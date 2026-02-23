import { createClient } from "@/lib/supabase/server";
import type { Musical } from "@/lib/types";
import SearchableMusicalGrid from "./SearchableMusicalGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data } = await supabase
    .from("musicals")
    .select("id, title, year, description, image_url")
    .order("title");

  const musicals: Musical[] = data ?? [];

  return (
    <div className="page-container">
      <h2 className="section-title">Explore Shows</h2>
      <SearchableMusicalGrid musicals={musicals} />
    </div>
  );
}
