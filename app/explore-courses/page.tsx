import Link from "next/link";

import { StatedIntentField } from "@/components/explore/StatedIntentField";
import { getMicrocopy } from "@/lib/content";

export default async function ExploreCoursesPage() {
  const copy = await getMicrocopy();

  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-phosphor-text">
        Labdox
      </p>

      <h1 className="mt-3 text-4xl text-ink">{copy.home.blue.label}</h1>

      <p className="mt-6 text-lg text-ink-dim">{copy.home.blue.sub}</p>

      <div className="mt-10 space-y-4 text-ink-dim">
        <StatedIntentField
          prompt={copy.blue.prompt}
          placeholders={copy.blue.placeholder}
        />

        <p className="mt-8 text-sm">
          Blue uses stated intent with a deterministic catalogue match. No AI
          calls are made on this path.
        </p>

        <p className="mt-12">
          <Link
            href="/discover-your-path"
            className="text-crimson underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
          >
            {copy.switch.toRed}
          </Link>
        </p>
      </div>
    </article>
  );
}