"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsReadAction() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
  revalidatePath("/notifications");
}
