import { NextResponse } from "next/server";
import { IntentSessionRepo } from "@/lib/data/repos";

export async function POST() {
  try {
    const session = await IntentSessionRepo.create();

    const response = NextResponse.json(
      {
        sessionId: session.id,
        expiresAt: session.expiresAt,
      },
      { status: 201 },
    );

    response.cookies.set("labdox_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Failed to create session", error);

    return NextResponse.json(
      { error: "SESSION_CREATION_FAILED" },
      { status: 500 },
    );
  }
}
