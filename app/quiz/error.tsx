"use client";

import { useEffect } from "react";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Quiz route error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-ink">
        We couldn’t load your question
      </h1>
      <p className="mt-3 text-ink-dim">
        Please try again, or switch to Blue to explore another path.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-crimson px-6 py-3 font-semibold text-white"
        >
          Retry
        </button>
        <a
          href="/explore-courses"
          className="rounded-lg border border-hairline px-6 py-3 text-ink"
        >
          Switch to Blue
        </a>
      </div>
    </main>
  );
}
