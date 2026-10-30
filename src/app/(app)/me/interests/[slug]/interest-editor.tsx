"use client";

import { useActionState, useState } from "react";
import { Heart } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert, SubmitButton, type FormState } from "@/components/vybe/form";
import type { Hue } from "@/lib/hue";
import { cn } from "@/lib/utils";
import { saveCategoryInterestsAction } from "../actions";

type Sub = {
  id: number;
  name: string;
  prompt: string | null;
  kind: "multi" | "single" | "text";
  options: { id: number; name: string }[];
};

const VISIBILITY_LABELS = {
  public: "Shown on my VYBE",
  matching_only: "Matching only (hidden)",
  private: "Private (not used)",
} as const;

const SELECTED: Record<Hue, string> = {
  violet: "border-violet bg-violet/15",
  indigo: "border-indigo bg-indigo/15",
  blush: "border-blush bg-blush/15",
};

export function InterestEditor({
  categoryId,
  hue,
  subcategories,
  initialChoices,
  initialVisibility,
  initialDetails,
}: {
  categoryId: number;
  hue: Hue;
  subcategories: Sub[];
  initialChoices: Record<number, number>;
  initialVisibility: Record<string, string>;
  initialDetails: Record<number, string>;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveCategoryInterestsAction, {});
  const [choices, setChoices] = useState<Record<number, number>>(initialChoices);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [details, setDetails] = useState<Record<number, string>>(initialDetails);

  function toggle(sub: Sub, optionId: number) {
    setChoices((prev) => {
      const next = { ...prev };
      const current = prev[optionId];
      if (sub.kind === "single") {
        for (const o of sub.options) delete next[o.id];
        if (!current) next[optionId] = 2;
        return next;
      }
      // Multi: off -> like -> love -> off
      if (!current) next[optionId] = 2;
      else if (current === 2) next[optionId] = 3;
      else delete next[optionId];
      return next;
    });
  }

  const payload = JSON.stringify({
    categoryId,
    choices: Object.entries(choices).map(([option_id, intensity]) => ({ option_id: Number(option_id), intensity })),
    visibility,
    details: Object.entries(details).map(([subcategory_id, text]) => ({ subcategory_id: Number(subcategory_id), details: text })),
  });

  return (
    <form action={action} className="mt-8 space-y-6">
      <input type="hidden" name="payload" value={payload} />
      <p className="text-sm text-muted-foreground">
        Tap once to add, twice for <Heart className="inline size-3.5 fill-blush text-blush" aria-label="love it" />, three
        times to remove.
      </p>

      {subcategories.map((sub) => (
        <fieldset key={sub.id} className="rounded-3xl border border-white/8 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <legend className="font-heading text-lg font-semibold">{sub.name}</legend>
              {sub.prompt && <p className="mt-0.5 text-sm text-muted-foreground">{sub.prompt}</p>}
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="sr-only">Visibility for {sub.name}</span>
              <select
                value={visibility[sub.id]}
                onChange={(e) => setVisibility((v) => ({ ...v, [sub.id]: e.currentTarget.value }))}
                className="h-9 rounded-lg border border-input bg-surface px-2 text-xs text-foreground"
              >
                {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {sub.kind === "text" ? (
            <div className="mt-3 space-y-2">
              <Label htmlFor={`details-${sub.id}`} className="sr-only">
                {sub.name}
              </Label>
              <Textarea
                id={`details-${sub.id}`}
                maxLength={280}
                rows={2}
                value={details[sub.id] ?? ""}
                placeholder={sub.prompt ?? undefined}
                onChange={(e) => setDetails((d) => ({ ...d, [sub.id]: e.currentTarget.value }))}
                className="rounded-xl text-base"
              />
              <p className="text-right text-xs text-muted-foreground">{(details[sub.id] ?? "").length}/280</p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {sub.options.map((o) => {
                const level = choices[o.id];
                const stateLabel = !level ? "not selected" : level === 3 ? "love it" : "selected";
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => toggle(sub, o.id)}
                      aria-pressed={sub.kind === "single" ? undefined : Boolean(level)}
                      aria-label={`${o.name}: ${stateLabel}`}
                      role={sub.kind === "single" ? "radio" : undefined}
                      aria-checked={sub.kind === "single" ? Boolean(level) : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-4 text-sm transition-colors hover:border-white/30",
                        level && SELECTED[hue],
                      )}
                    >
                      {o.name}
                      {level === 3 && <Heart className="size-3.5 fill-blush text-blush" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>
      ))}

      <div className="sticky bottom-20 z-10 space-y-3 md:bottom-4">
        <FormAlert state={state} />
        <SubmitButton size="lg" className="shadow-xl shadow-black/40">
          Save {Object.keys(choices).length > 0 ? `(${Object.keys(choices).length} chosen)` : ""}
        </SubmitButton>
      </div>
    </form>
  );
}
