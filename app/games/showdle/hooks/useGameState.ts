"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateGuess, type TileState } from "@/lib/showdle/evaluateGuess";

const MAX_GUESSES = 6;

const WIN_TOASTS = [
  "Maestro!",
  "Brava!",
  "Encore!",
  "Standing ovation!",
  "Lucky!",
  "By the skin of your teeth!",
];

interface GameState {
  puzzleId: string;
  wordLength: number;
  guesses: string[];
  evaluations: TileState[][];
  currentGuess: string;
  status: "playing" | "won" | "lost";
  hintUsed: boolean;
  hintShowName: string | null;
}

function storageKey(puzzleId: string) {
  return `showdle-v1-${puzzleId}`;
}

function loadState(puzzleId: string): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(puzzleId));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveState(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(state.puzzleId), JSON.stringify(state));
  } catch {
    // Silently ignore storage errors
  }
}

function postCompletion(puzzleId: string, state: GameState) {
  try {
    fetch(`/api/showdle/puzzle/${puzzleId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guesses: state.guesses.filter((g) => g !== "HINT"),
        won: state.status === "won",
        guessCount: state.guesses.length,
        hintUsed: state.hintUsed,
      }),
    }).catch(() => {});
  } catch {
    // Fire-and-forget — swallow all errors
  }
}

export function useGameState(puzzleId: string, wordLength: number, answer: string | null) {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadState(puzzleId);
    if (saved && saved.puzzleId === puzzleId) return saved;
    return {
      puzzleId,
      wordLength,
      guesses: [],
      evaluations: [],
      currentGuess: "",
      status: "playing",
      hintUsed: false,
      hintShowName: null,
    };
  });

  const [toast, setToast] = useState<string | null>(null);
  const [latestGuessIndex, setLatestGuessIndex] = useState<number | null>(null);
  const completedRef = useRef(false);

  // Persist state on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Fire-and-forget completion POST
  useEffect(() => {
    if (state.status === "playing" || completedRef.current) return;
    completedRef.current = true;
    postCompletion(state.puzzleId, state);
  }, [state.status, state.puzzleId, state.guesses, state.hintUsed]);

  const addLetter = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.currentGuess.length >= prev.wordLength) return prev;
      return { ...prev, currentGuess: prev.currentGuess + letter.toUpperCase() };
    });
  }, []);

  const deleteLetter = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.currentGuess.length === 0) return prev;
      return { ...prev, currentGuess: prev.currentGuess.slice(0, -1) };
    });
  }, []);

  const submitGuess = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.currentGuess.length !== prev.wordLength) {
        setToast("Not enough letters");
        return prev;
      }

      if (!answer) return prev;

      const guess = prev.currentGuess.toUpperCase();
      const evaluation = evaluateGuess(guess, answer);
      const newGuesses = [...prev.guesses, guess];
      const newEvaluations = [...prev.evaluations, evaluation];

      const isWin = evaluation.every((t) => t === "correct");
      const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;

      let newStatus: GameState["status"] = prev.status;
      if (isWin) {
        newStatus = "won";
        setToast(WIN_TOASTS[newGuesses.length - 1] || "Well done!");
      } else if (isLoss) {
        newStatus = "lost";
      }

      setLatestGuessIndex(newGuesses.length - 1);

      return {
        ...prev,
        guesses: newGuesses,
        evaluations: newEvaluations,
        currentGuess: "",
        status: newStatus,
      };
    });
  }, [answer]);

  const activateHint = useCallback((showName: string) => {
    setState((prev) => {
      if (prev.hintUsed) return prev;
      if (prev.status !== "playing") return prev;
      // Disable hint if 5 or more real guesses already submitted
      if (prev.guesses.filter((g) => g !== "HINT").length >= 5) return prev;

      const hintEvaluation: TileState[] = new Array(prev.wordLength).fill("hint");
      const newGuesses = [...prev.guesses, "HINT"];
      const newEvaluations = [...prev.evaluations, hintEvaluation];

      // If hint pushes to 6 total guesses, game is lost
      const isLoss = newGuesses.length >= MAX_GUESSES;
      const newStatus: GameState["status"] = isLoss ? "lost" : "playing";

      const newState: GameState = {
        ...prev,
        guesses: newGuesses,
        evaluations: newEvaluations,
        hintUsed: true,
        hintShowName: showName,
        status: newStatus,
      };

      // If hint caused a loss, post completion
      if (isLoss) {
        postCompletion(prev.puzzleId, newState);
        completedRef.current = true;
      }

      return newState;
    });
  }, []);

  // Derive keyboard letter states from all evaluations (skip hint rows)
  const letterStates: Record<string, TileState> = {};
  for (let i = 0; i < state.guesses.length; i++) {
    if (state.guesses[i] === "HINT") continue;
    const guess = state.guesses[i];
    const evaluation = state.evaluations[i];
    for (let j = 0; j < guess.length; j++) {
      const letter = guess[j];
      const newState = evaluation[j];
      const existing = letterStates[letter];
      const priority: Record<string, number> = { correct: 3, present: 2, absent: 1 };
      if (!existing || (priority[newState] || 0) > (priority[existing] || 0)) {
        letterStates[letter] = newState;
      }
    }
  }

  return {
    ...state,
    toast,
    setToast,
    latestGuessIndex,
    letterStates,
    addLetter,
    deleteLetter,
    submitGuess,
    activateHint,
  };
}
