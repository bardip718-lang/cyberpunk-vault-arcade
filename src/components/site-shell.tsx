import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const SITE_URL = "https://cyberpunk-vault-arcade.lovable.app";

export const INFO_LINKS = [
  { to: "/about", label: "About" },
  { to: "/how-to-play", label: "How to Play" },
  { to: "/responsible-play", label: "Responsible Play" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
] as const;

export function pageHead(path: string, title: string, description: string) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border pt-5 pb-4 text-xs text-muted-foreground">
      <nav aria-label="Site information">
        <ul className="grid grid-cols-2 gap-2">
          {INFO_LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="hover:text-foreground underline-offset-2 hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-4 leading-relaxed">
        18+ only. Games are based on chance. Real-money play involves the risk of losing your
        deposit. Play only where it is legal for you.
      </p>
      <p className="mt-2">© {new Date().getFullYear()} win1</p>
    </footer>
  );
}

export function InfoPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-black italic tracking-tight text-primary">
            1win
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to lobby
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{title}</h1>
          {updated && <p className="text-xs">Last updated: {updated}</p>}
          {children}
        </article>
        <SiteFooter />
      </main>
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-accent px-1 text-accent-foreground">[PLACEHOLDER — owner to edit: {children}]</mark>
  );
}
