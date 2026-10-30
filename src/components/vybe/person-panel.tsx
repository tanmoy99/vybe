"use client";

import { Languages, MapPin, MessageCircleHeart, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { CONNECTION_KIND_LABEL, TIER_LABEL, WAVELENGTH_LABEL } from "@/lib/matching/explain";
import { hueFor } from "@/lib/person-hue";

export type PanelPerson = {
  id: string;
  nickname: string;
  age: number;
  connectionKind: string;
  tier: number;
  areaLabel: string | null;
  wavelength: number;
  shared: { name: string; world: string; love: boolean }[];
  sharedHiddenCount: number;
  languages: string[];
  highlights: { name: string; world: string }[];
  reasons: string[];
  spark: string;
};

/** Floating profile panel: world before face. Actions (connect, block, report) are passed in. */
export function PersonPanel({
  person,
  onOpenChange,
  actions,
}: {
  person: PanelPerson | null;
  onOpenChange: (open: boolean) => void;
  actions?: (person: PanelPerson) => React.ReactNode;
}) {
  return (
    <Sheet open={person !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass mx-auto max-h-[88dvh] max-w-xl overflow-y-auto rounded-t-3xl border-white/10 px-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {person && (
          <div className="px-5 sm:px-7">
            <SheetHeader className="px-0">
              <div className="flex items-center gap-4">
                <AvatarOrb hue={hueFor(person.id)} className="size-16" />
                <div className="min-w-0 text-left">
                  <SheetTitle className="font-heading text-2xl">{person.nickname}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span>{person.age}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {person.areaLabel ? `Near ${person.areaLabel}` : TIER_LABEL[person.tier]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{CONNECTION_KIND_LABEL[person.connectionKind]}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <p className="mt-2 inline-flex rounded-full bg-violet/15 px-3 py-1 text-xs font-medium text-violet">
              {WAVELENGTH_LABEL[person.wavelength]}
            </p>

            {person.reasons.length > 0 && (
              <section aria-label="Why you might click" className="mt-4 space-y-2">
                {person.reasons.map((r) => (
                  <p key={r} className="flex gap-2">
                    <Sparkles className="mt-1 size-4 shrink-0 text-blush" aria-hidden="true" />
                    <span>{r}</span>
                  </p>
                ))}
              </section>
            )}

            {person.shared.length > 0 && (
              <section aria-labelledby="shared-h" className="mt-6">
                <h3 id="shared-h" className="text-xs tracking-wider text-muted-foreground uppercase">
                  Shared
                </h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {person.shared.map((s) => (
                    <li key={s.name} className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-1 text-sm">
                      {s.name}
                      {s.love && <span className="ml-1 text-blush" aria-label="(you both love it)">♥</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {person.highlights.length > 0 && (
              <section aria-labelledby="into-h" className="mt-6">
                <h3 id="into-h" className="text-xs tracking-wider text-muted-foreground uppercase">
                  Into
                </h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {person.highlights.map((h) => (
                    <li key={h.name} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm" title={h.world}>
                      {h.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {person.languages.length > 0 && (
              <p className="mt-6 flex items-center gap-2 text-sm">
                <Languages className="size-4 text-indigo" aria-hidden="true" />
                Common languages: {person.languages.join(", ")}
              </p>
            )}

            <section aria-label="Conversation spark" className="mt-6 rounded-2xl border border-blush/25 bg-blush/8 p-4">
              <p className="flex items-center gap-2 text-xs tracking-wider text-blush uppercase">
                <MessageCircleHeart className="size-4" aria-hidden="true" /> Conversation spark
              </p>
              <p className="mt-2">{person.spark}</p>
            </section>

            {actions && <div className="mt-6">{actions(person)}</div>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
