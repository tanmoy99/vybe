"use server";

import { z } from "zod";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { discover, RateLimitedError, type Candidate } from "@/lib/discovery";

const schema = z.object({
  mode: z.enum(["all", "taste_twin", "opposite"]),
  category: z.string().regex(/^[a-z0-9-]{2,40}$/).nullable(),
  offset: z.number().int().min(0).max(300),
});

export async function loadCandidatesAction(input: {
  mode: "all" | "taste_twin" | "opposite";
  category: string | null;
  offset: number;
}): Promise<{ candidates: Candidate[]; error?: string }> {
  const profile = await requireOnboardedProfile();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { candidates: [], error: "Invalid request." };
  try {
    return { candidates: await discover(profile.id, parsed.data) };
  } catch (e) {
    return { candidates: [], error: e instanceof RateLimitedError ? e.message : "Couldn't load people right now." };
  }
}
