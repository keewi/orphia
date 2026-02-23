import Link from "next/link";
import { musicals } from "@/data/musicals";
import type { Musical } from "@/data/musicals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyTheatreLife() {
  const supabase = createClient();

  // Get all seen entries
  const { data: entries } = await supabase
    .from("seen_entries")
    .select("musical_id, created_at")
    .order("created_at", { ascending: false });

  const seenCount = entries?.length ?? 0;

  // Compute unique shows and recent list
  const latestMap = new Map<string, string>();
  if (entries) {
    for (const entry of entries) {
      if (!latestMap.has(entry.musical_id)) {
        latestMap.set(entry.musical_id, entry.created_at);
      }
    }
  }

  const uniqueShows = latestMap.size;
  const musicalMap = new Map(musicals.map((m) => [m.id, m]));

  // Sort by most-recently-seen first
  const recentShows: Musical[] = Array.from(latestMap.entries())
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
    .map(([id]) => musicalMap.get(id))
    .filter((m): m is Musical => m !== undefined);

  return (
    <div className="page-container">
      <h2 className="section-title">My Playbill</h2>

      {/* ── Hero Stats ── */}
      <div className="hero-stats">
        <div className="stat-card">
          <span className="stat-number">{seenCount}</span>
          <span className="stat-label">Shows Seen</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{uniqueShows}</span>
          <span className="stat-label">Unique Shows</span>
        </div>
      </div>

      {/* ── Recent Shows ── */}
      <h3 className="subsection-title">Recently Seen</h3>

      {recentShows.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          Your playbill is empty. Time to take your seat!
          <br />
          <Link
            href="/"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Explore Shows
          </Link>
        </div>
      ) : (
        <ul className="seen-list">
          {recentShows.map((musical) => (
            <li key={musical.id} className="seen-card">
              <div>
                <p className="seen-title">{musical.title}</p>
                <p className="seen-year">{musical.year}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
