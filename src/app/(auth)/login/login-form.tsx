"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormAlert, SubmitButton, TextField, type FormState } from "@/components/vybe/form";
import { magicLinkAction, signInAction } from "../actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const linkError = searchParams.get("error") === "link";
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [passwordState, passwordAction] = useActionState<FormState, FormData>(signInAction, {});
  const [magicState, magicAction] = useActionState<FormState, FormData>(magicLinkAction, {});

  const state = mode === "password" ? passwordState : magicState;
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-5">
      {linkError && !state.message && (
        <FormAlert state={{ message: "That link is invalid or has expired. Please try again." }} />
      )}
      <FormAlert state={state} />

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-5" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
          <div className="space-y-2">
            <TextField name="password" label="Password" type="password" autoComplete="current-password" required errors={errors.password} />
            <Link href="/forgot-password" className="inline-block text-sm text-violet underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <SubmitButton size="lg">Log in</SubmitButton>
        </form>
      ) : (
        <form action={magicAction} className="space-y-5" noValidate>
          <TextField name="email" label="Email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
          <SubmitButton size="lg">Email me a sign-in link</SubmitButton>
        </form>
      )}

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
      >
        {mode === "password" ? "Use a sign-in link instead" : "Use my password instead"}
      </Button>
    </div>
  );
}
