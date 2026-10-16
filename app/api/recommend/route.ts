import { NextResponse } from "next/server";

import {
  authorizeAiRequest,
  recordAiOutputRejected,
  reserveAiCall,
} from "../../../lib/api/ai-request";
import type {
  RecommendationBlock,
  RecommendationResponse,
} from "../../../lib/api/contracts";
import { getAiMetadata } from "../../../lib/ai/metadata";
import type { recommendWithAi } from "../../../lib/ai/provider";
import { AiUsageRepo } from "../../../lib/data/aiUsage";
import { CatalogueRepo } from "../../../lib/data/repos";
import {
  getDeterministicRecommendations,
  type DeterministicRecommendation,
  type RecommendationCandidate,
  type RecommendationInput,
} from "../../../lib/engine/recommender";

type RecommendRequest = {
  input?: unknown;
  candidates?: unknown;
  catalogueVersion?: unknown;
  sessionId?: unknown;
};

const ITEM_ID_PATTERN = /^(CRS-\d{3}|TRK-[A-Z]+|SVC-[A-Z]+|ENG-[A-Z]+)$/;
const GOAL_TAGS = [
  "first_job",
  "switch_career",
  "upskill",
  "grow_business",
  "explore",
  "solve_problem",
];
const PASSION_THEMES = [
  "building",
  "analyzing",
  "creating",
  "helping",
  "persuading",
  "organizing",
];
const CANDIDATE_TYPES = ["course", "track", "service", "engagement"];
const CANDIDATE_STATUSES = ["published", "draft", "archived", "closed"];
const OPTIONAL_CANDIDATE_ARRAYS = [
  "intents",
  "audiences",
  "themes",
  "levels",
  "timePreferences",
];

function isStringArray(value: unknown, maxItems: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (item) => typeof item === "string" && item.length <= 64,
    )
  );
}

function isRecommendationInput(value: unknown): value is RecommendationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const input = value as Record<string, unknown>;
  return (
    (input.goalTag === null ||
      (typeof input.goalTag === "string" && GOAL_TAGS.includes(input.goalTag))) &&
    (input.passionTheme === undefined ||
      input.passionTheme === null ||
      (typeof input.passionTheme === "string" &&
        PASSION_THEMES.includes(input.passionTheme))) &&
    ["audience", "level", "timePreference"].every(
      (key) =>
        input[key] === undefined ||
        input[key] === null ||
        (typeof input[key] === "string" && input[key].length <= 64),
    )
  );
}

function isRecommendationCandidate(
  value: unknown,
): value is RecommendationCandidate {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.itemId === "string" &&
    ITEM_ID_PATTERN.test(candidate.itemId) &&
    typeof candidate.type === "string" &&
    CANDIDATE_TYPES.includes(candidate.type) &&
    typeof candidate.name === "string" &&
    candidate.name.length <= 120 &&
    typeof candidate.status === "string" &&
    CANDIDATE_STATUSES.includes(candidate.status) &&
    (candidate.needsEditorialReview === undefined ||
      typeof candidate.needsEditorialReview === "boolean") &&
    OPTIONAL_CANDIDATE_ARRAYS.every(
      (key) =>
        candidate[key] === undefined || isStringArray(candidate[key], 20),
    )
  );
}

function buildResponse(
  results: DeterministicRecommendation[],
  catalogueVersion: string,
  deterministicOnly: boolean,
  metadata: ReturnType<typeof getAiMetadata>,
): RecommendationResponse {
  const blocks: RecommendationBlock[] = [];

  if (results.length === 0) {
    blocks.push({
      blockType: "no_match",
      payload: {
        itemIds: [],
      },
    });
  } else {
    blocks.push({
      blockType: "primary_recommendation",
      payload: {
        itemId: results[0].itemId,
        reason: results[0].reason,
      },
    });

    if (results.length > 1) {
      blocks.push({
        blockType: "alternatives",
        payload: {
          items: results.slice(1).map((item) => ({
            itemId: item.itemId,
            reason: item.reason,
          })),
        },
      });
    }
  }

  blocks.push({
    blockType: "controls",
    payload: {
      deterministicOnly,
      fallbackMessage: deterministicOnly
        ? "computed without AI assistance"
        : undefined,
    },
  });

  return {
    blocks,
    provenance: {
      deterministicOnly,
      catalogueVersion,
      promptVersion: metadata.promptVersion,
      model: metadata.model ?? undefined,
      confidenceBand: results.length === 0 ? "no_match" : "medium",
    },
  };
}

function serviceUnavailable(error: string) {
  return NextResponse.json({ error }, { status: 503 });
}

