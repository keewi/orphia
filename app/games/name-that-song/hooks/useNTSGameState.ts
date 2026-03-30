"use client";
import { useState, useEffect, useCallback } from "react";
import { LetterState, GameStatus, FeedbackType, CompletionStats } from "../types";

interface GameState {
  songId: string;
  songTitle: string;
  musicalName: string;
  guessedLetters: Record<string, LetterState>;
  flashLetters: Set<string>;
  hintUsed: boolean;
  timeRemaining: number;
  gameStatus: GameStatus;
  feedbackType: FeedbackType;
  feedbackMessage: string;
  solveModalOpen: boolean;
  wrongSolveAttempts: number;
}

interface UseNTSGameStateReturn extends GameState {
  guessLetter: (letter: string) => void;
  submitSolve: (guess: string) => void;
  useHint: () => void;
  openSolveModal: () => void;
  closeSolveModal: () => void;
  getCompletionStats: (winsToday: number) => CompletionStats;
}

// Normalise for comparison: lowercase, strip non-alphanumeric except spaces
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Get unique letters (A-Z only) from a song title
function getUniqueLetters(title: string): Set<string> {
  const s = new Set<string>();
  for (const ch of title.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") s.add(ch);
  }
  return s;
}

export function useNTSGameState(
  songId: string,
  songTitle: string,
  musicalName: string
): UseNTSGameStateReturn {
  const uniqueLetters = getUniqueLetters(songTitle);

  const [state, setState] = useState<GameState>({
    songId,
    songTitle,
    musicalName,
    guessedLetters: {},
    flashLetters: new Set(),
    hintUsed: false,
    timeRemaining: 60,
    gameStatus: "playing",
    feedbackType: "prompt",
    feedbackMessage: "",
    solveModalOpen: false,
    wrongSolveAttempts: 0,
  });

  // Timer
  useEffect(() => {
    if (state.gameStatus !== "playing") return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(interval);
          return { ...prev, timeRemaining: 0, gameStatus: "lost" };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.gameStatus]);

  // Check win condition after guesses update
  useEffect(() => {
    if (state.gameStatus !== "playing") return;
    const allRevealed = [...uniqueLetters].every(
      (l) => state.guessedLetters[l] === "correct"
    );
    if (allRevealed) {
      setState((prev) => ({ ...prev, gameStatus: "won" }));
    }
  }, [state.guessedLetters, state.gameStatus, uniqueLetters]);

  const setFeedback = useCallback((type: FeedbackType, message: string) => {
    setState((prev) => ({ ...prev, feedbackType: type, feedbackMessage: message }));
  }, []);

  const guessLetter = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.gameStatus !== "playing") return prev;
      if (prev.guessedLetters[letter]) return prev;

      const isCorrect = uniqueLetters.has(letter);
      const newState: LetterState = isCorrect ? "correct" : "absent";

      if (isCorrect) {
        const newFlash = new Set(prev.flashLetters).add(letter);
        setTimeout(() => {
          setState((s) => {
            const f = new Set(s.flashLetters);
            f.delete(letter);
            return { ...s, flashLetters: f };
          });
        }, 900);

        setFeedback("correct", `\u2713 ${letter} is in the song!`);
        return {
          ...prev,
          guessedLetters: { ...prev.guessedLetters, [letter]: newState },
          flashLetters: newFlash,
        };
      } else {
        setFeedback("absent", `'${letter}' isn't in the song name`);
        return {
          ...prev,
          guessedLetters: { ...prev.guessedLetters, [letter]: newState },
        };
      }
    });
  }, [uniqueLetters, setFeedback]);

  const submitSolve = useCallback((guess: string) => {
    setState((prev) => {
      if (prev.gameStatus !== "playing") return prev;
      const isCorrect = normalise(guess) === normalise(prev.songTitle);
      if (isCorrect) {
        return { ...prev, gameStatus: "won", solveModalOpen: false };
      }
      setFeedback("error", "Not quite \u2014 keep guessing!");
      return {
        ...prev,
        solveModalOpen: false,
        wrongSolveAttempts: prev.wrongSolveAttempts + 1,
      };
    });
  }, [setFeedback]);

  const useHint = useCallback(() => {
    setState((prev) => ({ ...prev, hintUsed: true }));
  }, []);

  const openSolveModal = useCallback(() => {
    setState((prev) => ({ ...prev, solveModalOpen: true }));
  }, []);

  const closeSolveModal = useCallback(() => {
    setState((prev) => ({ ...prev, solveModalOpen: false }));
  }, []);

  const getCompletionStats = useCallback((winsToday: number): CompletionStats => {
    const timeSpent = 60 - state.timeRemaining;
    const rightLetters = [...uniqueLetters].filter(
      (l) => state.guessedLetters[l] === "correct"
    ).length;
    const wrongLetters = Object.values(state.guessedLetters).filter(
      (s) => s === "absent"
    ).length;
    return {
      timeSpent,
      rightLetters,
      wrongLetters,
      totalUniqueLetters: uniqueLetters.size,
      hintUsed: state.hintUsed,
      winsToday,
    };
  }, [state, uniqueLetters]);

  return {
    ...state,
    guessLetter,
    submitSolve,
    useHint,
    openSolveModal,
    closeSolveModal,
    getCompletionStats,
  };
}
