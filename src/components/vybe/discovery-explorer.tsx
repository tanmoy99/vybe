"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { List, LoaderCircle, Orbit } from "lucide-react";
import { loadCandidatesAction } from "@/app/(app)/radar/actions";
import { Button } from "@/components/ui/button";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { PersonActions } from "@/components/vybe/person-actions";
import { PersonPanel } from "@/components/vybe/person-panel";
import { RadarOrbit } from "@/components/vybe/radar-orbit";
import type { Candidate, DiscoveryMode } from "@/lib/discovery";
import { TIER_LABEL, WAVELENGTH_LABEL } from "@/lib/matching/explain";
import { hueFor } from "@/lib/person-hue";
import { cn } from "@/lib/utils";

const MODES: { value: DiscoveryMode; label: string; hint: string }[] = [
  { value: "all", label: "Everyone", hint: "Closest areas first, then by wavelength." },
  { value: "taste_twin", label: "Taste twins", hint: "People with unusually similar specific tastes." },
  { value: "opposite", label: "Opposite VYBE", hint: "Compatible people with interestingly different tastes." },
];

const VIEW_KEY = "vybe:discovery-view";

// Per-device view preference in localStorage (never required for the page to work).
function readView(): "orbit" | "list" {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "orbit";
  } catch {
    return "orbit";
  }
}
function subscribeView(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("vybe:view", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("vybe:view", onChange);
  };
}
const PAGE = 24;

export function DiscoveryExplorer({
  initial,
  category = null,
  showModes = true,
}: {
  initial: Candidate[];
  category?: string | null;
  showModes?: boolean;
}) {
  const [mode, setMode] = useState<DiscoveryMode>("all");
  const view = useSyncExternalStore(subscribeView, readView, () => "orbit" as const);
  const [people, setPeople] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length === PAGE);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeView(v: "orbit" | "list") {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable: the toggle simply won't persist */
    }
    window.dispatchEvent(new Event("vybe:view"));
  }

  function load(nextMode: DiscoveryMode, offset: number) {
    startTransition(async () => {
      const res = await loadCandidatesAction({ mode: nextMode, category, offset });
      setError(res.error ?? null);
      setPeople((prev) => (offset === 0 ? res.candidates : [...prev, ...res.candidates]));
      setHasMore(res.candidates.length === PAGE);
    });
  }

  const selected = people.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showModes ? (
          <div role="radiogroup" aria-label="Discovery mode" className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                title={m.hint}
                onClick={() => {
                  setMode(m.value);
                  load(m.value, 0);
                }}
                className={cn(
                  "h-10 rounded-full border border-white/10 px-4 text-sm transition-colors",
                  mode === m.value ? "border-violet bg-violet/15 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div role="radiogroup" aria-label="View" className="flex rounded-full border border-white/10 p-1">
          {(["orbit", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => changeView(v)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm",
                view === v ? "bg-white/10 text-foreground" : "text-muted-foreground",
              )}
            >
              {v === "orbit" ? <Orbit className="size-4" aria-hidden="true" /> : <List className="size-4" aria-hidden="true" />}
              {v === "orbit" ? "Orbit" : "List"}
            </button>
          ))}
        </div>
      </div>
      {showModes && <p className="mt-2 text-sm text-muted-foreground">{MODES.find((m) => m.value === mode)?.hint}</p>}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className={cn("mt-6 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
        {people.length === 0 && !pending ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center">
            <p className="font-medium">No one on this wavelength yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              VYBE is new and only shows real, eligible people who match your preferences. Try another mode, widen your
              discovery radius in Privacy, or add more interests.
            </p>
          </div>
        ) : view === "orbit" ? (
          <RadarOrbit people={people} onSelect={setSelectedId} center={<AvatarOrb hue="violet" className="size-full" />} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="glass flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:border-violet/40"
                >
                  <AvatarOrb hue={hueFor(p.id)} className="size-12 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-heading font-semibold">{p.nickname}</span>
                      <span className="text-sm text-muted-foreground">
                        {p.age} · {p.areaLabel ? `Near ${p.areaLabel}` : TIER_LABEL[p.tier]}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm">{p.reasons[0] ?? WAVELENGTH_LABEL[p.wavelength]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {view === "orbit" && people.length > 0 && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Inner ring: same local area · Outer rings: wider Sydney. Rings are areas, never distances.
        </p>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => load(mode, people.length)} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            Show more people
          </Button>
        </div>
      )}

      <PersonPanel
        person={selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        actions={(p) => (
          <PersonActions
            person={p}
            onRemoved={() => {
              setPeople((prev) => prev.filter((x) => x.id !== p.id));
              setSelectedId(null);
            }}
          />
        )}
      />
    </div>
  );
}
