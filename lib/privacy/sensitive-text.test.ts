import { describe, expect, it } from "vitest";

import { isSafeFreeTextForPersistence } from "./sensitive-text";

describe("isSafeFreeTextForPersistence", () => {
  it.each([
    "Contact me at person@example.com",
    "Call me at +91 98765 43210",
    "api_key=abcdef123456789",
    "password: MySecretPassword123",
    "Bearer abcdefghijklmnopqrstuvwxyz",
    "My key is sk-1234567890abcdef",
    "-----BEGIN PRIVATE KEY-----",
  ])("rejects sensitive text: %s", (text) => {
    expect(isSafeFreeTextForPersistence(text)).toBe(false);
  });

  it("allows ordinary career-related text", () => {
    expect(
      isSafeFreeTextForPersistence(
        "I want to switch careers into data analytics.",
      ),
    ).toBe(true);
  });
});
