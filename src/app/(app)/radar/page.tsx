import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Circle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscoveryExplorer } from "@/components/vybe/discovery-explorer";
import { SuburbPicker } from "@/components/vybe/suburb-picker";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { discover, getReadiness, RateLimitedError } from "@/lib/discovery";
import { MIN_INTERESTS_FOR_DISCOVERY } from "@/lib/validation/interests";

export const metadata: Metadata = { title: "Radar" };

export default function RadarPage() {
  return (
    <div>
      <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Radar</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">People on your wavelength</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Nearby people appear on the inner ring, wider Sydney further out. Approximate areas only, never distances.
      </p>
      <Suspense fallback={<div className="mt-8 aspect-square max-w-[560px] animate-pulse rounded-full bg-white/5" aria-label="Loading" />}>
        <Radar />
      </Suspense>
    </div>
  );
}

async function Radar() {
  const profile = await requireOnboardedProfile();
  const readiness = await getReadiness();

  if (readiness.intent === "communities") {
    return (
      <div className="glass mt-8 rounded-3xl p-6">
        <p>You&apos;re here for communities only, so one-to-one discovery is off.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/onboarding/intentions">Change what I&apos;m looking for</Link>
        </Button>
      </div>
    );
  }

  const needsInterests = readiness.interestCount < MIN_INTERESTS_FOR_DISCOVERY;
  if (!readiness.hasLocation || needsInterests) {
    return (
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="ready-h" className="glass rounded-3xl p-6">
          <h2 id="ready-h" className="text-lg font-semibold">
            Two steps to open Radar
          </h2>
          <ul className="mt-4 space-y-4">
            <li className="flex gap-3">
              {readiness.hasLocation ? (
                <CheckCircle2 className="mt-0.5 size-5 text-violet" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              )}
              <span>Choose your home area {readiness.hasLocation && <span className="sr-only">(done)</span>}</span>
            </li>
            <li className="flex gap-3">
              {needsInterests ? (
                <Circle className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 text-violet" aria-hidden="true" />
              )}
              <span>
                Add at least {MIN_INTERESTS_FOR_DISCOVERY} interests to your VYBE DNA ({readiness.interestCount} so far)
                {needsInterests && (
                  <Button asChild size="sm" variant="outline" className="mt-2 flex w-fit">
                    <Link href="/me/interests">Add interests</Link>
                  </Button>
                )}
              </span>
            </li>
          </ul>
        </section>
        {!readiness.hasLocation && (
          <section aria-labelledby="area-h" className="glass rounded-3xl p-6">
            <h2 id="area-h" className="mb-4 text-lg font-semibold">
              Your home area
            </h2>
            <SuburbPicker current={null} />
          </section>
        )}
      </div>
    );
  }

  if (readiness.paused || !readiness.discoverable) {
    return (
      <div className="glass mt-8 flex flex-col items-start gap-4 rounded-3xl p-6">
        <PauseCircle className="size-8 text-violet" aria-hidden="true" />
        <p>
          Discovery is {readiness.paused ? "paused" : "turned off"}. To keep things fair, you can browse Radar while
          people can also find you.
        </p>
        <Button asChild>
          <Link href="/me/privacy">Privacy controls</Link>
        </Button>
      </div>
    );
  }

  let initial: Awaited<ReturnType<typeof discover>> = [];
  let error: string | null = null;
  try {
    initial = await discover(profile.id, { mode: "all" });
  } catch (e) {
    error = e instanceof RateLimitedError ? e.message : "Couldn't load people right now.";
  }

  return (
    <div className="mt-8">
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      ) : (
        <DiscoveryExplorer initial={initial} />
      )}
    </div>
  );
}
