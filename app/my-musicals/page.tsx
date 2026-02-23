import Link from "next/link";
import { musicals } from "@/data/musicals";
import type { Musical } from "@/data/musicals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SeenEntry {
  musical: Musical;
  count: number;
}

export default async function MyMusicals() {
  const supabase = createClient();

  // Get seen entries grouped by musical_id with count, ordered by most recent
  const { data: entries } = await supabase
    .from("seen_entries")
    .select("musical_id, created_at")
    .order("created_at", { ascending: false });

  const seenEntries: SeenEntry[] = [];

  if (entries && entries.length > 0) {
    // Build count map and track latest timestamp per musical
    const countMap = new Map<string, number>();
    const latestMap = new Map<string, string>();

    for (const entry of entries) {
      countMap.set(entry.musical_id, (countMap.get(entry.musical_id) ?? 0) + 1);
      if (!latestMap.has(entry.musical_id)) {
        latestMap.set(entry.musical_id, entry.created_at);
      }
    }

    const musicalMap = new Map(musicals.map((m) => [m.id, m]));

    // Sort by most-recently-seen first
    const sorted = Array.from(countMap.entries()).sort(
      (a, b) =>
        new Date(latestMap.get(b[0])!).getTime() -
        new Date(latestMap.get(a[0])!).getTime()
    );

    for (const [id, count] of sorted) {
      const musical = musicalMap.get(id);
      if (musical) {
        seenEntries.push({ musical, count });
      }
    }
  }

  return (
    <div className="page-container">
      <h2 className="section-title">My Collection</h2>

      {seenEntries.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          Your collection is waiting. Start marking shows you&rsquo;ve seen!
          <br />
          <Link href="/" className="btn btn-accent" style={{ marginTop: "1rem", display: "inline-block" }}>
            Explore Shows
          </Link>
        </div>
      ) : (
        <ul className="seen-list">
          {seenEntries.map(({ musical, count }) => (
            <li key={musical.id} className="seen-card">
              <div>
                <p className="seen-title">{musical.title}</p>
                <p className="seen-year">{musical.year}</p>
              </div>
              <span className="status-label status-seen">
                Seen {count} {count === 1 ? "time" : "times"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
