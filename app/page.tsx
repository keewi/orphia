import { createClient } from "@/lib/supabase/server";
import type { Musical } from "@/lib/types";
import ExploreCarousel from "./ExploreCarousel";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all musicals — try popularity_rank ordering first, fall back to title-only
  let allMusicals: Musical[] | null = null;
  {
    const { data, error } = await supabase
      .from("musicals")
      .select("id, title, year, description, image_url, popularity_rank")
      .order("popularity_rank", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true });

    if (error) {
      // popularity_rank column may not exist yet — fall back to title ordering
      const fallback = await supabase
        .from("musicals")
        .select("id, title, year, description, image_url")
        .order("title", { ascending: true });
      allMusicals = fallback.data;
    } else {
      allMusicals = data;
    }
  }

  // Fetch musical IDs where the user already has a status row
  let statusRows: { musical_id: string }[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("user_musical_status")
      .select("musical_id")
      .eq("user_id", user.id);

    if (!error && data) {
      statusRows = data;
    } else if (error?.code === "PGRST205") {
      // Table doesn't exist — fall back to legacy tables
      const [{ data: savedRows }, { data: reviewRows }] = await Promise.all([
        supabase
          .from("saved_musicals")
          .select("musical_id")
          .eq("user_id", user.id),
        supabase
          .from("reviews")
          .select("musical_id")
          .eq("user_id", user.id),
      ]);
      const ids = new Set<string>();
      for (const r of savedRows ?? []) ids.add(r.musical_id);
      for (const r of reviewRows ?? []) ids.add(r.musical_id);
      statusRows = Array.from(ids).map((musical_id) => ({ musical_id }));
    }
  }

  const actedSet = new Set(statusRows.map((s) => s.musical_id));

  // Filter to only unseen/un-acted musicals
  const musicals: Musical[] = (allMusicals ?? []).filter(
    (m) => !actedSet.has(m.id),
  );

  return (
    <div className="page-container">
      <h2 className="section-title">Explore</h2>
      <ExploreCarousel musicals={musicals} userId={user?.id ?? null} />
    </div>
  );
}
