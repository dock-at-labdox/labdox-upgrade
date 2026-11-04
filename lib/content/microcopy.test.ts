import { describe, expect, it } from "vitest";

import { getMicrocopy, MICROCOPY } from "./microcopy";

describe("microcopy", () => {
  it("provides the expected homepage fork copy", async () => {
    const copy = await getMicrocopy();

    expect(copy.home).toEqual({
      headline: "",
      red: {
        label: "Discover your path.",
        sub: "Answer a few questions. Get a path built for you.",
      },
      blue: {
        label: "I know what I want.",
        sub: "Name the skill, role, or outcome. We'll match it.",
      },
    });
  });

  it("provides Blue and Red journey prompts, placeholders and suggestions", async () => {
    const copy = await getMicrocopy();

    expect(copy.blue.prompt).toBe("What are you looking for?");
    expect(copy.blue.placeholder).toEqual([
      "Data analytics job",
      "UI/UX portfolio",
      "automate my operations",
      "learn Python",
      "build a marketing strategy",
    ]);
    expect(copy.blue.starterChips).toEqual([
      "Data analytics",
      "UI/UX design",
      "Software development",
      "Digital marketing",
    ]);

    expect(copy.red.prompt).toBe("What do you want to achieve?");
    expect(copy.red.placeholder).toEqual([
      "Find a career that fits me",
      "Build skills for a new role",
      "Start my own business",
    ]);
    expect(copy.red.suggestions).toEqual([
      "Explore career options",
      "Change careers",
      "Grow my business",
      "Build confidence",
    ]);
  });

  it("provides the journey-switch labels", async () => {
    const copy = await getMicrocopy();

    expect(copy.switch).toEqual({
      toRed: "Not sure? Discover your path.",
      toBlue: "Browse by what you already know.",
    });
  });

  it("returns the current seed through the content adapter", async () => {
    await expect(getMicrocopy()).resolves.toBe(MICROCOPY);
  });
});
