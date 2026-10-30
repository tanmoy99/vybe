"use client";

import { useActionState } from "react";
import { FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { updatePasswordAction } from "../actions";

export default function UpdatePasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, {});
  const errors = state.fieldErrors ?? {};
  return (
    <>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 mb-6 text-muted-foreground">You&apos;ll be signed in once it&apos;s saved.</p>
      <form action={action} className="space-y-5" noValidate>
        <FormAlert state={state} />
        <TextField
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 10 characters, with upper and lowercase letters and a number."
          errors={errors.password}
        />
        <TextField name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required errors={errors.confirm} />
        <SubmitButton size="lg">Save password</SubmitButton>
      </form>
    </>
  );
}
