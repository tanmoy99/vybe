import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { HUE_DOT } from "@/lib/hue";
import { getCategories, getMyDna } from "@/lib/interests";
import { MIN_INTERESTS_FOR_DISCOVERY } from "@/lib/validation/interests";

export const metadata: Metadata = { title: "My interests" };

export default function InterestsIndexPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/5" aria-label="Loading" />}>
      <InterestsIndex />
    </Suspense>
  );
}

async function InterestsIndex() {
  const profile = await requireOnboardedProfile();
  const [categories, dna] = await Promise.all([getCategories(), getMyDna(profile.id)]);
  const counts = new Map(dna.map((s) => [s.category.id, s.items.length]));
  const total = dna.reduce((n, s) => n + s.items.length, 0);
  const remaining = Math.max(0, MIN_INTERESTS_FOR_DISCOVERY - total);

  return (
    <div>
      <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
        ← My VYBE
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Build your VYBE DNA</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Step into each world and pick the specifics. Go as deep as you like; you can hide anything, or keep it for
        matching only.
      </p>
      <p
        role="status"
        className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
      >
        {remaining > 0
          ? `${total} chosen · add ${remaining} more to appear in discovery`
          : `${total} interests chosen · you're discoverable`}
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {categories.map((c) => {
          const count = counts.get(c.id) ?? 0;
          return (
            <li key={c.id}>
              <Link
                href={`/me/interests/${c.slug}`}
                className="glass flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors hover:border-violet/40"
              >
                <span className={`size-3 shrink-0 rounded-full ${HUE_DOT[c.hue]}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-heading font-semibold">{c.world_name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{c.description}</span>
                </span>
                <span className="text-sm text-muted-foreground">{count > 0 ? `${count} chosen` : "Explore"}</span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
