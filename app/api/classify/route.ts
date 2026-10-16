import { isSafeFreeTextForPersistence } from "../../../lib/privacy/sensitive-text";
import { NextResponse } from "next/server";

import type { ClassifyResult } from "../../../lib/api/contracts";
import {
  authorizeAiRequest,
  FREE_TEXT_POLICY_VERSION,
  recordAiOutputRejected,
  reserveAiCall,
} from "../../../lib/api/ai-request";
import { getAiMetadata } from "../../../lib/ai/metadata";
import type { classifyWithAi } from "../../../lib/ai/provider";
import { AiUsageRepo } from "../../../lib/data/aiUsage";
import { classifyStatement } from "../../../lib/engine/classifier";

type ClassifyRequest = {
  freeText?: unknown;
  text?: unknown;
  sessionId?: unknown;
  storeFreeTextConsent?: unknown;
};

const MAX_FREE_TEXT_LENGTH = 500;

function sanitizeFreeText(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsContactDetails(text: string): boolean {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text)
  );
}

function deterministicResult(text: string): ClassifyResult {
  const result = classifyStatement(text);

  return {
    goalTag: isGoalTag(result.intentTag) ? result.intentTag : null,
    passionTheme: null,
    confidence: result.confidence,
    clarificationNeeded: result.confidence < 0.6,
    deterministicOnly: true,
    fallbackMessage: "computed without AI assistance",
  };
}

function isGoalTag(value: string | null): value is ClassifyResult["goalTag"] {
  return (
    value === "first_job" ||
    value === "switch_career" ||
    value === "upskill" ||
    value === "grow_business" ||
    value === "explore" ||
    value === "solve_problem"
  );
}

function serviceUnavailable(error: string) {
  return NextResponse.json({ error }, { status: 503 });
}

export async function POST(request: Request) {
  let body: ClassifyRequest;

  try {
    body = (await request.json()) as ClassifyRequest;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON request body.",
      },
      {
        status: 400,
      },
    );
  }

  const rawText = body.freeText !== undefined ? body.freeText : body.text;
  if (typeof rawText !== "string") {
    return NextResponse.json(
      {
        error: "freeText must be a string.",
      },
      {
        status: 400,
      },
    );
  }

  const text = sanitizeFreeText(rawText);
  if (!text) {
    return NextResponse.json(
      {
        error: "freeText is required.",
      },
      {
        status: 400,
      },
    );
  }

  if (text.length > MAX_FREE_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: "freeText must be no longer than 500 characters.",
      },
      {
        status: 400,
      },
    );
  }

  let authorization;
  try {
    authorization = await authorizeAiRequest(
      request,
      body.sessionId,
      "classify",
    );
  } catch {
    console.error(JSON.stringify({ event: "ai_usage_store_unavailable" }));
    return serviceUnavailable(
      "AI request controls are temporarily unavailable.",
    );
  }

  if (!authorization.ok) {
    const response = NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );

    if (authorization.retryAfterSeconds !== undefined) {
      response.headers.set(
        "Retry-After",
        String(authorization.retryAfterSeconds),
      );
    }

    return response;
  }

  const deterministic = deterministicResult(text);
  let aiResult: Awaited<ReturnType<typeof classifyWithAi>> = {
    ok: false,
    failure: "disabled",
  };
  let fallbackReason: string | undefined;
  let providerAttempted = false;

  if (authorization.pill === "red") {
    const provider = await import("../../../lib/ai/provider");
    if (provider.isAiEnabled()) {
      const reservation = await reserveAiCall();
      if (!reservation.allowed) {
        fallbackReason = reservation.failure;
      } else {
        providerAttempted = true;
        aiResult = await provider.classifyWithAi({
          text,
          deterministic,
        });
        if (!aiResult.ok) {
          fallbackReason = aiResult.failure;
        }
      }
    }
  }

  if (!aiResult.ok && aiResult.rejectionClass) {
    await recordAiOutputRejected(aiResult.rejectionClass);
  }

  const result: ClassifyResult = aiResult.ok
    ? {
        goalTag: aiResult.output.goalTag,
        passionTheme: aiResult.output.passionTheme ?? null,
        confidence: aiResult.output.confidence,
        clarificationNeeded: aiResult.output.clarificationNeeded,
        deterministicOnly: false,
      }
    : deterministic;

  const metadata = getAiMetadata({
    provider: providerAttempted
      ? aiResult.ok
        ? aiResult.provider
        : "gemini"
      : "deterministic",
    model: aiResult.ok
      ? aiResult.model
      : providerAttempted
        ? process.env.AI_MODEL
        : undefined,
    promptVersion: "classify-v1",
    schemaVersion: "classification.v1",
    deterministicOnly: !aiResult.ok,
    fallback: fallbackReason !== undefined,
    fallbackReason,
  });

  try {
    const persisted = await AiUsageRepo.persistClassification({
      sessionId: authorization.sessionId,
      metadata,
      result,
      freeText: text,
      storeFreeTextConsent: body.storeFreeTextConsent === true,
      persistFreeText:
        body.storeFreeTextConsent === true &&
        isSafeFreeTextForPersistence(text),
      consentedAt: new Date(),
      policyVersion: FREE_TEXT_POLICY_VERSION,
    });

    if (!persisted) {
      console.error(JSON.stringify({ event: "ai_session_persistence_failed" }));
      return serviceUnavailable("Session data could not be saved.");
    }
  } catch {
    console.error(JSON.stringify({ event: "ai_session_persistence_failed" }));
    return serviceUnavailable("Session data could not be saved.");
  }

  return NextResponse.json(result);
}
