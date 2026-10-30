"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/vybe/form";
import { getMyProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { energySchema, identitySchema, intentionsSchema, languagesSchema } from "@/lib/validation/onboarding";

function fieldErrors(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as FormState["fieldErrors"] };
}

const SAVE_FAILED: FormState = { message: "We couldn't save that just now. Please try again." };

/** Records progress without letting a user skip ahead or move backwards. */
async function advanceStep(step: number) {
  const profile = await getMyProfile();
  if (profile.onboarding_step >= step) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_step: step }).eq("id", profile.id);
}

export async function saveIdentityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getMyProfile();
  const parsed = identitySchema.safeParse({
    nickname: formData.get("nickname"),
    gender: formData.get("gender"),
    genderSelfDescription: formData.get("genderSelfDescription") || undefined,
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: parsed.data.nickname,
      gender: parsed.data.gender,
      gender_self_description: parsed.data.genderSelfDescription,
    })
    .eq("id", profile.id);

  if (error) {
    if (error.code === "23505") return { fieldErrors: { nickname: ["That nickname is taken. Try another."] } };
    if (error.code === "23514") return { fieldErrors: { nickname: ["That nickname isn't allowed."] } };
    return SAVE_FAILED;
  }
  await advanceStep(1);
  redirect("/onboarding/intentions");
}

export async function saveIntentionsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getMyProfile();
  const parsed = intentionsSchema.safeParse({
    intent: formData.get("intent"),
    datingGenders: formData.getAll("datingGenders"),
    ageMin: formData.get("ageMin"),
    ageMax: formData.get("ageMax"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_preferences")
    .update({
      intent: parsed.data.intent,
      dating_genders: parsed.data.datingGenders,
      age_min: parsed.data.ageMin,
      age_max: parsed.data.ageMax,
    })
    .eq("user_id", profile.id);
  if (error) return SAVE_FAILED;

  await advanceStep(2);
  redirect("/onboarding/languages");
}

export async function saveLanguagesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await getMyProfile();
  let languages: unknown;
  try {
    languages = JSON.parse(String(formData.get("languages") ?? "[]"));
  } catch {
    return { fieldErrors: { languages: ["Add at least one language."] } };
  }
  const parsed = languagesSchema.safeParse({ languages, multilingualOk: formData.get("multilingualOk") === "on" });
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_languages", {
    langs: parsed.data.languages.map((l) => ({
      code: l.code,
      proficiency: l.proficiency,
      prefers_chatting: l.prefersChatting,
    })),
    multilingual: parsed.data.multilingualOk,
  });
  if (error) {
    if (error.code === "23503") return { fieldErrors: { languages: ["One of those languages isn't available."] } };
    return SAVE_FAILED;
  }

  await advanceStep(3);
  redirect("/onboarding/energy");
}

export async function saveEnergyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getMyProfile();
  const parsed = energySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_preferences")
    .update({
      social_energy: parsed.data.socialEnergy,
      conversation_depth: parsed.data.conversationDepth,
      planning_style: parsed.data.planningStyle,
      chronotype: parsed.data.chronotype,
      message_frequency: parsed.data.messageFrequency,
      group_size: parsed.data.groupSize,
    })
    .eq("user_id", profile.id);
  if (error) return SAVE_FAILED;

  await advanceStep(4);
  const { error: completeError } = await supabase.rpc("complete_onboarding");
  if (completeError) {
    const step = /IDENTITY/.test(completeError.message)
      ? "identity"
      : /INTENT|DATING/.test(completeError.message)
        ? "intentions"
        : /LANGUAGES/.test(completeError.message)
          ? "languages"
          : null;
    return {
      message: step
        ? `One earlier step still needs an answer. Please revisit "${step}".`
        : SAVE_FAILED.message,
    };
  }
  redirect("/universe");
}
