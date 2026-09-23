import { NextRequest, NextResponse } from "next/server";
import { IntentSessionRepo } from "@/lib/data/repos";
import type {
  ApiErrorResponse,
  SessionResponse,
  SessionStateResponse,
} from "@/lib/api/contracts";

const SESSION_COOKIE = "labdox_session";

export async function POST() {
  try {
    const session = await IntentSessionRepo.create();

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
