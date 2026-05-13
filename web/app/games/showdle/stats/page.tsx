"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ShowdleHeader from "../components/ShowdleHeader";
import Histogram from "../components/Histogram";
import Last7Grid from "../components/Last7Grid";

interface StatsResponse {
  totalPlayed: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  avgGuesses: number | null;
  guessDistribution: number[];
  last7: { date: string; won: boolean | null; score: number }[];
}

export default function ShowdleStatsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/games");
      return;
    }
    fetch("/api/showdle/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.totalPlayed === "number") setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  const showLoading = loading || status === "loading";

  return (
    <div className="sd-container">
      <ShowdleHeader />
      <div className="sd-back-bar">
        <Link href="/games" className="sd-back-btn">
          ← Back to games
        </Link>
      </div>

      {showLoading ? (
        <div className="sd-content">
          <div className="sd-skeleton" style={{ height: 100 }} />
          <div className="sd-skeleton" style={{ height: 120 }} />
          <div className="sd-skeleton" style={{ height: 180 }} />
          <div className="sd-skeleton" style={{ height: 100 }} />
        </div>
      ) : !stats || stats.totalPlayed === 0 ? (
        <div className="sd-empty">
          <h3>No stats yet</h3>
          <p>
            Play your first Showdle to start tracking your stats, streak, and
            score.
          </p>
          <Link href="/games/showdle" className="sd-empty-btn">
            Play Today&apos;s Showdle
          </Link>
        </div>
      ) : (
        <StatsContent stats={stats} />
      )}
    </div>
  );
}

function StatsContent({ stats }: { stats: StatsResponse }) {
  // Most common guess count (1..6) — excludes losses
  const guessOnly = stats.guessDistribution.slice(1, 7);
  const maxVal = Math.max(...guessOnly);
  const mostCommonGuess = maxVal > 0 ? guessOnly.indexOf(maxVal) + 1 : null;

  return (
    <div className="sd-content">
      {/* Streaks */}
      <div>
        <p className="sd-stats-heading">Streaks</p>
        <div className="sd-streak-row">
          <div className="sd-streak-card">
            <div className="sd-streak-card-icon">🔥</div>
            <div className="sd-streak-card-val">{stats.currentStreak}</div>
            <div className="sd-streak-card-lbl">Current streak</div>
          </div>
          <div className="sd-streak-card sd-streak-card--plain">
            <div className="sd-streak-card-icon" style={{ opacity: 0.4 }}>
              🔥
            </div>
            <div className="sd-streak-card-val">{stats.maxStreak}</div>
            <div className="sd-streak-card-lbl">Best streak</div>
          </div>
        </div>
      </div>

      {/* Lifetime totals */}
      <div>
        <p className="sd-stats-heading">Lifetime totals</p>
        <div className="sd-stat-grid">
          <div className="sd-stat-cell">
            <div className="sd-stat-cell-val">{stats.totalPlayed}</div>
            <div className="sd-stat-cell-lbl">Played</div>
          </div>
          <div className="sd-stat-cell">
            <div className="sd-stat-cell-val">{stats.winRate}%</div>
            <div className="sd-stat-cell-lbl">Win rate</div>
          </div>
          <div className="sd-stat-cell">
            <div className="sd-stat-cell-val">
              {stats.avgGuesses ?? "—"}
            </div>
            <div className="sd-stat-cell-lbl">Avg guesses</div>
          </div>
        </div>
        <div className="sd-total-score-row">
          <span className="sd-total-score-lbl">Total score</span>
          <span className="sd-total-score-val">
            {stats.totalScore.toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* Guess distribution */}
      <div>
        <p className="sd-stats-heading">Guess distribution</p>
        <Histogram
          distribution={stats.guessDistribution}
          totalPlayers={stats.totalPlayed}
          highlightIndex={mostCommonGuess}
          label=""
        />
      </div>

      {/* Last 7 days */}
      <div>
        <p className="sd-stats-heading">Last 7 days</p>
        <Last7Grid days={stats.last7} />
        <div className="sd-legend">
          <div className="sd-legend-item">
            <div
              className="sd-legend-swatch"
              style={{ background: "var(--sd-correct)" }}
            />
            Win
          </div>
          <div className="sd-legend-item">
            <div
              className="sd-legend-swatch"
              style={{ background: "var(--sd-error)" }}
            />
            Loss
          </div>
          <div className="sd-legend-item">
            <div
              className="sd-legend-swatch"
              style={{ background: "var(--sd-absent)" }}
            />
            Skipped
          </div>
        </div>
      </div>
    </div>
  );
}
