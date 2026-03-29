# PRD 1D: Game Logic & Wiring

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 1 — Playable Game End-to-End (1D of 4)

---

## Goal

Wire all game components into a live, playable round. This PRD creates `useNTSGameState` (all game state + timer + evaluation logic) and `NTSGame` (the client orchestrator that imports every component). It also replaces the placeholder `page.tsx` with the real Server Component that fetches the song and passes it as props. After this ships, a user can play a complete game end-to-end: guess letters, see tiles reveal, use the hint, attempt a solve, and see the completion modal with accurate stats.

## Prerequisites

- PRD 1B complete: API endpoints `/random` and `/reveal` work, CSS file exists
- PRD 1C complete: all 8 components exist and render correctly

## What This PRD Ships

- `app/games/name-that-song/hooks/useNTSGameState.ts` — game state + timer hook
- `app/games/name-that-song/NTSGame.tsx` — client orchestrator
- `app/games/name-that-song/page.tsx` — replaces placeholder; Server Component fetches song

## What This PRD Does NOT Ship

- localStorage persistence (PRD 2)
- Session/daily stats (PRD 2)
- Leaderboard (PRD 3)

## Visual Design Reference

See `NTS_Mockup.html` Sections 1–7 for the full game flow. The integration must produce the exact visual states shown — initial prompt, correct/absent feedback with auto-fade, tile flash, hint button transform, solve modal, and both completion modal states.

---

## Data Model

No new models. State lives entirely in React (`useState`).

---

## Implementation

### Step 1 — Game state hook

```typescript
// app/games/name-that-song/hooks/useNTSGameState.ts
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { LetterState, GameStatus, FeedbackType, CompletionStats } from "../types";

interface GameState {
  songId: string;
  songTitle: string;        // held in memory, never rendered until game over
  musicalName: string;
  guessedLetters: Record<string, LetterState>;
  flashLetters: Set<string>;
  hintUsed: boolean;
  timeRemaining: number;    // seconds, starts at 60
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

  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const setFeedback = useCallback((type: FeedbackType, message: string, autoClear = true) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setState((prev) => ({ ...prev, feedbackType: type, feedbackMessage: message }));
    if (autoClear) {
      feedbackTimeout.current = setTimeout(() => {
        setState((prev) => ({ ...prev, feedbackType: "empty", feedbackMessage: "" }));
      }, 1500);
    }
  }, []);

  const guessLetter = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.gameStatus !== "playing") return prev;
      if (prev.guessedLetters[letter]) return prev; // already guessed

      const isCorrect = uniqueLetters.has(letter);
      const newState: LetterState = isCorrect ? "correct" : "absent";

      if (isCorrect) {
        // Flash tiles for 300ms then remove flash
        const newFlash = new Set(prev.flashLetters).add(letter);
        setTimeout(() => {
          setState((s) => {
            const f = new Set(s.flashLetters);
            f.delete(letter);
            return { ...s, flashLetters: f };
          });
        }, 300);

        setFeedback("correct", `✓ ${letter} is in the song!`);
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
      setFeedback("error", "Not quite — keep guessing!");
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
```

### Step 2 — NTSGame orchestrator

```typescript
// app/games/name-that-song/NTSGame.tsx
"use client";
import { useNTSGameState } from "./hooks/useNTSGameState";
import NTSHeader from "./components/NTSHeader";
import NTSFeedback from "./components/NTSFeedback";
import NTSGrid from "./components/NTSGrid";
import NTSKeyboard from "./components/NTSKeyboard";
import NTSHintButton from "./components/NTSHintButton";
import NTSSolveModal from "./components/NTSSolveModal";
import NTSCompletionModal from "./components/NTSCompletionModal";

interface NTSGameProps {
  songId: string;
  songTitle: string;
  musicalName: string;
  onPlayAgain: () => void;
}

export default function NTSGame({
  songId,
  songTitle,
  musicalName,
  onPlayAgain,
}: NTSGameProps) {
  const game = useNTSGameState(songId, songTitle, musicalName);

  const isPlaying = game.gameStatus === "playing";

  // winsToday is 0 until PRD 2 adds session tracking
  const WINS_TODAY_PLACEHOLDER = 0;

  return (
    <>
      <NTSHeader timeRemaining={game.timeRemaining} />

      <div className="nts-game-body">
        <NTSFeedback type={game.feedbackType} message={game.feedbackMessage} />

        <NTSGrid
          title={songTitle}
          guessedLetters={game.guessedLetters}
          flashLetters={game.flashLetters}
        />

        <NTSKeyboard
          guessedLetters={game.guessedLetters}
          onKey={game.guessLetter}
          disabled={!isPlaying}
        />

        <div className="nts-action-bar">
          <NTSHintButton
            hintUsed={game.hintUsed}
            musicalName={musicalName}
            onHint={game.useHint}
          />
          <button className="nts-btn-solve" onClick={game.openSolveModal} disabled={!isPlaying}>
            {/* Lightbulb icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            Guess the song
          </button>
        </div>
      </div>

      {game.solveModalOpen && (
        <NTSSolveModal
          onSubmit={game.submitSolve}
          onCancel={game.closeSolveModal}
        />
      )}

      {game.gameStatus !== "playing" && (
        <NTSCompletionModal
          status={game.gameStatus}
          songTitle={songTitle}
          musicalName={musicalName}
          stats={game.getCompletionStats(WINS_TODAY_PLACEHOLDER)}
          onPlayAgain={onPlayAgain}
        />
      )}
    </>
  );
}
```

### Step 3 — Replace page.tsx

Follow the Showdle pattern exactly: `page.tsx` is an `async` Server Component that fetches the song directly and renders `NTSGame` (which is `"use client"`). No intermediate loader or wrapper files — that would deviate from the architecture in `game-development-context.md` section 3.3.

