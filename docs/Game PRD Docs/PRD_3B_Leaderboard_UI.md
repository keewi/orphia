# PRD 3B: Leaderboard UI

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 3 — Global Leaderboard (3B of 2)

---

## Goal

Add username entry, score submission, and a live global leaderboard to the completion modal. After this PRD ships, a user who finishes a game can type a username, submit their score, and see the top-10 leaderboard with their own row highlighted. Username persists in localStorage across sessions.

## Prerequisites

- PRD 3A complete: submit and leaderboard endpoints exist and work
- PRD 2A complete: `deviceId` and `lastUsername` available from `useNTSSession`
- PRD 2B complete: `NTSGame` already calls `useNTSSession` internally

## What This PRD Ships

- `NTSCompletionModal.tsx` updated — adds username input, submit button, leaderboard table
- `NTSGame.tsx` updated — passes `deviceId`, `songId`, `lastUsername`, `onSaveUsername` to modal (all sourced from `useNTSSession`, no new props on `NTSGame`)
- `useNTSSession.ts` updated — persists `lastUsername` to localStorage

## What This PRD Does NOT Ship

- Anti-cheat or rate limiting
- All-time vs weekly leaderboard toggle (deferred)
- User authentication (deferred)

## Visual Design Reference

See `NTS_Mockup.html` Section 8:
- Play Again button sits above the divider (before the leaderboard)
- Username input row + Submit Score button below the divider
- Leaderboard table: Rank | Username | Wins columns
- Current user's row highlighted with `var(--nts-gold-bg)` background
- Table uses `nts-` token font sizes, no values below 10px

---

## Data Model

Additional localStorage key (added to `useNTSSession`):

```
key:   'nts-v1-username'
value: string  // last-used username, max 20 chars
```

---

## Implementation

### Step 1 — Update useNTSSession to persist username

```typescript
// app/games/name-that-song/hooks/useNTSSession.ts  (updated)
// Add to existing hook — new exports and state only, do not remove existing code

export interface NTSSessionReturn {
  deviceId: string;
  todayStats: DailyStats;
  recordResult: (result: GameResult) => void;
  lastUsername: string;                    // ADD
  saveUsername: (name: string) => void;   // ADD
}

// Add inside useNTSSession():

const [lastUsername, setLastUsername] = useState<string>(() => {
  try { return localStorage.getItem("nts-v1-username") ?? ""; }
  catch { return ""; }
});

const saveUsername = useCallback((name: string) => {
  const trimmed = name.trim().slice(0, 20);
  setLastUsername(trimmed);
  try { localStorage.setItem("nts-v1-username", trimmed); }
  catch {}
}, []);

// Return: add lastUsername and saveUsername to the returned object
```

### Step 2 — Update NTSGame to pass session fields to NTSCompletionModal

`NTSGame` already calls `useNTSSession()` (added in PRD 2B). `deviceId`, `lastUsername`, and `saveUsername` are all already available from that hook — no new props needed on `NTSGame` itself. Just update the `NTSCompletionModal` render call:

```typescript
// app/games/name-that-song/NTSGame.tsx  (updated — NTSCompletionModal render only)
// session is already declared via useNTSSession() from PRD 2B

{game.gameStatus !== "playing" && (
  <NTSCompletionModal
    status={game.gameStatus}
    songTitle={songTitle}
    musicalName={musicalName}
    stats={game.getCompletionStats(session.todayStats.wins)}
    onPlayAgain={() => router.refresh()}
    deviceId={session.deviceId}           // ADD — from session, no new prop
    songId={songId}                       // ADD — already in scope as prop
    lastUsername={session.lastUsername}   // ADD — from session
    onSaveUsername={session.saveUsername} // ADD — from session
  />
)}
```

No changes to `NTSGame`'s props interface — all new values come from `useNTSSession` which is already called inside the component.

### Step 3 — No changes to page.tsx or any other files

