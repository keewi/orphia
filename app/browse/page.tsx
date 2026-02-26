import { createClient } from "@/lib/supabase/server";
import { getAllMusicalsAlpha, getBrowseStatusMap } from "@/lib/services/musicalReadService";
import type { Musical } from "@/lib/types";
import SearchableMusicalGrid from "../SearchableMusicalGrid";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const musicals: Musical[] = await getAllMusicalsAlpha();

  // Build status map for the current user
  const statusMap = user
    ? await getBrowseStatusMap(user.id)
    : ({} as Record<string, { seenCount: number; savedForLater: boolean }>);

  return (
    <div className="page-container">
      <h2 className="section-title">Browse Shows</h2>
      <SearchableMusicalGrid musicals={musicals} statusMap={statusMap} />
    </div>
  );
}
