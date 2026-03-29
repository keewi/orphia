# PRD 2B: Modal Integration

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 2 — Session Tracking & Daily Stats (2B of 2)

---

## Goal

Wire `useNTSSession` into the live game. After this PRD ships: (1) every completed round is automatically recorded to localStorage, (2) the completion modal shows the real wins-today count instead of the placeholder 0, and (3) the wins count updates immediately after the result is recorded.

## Prerequisites

- PRD 2A complete: `useNTSSession` hook exists and works correctly

## What This PRD Ships

- `NTSGameClient.tsx` updated — calls `useNTSSession`, passes `winsToday` to `NTSGame`
- `NTSGame.tsx` updated — receives `sessionProps`, calls `recordResult` at game end, passes real `winsToday` to completion modal

## What This PRD Does NOT Ship

- Server-side result storage (PRD 3)
- Leaderboard (PRD 3)

## Visual Design Reference

See `NTS_Mockup.html` Section 6 — wins chip shows the correct count (e.g. "2 wins today") rather than 0. No new visual states — this is pure wiring.

---

## Data Model

No new models. Reads/writes via `useNTSSession` (PRD 2A).

---

## Implementation

### Step 1 — Add useNTSSession to NTSGame directly

Following the Showdle pattern (`page.tsx → NTSGame.tsx`), `useNTSSession` is called inside `NTSGame` itself — not in a separate wrapper. Update `NTSGame.tsx`:

```typescript
// app/games/name-that-song/NTSGame.tsx  (updated)
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNTSGameState } from "./hooks/useNTSGameState";
import { useNTSSession } from "./hooks/useNTSSession";
// ... component imports unchanged

interface NTSGameProps {
  songId: string;
  songTitle: string;
  musicalName: string;
}

export default function NTSGame({ songId, songTitle, musicalName }: NTSGameProps) {
  const router = useRouter();
  const session = useNTSSession();
  const game = useNTSGameState(songId, songTitle, musicalName);
  const resultRecorded = useRef(false);

  // Record result exactly once when game ends
  useEffect(() => {
    if (game.gameStatus === "playing" || resultRecorded.current) return;
    resultRecorded.current = true;

    const stats = game.getCompletionStats(0);
    // PRD 3: also pass session.deviceId here for leaderboard submission
    session.recordResult({
      songId,
      outcome: game.gameStatus,
      hintUsed: game.hintUsed,
      timeSpent: stats.timeSpent,
      rightLetters: stats.rightLetters,
      wrongLetters: stats.wrongLetters,
    });
  }, [game.gameStatus]);

  const isPlaying = game.gameStatus === "playing";

  return (
    <>
      <NTSHeader timeRemaining={game.timeRemaining} />
      <div className="nts-game-body">
        {/* ... all game UI unchanged ... */}
      </div>
      {game.solveModalOpen && (
        <NTSSolveModal onSubmit={game.submitSolve} onCancel={game.closeSolveModal} />
      )}
      {game.gameStatus !== "playing" && (
        <NTSCompletionModal
          status={game.gameStatus}
          songTitle={songTitle}
          musicalName={musicalName}
          stats={game.getCompletionStats(session.todayStats.wins)}  // real wins count
          onPlayAgain={() => router.refresh()}
        />
      )}
    </>
  );
}
```

### Step 2 — No other changes needed

`page.tsx` does not change — it remains the async Server Component from PRD 1D that fetches the song and renders `NTSGame`. All session logic lives inside `NTSGame` itself via `useNTSSession`.

---

## API Routes

None.

---

## Testing Checklist

1. Complete a game (win) — completion modal shows "1 win today"
2. Click Play Again, win again — completion modal shows "2 wins today"
3. Click Play Again, lose — completion modal shows "2 wins today" (losses don't count for wins chip)
4. Refresh page mid-game — after refresh, complete a new game — "wins today" count still reflects previous session's wins
5. Complete same song twice in the same day — second completion modal shows same wins count as first (dedup guard working)
6. Win with hint used — `winsWithHint` increments in localStorage (verify via dev tools)
7. `resultRecorded.current` guard — completing the game twice without Play Again does not double-record (edge case: timer hits 0 while solve modal is open)

---

## Acceptance Criteria

- [ ] `NTSGameClient` calls `useNTSSession` and passes `session` to `NTSGame`
- [ ] `NTSGame` records result via `session.recordResult` exactly once per game
- [ ] `NTSCompletionModal` receives `session.todayStats.wins` as `winsToday`
- [ ] Wins chip displays the accurate count immediately after game ends
- [ ] Count persists correctly across page refresh
- [ ] Win with hint increments both `wins` and `winsWithHint` in localStorage

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/NTSGame.tsx` | Modify | Add `useNTSSession`, `useRouter`, result recording, real `winsToday` |

---

## Notes for Developer

1. **`resultRecorded.current` ref prevents double-recording.** React `useEffect` can fire twice in Strict Mode. The ref guard ensures `recordResult` is called exactly once regardless.
2. **`recordResult` updates `todayStats` state synchronously** within the hook. By the time the completion modal renders (triggered by the same `gameStatus` change), `session.todayStats.wins` already reflects the newly recorded win. No timing issue.
3. **Do NOT add `game.getCompletionStats` or `session` to the `useEffect` dependency array** for the result-recording effect. The only dependency should be `game.gameStatus`. Adding more dependencies risks re-firing the effect.
4. **PRD 3 will add `deviceId` to the result recording** for leaderboard submission. Leave a clear `// PRD 3: pass deviceId for leaderboard` comment next to the `recordResult` call.
