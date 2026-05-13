"use client";

interface NTSGridProps {
  title: string;             // e.g. "You're the One That I Want"
  guessedLetters: Record<string, 'correct' | 'absent' | 'unused'>;
  flashLetters?: Set<string>; // letters whose tiles are currently flashing
}

const PUNCT_CHARS = new Set(["'", "\u2019", ",", "!", "?", "-", "."]);
const MAX_PER_ROW = 10;

// A "cell" is either a letter slot, a punct character, or a word gap
type Cell =
  | { kind: "letter"; char: string }
  | { kind: "punct";  char: string }
  | { kind: "gap" };

function buildRows(title: string): Cell[][] {
  const words = title.split(" ");
  const rows: Cell[][] = [];
  let currentRow: Cell[] = [];
  let rowCount = 0;

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    // Build cells for this word
    const wordCells: Cell[] = word.split("").map((ch) =>
      PUNCT_CHARS.has(ch) ? { kind: "punct", char: ch } : { kind: "letter", char: ch.toUpperCase() }
    );
    const wordSize = wordCells.length;

    const spaceNeeded = rowCount === 0
      ? wordSize
      : 1 + wordSize;

    if (rowCount + spaceNeeded > MAX_PER_ROW && currentRow.length > 0) {
      // Wrap to new row
      rows.push(currentRow);
      currentRow = [];
      rowCount = 0;
    }

    // Add gap if not first on row
    if (currentRow.length > 0) {
      currentRow.push({ kind: "gap" });
      rowCount += 1;
    }

    currentRow.push(...wordCells);
    rowCount += wordSize;
  }

  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

export default function NTSGrid({ title, guessedLetters, flashLetters = new Set() }: NTSGridProps) {
  const rows = buildRows(title);

  return (
    <div className="nts-grid">
      {rows.map((row, ri) => (
        <div key={ri} className="nts-grid-row">
          {row.map((cell, ci) => {
            if (cell.kind === "gap") {
              return <div key={ci} className="nts-tile-gap" />;
            }
            if (cell.kind === "punct") {
              return (
                <div key={ci} className="nts-tile nts-tile--punct">
                  {cell.char}
                </div>
              );
            }
            // Letter cell
            const state = guessedLetters[cell.char];
            const isRevealed = state === "correct";
            const isFlashing = flashLetters.has(cell.char);

            let cls = "nts-tile";
            if (isFlashing)  cls += " nts-tile--flash";
            else if (isRevealed) cls += " nts-tile--revealed";
            else cls += " nts-tile--blank";

            return (
              <div key={ci} className={cls}>
                {isRevealed || isFlashing ? cell.char : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
