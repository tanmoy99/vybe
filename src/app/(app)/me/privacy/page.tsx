import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SuburbPicker } from "@/components/vybe/suburb-picker";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PrivacyForm } from "./privacy-form";

export const metadata: Metadata = { title: "Privacy controls" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
        ← My VYBE
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Privacy controls</h1>
      <p className="mt-3 text-muted-foreground">
        Location is only ever used to rank people by broad areas. Nobody sees distances, your exact location or your
        suburb unless you choose to show it.
      </p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-3xl bg-white/5" aria-label="Loading" />}>
        <PrivacyLoader />
      </Suspense>
    </div>
  );
}

async function PrivacyLoader() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  const [{ data: privacy }, { data: discovery }, { data: location }] = await Promise.all([
    supabase.from("user_privacy_settings").select("*").eq("user_id", profile.id).single(),
    supabase.from("discovery_preferences").select("max_tier").eq("user_id", profile.id).maybeSingle(),
    supabase.from("user_location_preferences").select("suburbs(name)").eq("user_id", profile.id).maybeSingle(),
  ]);

  return (
    <div className="mt-8 space-y-10">
      <section aria-labelledby="home-area" className="glass rounded-3xl p-5 sm:p-6">
        <h2 id="home-area" className="text-lg font-semibold">
          Home area
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">You can change it up to 3 times every 30 days.</p>
        <SuburbPicker current={location?.suburbs ? { name: location.suburbs.name } : null} />
      </section>
      <PrivacyForm
        settings={{
          discoverable: privacy?.discoverable ?? true,
          paused: privacy?.discovery_paused ?? false,
          hideFromLocal: privacy?.hide_from_local ?? false,
          showAreaLabel: privacy?.show_area_label ?? false,
          maxTier: discovery?.max_tier ?? 4,
        }}
      />
    </div>
  );
}
