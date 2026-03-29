# PRD 1 Overview: Playable Game End-to-End

**Date:** March 29, 2026
**Total mini-PRDs:** 4
**Ship order:** 1A → 1B → 1C → 1D

---

## Summary

PRD 1 delivers a fully playable Name That Song game at `/games/name-that-song`. Starting from nothing, it sets up the Neon database schema (musicals + songs), seeds 10 musicals and 20 songs, scaffolds the isolated Next.js route with its own CSS design system, builds every game UI component, and wires up all game logic — timer, letter guessing, WoF grid, hint, solve modal, and completion modal.

After PRD 1 ships, a user can navigate to the route, play a complete round of Name That Song from start to finish, see the completion modal with their stats, and click Play Again for a new song. No persistence, no leaderboard — just a fully interactive game loop.

---

## Mini-PRD Index

| ID | Name | File | Key Deliverables | Done When |
|----|------|------|-----------------|-----------|
| 1A | DB Schema & Seed | `PRD_1A_DB_Schema.md` | `nts-schema.ts`, seed script, 10 musicals + 20 songs, Drizzle registration | `SELECT COUNT(*) FROM nts_songs` returns 20; `npx drizzle-kit push` succeeds |
| 1B | Route Shell & CSS | `PRD_1B_Route_Shell.md` | `layout.tsx`, `name-that-song.css`, random + reveal API endpoints, middleware update | `/games/name-that-song` renders cream overlay; API returns correct shapes |
| 1C | Game UI Components | `PRD_1C_Game_UI.md` | `NTSGrid`, `NTSTimer`, `NTSFeedback`, `NTSKeyboard`, `NTSHintButton`, `NTSSolveModal`, `NTSCompletionModal` | All components render in isolation with correct visual states per mockup |
| 1D | Game Logic & Wiring | `PRD_1D_Game_Logic.md` | `useNTSGameState` hook, `NTSGame` orchestrator, full end-to-end game loop | Full round playable: guess letters, use hint, attempt solve, timer expires, completion modal shows correct stats |

---

## Ship Order & Dependencies

```
1A: DB Schema & Seed
    ↓
1B: Route Shell & CSS        ← needs schema + tables to exist for API queries
    ↓
1C: Game UI Components       ← needs CSS file + route shell to exist
    ↓
1D: Game Logic & Wiring      ← needs all components + API endpoints
```

1A must ship first because 1B's API endpoints query the database. 1B must ship before 1C because the CSS file defines all design tokens the components consume. 1C must ship before 1D because the orchestrator imports all components. 1D is the integration layer that makes the game playable.

---

## New LLM Prompts

| Prompt ID | Description | Mini-PRD | Status |
|-----------|-------------|----------|--------|
| — | No LLM prompts in PRD 1 | — | — |

---

## New API Endpoints

| Method | Route | Mini-PRD | Purpose |
|--------|-------|----------|---------|
| GET | `/api/name-that-song/song/random` | 1B | Returns `{ id, musicalName }` — title withheld for client-side evaluation |
| GET | `/api/name-that-song/song/[id]/reveal` | 1B | Returns `{ id, title, musicalName }` — called by Server Component at render time |

---

## New Data Models

| Model | Mini-PRD | Key Fields |
|-------|----------|------------|
| `nts_musicals` | 1A | `id`, `name`, `displayOrder`, `createdAt` |
| `nts_songs` | 1A | `id`, `musicalId`, `title`, `displayOrder`, `createdAt` |

---

## New UI Components

| Component | Mini-PRD | Location | Notes |
|-----------|----------|----------|-------|
| `NTSGrid` | 1C | `app/games/name-that-song/components/NTSGrid.tsx` | WoF-style letter grid, max 10 per row |
| `NTSTimer` | 1C | `app/games/name-that-song/components/NTSTimer.tsx` | Countdown bar + number |
| `NTSFeedback` | 1C | `app/games/name-that-song/components/NTSFeedback.tsx` | Feedback area above grid |
| `NTSKeyboard` | 1C | `app/games/name-that-song/components/NTSKeyboard.tsx` | QWERTY keyboard, adapted from Showdle |
| `NTSHintButton` | 1C | `app/games/name-that-song/components/NTSHintButton.tsx` | One-use hint button |
| `NTSSolveModal` | 1C | `app/games/name-that-song/components/NTSSolveModal.tsx` | Full-title guess modal |
| `NTSCompletionModal` | 1C | `app/games/name-that-song/components/NTSCompletionModal.tsx` | End-of-game sheet modal |
| `NTSGame` | 1D | `app/games/name-that-song/NTSGame.tsx` | Client orchestrator, wires all components |
| `useNTSGameState` | 1D | `app/games/name-that-song/hooks/useNTSGameState.ts` | All game state + timer logic |

---

## Design Token Reference

All tokens are defined in `app/games/name-that-song/name-that-song.css` with `nts-` prefix:

| Token | Value | Usage |
|-------|-------|-------|
| `--nts-ink` | `#1a1108` | Text, header background |
| `--nts-cream` | `#faf5ee` | Page background |
| `--nts-surface` | `#ffffff` | Blank letter tiles |
| `--nts-gold` | `#c8922a` | Correct tiles, accent |
| `--nts-gold-bright` | `#f5c842` | Tile flash animation peak |
| `--nts-gold-bg` | `#fdf6e8` | Revealed tile background |
| `--nts-gold-muted` | `#a08060` | Hint button, muted text |
| `--nts-border` | `#d4c9b8` | Tile borders, input borders |
| `--nts-absent` | `#787c7e` | Absent key background (Showdle grey) |
| `--nts-absent-bg` | `#e8e0d4` | Absent feedback background |
| `--nts-correct` | `#2d6a2d` | Correct feedback text |
| `--nts-correct-bg` | `#eaf4ea` | Correct feedback background |
| `--nts-error` | `#b03a2e` | Error text |
| `--nts-error-bg` | `#fcecea` | Error feedback background |
| `--nts-key-unused` | `#ede8df` | Unused keyboard key |

---

## Mockup Reference

See `NTS_Mockup.html` for all visual states. Section references per mini-PRD:
- **1A/1B**: No UI — backend only
- **1C**: Sections 1–5 (all game states and modals)
- **1D**: Sections 1–5 (integration verification)
