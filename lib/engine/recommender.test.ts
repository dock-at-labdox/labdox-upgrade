import { describe, expect, it } from "vitest";

import {
  getDeterministicRecommendations,
  type RecommendationCandidate,
} from "./recommender";

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
  {
    itemId: "CRS-003",
    type: "course",
    name: "Archived Course",
    status: "archived",
    intents: ["switch_career"],
  },
];

describe("getDeterministicRecommendations", () => {
  it("excludes draft and archived catalogue items", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "switch_career",
    });

    expect(results.map((item) => item.itemId)).toEqual(["TRK-UX", "CRS-001"]);
  });

  it("scores an intent match", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "switch_career",
    });

    expect(results[0]).toMatchObject({
      itemId: "TRK-UX",
      score: 40,
      type: "track",
    });
  });

  it("adds audience and theme scores", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "switch_career",
      audience: "career_transition",
      passionTheme: "creating",
    });

    expect(results[0]).toMatchObject({
      itemId: "TRK-UX",
      score: 80,
      type: "track",
    });
  });

  it("adds level and time preference scores", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "switch_career",
      audience: "career_transition",
      passionTheme: "creating",
      level: "beginner",
      timePreference: "flexible",
    });

    expect(results[0]).toMatchObject({
      itemId: "TRK-UX",
      score: 100,
      type: "track",
      level: "beginner",
    });
  });

  it("returns no recommendations when there is no deterministic match", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "first_job",
    });

    expect(results).toEqual([]);
  });

  it("prefers tracks over courses when scores are tied", () => {
    const results = getDeterministicRecommendations(candidates, {
      goalTag: "switch_career",
    });

    expect(results[0].type).toBe("track");
    expect(results[0].itemId).toBe("TRK-UX");
  });
});
