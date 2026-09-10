"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HEADER_CTA, HEADER_NAV } from "@/lib/routes";
import { Mark } from "./SkipLink";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const minimal = pathname === "/";

  return (
    <header className={`z-40 ${minimal ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-hairline bg-void/90 backdrop-blur"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Mark className="text-sm" />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-dim transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={HEADER_CTA.href}
            className="rounded-full border border-crimson bg-crimson-soft px-4 py-2 text-sm text-crimson transition-colors hover:bg-crimson hover:text-void"
          >
            {HEADER_CTA.label}
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-hairline text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="font-mono text-phosphor">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-hairline bg-surface px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {HEADER_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-14 items-center text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={HEADER_CTA.href}
                className="flex min-h-14 items-center text-crimson"
                onClick={() => setOpen(false)}
              >
                {HEADER_CTA.label}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
