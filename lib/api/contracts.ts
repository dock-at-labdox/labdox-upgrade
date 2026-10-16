export type SessionResponse = {
  sessionId: string;
  expiresAt: string;
};

export type ApiErrorResponse = {
  error: string;
};

export type SessionState = {
  pill: string;
  audienceDerived: string | null;
  conversionState: string;
};

export type SessionStateResponse = SessionState & {
  sessionId: string;
  expiresAt: string;
};

export type ClassifyResult = {
  goalTag:
    | "first_job"
    | "switch_career"
    | "upskill"
    | "grow_business"
    | "explore"
    | "solve_problem"
    | null;
  passionTheme:
    | "building"
    | "analyzing"
    | "creating"
    | "helping"
    | "persuading"
    | "organizing"
    | null;
  confidence: number;
  clarificationNeeded: boolean;
  deterministicOnly: boolean;
  fallbackMessage?: string;
};

export type RecommendationBlockType =
  | "intent_summary"
  | "primary_recommendation"
  | "path_snapshot"
  | "proof"
  | "alternatives"
  | "actions"
  | "controls"
  | "no_match";

export type RecommendationBlock = {
  blockType: RecommendationBlockType;
  payload: Record<string, unknown>;
};

export type RecommendationResponse = {
  blocks: RecommendationBlock[];
  provenance: {
    deterministicOnly: boolean;
    catalogueVersion: string;
    promptVersion?: string;
    model?: string;
    confidenceBand?: "high" | "medium" | "no_match";
  };
};
