import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { conversationSpark, explainMatch, type SharedItem, type ViewerStyle } from "@/lib/matching/explain";

type Row = Database["public"]["Functions"]["discover_candidates"]["Returns"][number];

export type DiscoveryMode = "all" | "taste_twin" | "opposite";

/** What the client receives for each person: public-safe, already explained. */
export type Candidate = {
  id: string;
  nickname: string;
  age: number;
  intent: string;
  connectionKind: string;
  tier: number;
  areaLabel: string | null;
  wavelength: number;
  shared: SharedItem[];
  sharedHiddenCount: number;
  languages: string[];
  highlights: { name: string; world: string }[];
  reasons: string[];
  spark: string;
};

export type Readiness = {
  hasLocation: boolean;
  interestCount: number;
  intent: string | null;
  discoverable: boolean;
  paused: boolean;
};

export async function getReadiness(): Promise<Readiness> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_discovery_readiness").single();
  if (error || !data) throw new Error("Couldn't check discovery readiness.");
  return {
    hasLocation: data.has_location,
    interestCount: data.interest_count,
    intent: data.intent,
    discoverable: data.discoverable,
    paused: data.paused,
  };
}

export async function getViewerStyle(userId: string): Promise<ViewerStyle> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_preferences")
    .select("social_energy, conversation_depth, chronotype, planning_style")
    .eq("user_id", userId)
    .single();
  return {
    social_energy: data?.social_energy ?? null,
    conversation_depth: data?.conversation_depth ?? null,
    chronotype: data?.chronotype ?? null,
    planning_style: data?.planning_style ?? null,
  };
}

export class RateLimitedError extends Error {}

export async function discover(
  userId: string,
  { mode = "all", category = null, offset = 0, limit = 24 }: { mode?: DiscoveryMode; category?: string | null; offset?: number; limit?: number },
): Promise<Candidate[]> {
  const supabase = await createClient();
  const [{ data, error }, style] = await Promise.all([
    supabase.rpc("discover_candidates", { p_mode: mode, p_category: category ?? undefined, p_limit: limit, p_offset: offset }),
    getViewerStyle(userId),
  ]);
  if (error) {
    if (/RATE_LIMITED/.test(error.message)) throw new RateLimitedError("You're exploring very fast. Take a breather and try again soon.");
    throw new Error("Couldn't load discovery.");
  }
  return (data ?? []).map((r) => toCandidate(r, style));
}

function toCandidate(r: Row, style: ViewerStyle): Candidate {
  const shared = (r.shared as SharedItem[] | null) ?? [];
  return {
    id: r.candidate_id,
    nickname: r.nickname,
    age: r.age,
    intent: r.intent,
    connectionKind: r.connection_kind,
    tier: r.proximity_tier,
    areaLabel: r.area_label,
    wavelength: r.wavelength,
    shared,
    sharedHiddenCount: r.shared_hidden_count,
    languages: r.shared_languages ?? [],
    highlights: (r.highlights as { name: string; world: string }[] | null) ?? [],
    reasons: explainMatch(
      {
        shared,
        shared_hidden_count: r.shared_hidden_count,
        shared_languages: r.shared_languages ?? [],
        social_energy: r.social_energy,
        conversation_depth: r.conversation_depth,
        chronotype: r.chronotype,
        planning_style: r.planning_style,
      },
      style,
    ),
    spark: conversationSpark(shared),
  };
}
