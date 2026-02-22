"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { musicals } from "@/data/musicals";
import type { Musical } from "@/data/musicals";
import { readAllEntries } from "@/app/MusicalCard";
import type { SeenEntryRecord } from "@/app/MusicalCard";

interface TheatreData {
  seenCount: number;
  uniqueShows: number;
  recentShows: Musical[];
}

function readTheatreData(): TheatreData {
  try {
    const entries: SeenEntryRecord[] = readAllEntries();
    if (entries.length === 0) {
      return { seenCount: 0, uniqueShows: 0, recentShows: [] };
    }

    const seenEntries = entries.filter((e) => e.status === "seen");
    const seenCount = seenEntries.length;

    // Track unique musical IDs and their latest timestamp
    const latestMap = new Map<string, number>();
    for (const entry of seenEntries) {
      const prev = latestMap.get(entry.musicalId) ?? 0;
      if (entry.timestamp > prev) {
        latestMap.set(entry.musicalId, entry.timestamp);
      }
    }

    const uniqueShows = latestMap.size;
    const musicalMap = new Map(musicals.map((m) => [m.id, m]));

    // Sort by most-recently-seen first
    const recentShows = Array.from(latestMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => musicalMap.get(id))
      .filter((m): m is Musical => m !== undefined);

    return { seenCount, uniqueShows, recentShows };
  } catch {
    return { seenCount: 0, uniqueShows: 0, recentShows: [] };
  }
}

export default function MyTheatreLife() {
  const [data, setData] = useState<TheatreData>({
    seenCount: 0,
    uniqueShows: 0,
    recentShows: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(readTheatreData());
    setLoaded(true);
  }, []);

  return (
    <div className="page-container">
      <h2 className="section-title">My Playbill</h2>

      {/* ── Hero Stats ── */}
      <div className="hero-stats">
        <div className="stat-card">
          <span className="stat-number">{loaded ? data.seenCount : "—"}</span>
          <span className="stat-label">Shows Seen</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{loaded ? data.uniqueShows : "—"}</span>
          <span className="stat-label">Unique Shows</span>
        </div>
      </div>

      {/* ── Recent Shows ── */}
      <h3 className="subsection-title">Recently Seen</h3>

      {!loaded ? null : data.recentShows.length === 0 ? (
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
          {data.recentShows.map((musical) => (
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
