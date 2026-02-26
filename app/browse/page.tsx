import { createClient } from "@/lib/supabase/server";
import { isTableMissing } from "@/lib/supabase/compat";
import type { Musical } from "@/lib/types";
import SearchableMusicalGrid from "../SearchableMusicalGrid";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = createClient();

  // Get user first (fast JWT check), then batch-fetch with proper scoping
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data },
    { data: reviewData, error: reviewError },
    { data: savedData, error: savedError },
  ] = await Promise.all([
    supabase
      .from("musicals")
      .select("id, title, year, description, image_url")
      .order("title"),
    user
      ? supabase.from("user_reviews").select("musical_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { musical_id: string }[], error: null }),
    user
      ? supabase
          .from("user_musical_status")
          .select("musical_id")
          .eq("user_id", user.id)
          .eq("status", "want_to_see")
      : Promise.resolve({ data: [] as { musical_id: string }[], error: null }),
  ]);

  // Fall back to legacy tables when new ones don't exist
  let reviewRows = reviewData;
  if (isTableMissing(reviewError)) {
    const { data: legacyData } = await supabase
      .from("reviews")
      .select("musical_id")
      .eq("user_id", user!.id);
    reviewRows = legacyData;
  }

  let savedRows = savedData;
  if (isTableMissing(savedError)) {
    const { data: legacyData } = await supabase
      .from("saved_musicals")
      .select("musical_id")
      .eq("user_id", user!.id);
    savedRows = legacyData;
  }

  const musicals: Musical[] = data ?? [];

  // Build status map: musicalId -> { seenCount, savedForLater }
  const seenCounts = new Map<string, number>();
  for (const r of reviewRows ?? []) {
    seenCounts.set(r.musical_id, (seenCounts.get(r.musical_id) ?? 0) + 1);
  }
  const savedSet = new Set((savedRows ?? []).map((s) => s.musical_id));

  const statusMap: Record<
    string,
    { seenCount: number; savedForLater: boolean }
  > = {};
  for (const m of musicals) {
    statusMap[m.id] = {
      seenCount: seenCounts.get(m.id) ?? 0,
      savedForLater: savedSet.has(m.id),
    };
  }

  return (
    <div className="page-container">
      <h2 className="section-title">Browse Shows</h2>
      <SearchableMusicalGrid musicals={musicals} statusMap={statusMap} />
    </div>
  );
}
