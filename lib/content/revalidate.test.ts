import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { POST } from "../../app/api/revalidate/route";

const SECRET = "test-webhook-secret";

function signedRequest(
  body: string,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${body}`)
    .digest("base64url");

  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sanity-webhook-signature": `t=${timestamp},v1=${signature}`,
    },
    body,
  });
}

describe("POST /api/revalidate", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects requests without a configured webhook secret", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", "");

    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        body: '{"_type":"globalSettings"}',
      }),
    );

    expect(response.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", SECRET);

    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { "sanity-webhook-signature": "t=123,v1=invalid" },
        body: '{"_type":"globalSettings"}',
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an expired signature", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", SECRET);

    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const request = signedRequest(
      '{"_type":"globalSettings"}',
      oldTimestamp,
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON even when the signature is valid", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", SECRET);

    const response = await POST(signedRequest("{invalid-json"));

    expect(response.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates all three pages for a published microcopy document", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", SECRET);

    const response = await POST(
      signedRequest('{"_type":"globalSettings"}'),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/explore-courses");
    expect(revalidatePath).toHaveBeenCalledWith("/discover-your-path");
  });

  it("does not revalidate pages for unrelated document types", async () => {
    vi.stubEnv("CMS_WEBHOOK_SECRET", SECRET);

    const response = await POST(
      signedRequest('{"_type":"questionBank"}'),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
