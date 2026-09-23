"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { Microcopy } from "@/lib/content";

type PillForkProps = {
  microcopy: Microcopy;
};

type Journey = "red" | "blue" | null;

const SUGGESTIONS = [
  "Find a UI/UX job",
  "Learn Data Analytics",
  "Switch my career",
  "Explore career options",
];

export function PillFork({ microcopy }: PillForkProps) {
  const [input, setInput] = useState("");
  const [journey, setJourney] = useState<Journey>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();

    if (!value) {
      setError("Please tell Ansh what you are looking for.");
      return;
    }

    setError("");
    setLoading(true);

    // Temporary frontend loading state.
    // API integration will be connected when the backend endpoint is available.
    setTimeout(() => {
      setLoading(false);
      setJourney("blue");
    }, 800);
  }

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-16 pt-20">
      <p className="font-mono text-sm tracking-[0.35em] text-phosphor">ANSH</p>

      <h1 className="mt-6 max-w-2xl text-center text-3xl text-ink sm:text-4xl">
        What do you want to achieve?
      </h1>

      <p className="mt-4 max-w-xl text-center text-sm text-ink-dim sm:text-base">
        Tell Ansh what you are looking for, and choose how you want to explore it.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 w-full max-w-2xl"
        noValidate
      >
        <label htmlFor="ansh-input" className="sr-only">
          {microcopy.blue.prompt}
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="ansh-input"
            type="text"
            value={input}
            disabled={loading}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError("");
            }}
            placeholder={microcopy.blue.placeholder[0]}
            className="min-h-14 flex-1 rounded-xl border border-hairline bg-surface px-5 text-ink outline-none transition focus:border-phosphor focus:shadow-glow-green disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 rounded-xl border border-phosphor bg-phosphor px-6 font-mono text-sm font-medium text-void transition hover:bg-phosphor-dim focus-visible:outline-phosphor disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-error">
            {error}
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex w-full max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => {
              setInput(suggestion);
              setError("");
            }}
            className="rounded-full border border-hairline bg-surface px-4 py-2 text-sm text-ink-dim transition hover:border-phosphor hover:text-phosphor focus-visible:outline-phosphor disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-12 w-full max-w-3xl">
        <p className="mb-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
          Choose your path
        </p>

        <ul className="grid w-full gap-4 sm:grid-cols-2">
          <li>
            <Link
              href="/discover-your-path"
              onClick={() => setJourney("red")}
              className={`group flex min-h-14 flex-col justify-center rounded-xl border-2 border-crimson bg-crimson-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-red focus-visible:outline-crimson motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                journey === "red" ? "shadow-glow-red" : ""
              }`}
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
                Red pill
              </span>

              <span className="mt-2 text-xl text-ink">
                {microcopy.red.prompt}
              </span>

              <span className="mt-2 text-sm text-ink-dim">
                {microcopy.home.red.sub}
              </span>
            </Link>
          </li>

          <li>
            <Link
              href="/explore-courses"
              onClick={() => setJourney("blue")}
              className={`group flex min-h-14 flex-col justify-center rounded-xl border-2 border-electric bg-electric-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-blue focus-visible:outline-electric motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                journey === "blue" ? "shadow-glow-blue" : ""
              }`}
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-electric">
                Blue pill
              </span>

              <span className="mt-2 text-xl text-ink">
                {microcopy.home.blue.label}
              </span>

              <span className="mt-2 text-sm text-ink-dim">
                {microcopy.home.blue.sub}
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}