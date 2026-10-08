import { describe, expect, it } from "vitest";

import { POST } from "../../app/api/classify/route";

describe("POST /api/classify", () => {
  it("rejects invalid JSON", async () => {
    const request = new Request("http://localhost/api/classify", {
      method: "POST",
      body: "{invalid",
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid JSON request body.");
  });

  it("rejects a missing text field", async () => {
    const request = new Request("http://localhost/api/classify", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("rejects empty text", async () => {
    const request = new Request("http://localhost/api/classify", {
      method: "POST",
      body: JSON.stringify({
        text: "   ",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("uses deterministic classification when AI is disabled", async () => {
    const request = new Request("http://localhost/api/classify", {
      method: "POST",
      body: JSON.stringify({
        text: "I want to switch careers",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      goalTag: "switch_career",
      passionTheme: null,
      confidence: 0.8,
      clarificationNeeded: false,
      deterministicOnly: true,
    });
  });
});
