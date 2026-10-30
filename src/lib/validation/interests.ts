import { z } from "zod";

export const VISIBILITIES = ["public", "matching_only", "private"] as const;

export const categoryInterestsSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  choices: z
    .array(z.object({ option_id: z.number().int().positive(), intensity: z.number().int().min(1).max(3) }))
    .max(120),
  visibility: z.record(z.string().regex(/^\d+$/), z.enum(VISIBILITIES)),
  details: z
    .array(z.object({ subcategory_id: z.number().int().positive(), details: z.string().trim().max(280, "Keep it under 280 characters.") }))
    .max(20),
});

export type CategoryInterestsInput = z.infer<typeof categoryInterestsSchema>;

/** Minimum interests before someone appears in discovery (also enforced in SQL). */
export const MIN_INTERESTS_FOR_DISCOVERY = 5;
