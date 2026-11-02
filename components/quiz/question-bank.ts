import {
  AUDIENCES,
  INTENT_TAGS,
  OUTCOME_TAGS,
  PASSION_THEMES,
} from "@/lib/taxonomy/constants";

export const QUIZ_STEPS = 5;

export const GOAL_OPTIONS = INTENT_TAGS.filter((item) =>
  ["first_job", "switch_career", "upskill", "grow_business"].includes(item.slug),
);

export const PERSONA_OPTIONS = AUDIENCES;
export const PASSION_OPTIONS = PASSION_THEMES;
export const OUTCOME_OPTIONS = OUTCOME_TAGS;

export const TIME_OPTIONS = [
  { slug: "flexible", label: "A flexible pace that fits my schedule" },
  { slug: "steady", label: "A steady, consistent learning pace" },
  { slug: "intensive", label: "A focused, intensive learning experience" },
  { slug: "unsure", label: "I'm not sure yet" },
] as const;

export const PASSION_QUESTION_BANK: Record<string, string> = {
  student: "What kind of activities do you enjoy most?",
  professional: "What kind of work would you like to do more of?",
  entrepreneur: "What kind of work would help you move your venture forward?",
  organization: "What kind of work would help your organization most?",
  default: "Which kind of work interests you most?",
};

export const OUTCOME_QUESTION_BANK: Record<string, string> = {
  "first_job:student": "What would help you feel ready for your first opportunity?",
  "first_job:professional": "What would help you prepare for your next opportunity?",
  "switch_career:professional": "What would help you prepare for a career change?",
  "upskill:professional": "What would you most like to achieve in your current role?",
  "grow_business:entrepreneur": "What would help you grow your business?",
  "solve_problem:organization": "What outcome would help address your organization's needs?",
  default: "What would you most like to achieve from this learning journey?",
};

export function getPassionQuestion(persona?: string): string {
  return PASSION_QUESTION_BANK[persona ?? ""] ?? PASSION_QUESTION_BANK.default;
}

export function getOutcomeQuestion(goal?: string, persona?: string): string {
  const key = `${goal ?? ""}:${persona ?? ""}`;
  return OUTCOME_QUESTION_BANK[key] ?? OUTCOME_QUESTION_BANK.default;
}
