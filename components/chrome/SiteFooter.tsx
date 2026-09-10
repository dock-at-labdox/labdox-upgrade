import Link from "next/link";
import { FOOTER_GROUPS } from "@/lib/routes";
import { Mark } from "./SkipLink";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <Mark className="text-xs" />
          <p className="mt-4 max-w-xs text-sm text-ink-dim">
            Intent-based learning. Labdox history and group history are told on separate pages.
          </p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-xs uppercase tracking-widest text-phosphor-text">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-dim hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
