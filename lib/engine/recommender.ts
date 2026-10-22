export type RecommendationCandidate = {
  itemId: string;
  type: "course" | "track" | "service" | "engagement";
  name: string;
  status: "published" | "draft" | "archived" | "closed";
  needsEditorialReview?: boolean;
  intents?: string[];
  audiences?: string[];
  themes?: string[];
  levels?: string[];
  timePreferences?: string[];
};

export type RecommendationInput = {
  goalTag: string | null;
  passionTheme?: string | null;
  audience?: string | null;
  level?: string | null;
  timePreference?: string | null;
};

export type DeterministicRecommendation = {
  itemId: string;
  score: number;
  reason: string;
  type: RecommendationCandidate["type"];
  level?: string;
};

const MAX_CANDIDATES = 12;

function isMatchable(candidate: RecommendationCandidate): boolean {
  return (
    candidate.status === "published" && candidate.needsEditorialReview !== true
  );
}

function scoreCandidate(
  candidate: RecommendationCandidate,
  input: RecommendationInput,
): number {
  let score = 0;

  if (input.goalTag && candidate.intents?.includes(input.goalTag)) {
    score += 40;
  }

  if (input.audience && candidate.audiences?.includes(input.audience)) {
    score += 20;
  }

  if (input.passionTheme && candidate.themes?.includes(input.passionTheme)) {
    score += 20;
  }

  if (input.level && candidate.levels?.includes(input.level)) {
    score += 10;
  }

  if (
    input.timePreference &&
    candidate.timePreferences?.includes(input.timePreference)
  ) {
    score += 10;
  }

  return score;
}

function typeRank(type: RecommendationCandidate["type"]): number {
  switch (type) {
    case "track":
      return 0;
    case "course":
      return 1;
    default:
      return 2;
  }
}

function levelRank(level?: string): number {
  if (!level) {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalized = level.toLowerCase();

  switch (normalized) {
    case "beginner":
      return 0;
    case "intermediate":
      return 1;
    case "advanced":
      return 2;
    default:
      return Number.MAX_SAFE_INTEGER;
  }
}

export function getDeterministicRecommendations(
  candidates: RecommendationCandidate[],
  input: RecommendationInput,
): DeterministicRecommendation[] {
  return candidates
    .filter(isMatchable)
    .slice(0, MAX_CANDIDATES)
    .map((candidate) => ({
      itemId: candidate.itemId,
      score: scoreCandidate(candidate, input),
      reason:
        input.goalTag && candidate.intents?.includes(input.goalTag)
          ? `Matches your ${input.goalTag.replaceAll("_", " ")} goal.`
          : "Relevant to your selected path.",
      type: candidate.type,
      level: candidate.levels?.[0],
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const typeDifference = typeRank(a.type) - typeRank(b.type);

      if (typeDifference !== 0) {
        return typeDifference;
      }

      const levelDifference = levelRank(a.level) - levelRank(b.level);

      if (levelDifference !== 0) {
        return levelDifference;
      }

      return a.itemId.localeCompare(b.itemId);
    });
}
