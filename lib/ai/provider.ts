/**
 * Gemini adapter — Red journey only (DEC-020, DEC-041).
 * Blue routes must never import this module.
 */
export type AiProviderName = "gemini" | "mock";

export async function classifyWithAi(input: unknown): Promise<never> {
  void input;
  throw new Error("AI adapter is not enabled in Sprint 0/1. Deterministic classifier always runs first (DEC-026).");
}

export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED === "true" && Boolean(process.env.AI_API_KEY);
}
