import { describe, expect, it } from "vitest";

import { POST } from "../../app/api/recommend/route";

const candidates = [
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

describe("POST /api/recommend", () => {
  it("returns deterministic recommendations when AI is disabled", async () => {
    const request = new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({
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
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance.deterministicOnly).toBe(true);
    expect(body.provenance.catalogueVersion).toBe("synthetic-v1");
    expect(body.blocks[0].blockType).toBe("primary_recommendation");
    expect(body.blocks[0].payload.itemId).toBe("TRK-UX");
  });

  it("rejects an invalid request", async () => {
    const request = new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("does not recommend draft catalogue items", async () => {
    const request = new Request("http://localhost/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        input: {
          goalTag: "switch_career",
        },
        candidates: [
          {
            itemId: "CRS-002",
            type: "course",
            name: "Draft Course",
            status: "draft",
            intents: ["switch_career"],
          },
        ],
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.blocks[0].blockType).toBe("no_match");
  });
});
