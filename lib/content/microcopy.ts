export const MICROCOPY = {
  home: {
    headline: "",
    red: {
      label: "Discover your path.",
      sub: "Answer a few questions. Get a path built for you.",
    },
    blue: {
      label: "I know what I want.",
      sub: "Name the skill, role, or outcome. We'll match it.",
    },
  },
  blue: {
    prompt: "What are you looking for?",
    placeholder: [
      "Data analytics job",
      "UI/UX portfolio",
      "automate my operations",
      "learn Python",
      "build a marketing strategy",
    ],
  },
  red: {
    prompt: "What do you want to achieve?",
  },
  switch: {
    toRed: "Not sure? Discover your path.",
    toBlue: "Browse by what you already know.",
  },
} as const;

export type Microcopy = typeof MICROCOPY;

/** CMS adapter surface. Components import from `@/lib/content` only (DEC-016). */
export async function getMicrocopy(): Promise<Microcopy> {
  return MICROCOPY;
}