`page.tsx` remains unchanged. `deviceId` never needs to flow from the Server Component — it is generated client-side in `useNTSSession` and read directly in `NTSGame`. There is no `NTSGameClient.tsx` wrapper file (removed in PRD 1D revision).

### Step 4 — Update NTSCompletionModal with leaderboard

```typescript
// app/games/name-that-song/components/NTSCompletionModal.tsx  (updated)
"use client";
import { useState, useEffect } from "react";
import { GameStatus, CompletionStats } from "../types";
import type { LeaderboardEntry } from "@/app/api/name-that-song/leaderboard/route";

interface NTSCompletionModalProps {
  status: "won" | "lost";
  songTitle: string;
  musicalName: string;
  stats: CompletionStats;
  onPlayAgain: () => void;
  // PRD 3 additions:
  deviceId: string;
  songId: string;
  lastUsername: string;
  onSaveUsername: (name: string) => void;
}

export default function NTSCompletionModal({
  status, songTitle, musicalName, stats, onPlayAgain,
  deviceId, songId, lastUsername, onSaveUsername,
}: NTSCompletionModalProps) {
  const isWon = status === "won";
  const pctRight = stats.totalUniqueLetters > 0
    ? Math.round((stats.rightLetters / stats.totalUniqueLetters) * 100)
    : 0;

  const [username, setUsername] = useState(lastUsername);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/name-that-song/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLbLoading(false);
      })
      .catch(() => setLbLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    onSaveUsername(username.trim());

    try {
      await fetch("/api/name-that-song/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          username: username.trim(),
          songId,
          outcome: status,
          hintUsed: stats.hintUsed,
          timeSpent: stats.timeSpent,
          rightLetters: stats.rightLetters,
          wrongLetters: stats.wrongLetters,
        }),
      });

      // Refresh leaderboard after submit
      const res = await fetch("/api/name-that-song/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard ?? []);
      setSubmitted(true);
    } catch {
      // Fire-and-forget: fail silently
    } finally {
      setSubmitting(false);
    }
  };

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

          <div className="nts-stat-chips">
            <div className="nts-chip nts-chip--right">✓ {stats.rightLetters} right</div>
            <div className="nts-chip nts-chip--wrong">✗ {stats.wrongLetters} wrong</div>
            <div className="nts-chip nts-chip--pct">{pctRight}% correct</div>
            {stats.hintUsed && (
              <div className="nts-chip nts-chip--hint">Used Hint</div>
            )}
          </div>

          <div className="nts-wins-chip">
            <span className="nts-wins-chip-icon">★</span>
            <span className="nts-wins-chip-num">{stats.winsToday}</span>
            <span className="nts-wins-chip-label">
              {stats.winsToday === 1 ? "win" : "wins"} today
            </span>
          </div>

          {/* Play Again sits ABOVE leaderboard */}
          <button className="nts-btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>

          <div className="nts-sheet-divider" />

          {/* Leaderboard section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{
              fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em",
              color: "var(--nts-gold-muted)", textTransform: "uppercase"
            }}>
              Leaderboard — wins without hint
            </div>

            {/* Username input + submit */}
            {!submitted ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  style={{
                    flex: 1, border: "1.5px solid var(--nts-border)",
                    borderRadius: "var(--nts-radius-md)", padding: "8px 10px",
                    fontFamily: "var(--nts-font-ui, 'DM Sans', system-ui, sans-serif)",
                    fontSize: "13px", background: "var(--nts-surface)", color: "var(--nts-ink)",
                  }}
                  placeholder="Enter a username"
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  style={{
                    background: username.trim() ? "var(--nts-gold)" : "var(--nts-absent-bg)",
                    color: username.trim() ? "#fff" : "var(--nts-absent-text)",
                    border: "none", borderRadius: "var(--nts-radius-md)",
                    padding: "8px 14px",
                    fontFamily: "var(--nts-font-ui, 'DM Sans', system-ui, sans-serif)",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                  onClick={handleSubmit}
                  disabled={!username.trim() || submitting}
                >
                  {submitting ? "..." : "Submit score"}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "var(--nts-gold-muted)", fontStyle: "italic" }}>
                Score submitted as {username}
              </div>
            )}

            {/* Leaderboard table */}
            {lbLoading ? (
              <div style={{ fontSize: "12px", color: "var(--nts-absent-text)" }}>Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--nts-absent-text)" }}>
                No scores yet — be the first!
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Username", "Wins"].map((h, i) => (
                      <th key={h} style={{
                        fontSize: "10px", fontWeight: 500, color: "var(--nts-absent-text)",
                        textAlign: i === 2 ? "right" : "left",
                        padding: "4px 6px", borderBottom: "1px solid var(--nts-border-light)",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isMe = entry.username.toLowerCase() === username.toLowerCase() && submitted;
                    return (
                      <tr key={entry.rank} style={isMe ? { background: "var(--nts-gold-bg)" } : {}}>
                        <td style={{ fontSize: "11px", color: "var(--nts-absent-text)", padding: "6px 6px" }}>
                          {entry.rank}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--nts-ink)", padding: "6px 6px",
                          fontWeight: isMe ? 500 : 400 }}>
                          {entry.username}
                        </td>
                        <td style={{ fontSize: "12px", fontWeight: 500, color: "var(--nts-ink)",
                          textAlign: "right", padding: "6px 6px" }}>
                          {entry.winsNoHint}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## API Routes

Consumes endpoints from PRD 3A. No new routes.

---

## Testing Checklist

1. Completion modal renders leaderboard section with loading state, then data
2. Username input pre-fills from localStorage if previously set
3. Submit button disabled when username field empty
4. Submitting a score calls POST with correct `deviceId`, `username`, `songId`, `outcome`, stats
5. After submit: leaderboard refreshes, "Score submitted as [username]" replaces input
6. Current user's row highlighted in gold-bg when username matches submitted name
7. Play Again button is above the divider, not below the leaderboard
8. Leaderboard empty state shows "No scores yet — be the first!"
9. Submit with username > 20 chars → input maxLength prevents it
10. Network failure on submit → modal stays open, no crash (fire-and-forget)

---

## Acceptance Criteria

- [ ] Username input pre-fills from `lastUsername` (localStorage)
- [ ] Submit button disabled until username is non-empty
- [ ] POST fires with all required fields including `deviceId` from session
- [ ] Username saved to localStorage via `onSaveUsername` on submit
- [ ] Leaderboard fetches on modal open and re-fetches after submit
- [ ] Current user's row highlighted after submit
- [ ] Play Again is positioned above the leaderboard divider
- [ ] No font sizes below 10px in leaderboard section

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/hooks/useNTSSession.ts` | Modify | Add `lastUsername` + `saveUsername` to hook and return type |
| `app/games/name-that-song/NTSGame.tsx` | Modify | Pass `session.deviceId`, `songId`, `session.lastUsername`, `session.saveUsername` to modal |
| `app/games/name-that-song/components/NTSCompletionModal.tsx` | Modify | Add `deviceId`, `songId`, `lastUsername`, `onSaveUsername` props; add leaderboard section |

---

## Notes for Developer

1. **`LeaderboardEntry` type** is exported from the route file (`/app/api/name-that-song/leaderboard/route.ts`). Import it directly rather than duplicating the type definition.
2. **Username matching for highlight** uses case-insensitive comparison (`toLowerCase()`). The leaderboard may return "Alice" while the user typed "alice" — both should highlight.
3. **The submit is fire-and-forget on failure** — if the POST fails, the game experience is not blocked. Log the error to console but swallow it silently for the user.
4. **The `submitted` flag** prevents multiple submissions in one modal session. If the user wants to submit under a different username, they need to Play Again and finish another game.
5. **`deviceId` does not flow as a prop.** It is generated client-side inside `useNTSSession` and read directly from `session.deviceId` within `NTSGame`. There is no `NTSGameClient` wrapper — that pattern was not used in this codebase. Do not introduce a new prop on `NTSGame` for `deviceId`.
