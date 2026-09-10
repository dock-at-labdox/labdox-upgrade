import Link from "next/link";

export default function NotFound() {
  return (
    <article className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-phosphor">404</p>
      <h1 className="mt-4 text-3xl">This page is not on the map</h1>
      <p className="mt-4 text-ink-dim">
        <Link href="/" className="text-phosphor-text underline-offset-4 hover:underline">
          Back to the fork
        </Link>
      </p>
    </article>
  );
}
