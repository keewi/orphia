"use client";

import { useEffect, useState } from "react";
import type { TileState } from "@/lib/showdle/evaluateGuess";

interface TileProps {
  letter: string;
  state?: TileState;
  flipDelay?: number; // ms delay for staggered flip
  shouldFlip?: boolean;
}

export default function Tile({ letter, state, flipDelay = 0, shouldFlip = false }: TileProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [revealedState, setRevealedState] = useState<TileState | undefined>(undefined);

  useEffect(() => {
    if (!shouldFlip || !state) {
      // No flip needed — show state directly (restored from localStorage)
      setRevealedState(state);
      return;
    }

    // Start flip after stagger delay
    const flipTimer = setTimeout(() => {
      setIsFlipping(true);
    }, flipDelay);

    // Reveal color at midpoint (50% of 400ms = 200ms after flip starts)
    const revealTimer = setTimeout(() => {
      setRevealedState(state);
    }, flipDelay + 200);

    // End flip
    const endTimer = setTimeout(() => {
      setIsFlipping(false);
    }, flipDelay + 400);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(revealTimer);
      clearTimeout(endTimer);
    };
  }, [state, flipDelay, shouldFlip]);

  const stateClass = revealedState ? `sd-tile--${revealedState}` : letter ? "sd-tile--filled" : "";
  const flipClass = isFlipping ? "sd-tile--flip" : "";

  return (
    <div className={`sd-tile ${stateClass} ${flipClass}`}>
      {letter}
    </div>
  );
}
