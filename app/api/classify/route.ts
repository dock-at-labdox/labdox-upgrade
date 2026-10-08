import { NextResponse } from "next/server";

import type { ClassifyResult } from "../../../lib/api/contracts";
import { classifyWithAi, isAiEnabled } from "../../../lib/ai/provider";
import { classifyStatement } from "../../../lib/engine/classifier";

type ClassifyRequest = {
  text?: unknown;
  sessionId?: unknown;
};

function deterministicResult(text: string): ClassifyResult {
  const result = classifyStatement(text);

  return {
    goalTag: isGoalTag(result.intentTag) ? result.intentTag : null,
    passionTheme: null,
    confidence: result.confidence,
    clarificationNeeded: result.confidence < 0.6,
    deterministicOnly: true,
  };
}

function isGoalTag(value: string | null): value is ClassifyResult["goalTag"] {
  return (
    value === "first_job" ||
    value === "switch_career" ||
    value === "upskill" ||
    value === "grow_business" ||
    value === "explore" ||
    value === "solve_problem"
  );
}

export async function POST(request: Request) {
  let body: ClassifyRequest;

  try {
    body = (await request.json()) as ClassifyRequest;
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

  if (typeof body.text !== "string") {
    return NextResponse.json(
      {
        error: "text must be a string.",
      },
      {
        status: 400,
      },
    );
  }

  const text = body.text.trim();

  if (!text) {
    return NextResponse.json(
      {
        error: "text is required.",
      },
      {
        status: 400,
      },
    );
  }

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : undefined;

  const deterministic = deterministicResult(text);

  if (!isAiEnabled()) {
    return NextResponse.json(deterministic);
  }

  const aiResult = await classifyWithAi({
    text,
    deterministic,
  });

  if (!aiResult.ok) {
    return NextResponse.json(deterministic);
  }

  const output = aiResult.output;

  const aiClassification: ClassifyResult = {
    goalTag: output.goalTag,
    passionTheme: output.passionTheme ?? null,
    confidence: output.confidence,
    clarificationNeeded: output.clarificationNeeded,
    deterministicOnly: false,
  };
  return NextResponse.json(aiClassification);
}
