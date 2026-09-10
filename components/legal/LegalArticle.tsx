type LegalArticleProps = {
  title: string;
  version: string;
  children: React.ReactNode;
};

export function LegalArticle({ title, version, children }: LegalArticleProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-phosphor-text">{version}</p>
      <h1 className="mt-3 text-4xl text-ink">{title}</h1>
      <p className="mt-4 rounded-lg border border-hairline bg-surface px-4 py-3 text-sm text-ink-dim">
        Draft pending owner review (DEC-032). Placeholders such as legal entity name are not filled in.
      </p>
      <div className="prose-legal mt-10 space-y-6 text-ink-dim">{children}</div>
    </article>
  );
}
