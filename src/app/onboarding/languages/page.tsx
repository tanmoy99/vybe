import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { guardStep, StepFrame, StepSkeleton } from "../step-frame";
import { LanguagesForm } from "./languages-form";

export const metadata: Metadata = { title: "Your languages" };

export default function LanguagesStep() {
  return (
    <StepFrame
      title="Your languages"
      intro="Sharing a language can make a conversation feel like home. Tell us what you speak, and what you'd love to chat in."
    >
      <Suspense fallback={<StepSkeleton />}>
        <LanguagesLoader />
      </Suspense>
    </StepFrame>
  );
}

async function LanguagesLoader() {
  const profile = await guardStep("languages");
  const supabase = await createClient();
  const [languages, mine, prefs] = await Promise.all([
    supabase.from("languages").select("code, name, native_name").order("sort_order").order("name"),
    supabase.from("user_languages").select("language_code, proficiency, prefers_chatting").eq("user_id", profile.id),
    supabase.from("profile_preferences").select("multilingual_ok").eq("user_id", profile.id).single(),
  ]);
  if (languages.error) throw new Error("Couldn't load languages.");

  return (
    <LanguagesForm
      languages={languages.data}
      defaults={{
        selected: (mine.data ?? []).map((l) => ({
          code: l.language_code,
          proficiency: l.proficiency,
          prefersChatting: l.prefers_chatting,
        })),
        multilingualOk: prefs.data?.multilingual_ok ?? true,
      }}
    />
  );
}
