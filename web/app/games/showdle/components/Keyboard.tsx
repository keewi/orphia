"use client";

import type { TileState } from "@/lib/showdle/evaluateGuess";

interface KeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  letterStates: Record<string, TileState>;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENT", "Z", "X", "C", "V", "B", "N", "M", "DEL"],
];

export default function Keyboard({ onKey, onEnter, onDelete, letterStates }: KeyboardProps) {
  const handleClick = (key: string) => {
    if (key === "ENT") onEnter();
    else if (key === "DEL") onDelete();
    else onKey(key);
  };

  return (
    <div className="sd-keyboard">
      {ROWS.map((row, i) => (
        <div className="sd-keyboard-row" key={i}>
          {row.map((key) => {
            const isWide = key === "ENT" || key === "DEL";
            const state = letterStates[key];
            const stateClass = state ? `sd-key--${state}` : "";
            const wideClass = isWide ? "sd-key--wide" : "";

            return (
              <button
                key={key}
                className={`sd-key ${stateClass} ${wideClass}`}
                onClick={() => handleClick(key)}
                type="button"
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
