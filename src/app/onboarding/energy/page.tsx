import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { guardStep, StepFrame, StepSkeleton } from "../step-frame";
import { EnergyForm } from "./energy-form";

export const metadata: Metadata = { title: "Your social energy" };

export default function EnergyStep() {
  return (
    <StepFrame
      title="Your social energy"
      intro="How you like to connect matters as much as what you love. There are no wrong answers."
    >
      <Suspense fallback={<StepSkeleton />}>
        <EnergyLoader />
      </Suspense>
    </StepFrame>
  );
}

async function EnergyLoader() {
  const profile = await guardStep("energy");
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("profile_preferences")
    .select("social_energy, conversation_depth, planning_style, chronotype, message_frequency, group_size")
    .eq("user_id", profile.id)
    .single();
  return (
    <EnergyForm
      defaults={{
        socialEnergy: p?.social_energy,
        conversationDepth: p?.conversation_depth,
        planningStyle: p?.planning_style,
        chronotype: p?.chronotype,
        messageFrequency: p?.message_frequency,
        groupSize: p?.group_size,
      }}
    />
  );
}
