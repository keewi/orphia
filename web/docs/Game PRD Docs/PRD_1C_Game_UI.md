# PRD 1C: Game UI Components

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 1 — Playable Game End-to-End (1C of 4)

---

## Goal

Build every visual component the NTS game needs, in isolation. Each component accepts props and renders the correct visual state — no game logic, no state management. After this PRD ships, all components are individually verifiable against the mockup before being wired together in PRD 1D.

## Prerequisites

- PRD 1B complete: `name-that-song.css` exists with all `nts-` tokens, route shell renders
- Showdle's `Keyboard` component exists as a reference for key layout and sizing

## What This PRD Ships

- `app/games/name-that-song/components/NTSHeader.tsx`
- `app/games/name-that-song/components/NTSTimer.tsx`
- `app/games/name-that-song/components/NTSFeedback.tsx`
- `app/games/name-that-song/components/NTSGrid.tsx`
- `app/games/name-that-song/components/NTSKeyboard.tsx`
- `app/games/name-that-song/components/NTSHintButton.tsx`
- `app/games/name-that-song/components/NTSSolveModal.tsx`
- `app/games/name-that-song/components/NTSCompletionModal.tsx`

## What This PRD Does NOT Ship

- `useNTSGameState` hook (PRD 1D)
- `NTSGame` orchestrator (PRD 1D)
- Any state management — all components are stateless/controlled
- Session tracking or leaderboard (PRDs 2 and 3)

## Visual Design Reference

All components must match `NTS_Mockup.html` exactly:
- **Section 1** — Initial game state (NTSGrid blank, NTSKeyboard all unused, NTSFeedback prompt)
- **Section 2** — Wrong guess (feedback grey, absent keys grey)
- **Section 3** — Correct guess with tile flash animation (feedback green, flash tiles)
- **Section 4** — Hint revealed (NTSHintButton revealed state)
- **Section 5** — NTSSolveModal open
- **Section 6** — NTSCompletionModal win state (stat chips, wins chip)
- **Section 6b** — Win + hint used (Used Hint chip in stat chips row)
- **Section 7** — NTSCompletionModal loss state (red accent band)

---

## Data Model

No new models. All components are purely presentational.

---

## Implementation

### TypeScript types (shared)

Create `app/games/name-that-song/types.ts`:

```typescript
export type LetterState = 'unused' | 'correct' | 'absent';
export type GameStatus = 'playing' | 'won' | 'lost';
export type FeedbackType = 'empty' | 'prompt' | 'correct' | 'absent' | 'error';

export interface GuessedLetters {
  [letter: string]: LetterState;
}

export interface CompletionStats {
  timeSpent: number;        // seconds (60 − timeRemaining)
  rightLetters: number;     // unique letters guessed correctly
  wrongLetters: number;     // unique letters guessed incorrectly
  totalUniqueLetters: number; // total unique letters in song title
  hintUsed: boolean;
  winsToday: number;
}
```

### Step 1 — NTSHeader

```typescript
// app/games/name-that-song/components/NTSHeader.tsx
"use client";

interface NTSHeaderProps {
  timeRemaining: number; // 0-60
  maxTime?: number;      // default 60
}

export default function NTSHeader({ timeRemaining, maxTime = 60 }: NTSHeaderProps) {
  const pct = (timeRemaining / maxTime) * 100;
  const isWarn = timeRemaining <= 10;

  return (
    <div className="nts-header">
      <span className="nts-logo">
        Name That <span className="nts-logo-accent">Song</span>
      </span>
      <div className="nts-timer">
        <div className="nts-timer-track">
          <div
            className={`nts-timer-bar${isWarn ? " nts-timer-bar--warn" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`nts-timer-num${isWarn ? " nts-timer-num--warn" : ""}`}>
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
```

### Step 2 — NTSFeedback

```typescript
// app/games/name-that-song/components/NTSFeedback.tsx
"use client";
import { FeedbackType } from "../types";

interface NTSFeedbackProps {
  type: FeedbackType;
  message?: string;
}

const DEFAULTS: Record<FeedbackType, string> = {
  empty:   "",
  prompt:  "Pick a letter to start guessing!",
  correct: "",
  absent:  "",
  error:   "",
};

export default function NTSFeedback({ type, message }: NTSFeedbackProps) {
  const text = message ?? DEFAULTS[type];
  return (
    <div className={`nts-feedback nts-feedback--${type}`}>
      {text}
    </div>
  );
}
```

### Step 3 — NTSGrid

Grid layout algorithm — pack words greedily into rows of max 10 (letters + punct tiles + word-space gaps). Punctuation characters are pre-filled as `.nts-tile--punct` tiles. Word boundaries on the same row are `.nts-tile-gap` spacers.

```typescript
// app/games/name-that-song/components/NTSGrid.tsx
"use client";

