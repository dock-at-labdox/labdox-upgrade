import { fetchSanityMicrocopy, isSanityConfigured } from "./sanity";

export type Microcopy = {
  home: {
    headline: string;
    red: { label: string; sub: string };
    blue: { label: string; sub: string };
  };
  blue: {
    prompt: string;
    placeholder: readonly string[];
    starterChips: readonly string[];
  };
  red: {
    prompt: string;
    placeholder: readonly string[];
    suggestions: readonly string[];
  };
  switch: {
    toRed: string;
    toBlue: string;
  };
};

export const MICROCOPY: Microcopy = {
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
    starterChips: [
      "Data analytics",
      "UI/UX design",
      "Software development",
      "Digital marketing",
    ],
  },
  red: {
    prompt: "What do you want to achieve?",
    placeholder: [
      "Find a career that fits me",
      "Build skills for a new role",
      "Start my own business",
    ],
    suggestions: [
      "Explore career options",
      "Change careers",
      "Grow my business",
      "Build confidence",
    ],
  },
  switch: {
    toRed: "Not sure? Discover your path.",
    toBlue: "Browse by what you already know.",
  },
};

type SanityResult = {
  settings?: Record<string, unknown> | null;
  prompts?: Array<{
    journey: "blue" | "red";
    kind: "placeholder" | "starter_chip";
    label: string;
  }>;
};

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function mapSanityCopy(data: SanityResult): Microcopy {
  const settings = data.settings ?? {};
  const home = (settings.home ?? {}) as Record<string, unknown>;
  const homeRed = (home.red ?? {}) as Record<string, unknown>;
  const homeBlue = (home.blue ?? {}) as Record<string, unknown>;
  const red = (settings.red ?? {}) as Record<string, unknown>;
  const blue = (settings.blue ?? {}) as Record<string, unknown>;
  const switchCopy = (settings.switch ?? {}) as Record<string, unknown>;
  const prompts = data.prompts ?? [];

  const getPrompts = (
    journey: "blue" | "red",
    kind: "placeholder" | "starter_chip",
  ) =>
    prompts
      .filter((item) => item.journey === journey && item.kind === kind)
      .map((item) => item.label);

  const bluePlaceholders = getPrompts("blue", "placeholder");
  const blueStarterChips = getPrompts("blue", "starter_chip");
  const redPlaceholders = getPrompts("red", "placeholder");
  const redSuggestions = getPrompts("red", "starter_chip");

  return {
    home: {
      headline: readString(home.headline, MICROCOPY.home.headline),
      red: {
        label: readString(homeRed.label, MICROCOPY.home.red.label),
        sub: readString(homeRed.sub, MICROCOPY.home.red.sub),
      },
      blue: {
        label: readString(homeBlue.label, MICROCOPY.home.blue.label),
        sub: readString(homeBlue.sub, MICROCOPY.home.blue.sub),
      },
    },
    blue: {
      prompt: readString(blue.prompt, MICROCOPY.blue.prompt),
      placeholder: bluePlaceholders.length
        ? bluePlaceholders
        : MICROCOPY.blue.placeholder,
      starterChips: blueStarterChips.length
        ? blueStarterChips
        : MICROCOPY.blue.starterChips,
    },
    red: {
      prompt: readString(red.prompt, MICROCOPY.red.prompt),
      placeholder: redPlaceholders.length
        ? redPlaceholders
        : MICROCOPY.red.placeholder,
      suggestions: redSuggestions.length
        ? redSuggestions
        : MICROCOPY.red.suggestions,
    },
    switch: {
      toRed: readString(switchCopy.toRed, MICROCOPY.switch.toRed),
      toBlue: readString(switchCopy.toBlue, MICROCOPY.switch.toBlue),
    },
  };
}

export async function getMicrocopy(): Promise<Microcopy> {
  if (!isSanityConfigured) {
    return MICROCOPY;
  }

  try {
    const data = (await fetchSanityMicrocopy()) as SanityResult | null;
    return data ? mapSanityCopy(data) : MICROCOPY;
  } catch (error) {
    console.error("Unable to load CMS microcopy; using seed copy.", error);
    return MICROCOPY;
  }
}
