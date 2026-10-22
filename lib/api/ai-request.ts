import { isIP } from "node:net";
import { createHash } from "node:crypto";

import type { AiFailure, AiOutputRejectionClass } from "../ai/provider";
import { AiUsageRepo, type AiOperation } from "../data/aiUsage";
import { IntentSessionRepo } from "../data/repos";

export const AI_CALLS_PER_HOUR = 10;
export const FREE_TEXT_POLICY_VERSION = "privacy-v1-draft";

const SESSION_COOKIE = "labdox_session";
const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AiRequestAuthorization =
  | {
      ok: true;
      sessionId: string;
      pill: string;
      rateLimitResetAt: Date;
    }
  | {
      ok: false;
      status: 400 | 401 | 403 | 429 | 503;
      error: string;
      retryAfterSeconds?: number;
    };

function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) {
      continue;
    }

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function hashIdentity(kind: "ip" | "session", value: string): string {
  return createHash("sha256").update(`${kind}:${value}`).digest("hex");
}

function getClientIp(request: Request): string | null {
  if (process.env.AI_TRUST_PROXY_HEADERS !== "true") {
    return null;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (!realIp || isIP(realIp) === 0) {
    return null;
  }

  return realIp;
}

export function getRateLimitWindow(now: Date): {
  windowStart: Date;
  resetAt: Date;
} {
  const windowStart = new Date(now);
  windowStart.setUTCMinutes(0, 0, 0);

  const resetAt = new Date(windowStart);
  resetAt.setUTCHours(resetAt.getUTCHours() + 1);

  return { windowStart, resetAt };
}

export function retryAfterSeconds(resetAt: Date, now = new Date()): number {
  return Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
}

export async function authorizeAiRequest(
  request: Request,
  requestedSessionId: unknown,
  operation: AiOperation,
  now = new Date(),
): Promise<AiRequestAuthorization> {
  const cookieSessionId = getCookie(request, SESSION_COOKIE);
  if (!cookieSessionId || !SESSION_ID_PATTERN.test(cookieSessionId)) {
    return {
      ok: false,
      status: 401,
      error: "A valid session is required.",
    };
  }

  if (
    requestedSessionId !== undefined &&
    (typeof requestedSessionId !== "string" ||
      !SESSION_ID_PATTERN.test(requestedSessionId))
  ) {
    return {
      ok: false,
      status: 400,
      error: "sessionId must be a valid session ID.",
    };
  }

  if (
    typeof requestedSessionId === "string" &&
    requestedSessionId.toLowerCase() !== cookieSessionId.toLowerCase()
  ) {
    return {
      ok: false,
      status: 403,
      error: "The requested session does not match this browser.",
    };
  }

  const session = await IntentSessionRepo.getById(cookieSessionId);
  if (!session || session.expiresAt <= now) {
    return {
      ok: false,
      status: 401,
      error: "A valid session is required.",
    };
  }

  const { windowStart, resetAt } = getRateLimitWindow(now);
  const clientIp = getClientIp(request);
  const aiEnabled =
    process.env.AI_ENABLED === "true" &&
    Boolean(process.env.AI_API_KEY?.trim());

  if (session.pill === "red" && aiEnabled && !clientIp) {
    return {
      ok: false,
      status: 503,
      error: "AI request controls are temporarily unavailable.",
    };
  }

  const identityHashes = [
    ...(clientIp ? [hashIdentity("ip", clientIp)] : []),
    hashIdentity("session", cookieSessionId.toLowerCase()),
  ];
  const allowed = await AiUsageRepo.checkAndIncrementRateLimit({
    identityHashes,
    operation,
    windowStart,
    limit: AI_CALLS_PER_HOUR,
  });

  if (!allowed) {
    return {
      ok: false,
      status: 429,
      error: "AI request rate limit exceeded.",
      retryAfterSeconds: retryAfterSeconds(resetAt, now),
    };
  }

  return {
    ok: true,
    sessionId: session.id,
    pill: session.pill,
    rateLimitResetAt: resetAt,
  };
}

export type AiCallEligibility =
  | { allowed: true; reservationUsd: number; dailyCapUsd: number }
  | { allowed: false; failure: "budget_exhausted" | "usage_unavailable" };

type AiExecutionFailure = Extract<
  AiCallEligibility,
  { allowed: false }
>["failure"];

function parseUsd(value: string | undefined): number | null {
  if (!value || !/^\d+(\.\d{1,4})?$/.test(value)) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export async function reserveAiCall(
  now = new Date(),
): Promise<AiCallEligibility> {
  const dailyCapUsd = parseUsd(process.env.AI_DAILY_COST_CAP_USD ?? "5");
  const reservationUsd = parseUsd(process.env.AI_MAX_REQUEST_COST_USD);

  if (
    dailyCapUsd === null ||
    reservationUsd === null ||
    reservationUsd > dailyCapUsd
  ) {
    return { allowed: false, failure: "usage_unavailable" };
  }

  try {
    const reserved = await AiUsageRepo.reserveDailyCost(
      now,
      reservationUsd,
      dailyCapUsd,
    );
    return reserved
      ? { allowed: true, reservationUsd, dailyCapUsd }
      : { allowed: false, failure: "budget_exhausted" };
  } catch {
    return { allowed: false, failure: "usage_unavailable" };
  }
}

export async function recordAiOutputRejected(
  failureClass: AiOutputRejectionClass,
  now = new Date(),
): Promise<void> {
  console.warn(
    JSON.stringify({
      event: "ai_output_rejected",
      failureClass,
    }),
  );

  try {
    await AiUsageRepo.incrementRejectedOutput(now);
  } catch {
    console.error(
      JSON.stringify({
        event: "ai_rejected_output_counter_update_failed",
      }),
    );
  }
}

export function getFallbackReason(
  failure: AiFailure | AiExecutionFailure,
): string {
  return failure;
}
