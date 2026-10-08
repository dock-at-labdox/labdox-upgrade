import {
  classificationV1Schema,
  recommendationV1Schema,
  type ClassificationV1,
  type RecommendationV1,
} from "./schemas";

export type AiProviderName = "gemini" | "mock";

export type AiFailure =
  | "disabled"
  | "timeout"
  | "rate_limit"
  | "provider_error"
  | "invalid_output";

export type AiClassificationResult =
  | {
      ok: true;
      provider: AiProviderName;
      output: ClassificationV1;
    }
  | {
      ok: false;
      failure: AiFailure;
    };

export type AiRecommendationResult =
  | {
      ok: true;
      provider: AiProviderName;
      output: RecommendationV1;
    }
  | {
      ok: false;
      failure: AiFailure;
    };

const DEFAULT_TIMEOUT_MS = 3000;
const MAX_RETRIES = 1;

function getTimeoutMs(): number {
  const configured = Number(process.env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return configured;
}

export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED === "true" && Boolean(process.env.AI_API_KEY);
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

async function callProvider(input: unknown): Promise<unknown> {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured.");
  }

  const providerUrl = process.env.AI_PROVIDER_URL;

  if (!providerUrl) {
    throw new Error("AI_PROVIDER_URL is not configured.");
  }

  const response = await fetch(providerUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
    signal: createTimeoutSignal(getTimeoutMs()),
    cache: "no-store",
  });

  if (response.status === 429) {
    throw new Error("AI_RATE_LIMIT");
  }

  if (!response.ok) {
    throw new Error(`AI provider returned HTTP ${response.status}.`);
  }

  return response.json();
}

function classifyFailure(error: unknown): AiFailure {
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
    }
> {
  let lastFailure: AiFailure = "provider_error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const output = await callProvider(input);

      return {
        ok: true,
        output,
      };
    } catch (error) {
      lastFailure = classifyFailure(error);

      /*
       * Rate-limit responses are not retried.
       * The provider has explicitly told us to stop.
       */
      if (lastFailure === "rate_limit") {
        return {
          ok: false,
          failure: lastFailure,
        };
      }

      /*
       * Retry only once for timeout/provider
       * failures. The loop permits exactly one
       * additional provider call.
       */
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

  if (!result.success) {
    return null;
  }

  return result.data;
}

function containsNumericClaim(reason: string): boolean {
  /*
   * Recommendation reasons are user-facing
   * explanations, not a place for unsupported
   * numeric claims such as "95% placement",
   * "3 months", "10 courses", etc.
   */
  return /\d/.test(reason);
}

export function validateRecommendationOutput(
  value: unknown,
): RecommendationV1 | null {
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

export async function classifyWithAi(
  input: unknown,
): Promise<AiClassificationResult> {
  if (!isAiEnabled()) {
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
    };
  }

  return {
    ok: true,
    provider: "gemini",
    output,
  };
}

export async function recommendWithAi(
  input: unknown,
): Promise<AiRecommendationResult> {
  if (!isAiEnabled()) {
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

  const output = validateRecommendationOutput(result.output);

  if (!output) {
    return {
      ok: false,
      failure: "invalid_output",
    };
  }

  return {
    ok: true,
    provider: "gemini",
    output,
  };
}
