"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert, SubmitButton, type FormState } from "@/components/vybe/form";
import type { Enums } from "@/lib/supabase/database.types";
import { saveLanguagesAction } from "../actions";

type Language = { code: string; name: string; native_name: string | null };
type Selected = { code: string; proficiency: Enums<"language_proficiency">; prefersChatting: boolean };

const PROFICIENCY_LABELS: Record<Selected["proficiency"], string> = {
  native: "Native",
  fluent: "Fluent",
  conversational: "Conversational",
  learning: "Learning",
};

export function LanguagesForm({
  languages,
  defaults,
}: {
  languages: Language[];
  defaults: { selected: Selected[]; multilingualOk: boolean };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveLanguagesAction, {});
  const [selected, setSelected] = useState<Selected[]>(defaults.selected);
  const [query, setQuery] = useState("");
  const byCode = useMemo(() => new Map(languages.map((l) => [l.code, l])), [languages]);

  const available = languages.filter(
    (l) =>
      !selected.some((s) => s.code === l.code) &&
      (query.trim() === "" ||
        l.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        l.native_name?.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const update = (code: string, patch: Partial<Selected>) =>
    setSelected((prev) => prev.map((s) => (s.code === code ? { ...s, ...patch } : s)));

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="languages" value={JSON.stringify(selected)} />

      <section aria-labelledby="your-languages">
        <h2 id="your-languages" className="font-heading text-base font-semibold">
          Your languages <span className="font-normal text-muted-foreground">({selected.length}/12)</span>
        </h2>
        {selected.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-muted-foreground">
            Add the languages you speak or are learning.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selected.map((s) => {
              const lang = byCode.get(s.code);
              const label = lang?.name ?? s.code;
              return (
                <li key={s.code} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {label}
                      {lang?.native_name && lang.native_name !== label && (
                        <span className="ml-2 text-sm text-muted-foreground" lang={s.code}>
                          {lang.native_name}
                        </span>
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${label}`}
                      onClick={() => setSelected((prev) => prev.filter((x) => x.code !== s.code))}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Level</span>
                      <select
                        value={s.proficiency}
                        onChange={(e) => update(s.code, { proficiency: e.currentTarget.value as Selected["proficiency"] })}
                        className="h-10 rounded-lg border border-input bg-surface px-2 text-sm"
                      >
                        {Object.entries(PROFICIENCY_LABELS).map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-h-10 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={s.prefersChatting}
                        onChange={(e) => update(s.code, { prefersChatting: e.currentTarget.checked })}
                        className="size-4 accent-[var(--vybe-violet)]"
                      />
                      I like chatting in this
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-2">
          <FieldError id="languages-error" errors={state.fieldErrors?.languages} />
        </div>
      </section>

      {selected.length < 12 && (
        <section aria-labelledby="add-languages">
          <h2 id="add-languages" className="font-heading text-base font-semibold">
            Add a language
          </h2>
          <Label htmlFor="language-search" className="sr-only">
            Search languages
          </Label>
          <Input
            id="language-search"
            type="search"
            placeholder="Search, e.g. Bengali, 한국어"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="mt-3"
          />
          <ul className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto" aria-label="Available languages">
            {available.map((l) => (
              <li key={l.code}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full"
                  onClick={() => {
                    setSelected((prev) => [...prev, { code: l.code, proficiency: "fluent", prefersChatting: prev.length === 0 }]);
                    setQuery("");
                  }}
                >
                  <Plus aria-hidden="true" /> {l.name}
                </Button>
              </li>
            ))}
            {available.length === 0 && <li className="text-sm text-muted-foreground">No matching languages.</li>}
          </ul>
        </section>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          type="checkbox"
          name="multilingualOk"
          defaultChecked={defaults.multilingualOk}
          className="mt-1 size-4 accent-[var(--vybe-violet)]"
        />
        <span>
          <span className="block font-medium">I&apos;m happy with multilingual conversations</span>
          <span className="block text-sm text-muted-foreground">Switching between languages mid-chat is fine by me.</span>
        </span>
      </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button asChild variant="ghost" size="lg">
          <Link href="/onboarding/intentions">Back</Link>
        </Button>
        <SubmitButton size="lg" className="sm:flex-1">
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}
