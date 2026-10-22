import Link from "next/link";
import type { Microcopy } from "@/lib/content";

type PillForkProps = {
  microcopy: Microcopy;
};

export function PillFork({ microcopy }: PillForkProps) {
  return (
    <section className="relative flex min-h-[70dvh] flex-col items-center justify-center px-4 py-20">
      <p className="font-mono text-sm tracking-[0.35em] text-phosphor">
        ANSH
      </p>

      {microcopy.home.headline ? (
        <h1 className="mt-6 max-w-2xl text-center text-3xl text-ink sm:text-4xl">
          {microcopy.home.headline}
        </h1>
      ) : null}

      <nav
        aria-label="Choose how to continue"
        className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2"
      >
        <Link
          href="/discover-your-path"
          className="group flex min-h-40 flex-col justify-center rounded-xl border-2 border-crimson bg-crimson-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
            Red
          </span>

          <span className="mt-3 text-2xl text-ink">
            {microcopy.home.red.label}
          </span>

          <span className="mt-2 text-sm text-ink-dim">
            {microcopy.home.red.sub}
          </span>
        </Link>

        <Link
          href="/explore-courses"
          className="group flex min-h-40 flex-col justify-center rounded-xl border-2 border-electric bg-electric-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-electric">
            Blue
          </span>

          <span className="mt-3 text-2xl text-ink">
            {microcopy.home.blue.label}
          </span>

          <span className="mt-2 text-sm text-ink-dim">
            {microcopy.home.blue.sub}
          </span>
        </Link>
      </nav>
    </section>
  );
}