"use client";

import { useCallback, useEffect, useState } from "react";
import ShowdleHeader from "./components/ShowdleHeader";
import LyricDisplay from "./components/LyricDisplay";
import GameBoard from "./components/GameBoard";
import Keyboard from "./components/Keyboard";
import Toast from "./components/Toast";
import RevealModal from "./components/RevealModal";
import HintConfirmModal from "./components/HintConfirmModal";
import { useGameState } from "./hooks/useGameState";

interface ShowdleGameProps {
  puzzle: {
    id: string;
    lyric: string;
    wordLength: number;
    difficulty: number;
    answer: string;
    showName: string;
  };
}

export default function ShowdleGame({ puzzle }: ShowdleGameProps) {
  const {
    guesses,
    evaluations,
    currentGuess,
    status,
    hintUsed,
    hintShowName,
    latestGuessIndex,
    letterStates,
    toast,
    setToast,
    addLetter,
    deleteLetter,
    submitGuess,
    activateHint,
  } = useGameState(puzzle.id, puzzle.wordLength, puzzle.answer);

  const [showHintModal, setShowHintModal] = useState(false);

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

  // Hint disabled when: already used, game over, or 5+ real guesses submitted
  const realGuessCount = guesses.filter((g) => g !== "HINT").length;
  const hintDisabled = hintUsed || status !== "playing" || realGuessCount >= 5;

  const handleHintConfirm = () => {
    setShowHintModal(false);
    activateHint(puzzle.showName);
  };

  const showModal = status !== "playing";

  return (
    <>
      <ShowdleHeader />
      <LyricDisplay
        lyric={puzzle.lyric}
        wordLength={puzzle.wordLength}
        hintShowName={hintShowName}
        onHintTap={() => setShowHintModal(true)}
        hintDisabled={hintDisabled}
      />
      <GameBoard
        wordLength={puzzle.wordLength}
        guesses={guesses}
        evaluations={evaluations}
        currentGuess={currentGuess}
        latestGuessIndex={latestGuessIndex}
        status={status}
      />
      <Keyboard
        onKey={addLetter}
        onEnter={submitGuess}
        onDelete={deleteLetter}
        letterStates={letterStates}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showHintModal && (
        <HintConfirmModal
          onCancel={() => setShowHintModal(false)}
          onConfirm={handleHintConfirm}
        />
      )}

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
