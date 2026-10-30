"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/vybe/choice";
import { FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { saveIntentionsAction } from "../actions";

const INTENT_OPTIONS = [
  { value: "friendship", label: "Friendship", description: "Activity buddies, cultural circles, new people in the city." },
  { value: "dating", label: "Dating", description: "Getting to know someone romantically, at your pace." },
  { value: "both", label: "Open to both", description: "See where a shared wavelength leads." },
  { value: "communities", label: "Communities only", description: "Join worlds and discussions without one-to-one discovery." },
];

const DATING_GENDER_OPTIONS = [
  { value: "woman", label: "Women" },
  { value: "man", label: "Men" },
  { value: "non_binary", label: "Non-binary people" },
  { value: "other", label: "People who self-describe" },
];

export function IntentionsForm({
  defaults,
}: {
  defaults: { intent: string | null; datingGenders: string[]; ageMin: number; ageMax: number };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveIntentionsAction, {});
  const [intent, setIntent] = useState(defaults.intent);
  const errors = state.fieldErrors ?? {};
  const dating = intent === "dating" || intent === "both";

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormAlert state={state} />
      <ChoiceGroup
        name="intent"
        legend="What brings you to VYBE?"
        options={INTENT_OPTIONS}
        defaultValue={defaults.intent}
        errors={errors.intent}
        onValueChange={(value) => setIntent(value)}
      />

      {dating && (
        <ChoiceGroup
          type="checkbox"
          name="datingGenders"
          legend="Who would you like to date?"
          description="You'll only discover people whose preferences include you too."
          options={DATING_GENDER_OPTIONS}
          defaultValue={defaults.datingGenders}
          errors={errors.datingGenders}
        />
      )}

      {intent !== "communities" && (
        <fieldset>
          <legend className="font-heading text-base font-semibold">Age range you&apos;d like to meet</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TextField name="ageMin" label="From" type="number" inputMode="numeric" min={18} max={99} defaultValue={defaults.ageMin} errors={errors.ageMin} />
            <TextField name="ageMax" label="To" type="number" inputMode="numeric" min={18} max={99} defaultValue={defaults.ageMax} errors={errors.ageMax} />
          </div>
        </fieldset>
      )}
      {intent === "communities" && (
        <>
          <input type="hidden" name="ageMin" value={defaults.ageMin} />
          <input type="hidden" name="ageMax" value={defaults.ageMax} />
        </>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button asChild variant="ghost" size="lg" className="sm:w-auto">
          <Link href="/onboarding/identity">Back</Link>
        </Button>
        <SubmitButton size="lg" className="sm:flex-1">
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}
