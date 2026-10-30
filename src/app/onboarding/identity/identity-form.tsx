"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/vybe/choice";
import { FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { saveIdentityAction } from "../actions";

const FIRST = ["Midnight", "Coastal", "Neon", "Velvet", "Lunar", "Monsoon", "Saffron", "Echo", "Drift", "Static", "Indigo", "Sunrise"];
const SECOND = ["Nomad", "Drifter", "Dreamer", "Wanderer", "Signal", "Comet", "Reel", "Rider", "Tide", "Muse", "Orbit", "Chai"];

function suggestNickname() {
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  return `${pick(FIRST)}${pick(SECOND)}${Math.random() < 0.4 ? Math.floor(Math.random() * 90 + 10) : ""}`;
}

const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "I'll describe it" },
];

export function IdentityForm({
  defaults,
}: {
  defaults: { nickname: string | null; gender: string | null; genderSelfDescription: string | null };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveIdentityAction, {});
  const [nickname, setNickname] = useState(defaults.nickname ?? "");
  const [gender, setGender] = useState(defaults.gender);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormAlert state={state} />
      <div className="space-y-3">
        <TextField
          name="nickname"
          label="Your anonymous nickname"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={24}
          required
          value={nickname}
          onChange={(e) => setNickname(e.currentTarget.value)}
          hint="3 to 24 characters: letters, numbers and underscores. Avoid your real name."
          errors={errors.nickname}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setNickname(suggestNickname())}>
          <Sparkles aria-hidden="true" /> Suggest one
        </Button>
      </div>

      <ChoiceGroup
        name="gender"
        legend="Your gender"
        description="Used for mutual matching preferences. You'll control whether it's shown on your profile."
        options={GENDER_OPTIONS}
        defaultValue={defaults.gender}
        errors={errors.gender}
        onValueChange={(value) => setGender(value)}
      />
      {gender === "other" && (
        <TextField
          name="genderSelfDescription"
          label="How do you describe your gender? (optional)"
          maxLength={40}
          defaultValue={defaults.genderSelfDescription ?? ""}
          errors={errors.genderSelfDescription}
        />
      )}

      <SubmitButton size="lg">Continue</SubmitButton>
    </form>
  );
}
