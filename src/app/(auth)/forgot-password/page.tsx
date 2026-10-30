"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { requestPasswordResetAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordResetAction, {});
  return (
    <>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 mb-6 text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      <form action={action} className="space-y-5" noValidate>
        <FormAlert state={state} />
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          errors={state.fieldErrors?.email}
        />
        <SubmitButton size="lg">Send reset link</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-violet underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
