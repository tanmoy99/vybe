import "server-only";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/auth/dal";
import { ONBOARDING_STEPS, type OnboardingSlug } from "@/lib/validation/onboarding";

/** Loads the profile and stops users from skipping ahead of unfinished steps. */
export async function guardStep(slug: OnboardingSlug) {
  const profile = await getMyProfile();
  const index = ONBOARDING_STEPS.findIndex((s) => s.slug === slug);
  if (!profile.onboarding_completed_at && profile.onboarding_step < index) {
    redirect(`/onboarding/${ONBOARDING_STEPS[profile.onboarding_step].slug}`);
  }
  return profile;
}

export function StepFrame({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{intro}</p>
      <div className="mt-8">{children}</div>
    </>
  );
}

export function StepSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}
