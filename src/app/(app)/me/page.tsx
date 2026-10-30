import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, EyeOff, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { DnaWave } from "@/components/vybe/dna-wave";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { HUE_DOT } from "@/lib/hue";
import { getMyDna } from "@/lib/interests";

export const metadata: Metadata = { title: "My VYBE" };

export default function MyVybePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/5" aria-label="Loading your VYBE" />}>
      <MyVybe />
    </Suspense>
  );
}

const MORE_LINKS = [{ href: "/me/interests", label: "Edit my interests", description: "Add, remove or hide anything in your VYBE DNA." }];

async function MyVybe() {
  const profile = await requireOnboardedProfile();
  const dna = await getMyDna(profile.id);
  const total = dna.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <AvatarOrb hue="violet" className="size-16" />
        <div>
          <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">My VYBE</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{profile.nickname}</h1>
        </div>
      </header>

      <section aria-labelledby="dna-heading" className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="dna-heading" className="text-xl font-semibold">
              VYBE DNA
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 0 ? "Your DNA is blank so far." : `${total} interests across ${dna.length} worlds.`}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/me/interests">
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </Button>
        </div>

        {dna.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-muted-foreground">
              Add what you love so people on your wavelength can find you. Matching needs at least 5 interests.
            </p>
            <Button asChild className="mt-4">
              <Link href="/me/interests">Build my VYBE DNA</Link>
            </Button>
          </div>
        ) : (
          <>
            <DnaWave
              className="mt-6 h-28"
              label={`Signal waves for ${dna.map((s) => s.category.world_name).join(", ")}`}
              strands={dna.map((s) => ({
                label: s.category.slug,
                hue: s.category.hue,
                weight: Math.min(1, s.items.reduce((n, i) => n + i.intensity, 0) / 12),
              }))}
            />
            <dl className="mt-6 space-y-5">
              {dna.map((strand) => (
                <div key={strand.category.id} className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="flex items-center gap-2 text-sm font-medium">
                    <span className={`size-2 rounded-full ${HUE_DOT[strand.category.hue]}`} aria-hidden="true" />
                    {strand.category.world_name}
                  </dt>
                  <dd>
                    <ul className="flex flex-wrap gap-1.5">
                      {strand.items.map((item) => (
                        <li
                          key={item.optionId}
                          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm"
                        >
                          {item.name}
                          {item.intensity === 3 && <span className="text-blush" aria-label="(loves it)">♥</span>}
                          {item.visibility === "matching_only" && (
                            <EyeOff className="size-3.5 text-muted-foreground" aria-label="(used for matching only)" />
                          )}
                          {item.visibility === "private" && <Lock className="size-3.5 text-muted-foreground" aria-label="(private)" />}
                        </li>
                      ))}
                    </ul>
                    {strand.details.map((d) => (
                      <p key={d.subcategory} className="mt-2 text-sm text-muted-foreground">
                        <span className="text-foreground">{d.subcategory}:</span> {d.details}
                        {d.visibility !== "public" && <Lock className="ml-1 inline size-3.5" aria-label="(not public)" />}
                      </p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="text-blush">♥</span> loves it
              </span>
              <span className="inline-flex items-center gap-1">
                <EyeOff className="size-3.5" aria-hidden="true" /> matching only
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5" aria-hidden="true" /> private
              </span>
            </p>
          </>
        )}
      </section>

      <nav aria-label="My VYBE settings">
        <ul className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/8">
          {MORE_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                <span className="flex-1">
                  <span className="block font-medium">{link.label}</span>
                  <span className="block text-sm text-muted-foreground">{link.description}</span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
