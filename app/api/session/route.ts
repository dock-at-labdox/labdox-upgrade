import { NextRequest, NextResponse } from "next/server";
import { IntentSessionRepo } from "@/lib/data/repos";
import type {
  ApiErrorResponse,
  SessionResponse,
  SessionStateResponse,
} from "@/lib/api/contracts";

const SESSION_COOKIE = "labdox_session";

type CreateSessionRequest = {
  pill?: unknown;
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let createBody: CreateSessionRequest = {};

    if (rawBody.trim()) {
      try {
        const parsed: unknown = JSON.parse(rawBody);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return NextResponse.json(
            { error: "The request body must be an object." },
            { status: 400 },
          );
        }
        createBody = parsed as CreateSessionRequest;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON request body." },
          { status: 400 },
        );
      }
    }

    if (createBody.pill !== "red" && createBody.pill !== "blue") {
      return NextResponse.json(
        { error: "pill must be red or blue." },
        { status: 400 },
      );
    }

    const session = await IntentSessionRepo.create(createBody.pill);

    const body: SessionResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
    };

    const response = NextResponse.json(body, { status: 201 });

    response.cookies.set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Failed to create session", error);

    const body: ApiErrorResponse = {
      error: "SESSION_CREATION_FAILED",
    };

    return NextResponse.json(body, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    const body: ApiErrorResponse = {
      error: "SESSION_NOT_FOUND",
    };

    return NextResponse.json(body, { status: 401 });
  }

  try {
    const session = await IntentSessionRepo.getById(sessionId);

    if (!session || session.expiresAt <= new Date()) {
      const body: ApiErrorResponse = {
        error: "SESSION_NOT_FOUND",
      };

      return NextResponse.json(body, { status: 401 });
    }

    const body: SessionStateResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
      pill: session.pill,
      audienceDerived: session.audienceDerived,
      conversionState: session.conversionState,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("Failed to retrieve session", error);

    const body: ApiErrorResponse = {
      error: "SESSION_RETRIEVAL_FAILED",
    };

    return NextResponse.json(body, { status: 500 });
  }
}
