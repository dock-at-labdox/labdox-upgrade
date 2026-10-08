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
    AI_PROVIDER_URL: process.env.AI_PROVIDER_URL,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "false";
    delete process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER_URL;
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

    if (originalEnv.AI_PROVIDER_URL === undefined) {
      delete process.env.AI_PROVIDER_URL;
    } else {
      process.env.AI_PROVIDER_URL = originalEnv.AI_PROVIDER_URL;
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
    process.env.AI_PROVIDER_URL = "https://example.test/ai";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            schemaVersion: "classification.v1",
            goalTag: "switch_career",
            passionTheme: "creating",
            confidence: 0.9,
            clarificationNeeded: false,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    const result = await classifyWithAi({
      text: "I want to switch careers.",
    });

    expect(result).toEqual({
      ok: true,
      provider: "gemini",
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
    process.env.AI_PROVIDER_URL = "https://example.test/ai";

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
    process.env.AI_PROVIDER_URL = "https://example.test/ai";

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
});
