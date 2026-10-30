"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { signUpAction } from "../actions";

function maxAdultDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="space-y-4 text-center" role="status">
        <MailCheck className="mx-auto size-10 text-violet" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Check your inbox</h2>
        <p className="text-muted-foreground">{state.message}</p>
        <p className="text-sm text-muted-foreground">The link expires in one hour. Check spam if it doesn&apos;t arrive.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 10 characters, with upper and lowercase letters and a number."
        errors={errors.password}
      />
      <TextField
        name="dateOfBirth"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        required
        // Set on focus rather than render so a prerendered page never carries a stale date.
        onFocus={(e) => (e.currentTarget.max = maxAdultDob())}
        min="1900-01-01"
        hint="Used only to confirm you're 18+. It's never shown to anyone."
        errors={errors.dateOfBirth}
      />

      <fieldset className="space-y-3">
        <legend className="sr-only">Confirmations</legend>
        <div className="flex items-start gap-3">
          <Checkbox id="adultAttested" name="adultAttested" value="on" aria-describedby="adultAttested-error" className="mt-0.5" />
          <div className="space-y-1">
            <Label htmlFor="adultAttested" className="leading-snug font-normal">
              I confirm I&apos;m 18 or older.
            </Label>
            <FieldError id="adultAttested-error" errors={errors.adultAttested} />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="termsAccepted" name="termsAccepted" value="on" aria-describedby="termsAccepted-error" className="mt-0.5" />
          <div className="space-y-1">
            <Label htmlFor="termsAccepted" className="block leading-snug font-normal">
              I agree to the{" "}
              <Link href="/terms" className="text-violet underline underline-offset-4" target="_blank">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-violet underline underline-offset-4" target="_blank">
                Privacy Policy
              </Link>
              .
            </Label>
            <FieldError id="termsAccepted-error" errors={errors.termsAccepted} />
          </div>
        </div>
      </fieldset>

      <SubmitButton size="lg">Create my VYBE</SubmitButton>
    </form>
  );
}
