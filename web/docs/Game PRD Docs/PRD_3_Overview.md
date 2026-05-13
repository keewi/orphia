# PRD 3 Overview: Global Leaderboard

**Date:** March 29, 2026
**Total mini-PRDs:** 2
**Ship order:** 3A → 3B

---

## Summary

PRD 3 adds a global leaderboard to the completion modal. Results are submitted to a Neon database table keyed by device ID. A username input allows players to claim a name. The leaderboard ranks the top 10 players globally by wins without a hint, refreshing on every modal open.

After PRD 3 ships, a user who completes a game can enter a username, submit their score, and see themselves on a live global leaderboard. Their username persists across sessions.

---

## Mini-PRD Index

| ID | Name | File | Key Deliverables | Done When |
|----|------|------|-----------------|-----------|
| 3A | Results API & Schema | `PRD_3A_Results_API.md` | `nts_results` table, submit endpoint, leaderboard endpoint | POST stores result; GET returns top-10 ranked by wins-no-hint |
| 3B | Leaderboard UI | `PRD_3B_Leaderboard_UI.md` | Username input, submit button, leaderboard table in completion modal | User can submit score; leaderboard renders with current user highlighted |

---

## Ship Order & Dependencies

```
3A: Results API & Schema
    ↓
3B: Leaderboard UI    ← calls submit + leaderboard endpoints from 3A
```

3A must ship first because 3B's UI calls both API endpoints. 3A has no UI.

---

## New LLM Prompts

None.

---

## New API Endpoints

| Method | Route | Mini-PRD | Purpose |
|--------|-------|----------|---------|
| POST | `/api/name-that-song/results/submit` | 3A | Record a completed game result |
| GET | `/api/name-that-song/leaderboard` | 3A | Return top-10 by wins without hint |

---

## New Data Models

| Model | Mini-PRD | Key Fields |
|-------|----------|------------|
| `nts_results` | 3A | `id`, `deviceId`, `username`, `songId`, `outcome`, `hintUsed`, `timeSpent`, `rightLetters`, `wrongLetters`, `playedDate`, `completedAt` |

---

## New UI Components

| Component | Mini-PRD | Location | Notes |
|-----------|----------|----------|-------|
| Leaderboard section | 3B | `NTSCompletionModal.tsx` (updated) | Username input + submit + table; not a separate component file |

---

## Design Token Reference

No new tokens. Uses existing `nts-` tokens. Leaderboard table uses `nts-tile--revealed` gold-bg highlight for the current user's row.

---

## Mockup Reference

See `NTS_Mockup.html` Section 8 — leaderboard section including username input, submit button, top-10 table with current user highlighted, and Play Again positioned above the leaderboard divider.
