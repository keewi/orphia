"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { musicals } from "@/data/musicals";
import type { Musical } from "@/data/musicals";
import { readAllEntries } from "@/app/MusicalCard";
import type { SeenEntryRecord } from "@/app/MusicalCard";

interface SeenEntry {
  musical: Musical;
  count: number;
}

function readSeenMusicals(): SeenEntry[] {
  try {
    const entries: SeenEntryRecord[] = readAllEntries();
    if (entries.length === 0) return [];

    // Build a count map and track the latest timestamp per musical
    const countMap = new Map<string, number>();
    const latestMap = new Map<string, number>();

    for (const entry of entries) {
      if (entry.status !== "seen") continue;
      countMap.set(entry.musicalId, (countMap.get(entry.musicalId) ?? 0) + 1);
      const prev = latestMap.get(entry.musicalId) ?? 0;
      if (entry.timestamp > prev) {
        latestMap.set(entry.musicalId, entry.timestamp);
      }
    }

    const musicalMap = new Map(musicals.map((m) => [m.id, m]));

    // Sort by most-recently-seen first
    return Array.from(countMap.entries())
      .sort((a, b) => (latestMap.get(b[0]) ?? 0) - (latestMap.get(a[0]) ?? 0))
      .map(([id, count]) => {
        const musical = musicalMap.get(id);
        return musical ? { musical, count } : null;
      })
      .filter((e): e is SeenEntry => e !== null);
  } catch {
    return [];
  }
}

export default function MyMusicals() {
  const [seenEntries, setSeenEntries] = useState<SeenEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSeenEntries(readSeenMusicals());
    setLoaded(true);
  }, []);

  return (
    <div className="page-container">
      <h2 className="section-title">My Collection</h2>

      {!loaded ? null : seenEntries.length === 0 ? (
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
