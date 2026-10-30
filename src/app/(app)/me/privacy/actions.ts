"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/vybe/form";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  discoverable: z.boolean(),
  paused: z.boolean(),
  hideFromLocal: z.boolean(),
  showAreaLabel: z.boolean(),
  maxTier: z.coerce.number().int().min(2).max(5),
});

export async function savePrivacyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireOnboardedProfile();
  const parsed = schema.safeParse({
    discoverable: formData.get("discoverable") === "on",
    paused: formData.get("paused") === "on",
    hideFromLocal: formData.get("hideFromLocal") === "on",
    showAreaLabel: formData.get("showAreaLabel") === "on",
    maxTier: formData.get("maxTier"),
  });
  if (!parsed.success) return { message: "Please check your choices." };

  const supabase = await createClient();
  const [privacy, discovery] = await Promise.all([
    supabase
      .from("user_privacy_settings")
      .update({
        discoverable: parsed.data.discoverable,
        discovery_paused: parsed.data.paused,
        hide_from_local: parsed.data.hideFromLocal,
        show_area_label: parsed.data.showAreaLabel,
      })
      .eq("user_id", profile.id),
    supabase
      .from("discovery_preferences")
      .upsert({ user_id: profile.id, max_tier: parsed.data.maxTier }, { onConflict: "user_id" }),
  ]);
  if (privacy.error || discovery.error) return { message: "We couldn't save your settings. Please try again." };
  revalidatePath("/radar");
  return { ok: true, message: "Privacy settings saved." };
}
