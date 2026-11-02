import { describe, expect, it } from "vitest";
import {
  GOAL_OPTIONS,
  PASSION_OPTIONS,
  getOutcomeQuestion,
  getPassionQuestion,
} from "./question-bank";

describe("quiz question bank", () => {
  it("provides the four supported goal options", () => {
    expect(GOAL_OPTIONS.map((option) => option.slug)).toEqual([
      "first_job",
      "switch_career",
      "upskill",
      "grow_business",
    ]);
  });

  it("provides six passion options", () => {
    expect(PASSION_OPTIONS).toHaveLength(6);
  });

  it("returns a persona-specific passion question", () => {
    expect(getPassionQuestion("student")).toBe(
      "What kind of activities do you enjoy most?",
    );
  });

  it("falls back for an unknown persona", () => {
    expect(getPassionQuestion("unknown")).toBe(
      "Which kind of work interests you most?",
    );
  });

  it("returns a goal-and-persona-specific outcome question", () => {
    expect(getOutcomeQuestion("grow_business", "entrepreneur")).toBe(
      "What would help you grow your business?",
    );
  });

  it("falls back for an unmatched goal and persona", () => {
    expect(getOutcomeQuestion("unknown", "unknown")).toBe(
      "What would you most like to achieve from this learning journey?",
    );
  });
});
