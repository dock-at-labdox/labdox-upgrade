import { describe, expect, it } from "vitest";
import { AUDIENCES, DOMAINS, INTENT_TAGS, PASSION_THEMES } from "./constants";
import { slugify } from "./slug";

describe("taxonomy lock", () => {
  it("keeps the documented audience set", () => {
    expect(AUDIENCES.map((row) => row.slug)).toEqual([
      "student",
      "professional",
      "entrepreneur",
      "organization",
    ]);
  });

  it("keeps six intent tags", () => {
    expect(INTENT_TAGS).toHaveLength(6);
  });

  it("keeps six passion themes", () => {
    expect(PASSION_THEMES).toHaveLength(6);
  });

  it("keeps sixteen domain labels from the taxonomy doc", () => {
    expect(DOMAINS).toHaveLength(16);
  });
});

describe("slugify", () => {
  it("builds stable slugs", () => {
    expect(slugify("Data & Analytics")).toBe("data-and-analytics");
  });
});
