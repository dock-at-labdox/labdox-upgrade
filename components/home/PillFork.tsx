
import Link from "next/link";
import type { Microcopy } from "@/lib/content";

type PillForkProps = {
  microcopy: Microcopy;
};

export function PillFork({ microcopy }: PillForkProps) {
  return (
    <section
      aria-labelledby="home-heading"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-10 pt-20 sm:px-6"
    >
      <div className="w-full max-w-3xl">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-phosphor sm:text-sm">
          ANSH
        </p>

        {microcopy.home.headline ? (
          <h1
            id="home-heading"
            className="mt-5 text-center text-2xl font-medium text-ink sm:text-3xl"
          >
            {microcopy.home.headline}
          </h1>
        ) : (
          <h1 id="home-heading" className="sr-only">
            Choose how you want to explore Labdox
          </h1>
        )}

        <p className="mt-5 text-center font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Choose your path
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <li>
            <Link
              href="/discover-your-path"
              className="group flex min-h-36 flex-col justify-center rounded-2xl border-2 border-crimson bg-crimson-soft p-6 transition-colors hover:bg-crimson/15 hover:shadow-glow-red focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson motion-reduce:transition-none sm:min-h-44 sm:p-8"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
                Red pill
              </span>

              <span className="mt-3 text-xl font-medium text-ink sm:text-2xl">
                {microcopy.home.red.label}
              </span>

              <span className="mt-3 text-sm leading-6 text-ink-dim">
                {microcopy.home.red.sub}
              </span>

              <span
                aria-hidden="true"
                className="mt-4 font-mono text-sm text-crimson"
              >
                Explore path →
              </span>
            </Link>
          </li>

          <li>
            <Link
              href="/explore-courses"
              className="group flex min-h-36 flex-col justify-center rounded-2xl border-2 border-electric bg-electric-soft p-6 transition-colors hover:bg-electric/10 hover:shadow-glow-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric motion-reduce:transition-none sm:min-h-44 sm:p-8"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-electric">
                Blue pill
              </span>

              <span className="mt-3 text-xl font-medium text-ink sm:text-2xl">
                {microcopy.home.blue.label}
              </span>

              <span className="mt-3 text-sm leading-6 text-ink-dim">
                {microcopy.home.blue.sub}
              </span>

              <span
                aria-hidden="true"
                className="mt-4 font-mono text-sm text-electric"
              >
                Explore matches →
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}