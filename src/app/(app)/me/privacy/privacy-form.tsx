"use client";

import { useActionState } from "react";
import { ChoiceGroup } from "@/components/vybe/choice";
import { FormAlert, SubmitButton, type FormState } from "@/components/vybe/form";
import { savePrivacyAction } from "./actions";

type Settings = { discoverable: boolean; paused: boolean; hideFromLocal: boolean; showAreaLabel: boolean; maxTier: number };

const TOGGLES: { name: keyof Settings; label: string; description: string }[] = [
  { name: "discoverable", label: "Appear in discovery", description: "Let people on your wavelength find you in Radar and Worlds." },
  { name: "paused", label: "Pause discovery", description: "Take a break. Your connections and chats stay as they are." },
  { name: "hideFromLocal", label: "Hide me from local discovery", description: "Only appear to people in wider Sydney, never to your immediate area." },
  { name: "showAreaLabel", label: "Show my suburb name", description: "Off by default. When on, people see your suburb name (never your street)." },
];

const RADIUS = [
  { value: "2", label: "My local area", description: "Closest suburbs only" },
  { value: "3", label: "Nearby areas", description: "Neighbouring suburbs too" },
  { value: "4", label: "Greater Sydney", description: "Recommended" },
  { value: "5", label: "Anywhere", description: "Includes other cities" },
];

export function PrivacyForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<FormState, FormData>(savePrivacyAction, {});
  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-2">
        <legend className="font-heading text-base font-semibold">Visibility</legend>
        {TOGGLES.map((t) => (
          <label key={t.name} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input type="checkbox" name={t.name} defaultChecked={Boolean(settings[t.name])} className="mt-1 size-4 accent-[var(--vybe-violet)]" />
            <span>
              <span className="block font-medium">{t.label}</span>
              <span className="block text-sm text-muted-foreground">{t.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <ChoiceGroup
        name="maxTier"
        legend="Discovery radius"
        description="Mutual: you'll only see people whose radius includes you too."
        options={RADIUS}
        defaultValue={String(settings.maxTier)}
      />

      <FormAlert state={state} />
      <SubmitButton size="lg">Save privacy settings</SubmitButton>
    </form>
  );
}
