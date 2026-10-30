import type { Metadata } from "next";
import { Suspense } from "react";
import { guardStep, StepFrame, StepSkeleton } from "../step-frame";
import { IdentityForm } from "./identity-form";

export const metadata: Metadata = { title: "You, anonymously" };

export default function IdentityStep() {
  return (
    <StepFrame
      title="You, anonymously"
      intro="On VYBE, people meet your world before your face. Start with a nickname that feels like you."
    >
      <Suspense fallback={<StepSkeleton />}>
        <IdentityLoader />
      </Suspense>
    </StepFrame>
  );
}

async function IdentityLoader() {
  const profile = await guardStep("identity");
  return (
    <IdentityForm
      defaults={{
        nickname: profile.nickname,
        gender: profile.gender,
        genderSelfDescription: profile.gender_self_description,
      }}
    />
  );
}
