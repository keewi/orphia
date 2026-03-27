"use client";

import { useCallback, useEffect } from "react";
import ShowdleHeader from "./components/ShowdleHeader";
import LyricDisplay from "./components/LyricDisplay";
import GameBoard from "./components/GameBoard";
import Keyboard from "./components/Keyboard";
import Toast from "./components/Toast";
import RevealModal from "./components/RevealModal";
import { useGameState } from "./hooks/useGameState";

interface ShowdleGameProps {
  puzzle: {
    id: string;
    lyric: string;
    wordLength: number;
    difficulty: number;
    answer: string;
  };
}

export default function ShowdleGame({ puzzle }: ShowdleGameProps) {
  const {
    guesses,
    evaluations,
    currentGuess,
    status,
    latestGuessIndex,
    letterStates,
    toast,
    setToast,
    addLetter,
    deleteLetter,
    submitGuess,
  } = useGameState(puzzle.id, puzzle.wordLength, puzzle.answer);

  // Physical keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key);
      }
    },
    [addLetter, deleteLetter, submitGuess],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const showModal = status !== "playing";

  return (
    <>
      <ShowdleHeader />
      <LyricDisplay lyric={puzzle.lyric} wordLength={puzzle.wordLength} />
      <GameBoard
        wordLength={puzzle.wordLength}
        guesses={guesses}
        evaluations={evaluations}
        currentGuess={currentGuess}
        latestGuessIndex={latestGuessIndex}
      />
      <Keyboard
        onKey={addLetter}
        onEnter={submitGuess}
        onDelete={deleteLetter}
        letterStates={letterStates}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showModal && (
        <RevealModal
          puzzleId={puzzle.id}
          won={status === "won"}
          guessCount={guesses.length}
        />
      )}
    </>
  );
}
