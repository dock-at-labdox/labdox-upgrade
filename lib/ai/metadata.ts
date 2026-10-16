export type AiMetadata = {
  provider?: string;
  model: string | null;
  promptVersion: string;
  schemaVersion: string;
  catalogueVersion?: string;
  deterministicOnly: boolean;
  fallback: boolean;
  fallbackReason?: string;
};

export function getAiMetadata(input: {
  deterministicOnly: boolean;
  fallback?: boolean;
  fallbackReason?: string;
  provider?: string;
  model?: string;
  promptVersion: string;
  schemaVersion: string;
  catalogueVersion?: string;
}): AiMetadata {
  return {
    provider: input.provider ?? "deterministic",
    model: input.model ?? null,
    promptVersion: input.promptVersion,
    schemaVersion: input.schemaVersion,
    catalogueVersion: input.catalogueVersion,
    deterministicOnly: input.deterministicOnly,
    fallback: input.fallback ?? false,
    fallbackReason: input.fallbackReason,
  };
}
