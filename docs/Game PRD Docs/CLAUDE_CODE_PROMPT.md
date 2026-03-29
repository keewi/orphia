# Claude Code — Name That Song (NTS) Game: PRD 1A

You are building a new game called **Name That Song** (NTS) for the Orphia app. This is a Wheel of Fortune-style musical theater song-guessing game.

---

## Context

You're working inside an existing Next.js 14.2 app that already has another game called Showdle at `/games/showdle`. Use Showdle as your reference pattern for everything — layout, DB schema structure, Drizzle usage, API route style, middleware, and font loading. Before implementing anything, explore the codebase to understand how Showdle is structured.

**Key files to read first:**
- `lib/db/showdle-schema.ts` — reference for Drizzle schema and table structure
- `lib/db/index.ts` — how schemas are registered with the Drizzle client
- `drizzle.config.ts` — schema array pattern
- `scripts/seed-showdle.ts` (if it exists) — reference for seed script pattern
- `middleware.ts` — how public game routes are registered
- `app/games/showdle/layout.tsx` — the isolated overlay layout pattern

---

## Your Task: PRD 1A — DB Schema & Seed

Implement exactly what is described in the attached `PRD_1A_DB_Schema.md`. Do not build anything beyond what that document specifies.

**Deliverables:**
1. `lib/db/nts-schema.ts` — Drizzle schema for `nts_musicals` and `nts_songs`
2. Update `drizzle.config.ts` to include the new schema file
3. Update `lib/db/index.ts` to register `ntsSchema`
4. Run `npx drizzle-kit push` to create the tables
5. `scripts/seed-nts.ts` — seed script with exactly 10 musicals and 20 songs
6. Run `npx tsx scripts/seed-nts.ts` and confirm it succeeds

**Done when:**
- `npx drizzle-kit push` completes without errors
- `SELECT COUNT(*) FROM nts_songs` returns 20
- Re-running the seed script produces no duplicate-key errors

---

## Important constraints

- Match the exact Drizzle schema shown in `PRD_1A_DB_Schema.md` — field names, types, indexes, and `onConflictDoUpdate` pattern must match exactly
- The seed script must use upsert (not plain insert) so it's safe to re-run
- Do not build any API routes, UI components, or game logic — that is PRD 1B, 1C, and 1D

Read `PRD_1A_DB_Schema.md` carefully before writing any code. The seed data (10 musicals, 20 songs) is specified in the PRD — use it exactly.
