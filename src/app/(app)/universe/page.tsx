import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitField } from "@/components/vybe/orbit-field";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Universe" };

const INTENT_LABEL = {
  dating: "Dating",
  friendship: "Friendship",
  both: "Friendship & dating",
  communities: "Communities",
} as const;

const ENERGY_LABEL = { introvert: "Introvert", ambivert: "Ambivert", extrovert: "Extrovert" } as const;
const DEPTH_LABEL = { deep: "Deep conversations", light: "Light & playful", both: "Deep and light chats" } as const;

export default function UniversePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/5" aria-label="Loading your universe" />}>
      <Universe />
    </Suspense>
  );
}

async function Universe() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  const [{ data: prefs }, { data: langs }] = await Promise.all([
    supabase.from("profile_preferences").select("intent, social_energy, conversation_depth").eq("user_id", profile.id).single(),
    supabase.from("user_languages").select("language_code, prefers_chatting, languages(name)").eq("user_id", profile.id),
  ]);

  const strands = [
    { label: "Looking for", values: prefs?.intent ? [INTENT_LABEL[prefs.intent]] : [] },
    { label: "Languages", values: (langs ?? []).map((l) => l.languages?.name ?? l.language_code) },
    {
      label: "Social style",
      values: [
        prefs?.social_energy && ENERGY_LABEL[prefs.social_energy],
        prefs?.conversation_depth && DEPTH_LABEL[prefs.conversation_depth],
      ].filter((v): v is NonNullable<typeof v> => Boolean(v)),
    },
  ];

  return (
    <div className="grid items-start gap-10 md:grid-cols-[1fr_1.1fr]">
      <div className="relative mx-auto w-full max-w-md">
        <OrbitField />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Your orbit is quiet for now. People appear here once Radar opens.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Your universe</p>
        <h1 className="mt-2 text-4xl font-semibold">Welcome, {profile.nickname}.</h1>

        <section aria-labelledby="dna-so-far" className="glass mt-8 rounded-3xl p-5 sm:p-6">
          <h2 id="dna-so-far" className="text-lg font-semibold">
            Your VYBE so far
          </h2>
          <dl className="mt-4 space-y-3">
            {strands.map((s) => (
              <div key={s.label} className="grid grid-cols-[6.5rem_1fr] gap-3">
                <dt className="pt-1 text-xs tracking-wide text-muted-foreground uppercase">{s.label}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {s.values.map((v) => (
                    <span key={v} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm">
                      {v}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href="/onboarding/identity">Edit basics</Link>
          </Button>
        </section>

        <section aria-labelledby="next-up" className="mt-8">
          <h2 id="next-up" className="text-lg font-semibold">
            What&apos;s next
          </h2>
          <ul className="mt-3 space-y-3">
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-violet" aria-hidden="true" />
              <span>Basics, intentions, languages and social energy are done.</span>
            </li>
            <li className="flex gap-3">
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">
                <Link href="/me/interests" className="font-medium text-violet underline-offset-4 hover:underline">
                  Build your VYBE DNA
                </Link>{" "}
                with the cinema, music, road trips and food you love.
              </span>
            </li>
            <li className="flex gap-3">
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">
                <strong className="font-medium text-foreground">Home area and Radar</strong>: suburb-level discovery opens
                after that.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
