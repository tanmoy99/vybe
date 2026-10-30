"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type SuburbOption = { id: number; name: string; state: string; inSydney: boolean };

export async function searchSuburbsAction(query: string): Promise<SuburbOption[]> {
  await requireOnboardedProfile();
  const q = query.trim().replace(/[%_\\]/g, "");
  if (q.length < 2 || q.length > 50) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("suburbs")
    .select("id, name, state, region_code")
    .ilike("name", `${q}%`)
    .order("name")
    .limit(20);
  return (data ?? [])
    .map((s) => ({ id: s.id, name: s.name, state: s.state, inSydney: s.region_code === "1GSYD" }))
    .sort((a, b) => Number(b.inSydney) - Number(a.inSydney))
    .slice(0, 8);
}

const pointSchema = z.object({ lat: z.number().min(-44).max(-9), lon: z.number().min(112).max(154) });

/** Turns a one-off browser location into a suburb suggestion. The point is not stored or logged. */
export async function suggestSuburbAction(lat: number, lon: number): Promise<SuburbOption | null> {
  await requireOnboardedProfile();
  const parsed = pointSchema.safeParse({ lat, lon });
  if (!parsed.success) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("suggest_suburb", { lat: parsed.data.lat, lon: parsed.data.lon });
  const s = data?.[0];
  return s ? { id: s.id, name: s.name, state: s.state, inSydney: false } : null;
}

export async function setHomeSuburbAction(
  suburbId: number,
  source: "manual" | "browser_suggested",
): Promise<{ ok: boolean; message: string }> {
  const profile = await requireOnboardedProfile();
  if (!Number.isInteger(suburbId) || suburbId <= 0) return { ok: false, message: "Choose a suburb from the list." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_location_preferences")
    .upsert({ user_id: profile.id, suburb_id: suburbId, source }, { onConflict: "user_id" });
  if (error) {
    if (/SUBURB_CHANGE_LIMIT/.test(error.message)) {
      return { ok: false, message: "You can change your home area 3 times in 30 days. Please try again later." };
    }
    return { ok: false, message: "We couldn't save your home area. Please try again." };
  }
  revalidatePath("/radar");
  revalidatePath("/me/privacy");
  return { ok: true, message: "Home area saved." };
}