```typescript
// app/games/name-that-song/page.tsx  (Server Component — replaces placeholder)
import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq, sql } from "drizzle-orm";
import NTSGame from "./NTSGame";

export default async function NTSPage() {
  const results = await db
    .select({
      id: ntsSongs.id,
      title: ntsSongs.title,
      musicalName: ntsMusicals.name,
    })
    .from(ntsSongs)
    .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!results.length) {
    return (
      <div className="nts-game-body">
        No songs found. Please run the seed script.
      </div>
    );
  }

  const { id, title, musicalName } = results[0];

  // Pass song data as props — client-side evaluation only, no round-trips per guess.
  // Song title is visible in page source (accepted tradeoff per PRD Progression).
  return (
    <NTSGame
      songId={id}
      songTitle={title}
      musicalName={musicalName}
    />
  );
}
```

`NTSGame` handles Play Again by calling `router.refresh()` from `next/navigation`, which re-runs this Server Component and fetches a new random song:

```typescript
// app/games/name-that-song/NTSGame.tsx  (updated — add router.refresh for Play Again)
"use client";
import { useRouter } from "next/navigation";
// ... rest of imports unchanged

export default function NTSGame({ songId, songTitle, musicalName }: NTSGameProps) {
  const router = useRouter();
  const game = useNTSGameState(songId, songTitle, musicalName);
  const isPlaying = game.gameStatus === "playing";

  // PRD 2 will replace this with session.todayStats.wins
  const WINS_TODAY_PLACEHOLDER = 0;

  // ... rest of JSX unchanged, onPlayAgain={() => router.refresh()} passed to NTSCompletionModal
```

**Remove `NTSGameLoader.tsx` and `NTSGameClient.tsx` from scope** — they are not needed and would violate the Showdle architecture pattern.

---

## API Routes

None new. Consumes endpoints from PRD 1B.

---

## Testing Checklist

1. Navigate to `/games/name-that-song` — a song loads, grid shows correct structure, timer counts down
2. Click a correct letter — tile(s) reveal with flash animation, key turns gold, green feedback appears and fades after 1.5s
3. Click an absent letter — key turns grey, grey feedback appears and fades after 1.5s
4. Reveal all letters — completion modal appears automatically with won state
5. Let timer hit 0 — completion modal appears with lost state, "X of Y letters revealed" headline
6. Click "Hint: Reveal show" — button transforms to gold-bg, fades in "Show: [Musical]"
7. Click "Guess the song" — solve modal opens; type correct answer, press Enter — game won
8. Type wrong answer in solve modal — modal closes, red feedback, game continues
9. Completion modal shows correct `timeSpent`, `rightLetters`, `wrongLetters`, `pct`
10. Click "Play Again" — new song loads, all state resets (timer back to 60, grid blank, keyboard reset)
11. Song title with punctuation (apostrophe) renders apostrophe tile as parchment, not blank

---

## Acceptance Criteria

- [ ] Full game loop works end-to-end without errors
- [ ] Timer counts down from 60 and triggers loss at 0
- [ ] Correct letter: tile flash (300ms), key turns gold, green feedback (1.5s auto-fade)
- [ ] Absent letter: key turns grey (#787c7e), grey feedback (1.5s auto-fade)
- [ ] Win via tile reveal: completion modal shows won state
- [ ] Win via solve: correct title match (normalised) → won state
- [ ] Wrong solve: counter increments, error feedback, game continues
- [ ] Hint button: transforms correctly, musicalName shown
- [ ] Play Again: `router.refresh()` fetches a new random song, all state resets
- [ ] `winsToday` shows 0 (placeholder until PRD 2)

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/hooks/useNTSGameState.ts` | Create | Core game state hook |
| `app/games/name-that-song/NTSGame.tsx` | Create | Client orchestrator; imports `useRouter` for Play Again |
| `app/games/name-that-song/page.tsx` | Replace | Async Server Component — DB fetch + render NTSGame directly |

---

## Notes for Developer

1. **`router.refresh()` for Play Again** re-runs the async Server Component (`page.tsx`) and fetches a new random song from the DB via `RANDOM()`. It does not do a full page navigation. This matches the Showdle architecture: `page.tsx → NTSGame.tsx`, no intermediate loader files.
2. **`useEffect` for win detection** must list `guessedLetters` and `uniqueLetters` as dependencies. Do NOT check win condition inside `guessLetter` — it creates stale closure issues with React state. Use a separate `useEffect`.
3. **Flash letter cleanup timing**: the `setTimeout` in `guessLetter` that removes the letter from `flashLetters` must match the CSS animation duration exactly (300ms). If the animation is changed, update the timeout too.
4. **The timer `useEffect`** depends only on `gameStatus`. When `gameStatus` changes from "playing" to "won" or "lost", the effect cleanup runs and clears the interval automatically. Don't add `timeRemaining` to the dependency array — it would recreate the interval every second.
5. **Normalise function**: `'` (curly apostrophe) and `'` (straight apostrophe) both become empty string after `replace(/[^a-z0-9 ]/g, '')`. So "You're" and "Youre" both normalise to "youre". Test this with the actual song titles in the database.
6. **`WINS_TODAY_PLACEHOLDER = 0`** is intentional scaffolding. PRD 2B will replace this with `session.todayStats.wins`. Do not remove the constant — PRD 2B needs a clear hook point.
7. **No `NTSGameLoader.tsx` or `NTSGameClient.tsx`** — these extra files are not part of the Showdle pattern (see `game-development-context.md` section 3.3). Keep it to `page.tsx → NTSGame.tsx`.
