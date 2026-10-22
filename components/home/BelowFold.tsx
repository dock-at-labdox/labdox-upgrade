import Link from "next/link";

export function BelowFold() {
  return (
    <section className="border-t border-hairline px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl text-ink">What is Labdox</h2>
        <p className="mt-4 text-ink-dim">
          Labdox is an intent-based learning studio. The homepage asks which kind of help you want â€” a guided
          path, or a match from what you already know. Proof, pedagogy, and people live on quieter pages.
        </p>
        <p className="mt-4 text-sm text-ink-dim">
          Metrics appear only from the claims register. Employer names, never logos. Amit Kothari&apos;s portrait
          appears only on Team.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/about" className="text-phosphor-text underline-offset-4 hover:underline">
            About Labdox
          </Link>
          <Link href="/credibility" className="text-phosphor-text underline-offset-4 hover:underline">
            Credibility
          </Link>
        </div>
      </div>
    </section>
  );
}
