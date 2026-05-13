"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Histogram from "./Histogram";
import LyricReveal from "./LyricReveal";
import MiniLeaderboard from "./MiniLeaderboard";
import { getResultMessage } from "@/lib/showdle/resultMessages";
import type { TileState } from "@/lib/showdle/evaluateGuess";

interface RevealData {
  lyric: string;
  showName: string;
  songName: string;
  year: number;
  characterName: string;
  originalCast: string | null;
  difficulty: number;
  answer: string;
  guessDistribution: number[];
  totalPlayers: number;
}

interface PersonalStats {
  currentStreak: number;
  totalPlayed: number;
  winRate: number;
  totalScore: number;
}

interface RevealModalProps {
  puzzleId: string;
  won: boolean;
  /** Total rows in the guess array, including the HINT pseudo-row. */
  guessCount: number;
  /** Real guesses only (excludes HINT). Used in the "Correct! N guesses" line. */
  realGuessCount: number;
  evaluations: TileState[][];
  wordLength: number;
  hintUsed: boolean;
  score: number;
}

const MAX_GUESSES = 6;

const TILE_CLASS: Record<TileState | "empty", string> = {
  correct: "sq sq-c",
  present: "sq sq-p",
  absent: "sq sq-a",
  hint: "sq sq-h",
  empty: "sq sq-e",
};

export default function RevealModal({
  puzzleId,
  won,
  realGuessCount,
  evaluations,
  wordLength,
  hintUsed,
  score,
}: RevealModalProps) {
  const router = useRouter();
  const [data, setData] = useState<RevealData | null>(null);
  const [stats, setStats] = useState<PersonalStats | null>(null);

  // Stable result message — computed once on mount
  const resultMessage = useMemo(() => getResultMessage(won), [won]);

  // Reveal fetch — blocks modal render
  useEffect(() => {
    fetch(`/api/showdle/puzzle/${puzzleId}/reveal`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {});
  }, [puzzleId]);

  // Personal stats fetch — independent, non-blocking, 401 silently ignored
  useEffect(() => {
    fetch("/api/showdle/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s && typeof s.currentStreak === "number") setStats(s);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Build guess grid — always 6 rows
  const gridRows: React.ReactNode[] = [];
  for (let row = 0; row < MAX_GUESSES; row++) {
    const squares: React.ReactNode[] = [];
    for (let col = 0; col < wordLength; col++) {
      const state: TileState | "empty" =
        row < evaluations.length ? evaluations[row][col] : "empty";
      squares.push(<div key={col} className={TILE_CLASS[state]} />);
    }
    gridRows.push(
      <div key={row} className="sd-sb-row">
        {squares}
      </div>,
    );
  }

  // Histogram highlight: only on wins
  const highlightIndex = won ? realGuessCount : null;

  return (
    <div className="sd-modal-backdrop">
      <div className="sd-modal-panel">
        {/* Lyric reveal — black panel at top */}
        <LyricReveal
          lyric={data.lyric}
          answer={data.answer}
          won={won}
          resultMessage={resultMessage}
        />

        {/* Song + show + cast */}
        {data.songName && (
          <p className="sd-song-name">&ldquo;{data.songName}&rdquo;</p>
        )}
        <p className="sd-show-name">
          {data.showName}
          {data.year ? ` · ${data.year}` : ""}
          {data.originalCast ? ` · ${data.originalCast}` : ""}
        </p>

        {/* Points pill */}
        <div style={{ marginBottom: 12 }}>
          <span
            className={
              "sd-points-pill" + (won ? "" : " sd-points-pill--loss")
            }
          >
            +{" "}
            <span className="pts">{won ? score : 0}</span>{" "}
            points
            {hintUsed && won && (
              <span style={{ color: "var(--sd-gold-muted)", fontSize: 11 }}>
                (×0.5 hint)
              </span>
            )}
          </span>
        </div>

        {hintUsed && won && (
          <p className="sd-hint-note">Hint used — score halved</p>
        )}

        {/* Personal stat row */}
        {stats && (
          <div className="sd-stat-row">
            <div className="sd-stat-item">
              <div className="sd-stat-val">
                {stats.totalScore.toLocaleString()}
              </div>
              <div className="sd-stat-lbl">Total pts</div>
            </div>
            <div className="sd-stat-item">
              <div className="sd-stat-val">{stats.winRate}%</div>
              <div className="sd-stat-lbl">Win %</div>
            </div>
            <div className="sd-stat-item">
              <div className="sd-stat-val">🔥 {stats.currentStreak}</div>
              <div className="sd-stat-lbl">Streak</div>
            </div>
            <div className="sd-stat-item">
              <div className="sd-stat-val">{stats.totalPlayed}</div>
              <div className="sd-stat-lbl">Played</div>
            </div>
          </div>
        )}

        {/* Guess grid */}
        <div className="sd-scoreboard">{gridRows}</div>

        {/* Histogram */}
        {data.totalPlayers > 0 && (
          <Histogram
            distribution={data.guessDistribution}
            totalPlayers={data.totalPlayers}
            highlightIndex={highlightIndex}
            label="Today's puzzle — all players"
          />
        )}

        {/* Back to Games */}
        <button
          className="sd-btn sd-btn--secondary"
          onClick={() => router.push("/games")}
        >
          Back to Games
        </button>

        {/* Mini leaderboard */}
        <MiniLeaderboard />
      </div>
    </div>
  );
}
