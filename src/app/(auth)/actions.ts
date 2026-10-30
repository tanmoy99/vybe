"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/vybe/form";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  magicLinkSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  emailSchema,
} from "@/lib/validation/auth";

function fieldErrors(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"] };
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    dateOfBirth: formData.get("dateOfBirth"),
    adultAttested: formData.get("adultAttested") ?? undefined,
    termsAccepted: formData.get("termsAccepted") ?? undefined,
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const { email, password, dateOfBirth } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/onboarding`,
      // Validated again (and then stripped) by the handle_new_user trigger.
      data: { date_of_birth: dateOfBirth, adult_attested: true, terms_accepted: true },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: [error.message] } };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { message: "Too many attempts. Please wait a minute and try again." };
    }
    // Database trigger rejections surface as a generic auth error; don't leak internals.
    return { message: "We couldn't create your account. Check your details and try again." };
  }

  // Same response whether or not the email already exists (prevents account enumeration).
  return { ok: true, message: `Check ${email} for a link to confirm your account.` };
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { message: "Please confirm your email first. Check your inbox for the link." };
    }
    if (error.status === 429) return { message: "Too many attempts. Please wait a minute and try again." };
    return { message: "That email and password don't match an account." };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function magicLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  // shouldCreateUser: false. New accounts must go through sign-up and its age gate.
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/confirm?next=/universe` },
  });
  if (error?.status === 429) return { message: "Too many attempts. Please wait a minute and try again." };
  return { ok: true, message: "If that email has a VYBE account, a sign-in link is on its way." };
}

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailSchema }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/update-password`,
  });
  if (error?.status === 429) return { message: "Too many attempts. Please wait a minute and try again." };
  return { ok: true, message: "If that email has a VYBE account, a reset link is on its way." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { message: "Your reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: ["Choose a password you haven't used before."] } };
    if (error.code === "weak_password") return { fieldErrors: { password: [error.message] } };
    return { message: "We couldn't update your password. Please request a new reset link." };
  }
  redirect("/universe");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
