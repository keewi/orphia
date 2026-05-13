"use client";
import { LetterState } from "../types";

const ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

interface NTSKeyboardProps {
  guessedLetters: Record<string, LetterState>;
  onKey: (letter: string) => void;
  disabled?: boolean;
}

export default function NTSKeyboard({ guessedLetters, onKey, disabled = false }: NTSKeyboardProps) {
  return (
    <div className="nts-keyboard">
      {ROWS.map((row, ri) => (
        <div key={ri} className="nts-key-row">
          {row.map((letter) => {
            const state = guessedLetters[letter] ?? "unused";
            let cls = "nts-key";
            if (state === "correct") cls += " nts-key--correct";
            else if (state === "absent") cls += " nts-key--absent";

            return (
              <button
                key={letter}
                className={cls}
                onClick={() => !disabled && state === "unused" && onKey(letter)}
                disabled={disabled || state !== "unused"}
                aria-label={`Guess letter ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
