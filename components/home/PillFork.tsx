import Link from "next/link";
import type { Microcopy } from "@/lib/content";

type PillForkProps = {
  microcopy: Microcopy;
};

export function PillFork({ microcopy }: PillForkProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-16 pt-20">
      <p className="font-mono text-sm tracking-[0.35em] text-phosphor">LABDOX</p>
      {microcopy.home.headline ? (
        <h1 className="mt-6 max-w-xl text-center text-2xl text-ink sm:text-3xl">{microcopy.home.headline}</h1>
      ) : (
        <h1 className="sr-only">Choose a path: discover yours, or name what you already want.</h1>
      )}
      <ul className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/discover-your-path"
            className="group flex min-h-14 flex-col justify-center rounded-xl border-2 border-crimson bg-crimson-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-red focus-visible:outline-crimson motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">Red pill</span>
            <span className="mt-2 text-xl text-ink">{microcopy.home.red.label}</span>
            <span className="mt-2 text-sm text-ink-dim">{microcopy.home.red.sub}</span>
          </Link>
        </li>
        <li>
          <Link
            href="/explore-courses"
            className="group flex min-h-14 flex-col justify-center rounded-xl border-2 border-electric bg-electric-soft px-6 py-8 transition duration-200 hover:-translate-y-[2px] hover:shadow-glow-blue focus-visible:outline-electric motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-electric">Blue pill</span>
            <span className="mt-2 text-xl text-ink">{microcopy.home.blue.label}</span>
            <span className="mt-2 text-sm text-ink-dim">{microcopy.home.blue.sub}</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
