"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MiniRow {
  rank: number;
  displayName: string;
  score: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  rows: MiniRow[];
}

export default function MiniLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    fetch("/api/showdle/leaderboard?tab=weekly")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.rows)) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data || data.rows.length === 0) return null;

  // Show top 5 only
  const top5 = data.rows.slice(0, 5);

  return (
    <div className="sd-mini-lb">
      <p className="sd-mini-lb-heading">This week&apos;s leaders</p>
      {top5.map((r) => {
        const isMe = r.isCurrentUser;
        let rankDisplay: React.ReactNode = String(r.rank);
        if (r.rank === 1) rankDisplay = "🥇";
        else if (r.rank === 2) rankDisplay = "🥈";
        else if (r.rank === 3) rankDisplay = "🥉";

        return (
          <div
            key={r.rank + r.displayName}
            className={"sd-mini-lb-row" + (isMe ? " sd-mini-lb-row--me" : "")}
          >
            <span className="sd-mini-lb-rank">{rankDisplay}</span>
            <span className="sd-mini-lb-name">
              {isMe ? "you" : r.displayName}
              {isMe && <span className="sd-you-badge">you</span>}
            </span>
            <span className="sd-mini-lb-score">{r.score.toLocaleString()}</span>
          </div>
        );
      })}
      <Link href="/games/showdle/leaderboard" className="sd-mini-lb-link">
        Full leaderboard →
      </Link>
    </div>
  );
}
