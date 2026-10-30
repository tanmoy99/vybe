"use client";

import { usePathname } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";

export function OnboardingProgress() {
  const pathname = usePathname();
  const current = ONBOARDING_STEPS.findIndex((s) => pathname.endsWith(`/${s.slug}`));
  if (current < 0) return null;
  return (
    <nav aria-label="Onboarding progress">
      <p className="text-sm text-muted-foreground">
        Step {current + 1} of {ONBOARDING_STEPS.length}
        <span className="sr-only">: {ONBOARDING_STEPS[current].title}</span>
      </p>
      <ol className="mt-2 flex gap-1.5">
        {ONBOARDING_STEPS.map((step, i) => (
          <li
            key={step.slug}
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < current ? "bg-violet" : i === current ? "bg-gradient-to-r from-violet to-indigo" : "bg-white/10",
            )}
          >
            <span className="sr-only">
              {step.title}
              {i < current ? " (done)" : ""}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
