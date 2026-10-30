import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { getCategoryWithTaxonomy, getMyDna } from "@/lib/interests";
import { createClient } from "@/lib/supabase/server";
import { InterestEditor } from "./interest-editor";

export const metadata: Metadata = { title: "Edit interests" };

export default function CategoryInterestsPage({ params }: PageProps<"/me/interests/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/5" aria-label="Loading" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await requireOnboardedProfile();
  const data = await getCategoryWithTaxonomy(slug);
  if (!data) notFound();

  const supabase = await createClient();
  const [dna, { data: details }] = await Promise.all([
    getMyDna(profile.id),
    supabase
      .from("user_interest_details")
      .select("subcategory_id, details, visibility")
      .eq("user_id", profile.id),
  ]);
  const strand = dna.find((s) => s.category.id === data.category.id);
  const subIds = new Set(data.subcategories.map((s) => s.id));

  // Visibility is chosen per question; derive it from what's saved.
  const visibility: Record<string, string> = {};
  for (const sub of data.subcategories) {
    const saved = strand?.items.find((i) => sub.options.some((o) => o.id === i.optionId));
    const savedDetail = details?.find((d) => d.subcategory_id === sub.id);
    visibility[sub.id] = saved?.visibility ?? savedDetail?.visibility ?? sub.default_visibility;
  }

  return (
    <div>
      <Link href="/me/interests" className="text-sm text-muted-foreground hover:text-foreground">
        ← All worlds
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{data.category.world_name}</h1>
      <p className="mt-3 text-muted-foreground">{data.category.description}</p>
      <InterestEditor
        categoryId={data.category.id}
        hue={data.category.hue}
        subcategories={data.subcategories}
        initialChoices={Object.fromEntries((strand?.items ?? []).map((i) => [i.optionId, i.intensity]))}
        initialVisibility={visibility}
        initialDetails={Object.fromEntries(
          (details ?? []).filter((d) => subIds.has(d.subcategory_id)).map((d) => [d.subcategory_id, d.details]),
        )}
      />
    </div>
  );
}
