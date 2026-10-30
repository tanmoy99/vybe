import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/vybe/logo";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-10">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="h-10 px-4">
            <Link href="/signup">Join the beta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

const FOOTER = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Made in Sydney. Adults 18+ only. Private beta.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {FOOTER.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

/** Long-form static page (About, Safety, Terms, ...). */
export function ProsePage({
  eyebrow,
  title,
  intro,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  notice?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg text-muted-foreground">{intro}</p>
      {notice && (
        <p role="note" className="mt-6 rounded-xl border border-blush/30 bg-blush/10 px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      <div className="mt-10 space-y-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_p]:text-muted-foreground [&_section>ul]:mt-3 [&_section>ul]:list-disc [&_section>ul]:pl-5 [&_section>ul]:text-muted-foreground">
        {children}
      </div>
    </main>
  );
}
