import Link from "next/link";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-4 focus:py-2 focus:text-ink"
    >
      Skip to content
    </a>
  );
}

export function Mark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`font-mono tracking-[0.28em] text-phosphor ${className}`}>
      LABDOX
    </Link>
  );
}
