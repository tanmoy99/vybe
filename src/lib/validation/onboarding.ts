import { z } from "zod";
import type { Enums } from "@/lib/supabase/database.types";

const RESERVED = /^(admin|vybe|moderator|mod|support|official|staff|system)/i;

export const nicknameSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(24, "Use 24 characters or fewer.")
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Start with a letter; use letters, numbers and underscores only.")
  .refine((v) => !RESERVED.test(v), "That nickname is reserved.");

export const GENDERS = ["woman", "man", "non_binary", "other"] as const satisfies readonly Enums<"gender">[];
export const INTENTS = ["dating", "friendship", "both", "communities"] as const satisfies readonly Enums<"connection_intent">[];
export const PROFICIENCIES = ["native", "fluent", "conversational", "learning"] as const satisfies readonly Enums<"language_proficiency">[];

export const identitySchema = z
  .object({
    nickname: nicknameSchema,
    gender: z.enum(GENDERS, "Choose the option that fits you best."),
    genderSelfDescription: z.string().trim().max(40, "Use 40 characters or fewer.").optional(),
  })
  .transform((v) => ({
    ...v,
    genderSelfDescription: v.gender === "other" && v.genderSelfDescription ? v.genderSelfDescription : null,
  }));

export const intentionsSchema = z
  .object({
    intent: z.enum(INTENTS, "Choose what you're here for."),
    datingGenders: z.array(z.enum(GENDERS)).max(GENDERS.length).default([]),
    ageMin: z.coerce.number().int().min(18, "Minimum age is 18.").max(99),
    ageMax: z.coerce.number().int().min(18).max(99),
  })
  .refine((v) => v.ageMin <= v.ageMax, { message: "Minimum age must be below maximum.", path: ["ageMax"] })
  .refine((v) => (v.intent === "dating" || v.intent === "both" ? v.datingGenders.length > 0 : true), {
    message: "Choose who you'd like to date.",
    path: ["datingGenders"],
  })
  .transform((v) => ({
    ...v,
    datingGenders: v.intent === "dating" || v.intent === "both" ? [...new Set(v.datingGenders)] : [],
  }));

export const languagesSchema = z.object({
  languages: z
    .array(
      z.object({
        code: z.string().regex(/^[a-z]{2,3}$/),
        proficiency: z.enum(PROFICIENCIES),
        prefersChatting: z.boolean(),
      }),
    )
    .min(1, "Add at least one language.")
    .max(12, "You can add up to 12 languages.")
    .refine((l) => new Set(l.map((x) => x.code)).size === l.length, "Each language can only be added once."),
  multilingualOk: z.boolean(),
});

export const energySchema = z.object({
  socialEnergy: z.enum(["introvert", "ambivert", "extrovert"], "Pick one."),
  conversationDepth: z.enum(["deep", "light", "both"], "Pick one."),
  planningStyle: z.enum(["spontaneous", "organised", "mix"], "Pick one."),
  chronotype: z.enum(["morning", "night", "flexible"], "Pick one."),
  messageFrequency: z.enum(["often", "daily", "relaxed"], "Pick one."),
  groupSize: z.enum(["one_on_one", "small_group", "large_group", "any"], "Pick one."),
});

export const ONBOARDING_STEPS = [
  { slug: "identity", title: "You, anonymously" },
  { slug: "intentions", title: "What you're here for" },
  { slug: "languages", title: "Your languages" },
  { slug: "energy", title: "Your social energy" },
] as const;

export type OnboardingSlug = (typeof ONBOARDING_STEPS)[number]["slug"];
