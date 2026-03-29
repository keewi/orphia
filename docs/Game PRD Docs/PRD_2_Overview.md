# PRD 2 Overview: Session Tracking & Daily Stats

**Date:** March 29, 2026
**Total mini-PRDs:** 2
**Ship order:** 2A → 2B

---

## Summary

PRD 2 adds persistence to the game. After each round, results are saved to localStorage keyed by a stable device ID and UTC date. The completion modal gains an accurate wins-today count. Daily stats (wins, wins with hint, losses) reset at UTC midnight and can never double-count the same song in the same day.

After PRD 2 ships, a user who plays 3 games and refreshes the page still sees their accurate "2 wins today" count in the completion modal.

---

## Mini-PRD Index

| ID | Name | File | Key Deliverables | Done When |
|----|------|------|-----------------|-----------|
| 2A | Session Hook | `PRD_2A_Session_Hook.md` | `useNTSSession` hook, device ID, localStorage schema, `recordResult()` | Hook reads/writes localStorage correctly; daily stats persist across page refresh |
| 2B | Modal Integration | `PRD_2B_Modal_Integration.md` | Wire `useNTSSession` into `NTSGame`, pass real `winsToday` to completion modal | Wins chip shows accurate count; resets at midnight; hint wins tracked separately |

---

## Ship Order & Dependencies

```
2A: Session Hook
    ↓
2B: Modal Integration   ← reads deviceId + todayStats from 2A's hook
```

2A must ship first because 2B imports and calls `useNTSSession`. 2B is an integration-only PRD — it adds no new files, only modifies `NTSGame.tsx` and `NTSCompletionModal.tsx`.

---

## New LLM Prompts

None.

---

## New API Endpoints

None. localStorage only.

---

## New Data Models

localStorage schema (not a DB model):

| Key pattern | Value shape | Notes |
|-------------|-------------|-------|
| `nts-device-id` | `string` (UUID v4) | Permanent, generated once |
| `nts-v1-stats-YYYY-MM-DD` | `{ wins, winsWithHint, losses }` | UTC date key, resets daily |
| `nts-v1-result-{songId}-YYYY-MM-DD` | `{ outcome, hintUsed, timeSpent, rightLetters, wrongLetters }` | Dedup guard per song per day |

---

## New UI Components

None new. `NTSCompletionModal` updated to receive real `winsToday` from `useNTSSession`.

---

## Design Token Reference

No new tokens. Uses existing `nts-wins-chip` and `nts-chip` styles from PRD 1B CSS.

---

## Mockup Reference

See `NTS_Mockup.html` Section 6 (wins chip showing correct count) and Section 6b (Used Hint chip). No new visual states introduced by PRD 2 — the wins chip was already specced in the mockup with placeholder data.