export async function POST(request: Request) {
  let body: RecommendRequest;

  try {
    body = (await request.json()) as RecommendRequest;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON request body.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isRecommendationInput(body.input)) {
    return NextResponse.json(
      {
        error: "input is required and must be a valid recommendation input.",
      },
      {
        status: 400,
      },
    );
  }

  if (!Array.isArray(body.candidates) || body.candidates.length > 12) {
    return NextResponse.json(
      {
        error: "candidates must be an array of no more than 12 items.",
      },
      {
        status: 400,
      },
    );
  }

  if (!body.candidates.every(isRecommendationCandidate)) {
    return NextResponse.json(
      {
        error: "candidates contains an invalid catalogue item.",
      },
      {
        status: 400,
      },
    );
  }

  const requestedCandidateIds = body.candidates.map((candidate) => candidate.itemId);
  if (new Set(requestedCandidateIds).size !== requestedCandidateIds.length) {
    return NextResponse.json(
      {
        error: "candidates cannot contain duplicate catalogue IDs.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    body.catalogueVersion !== undefined &&
    (typeof body.catalogueVersion !== "string" ||
      !/^[a-zA-Z0-9._-]{1,80}$/.test(body.catalogueVersion))
  ) {
    return NextResponse.json(
      {
        error: "catalogueVersion is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  let authorization;
  try {
    authorization = await authorizeAiRequest(
      request,
      body.sessionId,
      "recommend",
    );
  } catch {
    console.error(JSON.stringify({ event: "ai_usage_store_unavailable" }));
    return serviceUnavailable("AI request controls are temporarily unavailable.");
  }

  if (!authorization.ok) {
    const response = NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );

    if (authorization.retryAfterSeconds !== undefined) {
      response.headers.set(
        "Retry-After",
        String(authorization.retryAfterSeconds),
      );
    }

    return response;
  }

  let candidates: RecommendationCandidate[];
  let catalogueVersion: string | null;
  try {
    [candidates, catalogueVersion] = await Promise.all([
      CatalogueRepo.getRecommendationCandidates(requestedCandidateIds),
      CatalogueRepo.getVersion(),
    ]);
  } catch {
    console.error(JSON.stringify({ event: "catalogue_lookup_failed" }));
    return serviceUnavailable("Recommendations are temporarily unavailable.");
  }

  if (catalogueVersion === null) {
    console.error(JSON.stringify({ event: "catalogue_version_unavailable" }));
    return serviceUnavailable("Recommendations are temporarily unavailable.");
  }

  if (candidates.length !== requestedCandidateIds.length) {
    return NextResponse.json(
      {
        error: "candidates contains an unpublished or unknown catalogue item.",
      },
      {
        status: 400,
      },
    );
  }

  const deterministicResults = getDeterministicRecommendations(
    candidates,
    body.input,
  );
  let aiResult: Awaited<ReturnType<typeof recommendWithAi>> = {
    ok: false,
    failure: "disabled",
  };
  let fallbackReason: string | undefined;
  let providerAttempted = false;

  if (authorization.pill === "red" && deterministicResults.length > 0) {
    const provider = await import("../../../lib/ai/provider");
    if (provider.isAiEnabled()) {
      const reservation = await reserveAiCall();
      if (!reservation.allowed) {
        fallbackReason = reservation.failure;
      } else {
        providerAttempted = true;
        aiResult = await provider.recommendWithAi(
          {
            input: body.input,
            candidates: deterministicResults,
          },
          new Set(deterministicResults.map((item) => item.itemId)),
        );
        if (!aiResult.ok) {
          fallbackReason = aiResult.failure;
        }
      }
    }
  }

  if (!aiResult.ok && aiResult.rejectionClass) {
    await recordAiOutputRejected(aiResult.rejectionClass);
  }

  let results = deterministicResults;
  if (aiResult.ok) {
    results = aiResult.output.rankedItems.flatMap((item) => {
      const deterministic = deterministicResults.find(
        (candidate) => candidate.itemId === item.itemId,
      );

      return deterministic
        ? [
            {
              itemId: deterministic.itemId,
              score: deterministic.score,
              reason: item.reason,
              type: deterministic.type,
              level: deterministic.level,
            },
          ]
        : [];
    });

    if (results.length === 0) {
      aiResult = {
        ok: false,
        failure: "invalid_output",
        rejectionClass: "invalid_catalogue_id",
      };
      fallbackReason = aiResult.failure;
      await recordAiOutputRejected("invalid_catalogue_id");
      results = deterministicResults;
    }
  }

  const metadata = getAiMetadata({
    provider: providerAttempted
      ? aiResult.ok
        ? aiResult.provider
        : "gemini"
      : "deterministic",
    model: aiResult.ok
      ? aiResult.model
      : providerAttempted
        ? process.env.AI_MODEL
        : undefined,
    promptVersion: "rank-v1",
    schemaVersion: "recommendation.v1",
    catalogueVersion,
    deterministicOnly: !aiResult.ok,
    fallback:
      fallbackReason !== undefined && fallbackReason !== "no_candidates",
    fallbackReason,
  });

  const response = buildResponse(
    results,
    catalogueVersion,
    !aiResult.ok,
    metadata,
  );

  try {
    const persisted = await AiUsageRepo.persistRecommendation({
      sessionId: authorization.sessionId,
      metadata,
      itemIds: results.map((item) => item.itemId),
    });

    if (!persisted) {
      console.error(JSON.stringify({ event: "ai_session_persistence_failed" }));
      return serviceUnavailable("Session data could not be saved.");
    }
  } catch {
    console.error(JSON.stringify({ event: "ai_session_persistence_failed" }));
    return serviceUnavailable("Session data could not be saved.");
  }

  return NextResponse.json(response);
}