interface NTSGridProps {
  title: string;             // e.g. "You're the One That I Want"
  guessedLetters: Record<string, 'correct' | 'absent' | 'unused'>;
  flashLetters?: Set<string>; // letters whose tiles are currently flashing
}

const PUNCT_CHARS = new Set(["'", "'", ",", "!", "?", "-", "."]);
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
    const gapSize = wi > 0 ? 1 : 0; // gap before word (except first on a row)

    const spaceNeeded = rowCount === 0
      ? wordSize
      : gapSize + wordSize;

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
```

### Step 4 — NTSKeyboard

```typescript
// app/games/name-that-song/components/NTSKeyboard.tsx
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
```

### Step 5 — NTSHintButton

```typescript
// app/games/name-that-song/components/NTSHintButton.tsx
"use client";

interface NTSHintButtonProps {
  hintUsed: boolean;
  musicalName: string;   // shown after hint used
  onHint: () => void;
}

// Info circle SVG icon
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// Lightbulb SVG icon
const BulbIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/><path d="M10 22h4"/>
  </svg>
);

export default function NTSHintButton({ hintUsed, musicalName, onHint }: NTSHintButtonProps) {
  if (hintUsed) {
    return (
      <div className="nts-btn-hint nts-btn-hint--revealed">
        <InfoIcon />
        Show: {musicalName}
      </div>
    );
  }
  return (
    <button className="nts-btn-hint" onClick={onHint}>
      <InfoIcon />
      Hint: Reveal show
    </button>
  );
}
```

### Step 6 — NTSSolveModal

```typescript
// app/games/name-that-song/components/NTSSolveModal.tsx
"use client";
import { useState } from "react";

interface NTSSolveModalProps {
  onSubmit: (guess: string) => void;
  onCancel: () => void;
}

export default function NTSSolveModal({ onSubmit, onCancel }: NTSSolveModalProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div className="nts-modal-overlay" onClick={onCancel}>
      <div className="nts-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="nts-modal-title">Guess the song</div>
          <div className="nts-modal-subtitle">Enter the full song title to solve</div>
        </div>
        <input
          className="nts-modal-input"
          placeholder="Song title..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <div className="nts-modal-actions">
          <button className="nts-btn-primary" style={{ flex: 1.4 }} onClick={handleSubmit}>
            Submit guess
          </button>
          <button className="nts-btn-solve" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "#7a7060", textAlign: "center" }}>
          Punctuation and case are ignored
        </div>
      </div>
    </div>
  );
}
```

### Step 7 — NTSCompletionModal

```typescript
// app/games/name-that-song/components/NTSCompletionModal.tsx
"use client";
import { GameStatus, CompletionStats } from "../types";

interface NTSCompletionModalProps {
  status: "won" | "lost";
  songTitle: string;
  musicalName: string;
  stats: CompletionStats;
  onPlayAgain: () => void;
  // PRD 3 will add: leaderboard, username input
}

