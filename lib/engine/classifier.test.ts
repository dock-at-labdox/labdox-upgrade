import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyStatement } from "./classifier";

describe("classifyStatement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AI_ENABLED;
    delete process.env.AI_API_KEY;
  });

  it("classifies a career switch request", () => {
    const result = classifyStatement("I want to switch career");

    expect(result.intentTag).toBe("switch_career");
    expect(result.confidence).toBe(0.8);
  });

  it("classifies an upskilling request", () => {
    const result = classifyStatement("I want to upskill");

    expect(result.intentTag).toBe("upskill");
    expect(result.confidence).toBe(0.8);
  });

  it("classifies a first-job request", () => {
    const result = classifyStatement("I am looking for my first job");

    expect(result.intentTag).toBe("first_job");
    expect(result.confidence).toBe(0.8);
  });

  it("returns no intent for empty input", () => {
    const result = classifyStatement("");

    expect(result).toEqual({
      intentTag: null,
      domainSlug: null,
      audience: null,
      confidence: 0,
    });
  });

  it("returns no intent for an unknown statement", () => {
    const result = classifyStatement("The weather is nice today");

    expect(result).toEqual({
      intentTag: null,
      domainSlug: null,
      audience: null,
      confidence: 0,
    });
  });

  it("keeps Blue's deterministic classifier isolated from the AI provider", () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_API_KEY = "synthetic-test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    expect(classifyStatement("I want to switch careers").intentTag).toBe(
      "switch_career",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
