import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../app/api/classify/route";
import { AiUsageRepo } from "../data/aiUsage";
import { IntentSessionRepo } from "../data/repos";

const SESSION_ID = "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0";
const TEST_IP = "203.0.113.10";

vi.mock("../data/repos", () => ({
  IntentSessionRepo: {
    getById: vi.fn(),
  },
  CatalogueRepo: {
    getRecommendationCandidates: vi.fn(),
    getVersion: vi.fn(),
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

function request(
  body: unknown,
  options: { cookie?: boolean; headers?: Record<string, string> } = {},
): Request {
  const headers = new Headers(options.headers);

  if (options.cookie !== false) {
    headers.set("cookie", `labdox_session=${SESSION_ID}`);
  }

  headers.set("x-real-ip", TEST_IP);

  return new Request("http://localhost/api/classify", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers,
  });
}

describe("POST /api/classify", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    process.env.AI_TRUST_PROXY_HEADERS = "true";
    process.env.AI_ENABLED = "false";
    delete process.env.AI_API_KEY;
    delete process.env.AI_MAX_REQUEST_COST_USD;

    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash";

    vi.mocked(IntentSessionRepo.getById).mockResolvedValue({
      id: SESSION_ID,
      pill: "red",
      expiresAt: new Date(Date.now() + 60_000),
    } as unknown as Awaited<ReturnType<typeof IntentSessionRepo.getById>>);

    vi.mocked(AiUsageRepo.checkAndIncrementRateLimit).mockResolvedValue(true);
    vi.mocked(AiUsageRepo.persistClassification).mockResolvedValue(true);
    vi.mocked(AiUsageRepo.reserveDailyCost).mockResolvedValue(true);
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(request("{invalid"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid JSON request body.");
  });

  it("rejects a missing text field", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
  });

  it("rejects empty text", async () => {
    const response = await POST(request({ freeText: "   " }));

    expect(response.status).toBe(400);
  });

  it("rejects free text exceeding the documented 500-character limit", async () => {
    const response = await POST(request({ freeText: "a".repeat(501) }));

    expect(response.status).toBe(400);
  });

  it("requires an authenticated session cookie", async () => {
    const response = await POST(
      request({ freeText: "I want to switch careers" }, { cookie: false }),
    );

    expect(response.status).toBe(401);
    expect(AiUsageRepo.checkAndIncrementRateLimit).not.toHaveBeenCalled();
  });

  it("uses deterministic classification when AI is disabled and shows the notice", async () => {
    const response = await POST(
      request({ freeText: "I want to switch careers" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      goalTag: "switch_career",
      passionTheme: null,
      confidence: 0.8,
      clarificationNeeded: false,
      deterministicOnly: true,
      fallbackMessage: "computed without AI assistance",
    });

    expect(AiUsageRepo.persistClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: SESSION_ID,
        freeText: "I want to switch careers",
        storeFreeTextConsent: false,
        metadata: expect.objectContaining({
          provider: "deterministic",
          model: null,
          promptVersion: "classify-v1",
          schemaVersion: "classification.v1",
          deterministicOnly: true,
        }),
      }),
    );
  });

  it("does not update a session other than the cookie-owned session", async () => {
    const response = await POST(
      request({
        freeText: "I want to switch careers",
        sessionId: "a0c8f190-abc2-4f1a-8c03-1234567890ab",
      }),
    );

    expect(response.status).toBe(403);
    expect(AiUsageRepo.persistClassification).not.toHaveBeenCalled();
  });

  it("records an explicitly consented free-text storage request", async () => {
    const response = await POST(
      request({
        freeText: "I want to switch careers",
        storeFreeTextConsent: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(AiUsageRepo.persistClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        freeText: "I want to switch careers",
        storeFreeTextConsent: true,
        policyVersion: "privacy-v1-draft",
      }),
    );
  });

  it("never invokes AI for a Blue session, even when the feature flag is enabled", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    vi.mocked(IntentSessionRepo.getById).mockResolvedValue({
      id: SESSION_ID,
      pill: "blue",
      expiresAt: new Date(Date.now() + 60_000),
    } as unknown as Awaited<ReturnType<typeof IntentSessionRepo.getById>>);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      request({ freeText: "I want to switch careers" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deterministicOnly).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(AiUsageRepo.reserveDailyCost).not.toHaveBeenCalled();
  });

  it("falls back after provider failures and returns a failure-only rejection event for bad output", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      schemaVersion: "classification.v99",
                      goalTag: "switch_career",
                      confidence: 0.9,
                      clarificationNeeded: false,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rawIntent = "I want a private result for my career change";

    const response = await POST(request({ freeText: rawIntent }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deterministicOnly).toBe(true);
    expect(body.fallbackMessage).toBe("computed without AI assistance");

    expect(warningSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "ai_output_rejected",
        failureClass: "schema_mismatch",
      }),
    );

    expect(warningSpy.mock.calls[0][0]).not.toContain(rawIntent);
    expect(AiUsageRepo.incrementRejectedOutput).toHaveBeenCalledTimes(1);

    expect(AiUsageRepo.persistClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallback: true,
          fallbackReason: "invalid_output",
        }),
      }),
    );
  });

  it("falls back after provider errors and reserves cost before either retry", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));

    const response = await POST(
      request({ freeText: "I want to switch careers" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deterministicOnly).toBe(true);
    expect(body.fallbackMessage).toBe("computed without AI assistance");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(AiUsageRepo.reserveDailyCost).toHaveBeenCalledTimes(1);

    expect(AiUsageRepo.persistClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          fallback: true,
          fallbackReason: "provider_error",
        }),
      }),
    );
  });

  it("fails closed when the shared rate-limit store is unavailable", async () => {
    vi.mocked(AiUsageRepo.checkAndIncrementRateLimit).mockRejectedValueOnce(
      new Error("synthetic storage failure"),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      request({ freeText: "I want to switch careers" }),
    );

    expect(response.status).toBe(503);
    expect(AiUsageRepo.persistClassification).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({ event: "ai_usage_store_unavailable" }),
    );
  });
});
