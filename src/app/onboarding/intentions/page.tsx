import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { guardStep, StepFrame, StepSkeleton } from "../step-frame";
import { IntentionsForm } from "./intentions-form";

export const metadata: Metadata = { title: "What you're here for" };

export default function IntentionsStep() {
  return (
    <StepFrame
      title="What you're here for"
      intro="Intentions are always mutual: you'll only meet people looking for the same kind of connection."
    >
      <Suspense fallback={<StepSkeleton />}>
        <IntentionsLoader />
      </Suspense>
    </StepFrame>
  );
}

async function IntentionsLoader() {
  const profile = await guardStep("intentions");
  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("profile_preferences")
    .select("intent, dating_genders, age_min, age_max")
    .eq("user_id", profile.id)
    .single();
  return (
    <IntentionsForm
      defaults={{
        intent: prefs?.intent ?? null,
        datingGenders: prefs?.dating_genders ?? [],
        ageMin: prefs?.age_min ?? 18,
        ageMax: prefs?.age_max ?? 99,
      }}
    />
  );
}
