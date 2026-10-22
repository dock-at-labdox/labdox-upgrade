import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeAiRequest,
  getRateLimitWindow,
  reserveAiCall,
} from "./ai-request";
import { AiUsageRepo } from "../data/aiUsage";
import { IntentSessionRepo } from "../data/repos";

const SESSION_A = "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0";
const SESSION_B = "a0c8f190-abc2-4f1a-8c03-1234567890ab";

vi.mock("../data/repos", () => ({
  IntentSessionRepo: {
    getById: vi.fn(),
  },
}));

vi.mock("../data/aiUsage", () => ({
  AiUsageRepo: {
    checkAndIncrementRateLimit: vi.fn(),
    reserveDailyCost: vi.fn(),
    incrementRejectedOutput: vi.fn(),
    persistClassification: vi.fn(),
    persistRecommendation: vi.fn(),
  },
}));

function request(sessionId: string, ip: string): Request {
  return new Request("http://localhost/api/classify", {
    headers: {
      cookie: `labdox_session=${sessionId}`,
      "x-real-ip": ip,
      "x-forwarded-for": ip,
    },
  });
}

describe("AI request controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_TRUST_PROXY_HEADERS = "true";
    vi.mocked(IntentSessionRepo.getById).mockImplementation(
      async (id) =>
        ({
          id,
          pill: "red",
          expiresAt: new Date("2099-10-09T00:00:00.000Z"),
        }) as unknown as Awaited<ReturnType<typeof IntentSessionRepo.getById>>,
    );
  });

  it("enforces ten calls per hour for both the IP and session under concurrency", async () => {
    const counts = new Map<string, number>();
    vi.mocked(AiUsageRepo.checkAndIncrementRateLimit).mockImplementation(
      async ({ identityHashes, limit }) => {
        if (
          identityHashes.some(
            (identity) => (counts.get(identity) ?? 0) >= limit,
          )
        ) {
          return false;
        }

        for (const identity of identityHashes) {
          counts.set(identity, (counts.get(identity) ?? 0) + 1);
        }
        return true;
      },
    );

    const calls = await Promise.all(
      Array.from({ length: 25 }, () =>
        authorizeAiRequest(
          request(SESSION_A, "192.0.2.8"),
          undefined,
          "classify",
          new Date("2026-10-08T10:20:00.000Z"),
        ),
      ),
    );

    expect(calls.filter((result) => result.ok)).toHaveLength(10);
    expect(
      calls.filter((result) => !result.ok && result.status === 429),
    ).toHaveLength(15);
    expect(AiUsageRepo.checkAndIncrementRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "classify", limit: 10 }),
    );
  });

  it("shares the IP quota between separate sessions", async () => {
    const counts = new Map<string, number>();
    vi.mocked(AiUsageRepo.checkAndIncrementRateLimit).mockImplementation(
      async ({ identityHashes, limit }) => {
        if (
          identityHashes.some(
            (identity) => (counts.get(identity) ?? 0) >= limit,
          )
        ) {
          return false;
        }

        for (const identity of identityHashes) {
          counts.set(identity, (counts.get(identity) ?? 0) + 1);
        }
        return true;
      },
    );

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        authorizeAiRequest(
          request(index % 2 === 0 ? SESSION_A : SESSION_B, "192.0.2.12"),
          undefined,
          "classify",
          new Date("2026-10-08T10:20:00.000Z"),
        ),
      ),
    );

    expect(results.filter((result) => result.ok)).toHaveLength(10);
  });

  it("uses a shared UTC hourly window and resets the quota at the next hour", () => {
    expect(getRateLimitWindow(new Date("2026-10-08T10:59:59.000Z"))).toEqual({
      windowStart: new Date("2026-10-08T10:00:00.000Z"),
      resetAt: new Date("2026-10-08T11:00:00.000Z"),
    });
  });

  it("reserves daily cost atomically before provider calls and respects the cap", async () => {
    let reservedCents = 0;
    vi.mocked(AiUsageRepo.reserveDailyCost).mockImplementation(
      async (_now, reservation, cap) => {
        const next = reservedCents + Math.round(reservation * 100);
        if (next > Math.round(cap * 100)) {
          return false;
        }

        reservedCents = next;
        return true;
      },
    );
    process.env.AI_DAILY_COST_CAP_USD = "5";
    process.env.AI_MAX_REQUEST_COST_USD = "0.5";

    const results = await Promise.all(
      Array.from({ length: 30 }, () =>
        reserveAiCall(new Date("2026-10-08T10:20:00.000Z")),
      ),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(10);
    expect(reservedCents).toBe(500);
    expect(AiUsageRepo.reserveDailyCost).toHaveBeenCalledTimes(30);
  });

  it("blocks calls if the reservation bound is missing or usage storage fails", async () => {
    delete process.env.AI_MAX_REQUEST_COST_USD;
    expect(await reserveAiCall()).toEqual({
      allowed: false,
      failure: "usage_unavailable",
    });
    expect(AiUsageRepo.reserveDailyCost).not.toHaveBeenCalled();

    process.env.AI_MAX_REQUEST_COST_USD = "0.01";
    vi.mocked(AiUsageRepo.reserveDailyCost).mockRejectedValueOnce(
      new Error("synthetic database failure"),
    );
    expect(await reserveAiCall()).toEqual({
      allowed: false,
      failure: "usage_unavailable",
    });
  });
});
