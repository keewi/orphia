"use client";

import Tile from "./Tile";
import type { TileState } from "@/lib/showdle/evaluateGuess";

interface GameBoardProps {
  wordLength: number;
  guesses: string[];
  evaluations: TileState[][];
  currentGuess: string;
  latestGuessIndex: number | null;
}

const MAX_GUESSES = 6;

export default function GameBoard({
  wordLength,
  guesses,
  evaluations,
  currentGuess,
  latestGuessIndex,
}: GameBoardProps) {
  const rows: React.ReactNode[] = [];

  for (let row = 0; row < MAX_GUESSES; row++) {
    if (row < guesses.length) {
      const isHintRow = guesses[row] === "HINT";

      if (isHintRow) {
        // Render hint row with overlay label
        rows.push(
          <div className="sd-board-row sd-board-row--hint" key={row}>
            {Array.from({ length: wordLength }).map((_, col) => (
              <div className="sd-tile sd-tile--hint" key={col} />
            ))}
            <span className="sd-hint-row-label">💡 hint</span>
          </div>,
        );
      } else {
        // Normal submitted guess row
        const guess = guesses[row];
        const evaluation = evaluations[row];
        const isLatest = row === latestGuessIndex;
        rows.push(
          <div className="sd-board-row" key={row}>
            {Array.from({ length: wordLength }).map((_, col) => (
              <Tile
                key={col}
                letter={guess[col] || ""}
                state={evaluation?.[col]}
                shouldFlip={isLatest}
                flipDelay={col * 80}
              />
            ))}
          </div>,
        );
      }
    } else if (row === guesses.length) {
      // Active input row
      rows.push(
        <div className="sd-board-row" key={row}>
          {Array.from({ length: wordLength }).map((_, col) => (
            <Tile key={col} letter={currentGuess[col] || ""} />
          ))}
        </div>,
      );
    } else {
      // Empty future row
      rows.push(
        <div className="sd-board-row" key={row}>
          {Array.from({ length: wordLength }).map((_, col) => (
            <Tile key={col} letter="" />
          ))}
        </div>,
      );
    }
  }

  return <div className="sd-board">{rows}</div>;
}
