export type AiMetadata = {
  provider?: string;
  model?: string;
  promptVersion?: string;
  schemaVersion?: string;
  catalogueVersion?: string;
  deterministicOnly: boolean;
};

const DEFAULT_PROMPT_VERSION = "ai-f-001-v1";

const DEFAULT_SCHEMA_VERSION = "classification.v1";

export function getAiMetadata(input: {
  deterministicOnly: boolean;
  provider?: string;
  model?: string;
  promptVersion?: string;
  schemaVersion?: string;
  catalogueVersion?: string;
}): AiMetadata {
  return {
    provider: input.provider,
    model: input.model,
    promptVersion: input.promptVersion ?? DEFAULT_PROMPT_VERSION,
    schemaVersion: input.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    catalogueVersion: input.catalogueVersion,
    deterministicOnly: input.deterministicOnly,
  };
}
