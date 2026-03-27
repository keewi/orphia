"use client";

import Tile from "./Tile";
import type { TileState } from "@/lib/showdle/evaluateGuess";

interface GameBoardProps {
  wordLength: number;
  guesses: string[];
  evaluations: TileState[][];
  currentGuess: string;
  latestGuessIndex: number | null; // index of the most recently submitted guess (for flip animation)
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
    const tiles: React.ReactNode[] = [];

    if (row < guesses.length) {
      // Submitted guess row
      const guess = guesses[row];
      const evaluation = evaluations[row];
      const isLatest = row === latestGuessIndex;
      for (let col = 0; col < wordLength; col++) {
        tiles.push(
          <Tile
            key={col}
            letter={guess[col] || ""}
            state={evaluation?.[col]}
            shouldFlip={isLatest}
            flipDelay={col * 80}
          />,
        );
      }
    } else if (row === guesses.length) {
      // Active input row
      for (let col = 0; col < wordLength; col++) {
        tiles.push(
          <Tile key={col} letter={currentGuess[col] || ""} />,
        );
      }
    } else {
      // Empty future row
      for (let col = 0; col < wordLength; col++) {
        tiles.push(<Tile key={col} letter="" />);
      }
    }

    rows.push(
      <div className="sd-board-row" key={row}>
        {tiles}
      </div>,
    );
  }

  return <div className="sd-board">{rows}</div>;
}
