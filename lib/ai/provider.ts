import {
  classificationV1Schema,
  recommendationV1Schema,
  type ClassificationV1,
  type RecommendationV1,
} from "./schemas";

export type AiProviderName = "gemini" | "mock";

export type AiOutputRejectionClass =
  | "schema_mismatch"
  | "unsupported_numeric_claim"
  | "invalid_catalogue_id";

export type AiFailure =
  | "disabled"
  | "timeout"
  | "rate_limit"
  | "provider_error"
  | "invalid_output";

type AiFailedResult = {
  ok: false;
  failure: AiFailure;
  rejectionClass?: AiOutputRejectionClass;
};

export type AiClassificationResult =
  | {
      ok: true;
      provider: AiProviderName;
      model: string;
      output: ClassificationV1;
    }
  | AiFailedResult;

export type AiRecommendationResult =
  | {
      ok: true;
      provider: AiProviderName;
      model: string;
      output: RecommendationV1;
    }
  | AiFailedResult;

const DEFAULT_TIMEOUT_MS = 3000;
const MAX_RETRIES = 1;
const GOOGLE_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const classificationResponseSchema = {
  type: "OBJECT",
  properties: {
    schemaVersion: { type: "STRING", enum: ["classification.v1"] },
    goalTag: {
      type: "STRING",
      enum: [
        "first_job",
        "switch_career",
        "upskill",
        "grow_business",
        "explore",
        "solve_problem",
      ],
      nullable: true,
    },
    passionTheme: {
      type: "STRING",
      enum: [
        "building",
        "analyzing",
        "creating",
        "helping",
        "persuading",
        "organizing",
      ],
      nullable: true,
    },
    topicKeywords: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "NUMBER" },
    clarificationNeeded: { type: "BOOLEAN" },
  },
  required: ["schemaVersion", "goalTag", "confidence", "clarificationNeeded"],
};

const recommendationResponseSchema = {
  type: "OBJECT",
  properties: {
    schemaVersion: { type: "STRING", enum: ["recommendation.v1"] },
    rankedItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          itemId: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["itemId", "reason"],
      },
    },
  },
  required: ["schemaVersion", "rankedItems"],
};

function getModel(): string | null {
  const model = process.env.AI_MODEL;

  return model && /^gemini-[a-z0-9.-]+$/i.test(model) ? model : null;
}

function getTimeoutMs(): number {
  const configured = Number(process.env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return configured;
}

export function isAiEnabled(): boolean {
  const provider = process.env.AI_PROVIDER ?? "gemini";
  return (
    process.env.AI_ENABLED === "true" &&
    provider === "gemini" &&
    Boolean(process.env.AI_API_KEY) &&
    getModel() !== null
  );
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

class InvalidAiOutputError extends Error {
  constructor(readonly rejectionClass: AiOutputRejectionClass) {
    super("Gemini returned an invalid structured response.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createGeminiRequest(input: unknown): Record<string, unknown> {
  if (!isRecord(input) || !isRecord(input.input)) {
    throw new Error("Invalid AI operation input.");
  }

  const operation = input.operation;

  if (operation !== "classify" && operation !== "recommend") {
    throw new Error("Unsupported AI operation.");
  }

  const systemInstruction =
    operation === "classify"
      ? "Classify the supplied visitor goal. Return only JSON matching the response schema. Use only the allowed taxonomy values. If unclear, use a null goalTag and set clarificationNeeded to true. Do not infer sensitive traits."
      : "Rank only the supplied candidate item IDs. Return only JSON matching the response schema. Reasons must be short, refer only to supplied inputs, contain no numeric claims, and make no factual claims about Labdox.";

  const serializedInput = JSON.stringify(input.input);
  if (serializedInput.length > 16_000) {
    throw new Error("AI provider input exceeds the configured size limit.");
  }

  return {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: serializedInput }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 512,
      responseSchema:
        operation === "classify"
          ? classificationResponseSchema
          : recommendationResponseSchema,
    },
  };
}

function parseGeminiResponse(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    throw new InvalidAiOutputError("schema_mismatch");
  }

  const candidate = value.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content)) {
    throw new InvalidAiOutputError("schema_mismatch");
  }

  const parts = candidate.content.parts;
  if (!Array.isArray(parts)) {
    throw new InvalidAiOutputError("schema_mismatch");
  }

  const text = parts
    .filter(isRecord)
    .map((part) => part.text)
    .filter((part): part is string => typeof part === "string")
    .join("");

  if (!text) {
    throw new InvalidAiOutputError("schema_mismatch");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidAiOutputError("schema_mismatch");
  }
}