export default function NTSCompletionModal({
  status,
  songTitle,
  musicalName,
  stats,
  onPlayAgain,
}: NTSCompletionModalProps) {
  const isWon = status === "won";
  const pctRight = stats.totalUniqueLetters > 0
    ? Math.round((stats.rightLetters / stats.totalUniqueLetters) * 100)
    : 0;

  return (
    <div className="nts-sheet-overlay">
      <div className="nts-sheet">
        {/* Accent band */}
        <div className={isWon ? "nts-sheet-accent--win" : "nts-sheet-accent--loss"}>
          <div className="nts-verdict-row">
            <span className="nts-verdict-icon">{isWon ? "✓" : "✕"}</span>
            <span className="nts-verdict-text">{isWon ? "You got it!" : "Time's up"}</span>
          </div>
          <div className="nts-comp-song">{songTitle}</div>
          <div className="nts-comp-show">from {musicalName}</div>
        </div>

        {/* Body */}
        <div className="nts-sheet-body">
          {isWon ? (
            <div className="nts-solve-headline">
              Solved in <span className="nts-solve-headline-accent">{stats.timeSpent} seconds!</span>
            </div>
          ) : (
            <div className="nts-solve-headline nts-solve-headline--loss">
              {stats.rightLetters} of {stats.totalUniqueLetters} letters revealed
            </div>
          )}

          {/* Stat chips */}
          <div className="nts-stat-chips">
            <div className="nts-chip nts-chip--right">✓ {stats.rightLetters} right</div>
            <div className="nts-chip nts-chip--wrong">✗ {stats.wrongLetters} wrong</div>
            <div className="nts-chip nts-chip--pct">{pctRight}% correct</div>
            {stats.hintUsed && (
              <div className="nts-chip nts-chip--hint">Used Hint</div>
            )}
          </div>

          {/* Wins today chip */}
          <div className="nts-wins-chip">
            <span className="nts-wins-chip-icon">★</span>
            <span className="nts-wins-chip-num">{stats.winsToday}</span>
            <span className="nts-wins-chip-label">
              {stats.winsToday === 1 ? "win" : "wins"} today
            </span>
          </div>

          <button className="nts-btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## API Routes

None in this PRD. All components are stateless.

---

## Testing Checklist

1. `NTSHeader` with `timeRemaining=60` shows full gold bar and "60"
2. `NTSHeader` with `timeRemaining=8` shows red bar and red "8"
3. `NTSFeedback` with `type="prompt"` shows italic grey "Pick a letter to start guessing!"
4. `NTSFeedback` with `type="correct"` and `message="✓ T is in the song!"` shows green
5. `NTSFeedback` with `type="absent"` shows grey
6. `NTSGrid` with title "You're the One That I Want" renders 3 rows: YOU'RE·THE (10), ONE·THAT (8), I·WANT (6)
7. `NTSGrid` apostrophe renders as `.nts-tile--punct` (parchment bg, not blank white)
8. `NTSGrid` with T in guessedLetters as "correct" shows T tiles as `.nts-tile--revealed`
9. `NTSGrid` with T in flashLetters shows T tiles with flash animation class
10. `NTSKeyboard` renders 3 rows; clicking an unused key calls `onKey`
11. `NTSKeyboard` with Q as "absent" shows Q in grey; Q is not clickable
12. `NTSHintButton` default state shows "Hint: Reveal show" with info icon
13. `NTSHintButton` with `hintUsed=true` shows "Show: [musicalName]" with gold-bg styling
14. `NTSSolveModal` renders; typing and pressing Enter calls `onSubmit`
15. `NTSSolveModal` clicking overlay calls `onCancel`
16. `NTSCompletionModal` win state shows gold gradient band, solve time, all chips
17. `NTSCompletionModal` with `hintUsed=true` shows "Used Hint" chip in stat row
18. `NTSCompletionModal` loss state shows red gradient band, "X of Y letters revealed"
19. `NTSCompletionModal` clicking "Play Again" calls `onPlayAgain`

---

## Acceptance Criteria

- [ ] All 8 components exist and render without TypeScript errors
- [ ] Grid row layout algorithm: max 10 per row, greedy packing, punctuation as pre-filled parchment tile
- [ ] All component visual states match `NTS_Mockup.html` Sections 1–7
- [ ] Flash animation (`@keyframes nts-tile-reveal`) fires on tiles in `flashLetters` set
- [ ] Hint button fade-in (`@keyframes nts-hint-fade-in`, 100ms) fires on revealed state
- [ ] "Used Hint" chip appears only when `hintUsed === true`
- [ ] Wins chip always present, singular/plural handled correctly
- [ ] No hardcoded colors — all styles reference `nts-` CSS custom properties

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/types.ts` | Create | Shared TypeScript types |
| `app/games/name-that-song/components/NTSHeader.tsx` | Create | Header with timer |
| `app/games/name-that-song/components/NTSFeedback.tsx` | Create | Feedback area |
| `app/games/name-that-song/components/NTSGrid.tsx` | Create | WoF grid with layout algorithm |
| `app/games/name-that-song/components/NTSKeyboard.tsx` | Create | QWERTY keyboard |
| `app/games/name-that-song/components/NTSHintButton.tsx` | Create | One-use hint button |
| `app/games/name-that-song/components/NTSSolveModal.tsx` | Create | Full-title guess modal |
| `app/games/name-that-song/components/NTSCompletionModal.tsx` | Create | End-of-game sheet |

---

## Notes for Developer

1. **Check Showdle's Keyboard component first.** The `nts-key` sizing and QWERTY row structure should match Showdle's exactly — don't reinvent. The only difference is the color classes (`nts-key--correct` vs Showdle's equivalent).
2. **The grid algorithm is the trickiest part.** Test it against at least 3 song titles before integration: short titles like "My Shot" (1 row), medium like "You're the One That I Want" (3 rows), and long like "The Room Where It Happens" (check wrapping).
3. **`flashLetters` is a Set<string> not a boolean.** The parent will add the newly-guessed letter to this set immediately, then remove it after 300ms (the animation duration). The component just reads the set and applies the class.
4. **Punctuation detection.** The PUNCT_CHARS set in NTSGrid must include both straight apostrophe `'` and curly apostrophe `'` — song titles in the database may use either. Check actual song titles before finalising.
5. **`onConflictDoUpdate` in the tile flash**: the animation class is applied by the parent passing `flashLetters`. To ensure the CSS animation replays on the same letter (if a user somehow guesses the same letter twice — which shouldn't happen but guard anyway), the animation should be tied to a `key` that changes each time.
