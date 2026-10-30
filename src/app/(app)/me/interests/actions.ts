"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/vybe/form";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { categoryInterestsSchema } from "@/lib/validation/interests";

export async function saveCategoryInterestsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOnboardedProfile();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { message: "Something went wrong reading your choices. Please try again." };
  }
  const parsed = categoryInterestsSchema.safeParse(payload);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Please check your choices." };

  const { categoryId, choices, visibility, details } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_category_interests", {
    p_category_id: categoryId,
    choices,
    visibility,
    details,
  });
  if (error) {
    if (/SINGLE_CHOICE/.test(error.message)) return { message: "Some questions only allow one answer." };
    return { message: "We couldn't save that just now. Please try again." };
  }
  revalidatePath("/me");
  return { ok: true, message: "Saved to your VYBE DNA." };
}
