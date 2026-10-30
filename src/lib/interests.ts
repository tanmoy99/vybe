import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

import type { Hue } from "@/lib/hue";
export type { Hue };
export type Visibility = Enums<"interest_visibility">;

export type Category = {
  id: number;
  slug: string;
  name: string;
  world_name: string;
  description: string | null;
  hue: Hue;
};

export type Subcategory = {
  id: number;
  slug: string;
  name: string;
  prompt: string | null;
  kind: Enums<"subcategory_kind">;
  default_visibility: Visibility;
  options: { id: number; name: string }[];
};

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interest_categories")
    .select("id, slug, name, world_name, description, hue")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error("Couldn't load interest categories.");
  return data as Category[];
});

export async function getCategoryWithTaxonomy(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interest_categories")
    .select(
      "id, slug, name, world_name, description, hue, interest_subcategories(id, slug, name, prompt, kind, default_visibility, sort_order, is_active, interest_options(id, name, sort_order, is_active))",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("Couldn't load this world.");
  if (!data) return null;

  const subcategories: Subcategory[] = data.interest_subcategories
    .filter((s) => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      prompt: s.prompt,
      kind: s.kind,
      default_visibility: s.default_visibility,
      options: s.interest_options
        .filter((o) => o.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ id: o.id, name: o.name })),
    }));

  const category: Category = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    world_name: data.world_name,
    description: data.description,
    hue: data.hue as Hue,
  };
  return { category, subcategories };
}

export type DnaStrand = {
  category: Category;
  items: { optionId: number; name: string; subcategory: string; intensity: number; visibility: Visibility }[];
  details: { subcategory: string; details: string; visibility: Visibility }[];
};

/** The signed-in user's VYBE DNA, grouped by world. RLS limits it to their own rows. */
export const getMyDna = cache(async (userId: string): Promise<DnaStrand[]> => {
  const supabase = await createClient();
  const [categories, interests, details] = await Promise.all([
    getCategories(),
    supabase
      .from("user_interests")
      .select("option_id, intensity, visibility, interest_options(name, interest_subcategories(name, category_id))")
      .eq("user_id", userId),
    supabase
      .from("user_interest_details")
      .select("details, visibility, interest_subcategories(name, category_id)")
      .eq("user_id", userId),
  ]);
  if (interests.error || details.error) throw new Error("Couldn't load your VYBE DNA.");

  return categories
    .map((category) => ({
      category,
      items: (interests.data ?? [])
        .filter((i) => i.interest_options?.interest_subcategories?.category_id === category.id)
        .map((i) => ({
          optionId: i.option_id,
          name: i.interest_options!.name,
          subcategory: i.interest_options!.interest_subcategories!.name,
          intensity: i.intensity,
          visibility: i.visibility,
        }))
        .sort((a, b) => b.intensity - a.intensity),
      details: (details.data ?? [])
        .filter((d) => d.interest_subcategories?.category_id === category.id)
        .map((d) => ({ subcategory: d.interest_subcategories!.name, details: d.details, visibility: d.visibility })),
    }))
    .filter((s) => s.items.length > 0 || s.details.length > 0);
});