async function callProvider(input: unknown): Promise<unknown> {
  const apiKey = process.env.AI_API_KEY;
  const model = getModel();

  if (!apiKey || !model) {
    throw new Error("Gemini provider configuration is incomplete.");
  }

  const response = await fetch(
    `${GOOGLE_API_BASE_URL}/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(createGeminiRequest(input)),
      signal: createTimeoutSignal(getTimeoutMs()),
      cache: "no-store",
    },
  );

  if (response.status === 429) {
    throw new Error("AI_RATE_LIMIT");
  }

  if (!response.ok) {
    throw new Error(`Gemini provider returned HTTP ${response.status}.`);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new InvalidAiOutputError("schema_mismatch");
  }

  return parseGeminiResponse(responseBody);
}

function classifyFailure(error: unknown): AiFailure {
  if (error instanceof InvalidAiOutputError) {
    return "invalid_output";
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "timeout";
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    return "timeout";
  }

  if (error instanceof Error && error.message === "AI_RATE_LIMIT") {
    return "rate_limit";
  }

  return "provider_error";
}

async function callProviderWithRetry(input: unknown): Promise<
  | {
      ok: true;
      output: unknown;
    }
  | {
      ok: false;
      failure: AiFailure;
      rejectionClass?: AiOutputRejectionClass;
    }
> {
  let lastFailure: AiFailure = "provider_error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return {
        ok: true,
        output: await callProvider(input),
      };
    } catch (error) {
      lastFailure = classifyFailure(error);

      if (lastFailure === "rate_limit") {
        return {
          ok: false,
          failure: lastFailure,
        };
      }

      if (error instanceof InvalidAiOutputError) {
        return {
          ok: false,
          failure: lastFailure,
          rejectionClass: error.rejectionClass,
        };
      }

      if (attempt < MAX_RETRIES) {
        continue;
      }

      return {
        ok: false,
        failure: lastFailure,
      };
    }
  }

  return {
    ok: false,
    failure: lastFailure,
  };
}

export function validateClassificationOutput(
  value: unknown,
): ClassificationV1 | null {
  const result = classificationV1Schema.safeParse(value);

  return result.success ? result.data : null;
}

function containsNumericClaim(reason: string): boolean {
  return (
    /\d/.test(reason) ||
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|dozens?|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|thousands?|millions?|billions?|once|twice|thrice|double|triple|half|quarter|couple|pair|few|several|multiple|numerous)\b/i.test(
      reason,
    ) ||
    /\b(?:percent|percentage|months?|weeks?|days?|hours?|years?)\b/i.test(
      reason,
    )
  );
}

function hasInvalidCatalogueId(
  value: unknown,
  allowedItemIds?: ReadonlySet<string>,
): boolean {
  if (!isRecord(value) || !Array.isArray(value.rankedItems)) {
    return false;
  }

  return value.rankedItems.some((item) => {
    if (!isRecord(item) || typeof item.itemId !== "string") {
      return false;
    }

    return (
      !/^(CRS-\d{3}|TRK-[A-Z]+|SVC-[A-Z]+|ENG-[A-Z]+)$/.test(item.itemId) ||
      (allowedItemIds !== undefined && !allowedItemIds.has(item.itemId))
    );
  });
}

export function validateRecommendationOutput(
  value: unknown,
  allowedItemIds?: ReadonlySet<string>,
): RecommendationV1 | null {
  if (hasInvalidCatalogueId(value, allowedItemIds)) {
    return null;
  }

  const result = recommendationV1Schema.safeParse(value);

  if (!result.success) {
    return null;
  }

  if (
    result.data.rankedItems.some((item) => containsNumericClaim(item.reason))
  ) {
    return null;
  }

  return result.data;
}

function getRecommendationRejectionClass(
  value: unknown,
  allowedItemIds?: ReadonlySet<string>,
): AiOutputRejectionClass {
  if (hasInvalidCatalogueId(value, allowedItemIds)) {
    return "invalid_catalogue_id";
  }

  const result = recommendationV1Schema.safeParse(value);
  if (!result.success) {
    return "schema_mismatch";
  }

  if (
    result.data.rankedItems.some((item) => containsNumericClaim(item.reason))
  ) {
    return "unsupported_numeric_claim";
  }

  return "schema_mismatch";
}

export async function classifyWithAi(
  input: unknown,
): Promise<AiClassificationResult> {
  const model = getModel();
  if (!isAiEnabled() || !model) {
    return {
      ok: false,
      failure: "disabled",
    };
  }

  const result = await callProviderWithRetry({
    operation: "classify",
    input,
  });

  if (!result.ok) {
    return result;
  }

  const output = validateClassificationOutput(result.output);

  if (!output) {
    return {
      ok: false,
      failure: "invalid_output",
      rejectionClass: "schema_mismatch",
    };
  }

  return {
    ok: true,
    provider: "gemini",
    model,
    output,
  };
}

export async function recommendWithAi(
  input: unknown,
  allowedItemIds?: ReadonlySet<string>,
): Promise<AiRecommendationResult> {
  const model = getModel();
  if (!isAiEnabled() || !model) {
    return {
      ok: false,
      failure: "disabled",
    };
  }

  const result = await callProviderWithRetry({
    operation: "recommend",
    input,
  });

  if (!result.ok) {
    return result;
  }

  const output = validateRecommendationOutput(result.output, allowedItemIds);

  if (!output) {
    return {
      ok: false,
      failure: "invalid_output",
      rejectionClass: getRecommendationRejectionClass(
        result.output,
        allowedItemIds,
      ),
    };
  }

  return {
    ok: true,
    provider: "gemini",
    model,
    output,
  };
}
