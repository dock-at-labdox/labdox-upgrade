import { NextResponse } from "next/server";

import type {
  RecommendationBlock,
  RecommendationResponse,
} from "../../../lib/api/contracts";
import { isAiEnabled, recommendWithAi } from "../../../lib/ai/provider";
import { getAiMetadata } from "../../../lib/ai/metadata";
import {
  getDeterministicRecommendations,
  type RecommendationCandidate,
  type RecommendationInput,
  type DeterministicRecommendation,
} from "../../../lib/engine/recommender";

type RecommendRequest = {
  input?: unknown;
  candidates?: unknown;
  catalogueVersion?: unknown;
  sessionId?: unknown;
};

function isRecommendationInput(value: unknown): value is RecommendationInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<string, unknown>;

  return input.goalTag === null || typeof input.goalTag === "string";
}

function isRecommendationCandidate(
  value: unknown,
): value is RecommendationCandidate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.itemId === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.status === "string"
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
      model: metadata.model,
      confidenceBand: results.length === 0 ? "no_match" : "medium",
    },
  };
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

  if (!Array.isArray(body.candidates)) {
    return NextResponse.json(
      {
        error: "candidates must be an array.",
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

  const catalogueVersion =
    typeof body.catalogueVersion === "string"
      ? body.catalogueVersion
      : "synthetic-v1";

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : undefined;

  const deterministicResults = getDeterministicRecommendations(
    body.candidates,
    body.input,
  );

  const deterministicCandidateIds = new Set(
    deterministicResults.map((item) => item.itemId),
  );

  if (!isAiEnabled()) {
    const metadata = getAiMetadata({
      deterministicOnly: true,
      schemaVersion: "recommendation.v1",
      catalogueVersion,
    });

    const response = buildResponse(
      deterministicResults,
      catalogueVersion,
      true,
      metadata,
    );

    return NextResponse.json(response);
  }

  const aiResult = await recommendWithAi({
    input: body.input,
    candidates: deterministicResults,
  });

  if (!aiResult.ok) {
    const metadata = getAiMetadata({
      deterministicOnly: true,
      schemaVersion: "recommendation.v1",
      catalogueVersion,
    });

    const response = buildResponse(
      deterministicResults,
      catalogueVersion,
      true,
      metadata,
    );

    return NextResponse.json(response);
  }

  const rankedResults: DeterministicRecommendation[] = [];

  for (const item of aiResult.output.rankedItems) {
    if (!deterministicCandidateIds.has(item.itemId)) {
      continue;
    }

    const deterministic = deterministicResults.find(
      (candidate) => candidate.itemId === item.itemId,
    );

    if (!deterministic) {
      continue;
    }

    rankedResults.push({
      itemId: deterministic.itemId,
      score: deterministic.score,
      reason: item.reason,
      type: deterministic.type,
      level: deterministic.level,
    });
  }

  if (rankedResults.length === 0) {
    const metadata = getAiMetadata({
      deterministicOnly: true,
      schemaVersion: "recommendation.v1",
      catalogueVersion,
    });

    const response = buildResponse(
      deterministicResults,
      catalogueVersion,
      true,
      metadata,
    );

    return NextResponse.json(response);
  }

  const metadata = getAiMetadata({
    deterministicOnly: false,
    provider: aiResult.provider,
    schemaVersion: aiResult.output.schemaVersion,
    catalogueVersion,
  });

  const response = buildResponse(
    rankedResults,
    catalogueVersion,
    false,
    metadata,
  );

  return NextResponse.json(response);
}

