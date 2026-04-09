"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StatsResponse {
  totalPlayed: number;
  currentStreak: number;
  totalScore: number;
  last7: { date: string; won: boolean | null; score: number }[];
}

const GOLD = "#c8922a";
const MUTED = "#a08060";

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ShowdleCard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/showdle/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.totalPlayed === "number") setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const playedToday = (() => {
    if (!stats || stats.totalPlayed === 0) return false;
    const today = todayIsoUtc();
    const lastDay = stats.last7[stats.last7.length - 1];
    return !!lastDay && lastDay.date === today && lastDay.won !== null;
  })();

  return (
    <div
      className="game-card"
      style={{ display: "flex", flexDirection: "column", padding: 0 }}
    >
      <Link
        href="/games/showdle"
        style={{
          display: "block",
          padding: 16,
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <div className="game-card-badge">Daily</div>
        <div className="game-card-icon">🎭</div>
        <h2 className="game-card-title">Showdle</h2>
        <p className="game-card-desc">
          Guess the mystery musical from a cryptic lyric clue. A new puzzle
          every day.
        </p>
        {playedToday ? (
          <div className="game-card-cta" style={{ color: MUTED }}>
            Played today ✓
          </div>
        ) : (
          <div className="game-card-cta">
            Play today&rsquo;s puzzle &rarr;
          </div>
        )}
      </Link>

      {loaded && <StatsStrip stats={stats} />}
    </div>
  );
}

function StatsStrip({ stats }: { stats: StatsResponse | null }) {
  const stripStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.03)",
  };

  // Empty / not logged in
  if (!stats || stats.totalPlayed === 0) {
    return (
      <div style={stripStyle}>
        <span style={{ fontSize: 12, fontStyle: "italic", color: MUTED }}>
          No stats yet — play to start tracking
        </span>
      </div>
    );
  }

  const today = todayIsoUtc();
  const lastDay = stats.last7[stats.last7.length - 1];
  const playedToday =
    !!lastDay && lastDay.date === today && lastDay.won !== null;
  const wonToday = playedToday && lastDay.won === true;
  const lostToday = playedToday && lastDay.won === false;
  const todayScore = playedToday ? lastDay.score : 0;

  const chipBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid",
  };
  const goldChip: React.CSSProperties = {
    ...chipBase,
    background: "rgba(200, 146, 42, 0.12)",
    borderColor: "rgba(200, 146, 42, 0.3)",
    color: GOLD,
  };
  const greenChip: React.CSSProperties = {
    ...chipBase,
    background: "rgba(45,106,45,0.12)",
    borderColor: "rgba(45,106,45,0.3)",
    color: "#2d6a2d",
  };
  const redChip: React.CSSProperties = {
    ...chipBase,
    background: "rgba(176,58,46,0.1)",
    borderColor: "rgba(176,58,46,0.2)",
    color: "#b03a2e",
  };
  const mutedChip: React.CSSProperties = {
    ...chipBase,
    background: "rgba(160,128,96,0.1)",
    borderColor: "rgba(160,128,96,0.2)",
    color: MUTED,
  };

  let chip1: React.ReactNode;
  let chip2: React.ReactNode;
  if (wonToday) {
    chip1 = <span style={goldChip}>🔥 {stats.currentStreak} streak</span>;
    chip2 = <span style={greenChip}>+{todayScore} pts today</span>;
  } else if (lostToday) {
    chip1 = <span style={mutedChip}>0 streak</span>;
    chip2 = <span style={redChip}>+0 pts today</span>;
  } else {
    chip1 = <span style={goldChip}>🔥 {stats.currentStreak} streak</span>;
    chip2 = (
      <span style={goldChip}>
        {stats.totalScore.toLocaleString()} pts
      </span>
    );
  }

  return (
    <div style={stripStyle}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {chip1}
        {chip2}
      </div>
      <div style={{ marginTop: 6 }}>
        <Link
          href="/games/showdle/stats"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 11,
            color: MUTED,
            textDecoration: "underline",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          View full stats
        </Link>
      </div>
    </div>
  );
}
