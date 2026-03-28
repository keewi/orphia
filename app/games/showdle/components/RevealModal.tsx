"use client";

import { useEffect, useState } from "react";
import DifficultyBadge from "./DifficultyBadge";
import type { TileState } from "@/lib/showdle/evaluateGuess";

interface RevealData {
  showName: string;
  characterName: string;
  originalCast: string | null;
  difficulty: number;
  answer: string;
}

interface RevealModalProps {
  puzzleId: string;
  won: boolean;
  guessCount: number;
  evaluations: TileState[][];
  wordLength: number;
  hintUsed: boolean;
}

const MAX_GUESSES = 6;

const SQUARE_COLORS: Record<TileState | "empty", React.CSSProperties> = {
  correct: { background: "#2d6a2d" },
  present: { background: "#c8922a" },
  absent: { background: "#e8e0d4" },
  hint: { background: "#f0e8d8", border: "1px solid #d4c9b8", opacity: 0.5 },
  empty: { background: "transparent", border: "1px solid #e0d5c4" },
};

export default function RevealModal({
  puzzleId,
  won,
  guessCount,
  evaluations,
  wordLength,
  // hintUsed,  // reserved for share text
}: RevealModalProps) {
  const [data, setData] = useState<RevealData | null>(null);

  useEffect(() => {
    fetch(`/api/showdle/puzzle/${puzzleId}/reveal`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [puzzleId]);

  if (!data) return null;

  // Result line
  const resultText = won
    ? `Correct! ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}`
    : null;
  const lossText = !won ? `The answer was ${data.answer}` : null;

  const castLine = data.originalCast
    ? `${data.characterName} \u2022 ${data.originalCast}`
    : data.characterName;

  // Build scoreboard rows — always 6
  const scoreboardRows: React.ReactNode[] = [];
  for (let row = 0; row < MAX_GUESSES; row++) {
    const squares: React.ReactNode[] = [];
    for (let col = 0; col < wordLength; col++) {
      const state: TileState | "empty" =
        row < evaluations.length ? evaluations[row][col] : "empty";
      squares.push(
        <div
          key={col}
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            boxSizing: "border-box",
            ...SQUARE_COLORS[state],
          }}
        />,
      );
    }
    scoreboardRows.push(
      <div key={row} style={{ display: "flex", gap: 3 }}>
        {squares}
      </div>,
    );
  }

  return (
    <div className="sd-modal-backdrop">
      <div className="sd-modal-panel">
        {resultText && <p className="sd-modal-result">{resultText}</p>}
        {lossText && (
          <p className="sd-modal-result" style={{ color: "#b03a2e" }}>
            {lossText}
          </p>
        )}
        <p className="sd-modal-show">{data.showName}</p>
        <p className="sd-modal-detail">{castLine}</p>
        <DifficultyBadge difficulty={data.difficulty} />

        {/* Scoreboard grid */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "center",
            margin: "8px 0",
          }}
        >
          {scoreboardRows}
        </div>

        {/* Slice 4: add Share Result button here (primary sd-gold style) */}

        <div style={{ marginTop: 12 }}>
          <button
            className="sd-btn sd-btn--secondary"
            onClick={() => {
              /* TODO: Slice 4 — Navigate to archive */
            }}
          >
            Play Archive
          </button>
        </div>
      </div>
    </div>
  );
}
