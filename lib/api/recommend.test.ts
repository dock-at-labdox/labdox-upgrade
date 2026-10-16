import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../app/api/recommend/route";
import { AiUsageRepo } from "../data/aiUsage";
import type { RecommendationCandidate } from "../engine/recommender";
import { CatalogueRepo, IntentSessionRepo } from "../data/repos";

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

const candidates: RecommendationCandidate[] = [
  {
    itemId: "TRK-UX",
    type: "track",
    name: "UI/UX",
    status: "published",
    intents: ["switch_career"],
    audiences: ["career_transition"],
    themes: ["creating"],
    levels: ["beginner"],
    timePreferences: ["flexible"],
  },
  {
    itemId: "CRS-001",
    type: "course",
    name: "Design Foundations",
    status: "published",
    intents: ["switch_career"],
    audiences: ["career_transition"],
    themes: ["creating"],
    levels: ["beginner"],
    timePreferences: ["flexible"],
  },
  {
    itemId: "CRS-002",
    type: "course",
    name: "Draft Course",
    status: "draft",
    intents: ["switch_career"],
  },
];

function request(body: unknown, cookie = true): Request {
  const headers = new Headers({ "content-type": "application/json" });

  headers.set("x-real-ip", TEST_IP);

  if (cookie) {
        headers.set("cookie", "labdox_session=" + SESSION_ID);
  }

  return new Request("http://localhost/api/recommend", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("POST /api/recommend", () => {
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
    } as unknown as Awaited<
      ReturnType<typeof IntentSessionRepo.getById>
    >);

    vi.mocked(CatalogueRepo.getRecommendationCandidates).mockImplementation(
      async (itemIds) =>
        candidates
          .filter((candidate) => itemIds.includes(candidate.itemId))
          .map((candidate) => candidate),
    );

    vi.mocked(CatalogueRepo.getVersion).mockResolvedValue("synthetic-v1");
    vi.mocked(AiUsageRepo.checkAndIncrementRateLimit).mockResolvedValue(true);
    vi.mocked(AiUsageRepo.persistRecommendation).mockResolvedValue(true);
    vi.mocked(AiUsageRepo.reserveDailyCost).mockResolvedValue(true);
  });

  it("returns deterministic recommendations and a visible fallback notice", async () => {
    const response = await POST(
      request({
        input: {
          goalTag: "switch_career",
          audience: "career_transition",
          passionTheme: "creating",
          level: "beginner",
          timePreference: "flexible",
        },
        candidates,
        catalogueVersion: "synthetic-v1",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance.deterministicOnly).toBe(true);
    expect(body.provenance.catalogueVersion).toBe("synthetic-v1");
    expect(body.blocks[0].blockType).toBe("primary_recommendation");
    expect(body.blocks[0].payload.itemId).toBe("TRK-UX");

    expect(body.blocks[body.blocks.length - 1].payload).toEqual({
      deterministicOnly: true,
      fallbackMessage: "computed without AI assistance",
    });

    expect(AiUsageRepo.persistRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: SESSION_ID,
        itemIds: ["TRK-UX", "CRS-001"],
        metadata: expect.objectContaining({
          provider: "deterministic",
          model: null,
          promptVersion: "rank-v1",
          schemaVersion: "recommendation.v1",
          catalogueVersion: "synthetic-v1",
          deterministicOnly: true,
        }),
      }),
    );
  });

  it("rejects an invalid request", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
  });

  it("rejects calls without a valid session cookie", async () => {
    const response = await POST(
      request(
        {
          input: { goalTag: "switch_career" },
          candidates,
        },
        false,
      ),
    );

    expect(response.status).toBe(401);
  });

  it("never invokes AI for a Blue recommendation session", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    vi.mocked(IntentSessionRepo.getById).mockResolvedValue({
      id: SESSION_ID,
      pill: "blue",
      expiresAt: new Date(Date.now() + 60_000),
    } as unknown as Awaited<
      ReturnType<typeof IntentSessionRepo.getById>
    >);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates,
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(AiUsageRepo.reserveDailyCost).not.toHaveBeenCalled();
  });

  it("rejects invalid candidate catalogue IDs", async () => {
    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates: [
          {
            itemId: "INVENTED-1",
            type: "course",
            name: "Unknown",
            status: "published",
          },
        ],
      }),
    );

    expect(response.status).toBe(400);
  });

  it("does not accept well-shaped IDs absent from the canonical catalogue", async () => {
    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates: [
          {
            itemId: "TRK-NOTREAL",
            type: "track",
            name: "Invented track",
            status: "published",
          },
        ],
      }),
    );

    expect(response.status).toBe(400);
    expect(AiUsageRepo.persistRecommendation).not.toHaveBeenCalled();
  });

  it("does not recommend draft catalogue items", async () => {
    const response = await POST(
      request({
        input: {
          goalTag: "switch_career",
        },
        candidates: [candidates[2]],
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.blocks[0].blockType).toBe("no_match");
  });

  it("persists recommendation metadata without generated reason text", async () => {
    await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates,
        catalogueVersion: "untrusted-client-version",
      }),
    );

    expect(AiUsageRepo.persistRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          catalogueVersion: "synthetic-v1",
        }),
        itemIds: ["TRK-UX", "CRS-001"],
      }),
    );

    const stored =
      vi.mocked(AiUsageRepo.persistRecommendation).mock.calls[0][0];

    expect(stored).not.toHaveProperty("reasons");
  });

  it("rejects and logs unknown AI catalogue IDs before returning results", async () => {
    process.env.AI_ENABLED = "true";
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
                      schemaVersion: "recommendation.v1",
                      rankedItems: [
                        {
                          itemId: "TRK-UX",
                          reason: "A matching path.",
                        },
                        {
                          itemId: "CRS-999",
                          reason: "An unknown catalogue item.",
                        },
                      ],
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

    const warningSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance.deterministicOnly).toBe(true);
    expect(body.blocks[0].payload.itemId).toBe("TRK-UX");

    expect(warningSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "ai_output_rejected",
        failureClass: "invalid_catalogue_id",
      }),
    );

    expect(AiUsageRepo.incrementRejectedOutput).toHaveBeenCalledTimes(1);
  });

  it("fails safely when the daily cost reservation cannot be read or written", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    vi.mocked(AiUsageRepo.reserveDailyCost).mockRejectedValueOnce(
      new Error("synthetic usage failure"),
    );

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance.deterministicOnly).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    expect(AiUsageRepo.persistRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          fallback: true,
          fallbackReason: "usage_unavailable",
        }),
      }),
    );
  });

  it("falls back without calling Gemini when the daily cost cap is exhausted", async () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    process.env.AI_MAX_REQUEST_COST_USD = "0.01";

    vi.mocked(AiUsageRepo.reserveDailyCost).mockResolvedValueOnce(false);

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      request({
        input: { goalTag: "switch_career" },
        candidates,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance.deterministicOnly).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    expect(AiUsageRepo.persistRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          fallbackReason: "budget_exhausted",
        }),
      }),
    );
  });
});
