"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup, type ChoiceOption } from "@/components/vybe/choice";
import { FormAlert, SubmitButton, type FormState } from "@/components/vybe/form";
import { saveEnergyAction } from "../actions";

const QUESTIONS: { name: string; legend: string; options: ChoiceOption[] }[] = [
  {
    name: "socialEnergy",
    legend: "Your social battery",
    options: [
      { value: "introvert", label: "Introvert", description: "I recharge with quiet time." },
      { value: "ambivert", label: "Ambivert", description: "Depends on the day." },
      { value: "extrovert", label: "Extrovert", description: "People give me energy." },
    ],
  },
  {
    name: "conversationDepth",
    legend: "Conversations you enjoy",
    options: [
      { value: "deep", label: "Deep talks", description: "Big ideas, real stories." },
      { value: "light", label: "Light & playful", description: "Banter, memes, good vibes." },
      { value: "both", label: "A bit of both" },
    ],
  },
  {
    name: "groupSize",
    legend: "Favourite way to hang out",
    options: [
      { value: "one_on_one", label: "One-on-one" },
      { value: "small_group", label: "Small group" },
      { value: "large_group", label: "Big gatherings" },
      { value: "any", label: "Whatever's happening" },
    ],
  },
  {
    name: "planningStyle",
    legend: "Plans are…",
    options: [
      { value: "spontaneous", label: "Spontaneous", description: "Let's go tonight." },
      { value: "organised", label: "Organised", description: "Booked and confirmed." },
      { value: "mix", label: "A mix" },
    ],
  },
  {
    name: "chronotype",
    legend: "You come alive in the…",
    options: [
      { value: "morning", label: "Morning" },
      { value: "night", label: "Night" },
      { value: "flexible", label: "Either, honestly" },
    ],
  },
  {
    name: "messageFrequency",
    legend: "Messaging rhythm",
    options: [
      { value: "often", label: "Chatty all day" },
      { value: "daily", label: "Check in daily" },
      { value: "relaxed", label: "Relaxed, no pressure" },
    ],
  },
];

export type EnergyDefaults = Partial<Record<(typeof QUESTIONS)[number]["name"], string | null>>;

export function EnergyForm({ defaults }: { defaults: EnergyDefaults }) {
  const [state, action] = useActionState<FormState, FormData>(saveEnergyAction, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-8" noValidate>
      <FormAlert state={state} />
      {QUESTIONS.map((q) => (
        <ChoiceGroup
          key={q.name}
          name={q.name}
          legend={q.legend}
          options={q.options}
          columns={q.options.length === 4 ? 2 : 3}
          defaultValue={defaults[q.name]}
          errors={errors[q.name]}
        />
      ))}
      <p className="text-sm text-muted-foreground">
        These are preferences, not a personality test. They help us explain matches, never to label you.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button asChild variant="ghost" size="lg">
          <Link href="/onboarding/languages">Back</Link>
        </Button>
        <SubmitButton size="lg" className="sm:flex-1">
          Enter my universe
        </SubmitButton>
      </div>
    </form>
  );
}
