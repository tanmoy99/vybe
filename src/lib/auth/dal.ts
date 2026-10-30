import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer: the single place that turns the session cookie into a
 * verified user. getClaims() validates the JWT signature, so unlike
 * getSession() the result can be trusted on the server.
 * All functions read cookies, so callers must sit behind <Suspense>.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  return { id: sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export const getMyProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, nickname, gender, gender_self_description, account_status, onboarding_step, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  if (error || !profile) {
    // Auth user without a profile should be impossible (sign-up trigger); fail closed.
    throw new Error("Profile not found for the signed-in user.");
  }
  if (profile.account_status !== "active") redirect("/account-restricted");
  return profile;
});

/** For product pages: signed in, active and finished onboarding. */
export async function requireOnboardedProfile() {
  const profile = await getMyProfile();
  if (!profile.onboarding_completed_at) redirect("/onboarding");
  return profile;
}
