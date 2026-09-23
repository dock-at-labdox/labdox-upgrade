import { describe, expect, it } from "vitest";
import { classifyStatement } from "./classifier";

describe("classifyStatement", () => {
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
});
