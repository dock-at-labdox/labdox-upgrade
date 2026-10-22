"use client";

import { useEffect, useState } from "react";

type StatedIntentFieldProps = {
  prompt: string;
  placeholders: readonly string[];
};

export function StatedIntentField({
  prompt,
  placeholders,
}: StatedIntentFieldProps) {
  const [intent, setIntent] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      return;
    }

    const timer = window.setInterval(() => {
      setPlaceholderIndex(
        (current) => (current + 1) % placeholders.length,
      );
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isFocused, placeholders.length]);

  const activePlaceholder =
    placeholders[placeholderIndex] ?? placeholders[0] ?? "";

  return (
    <>
      <form
        className="mt-10"
        onSubmit={(event) => event.preventDefault()}
      >
        <label
          htmlFor="blue-intent"
          className="block font-mono text-sm text-electric"
        >
          {prompt}
        </label>

        <input
          id="blue-intent"
          name="intent"
          type="text"
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={activePlaceholder}
          autoComplete="off"
          className="mt-2 w-full rounded-full border-2 border-electric bg-electric-soft px-5 py-4 text-ink outline-none placeholder:text-ink-dim focus-visible:ring-2 focus-visible:ring-electric motion-reduce:transition-none"
        />

        <div
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Starter searches"
        >
          {placeholders.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setIntent(chip)}
              className="min-h-11 rounded-full border border-electric px-4 font-mono text-sm text-electric transition-colors hover:bg-electric-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric motion-reduce:transition-none"
            >
              {chip}
            </button>
          ))}
        </div>
      </form>

      <p className="mt-8 text-sm text-ink-dim" aria-live="polite">
        {intent
          ? "Your stated intent is ready for a deterministic catalogue match."
          : "Type what you want or choose a starter search."}
      </p>
    </>
  );
}