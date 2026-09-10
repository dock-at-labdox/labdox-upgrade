import Link from "next/link";
import { HEADER_CTA } from "@/lib/routes";

type StubPageProps = {
  title: string;
  job: string;
  children?: React.ReactNode;
};

export function StubPage({ title, job, children }: StubPageProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-phosphor-text">Labdox</p>
      <h1 className="mt-3 text-4xl text-ink">{title}</h1>
      <p className="mt-6 text-lg text-ink-dim">{job}</p>
      {children ? <div className="mt-10 space-y-4 text-ink-dim">{children}</div> : null}
      <p className="mt-12">
        <Link href={HEADER_CTA.href} className="text-crimson underline-offset-4 hover:underline">
          {HEADER_CTA.label}
        </Link>
      </p>
    </article>
  );
}
