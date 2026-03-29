# PRD 2A: Session Hook

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 2 — Session Tracking & Daily Stats (2A of 2)

---

## Goal

Create `useNTSSession` — a React hook that manages a permanent device ID and per-day win/loss stats, all stored in localStorage. After this PRD ships, the hook can be called anywhere in the game to read today's stats and record a new result. It deduplicates results so replaying the same song twice in the same day never double-counts.

## Prerequisites

- PRD 1D complete: the game is fully playable
- Browser environment (localStorage available)

## What This PRD Ships

- `app/games/name-that-song/hooks/useNTSSession.ts`

## What This PRD Does NOT Ship

- Wiring into NTSGame or NTSCompletionModal (PRD 2B)
- Server-side result storage (PRD 3)
- Leaderboard (PRD 3)

## Visual Design Reference

No UI in this PRD. Backend/hook only.

---

## Data Model

```typescript
// localStorage keys and value shapes

// Permanent device identity
key:   'nts-device-id'
value: string  // UUID v4, generated on first visit, never changes

// Daily stats — key includes UTC date, resets automatically at midnight
key:   `nts-v1-stats-${YYYY-MM-DD}`      // e.g. 'nts-v1-stats-2026-03-29'
value: {
  wins: number,
  winsWithHint: number,
  losses: number,
}

// Per-game result — deduplication guard
key:   `nts-v1-result-${songId}-${YYYY-MM-DD}`
value: {
  outcome: 'won' | 'lost',
  hintUsed: boolean,
  timeSpent: number,
  rightLetters: number,
  wrongLetters: number,
}
```

---

## Implementation

```typescript
// app/games/name-that-song/hooks/useNTSSession.ts
"use client";
import { useState, useCallback } from "react";

export interface DailyStats {
  wins: number;
  winsWithHint: number;
  losses: number;
}

export interface GameResult {
  songId: string;
  outcome: "won" | "lost";
  hintUsed: boolean;
  timeSpent: number;
  rightLetters: number;
  wrongLetters: number;
}

export interface NTSSessionReturn {
  deviceId: string;
  todayStats: DailyStats;
  recordResult: (result: GameResult) => void;
}

// UTC date string: 'YYYY-MM-DD'
function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem("nts-device-id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("nts-device-id", id);
    return id;
  } catch {
    // localStorage unavailable (SSR, private browsing)
    return "anonymous";
  }
}

function loadTodayStats(): DailyStats {
  try {
    const raw = localStorage.getItem(`nts-v1-stats-${utcDateKey()}`);
    if (raw) return JSON.parse(raw) as DailyStats;
  } catch {}
  return { wins: 0, winsWithHint: 0, losses: 0 };
}

function saveTodayStats(stats: DailyStats): void {
  try {
    localStorage.setItem(`nts-v1-stats-${utcDateKey()}`, JSON.stringify(stats));
  } catch {}
}

function hasResultForToday(songId: string): boolean {
  try {
    return localStorage.getItem(`nts-v1-result-${songId}-${utcDateKey()}`) !== null;
  } catch {
    return false;
  }
}

function saveResult(result: GameResult): void {
  try {
    const { songId, ...rest } = result;
    localStorage.setItem(
      `nts-v1-result-${songId}-${utcDateKey()}`,
      JSON.stringify(rest)
    );
  } catch {}
}

export function useNTSSession(): NTSSessionReturn {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [todayStats, setTodayStats] = useState<DailyStats>(() => loadTodayStats());

  const recordResult = useCallback((result: GameResult) => {
    // Dedup: if this song was already recorded today, do nothing
    if (hasResultForToday(result.songId)) return;

    saveResult(result);

    const current = loadTodayStats();
    const updated: DailyStats = {
      wins: current.wins + (result.outcome === "won" ? 1 : 0),
      winsWithHint: current.winsWithHint + (result.outcome === "won" && result.hintUsed ? 1 : 0),
      losses: current.losses + (result.outcome === "lost" ? 1 : 0),
    };
    saveTodayStats(updated);
    setTodayStats(updated);
  }, []);

  return { deviceId, todayStats, recordResult };
}
```

---

## API Routes

None.

---

## Testing Checklist

1. First page load — `deviceId` is a valid UUID, stored in localStorage under `nts-device-id`
2. Page refresh — same `deviceId` returned
3. `recordResult({ songId: 'abc', outcome: 'won', hintUsed: false, ... })` → `todayStats.wins` increments to 1
4. Calling `recordResult` again with the same `songId` and today's date → stats do NOT increment (dedup)
5. Calling `recordResult` with a different `songId` → stats increment correctly
6. `outcome: 'won', hintUsed: true` → both `wins` and `winsWithHint` increment
7. `outcome: 'lost'` → `losses` increments, `wins` unchanged
8. Simulate midnight: manually change the date key — next `recordResult` call starts fresh stats
9. localStorage unavailable (private mode simulation) → hook returns `deviceId: 'anonymous'`, no crash

---

## Acceptance Criteria

- [ ] `useNTSSession` exported from `hooks/useNTSSession.ts`
- [ ] `deviceId` is stable across page refreshes
- [ ] `todayStats` loads from localStorage on mount
- [ ] `recordResult` writes the per-game result key and updates daily stats
- [ ] Double-recording the same `songId` on the same UTC day does nothing
- [ ] All localStorage operations wrapped in try/catch — no crashes in private browsing
- [ ] UTC date key correctly changes at midnight UTC (not local midnight)

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/hooks/useNTSSession.ts` | Create | Session hook |

---

## Notes for Developer

1. **UTC date key is critical.** Use `new Date().toISOString().slice(0, 10)` — this always returns UTC date. Do NOT use `new Date().toLocaleDateString()` — it uses local timezone and would cause different users to reset at different times.
2. **`crypto.randomUUID()` in the browser** is available in all modern browsers. However, if this code ever runs server-side (SSR), it will crash. The try/catch handles this by returning `'anonymous'`.
3. **`useState` lazy initializer** for `deviceId` and `todayStats` ensures localStorage is only read once on mount, not on every render.
4. **The dedup key includes both `songId` AND date** — so the same song can be played again the next day without being blocked.
5. **`winsWithHint` tracks wins-with-hint specifically**, not total hints used. A loss with a hint used does NOT increment `winsWithHint`.
