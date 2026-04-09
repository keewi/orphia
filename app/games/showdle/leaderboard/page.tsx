"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShowdleHeader from "../components/ShowdleHeader";

interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  currentStreak: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  rows: LeaderboardRow[];
  currentUserRow: {
    rank: number;
    score: number;
    currentStreak: number;
  } | null;
}

type Tab = "alltime" | "weekly";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("alltime");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/showdle/leaderboard?tab=${tab}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.rows)) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="sd-container">
      <ShowdleHeader />
      <div className="sd-back-bar">
        <Link href="/games" className="sd-back-btn">
          ← Back to games
        </Link>
      </div>

      <div className="sd-toggle-bar">
        <button
          type="button"
          className={
            "sd-toggle-opt" +
            (tab === "alltime" ? " sd-toggle-opt--active" : "")
          }
          onClick={() => setTab("alltime")}
        >
          All-time
        </button>
        <button
          type="button"
          className={
            "sd-toggle-opt" +
            (tab === "weekly" ? " sd-toggle-opt--active" : "")
          }
          onClick={() => setTab("weekly")}
        >
          This week
        </button>
      </div>

      <LeaderboardBody tab={tab} data={data} loading={loading} />
    </div>
  );
}

function LeaderboardBody({
  tab,
  data,
  loading,
}: {
  tab: Tab;
  data: LeaderboardResponse | null;
  loading: boolean;
}) {
  // Initial load skeleton
  if (!data && loading) {
    return (
      <div className="sd-content">
        <div className="sd-skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  if (!data) return null;

  // Weekly empty state
  if (tab === "weekly" && data.rows.length === 0) {
    return (
      <div className="sd-empty" style={{ padding: "40px 20px" }}>
        <h3>No plays yet this week</h3>
        <p>
          Play today&apos;s Showdle to appear on the weekly board. Resets
          every Monday.
        </p>
        <Link href="/games/showdle" className="sd-empty-btn">
          Play Today
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <table className="sd-lb-table">
        <thead className="sd-lb-thead">
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th className="right">Score</th>
            <th className="right">Streak</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <LeaderboardRowEl key={r.userId} row={r} />
          ))}
          {data.currentUserRow && <PinnedRow row={data.currentUserRow} />}
        </tbody>
      </table>
    </div>
  );
}

function rankDisplay(rank: number) {
  if (rank === 1) return <span className="sd-medal">🥇</span>;
  if (rank === 2) return <span className="sd-medal">🥈</span>;
  if (rank === 3) return <span className="sd-medal">🥉</span>;
  return <>{rank}</>;
}

function streakDisplay(streak: number) {
  if (streak > 0) {
    return <>🔥 {streak}</>;
  }
  return <span style={{ color: "var(--sd-gold-muted)" }}>—</span>;
}

function LeaderboardRowEl({ row }: { row: LeaderboardRow }) {
  const cls = "sd-lb-row" + (row.isCurrentUser ? " sd-lb-row--me" : "");
  return (
    <tr className={cls}>
      <td className="sd-lb-rank">{rankDisplay(row.rank)}</td>
      <td className="sd-lb-handle">
        {row.isCurrentUser ? "you" : row.displayName}
        {row.isCurrentUser && <span className="sd-you-badge">you</span>}
      </td>
      <td className="sd-lb-score">{row.score.toLocaleString()}</td>
      <td className="sd-lb-streak">{streakDisplay(row.currentStreak)}</td>
    </tr>
  );
}

function PinnedRow({
  row,
}: {
  row: { rank: number; score: number; currentStreak: number };
}) {
  return (
    <tr className="sd-lb-row sd-lb-row--pinned">
      <td className="sd-lb-rank">{rankDisplay(row.rank)}</td>
      <td className="sd-lb-handle" style={{ color: "var(--sd-gold)" }}>
        you<span className="sd-you-badge">you</span>
      </td>
      <td className="sd-lb-score">{row.score.toLocaleString()}</td>
      <td className="sd-lb-streak">{streakDisplay(row.currentStreak)}</td>
    </tr>
  );
}
