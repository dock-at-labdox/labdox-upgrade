import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  classifyWithAi,
  recommendWithAi,
  validateClassificationOutput,
  validateRecommendationOutput,
} from "./provider";

describe("AI provider adapter", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  };

  function geminiResponse(output: unknown): Response {
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(output) }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  beforeEach(() => {
    process.env.AI_ENABLED = "false";
    delete process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER;
    process.env.AI_MODEL = "gemini-2.5-flash";
    delete process.env.AI_TIMEOUT_MS;

    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnv.AI_ENABLED === undefined) {
      delete process.env.AI_ENABLED;
    } else {
      process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    }

    if (originalEnv.AI_API_KEY === undefined) {
      delete process.env.AI_API_KEY;
    } else {
      process.env.AI_API_KEY = originalEnv.AI_API_KEY;
    }

    if (originalEnv.AI_PROVIDER === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    }

    if (originalEnv.AI_MODEL === undefined) {
      delete process.env.AI_MODEL;
    } else {
      process.env.AI_MODEL = originalEnv.AI_MODEL;
    }

    if (originalEnv.AI_TIMEOUT_MS === undefined) {
      delete process.env.AI_TIMEOUT_MS;
    } else {
      process.env.AI_TIMEOUT_MS = originalEnv.AI_TIMEOUT_MS;
    }

    vi.restoreAllMocks();
  });

  it("returns disabled when AI is disabled", async () => {
    const result = await classifyWithAi({
      text: "I want to switch careers into UI/UX",
    });

    expect(result).toEqual({
      ok: false,
      failure: "disabled",
    });
  });

  it("fails closed when a Gemini model ID is not configured", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    delete process.env.AI_MODEL;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await classifyWithAi({
      text: "I want to switch careers",
    });

    expect(result).toEqual({ ok: false, failure: "disabled" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns disabled for recommendations when AI is disabled", async () => {
    const result = await recommendWithAi({
      input: {
        goalTag: "switch_career",
      },
    });

    expect(result).toEqual({
      ok: false,
      failure: "disabled",
    });
  });

  it("accepts a valid classification.v1 response", () => {
    const result = validateClassificationOutput({
      schemaVersion: "classification.v1",
      goalTag: "switch_career",
      passionTheme: "creating",
      topicKeywords: ["UI/UX"],
      confidence: 0.92,
      clarificationNeeded: false,
    });

    expect(result).not.toBeNull();
    expect(result?.schemaVersion).toBe("classification.v1");
    expect(result?.goalTag).toBe("switch_career");
    expect(result?.confidence).toBe(0.92);
  });

  it("rejects an invalid classification response", () => {
    const result = validateClassificationOutput({
      schemaVersion: "classification.v1",
      goalTag: "invalid_goal",
      confidence: 2,
      clarificationNeeded: false,
    });

    expect(result).toBeNull();
  });

  it("rejects spelled-out numeric claims", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "Complete this path in three months.",
        },
      ],
    });

    expect(result).toBeNull();
  });

  it("rejects comparative quantity claims", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "This path helps you progress twice as fast.",
        },
      ],
    });

    expect(result).toBeNull();
  });

  it("rejects classification output with unknown fields", () => {
    const result = validateClassificationOutput({
      schemaVersion: "classification.v1",
      goalTag: "switch_career",
      confidence: 0.9,
      clarificationNeeded: false,
      unexpectedField: "not allowed",
    });

    expect(result).toBeNull();
  });

  it("accepts a valid recommendation.v1 response", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "Matches your career transition goal.",
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.schemaVersion).toBe("recommendation.v1");
    expect(result?.rankedItems[0].itemId).toBe("TRK-UX");
  });

  it("rejects an invalid recommendation response", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "INVALID-ID",
          reason: "This should not pass.",
        },
      ],
    });

    expect(result).toBeNull();
  });

  it("rejects a recommendation response with too many items", () => {
    const rankedItems = [
      {
        itemId: "CRS-001",
        reason: "Recommendation one.",
      },
      {
        itemId: "CRS-002",
        reason: "Recommendation two.",
      },
      {
        itemId: "CRS-003",
        reason: "Recommendation three.",
      },
      {
        itemId: "CRS-004",
        reason: "Recommendation four.",
      },
      {
        itemId: "CRS-005",
        reason: "Recommendation five.",
      },
      {
        itemId: "CRS-006",
        reason: "Recommendation six.",
      },
    ];

    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems,
    });

    expect(result).toBeNull();
  });

  it("rejects a recommendation response with unknown fields", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "Valid recommendation.",
        },
      ],
      unexpectedField: true,
    });

    expect(result).toBeNull();
  });

  it("rejects numeric claims in recommendation reasons", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "This course has a 95% placement rate.",
        },
      ],
    });

    expect(result).toBeNull();
  });

  it("rejects numeric duration claims in recommendation reasons", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "You can complete this path in 3 months.",
        },
      ],
    });

    expect(result).toBeNull();
  });

  it("allows recommendation reasons without numeric claims", () => {
    const result = validateRecommendationOutput({
      schemaVersion: "recommendation.v1",
      rankedItems: [
        {
          itemId: "TRK-UX",
          reason: "Matches your career transition goal.",
        },
      ],
    });

    expect(result).not.toBeNull();
  });

  it("retries a provider failure once", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(
        geminiResponse({
          schemaVersion: "classification.v1",
          goalTag: "switch_career",
          passionTheme: "creating",
          confidence: 0.9,
          clarificationNeeded: false,
        }),
      );

    const result = await classifyWithAi({
      text: "I want to switch careers.",
    });

    expect(result).toEqual({
      ok: true,
      provider: "gemini",
      model: "gemini-2.5-flash",
      output: {
        schemaVersion: "classification.v1",
        goalTag: "switch_career",
        passionTheme: "creating",
        confidence: 0.9,
        clarificationNeeded: false,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a rate-limit response", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 429,
      }),
    );

    const result = await classifyWithAi({
      text: "I want to switch careers.",
    });

    expect(result).toEqual({
      ok: false,
      failure: "rate_limit",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back after the single retry is exhausted", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("provider unavailable"));

    const result = await classifyWithAi({
      text: "I want to switch careers.",
    });

    expect(result).toEqual({
      ok: false,
      failure: "provider_error",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses Gemini Flash JSON mode and maps Gemini's response envelope", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MODEL = "gemini-2.5-flash";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        geminiResponse({
          schemaVersion: "classification.v1",
          goalTag: "switch_career",
          confidence: 0.9,
          clarificationNeeded: false,
        }),
      );

    const result = await classifyWithAi({
      text: "I want to switch careers",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(String(options?.body));

    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(options?.headers).toMatchObject({
      "x-goog-api-key": "synthetic-test-key",
    });
    expect(JSON.stringify(requestBody)).not.toContain("synthetic-test-key");
    expect(requestBody.generationConfig.responseMimeType).toBe(
      "application/json",
    );
    expect(requestBody.generationConfig.responseSchema.required).toContain(
      "goalTag",
    );
  });

  it("rejects recommendation IDs outside the deterministic candidate set", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      geminiResponse({
        schemaVersion: "recommendation.v1",
        rankedItems: [
          {
            itemId: "TRK-UX",
            reason: "Matches your stated goal.",
          },
          {
            itemId: "CRS-999",
            reason: "An unsupported catalogue item.",
          },
        ],
      }),
    );

    const result = await recommendWithAi(
      { input: { goalTag: "switch_career" } },
      new Set(["TRK-UX"]),
    );

    expect(result).toEqual({
      ok: false,
      failure: "invalid_output",
      rejectionClass: "invalid_catalogue_id",
    });
  });

  it("falls back on recommendation provider failures after the configured retry", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));

    const result = await recommendWithAi({
      input: { goalTag: "switch_career" },
      candidates: [{ itemId: "TRK-UX" }],
    });

    expect(result).toEqual({
      ok: false,
      failure: "provider_error",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
