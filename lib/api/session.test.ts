import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../app/api/session/route";
import { IntentSessionRepo } from "@/lib/data/repos";

vi.mock("@/lib/data/repos", () => ({
  IntentSessionRepo: {
    create: vi.fn(),
  },
}));

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(IntentSessionRepo.create).mockResolvedValue({
      id: "9f46ff9a-1ff0-46da-b5fe-2e08efff58f0",
      expiresAt: new Date("2099-10-09T00:00:00.000Z"),
    } as unknown as Awaited<ReturnType<typeof IntentSessionRepo.create>>);
  });

  it.each(["red", "blue"] as const)(
    "records the selected %s pill on the session",
    async (pill) => {
      const response = await POST(
        new Request("http://localhost/api/session", {
          method: "POST",
          body: JSON.stringify({ pill }),
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status).toBe(201);
      expect(IntentSessionRepo.create).toHaveBeenCalledWith(pill);
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    },
  );

  it("requires callers to choose a Red or Blue journey", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", { method: "POST" }),
    );

    expect(response.status).toBe(400);
    expect(IntentSessionRepo.create).not.toHaveBeenCalled();
  });

  it("rejects invalid pill values", async () => {
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        body: JSON.stringify({ pill: "other" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    expect(IntentSessionRepo.create).not.toHaveBeenCalled();
  });
});
