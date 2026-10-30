import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/auth/dal";
import { ONBOARDING_STEPS } from "@/lib/validation/onboarding";
import { StepSkeleton } from "./step-frame";

export default function OnboardingIndex() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Resume />
    </Suspense>
  );
}

async function Resume(): Promise<never> {
  const profile = await getMyProfile();
  if (profile.onboarding_completed_at) redirect("/universe");
  const step = ONBOARDING_STEPS[Math.min(profile.onboarding_step, ONBOARDING_STEPS.length - 1)];
  redirect(`/onboarding/${step.slug}`);
}
