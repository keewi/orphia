# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key commands

All commands run from the `musical-search/` directory.

```bash
npm run dev      # Next.js dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npm run test     # Vitest unit tests
```

## Project conventions

1. Use Next.js App Router conventions (Server Components by default, `"use client"` only when needed).
2. CSS custom properties in `app/globals.css` for styling; prefer existing classes before adding new ones.
3. Keep diffs minimal — no refactors unless asked.
4. Always list files changed at the end of your response.
5. Prefer Plan Mode first for non-trivial work.

## Architecture

**Orphia** — Next.js 14 App Router app for tracking musicals and playing musical-theatre games (Showdle, Name That Song). Users collect playbills, rate shows, follow other fans, and play daily games.

**Stack:** Next.js 14.2, React 18, TypeScript 5, **Neon (serverless Postgres) + Drizzle ORM**, **NextAuth (credentials provider, JWT sessions)**, Vitest.

> **Migration note:** This app was originally built on Supabase (Postgres + Auth). It has since migrated to Neon + Drizzle for the database and NextAuth for auth. The legacy `lib/supabase/` directory, `app/auth/*` magic-link routes, Supabase poster-sourcing scripts, and `@supabase/*` npm packages have all been removed. The old Supabase project DNS does not resolve; do not try to query it.

**Database client:**
- `lib/db/index.ts` — single Drizzle client over `@neondatabase/serverless`, wired to `DATABASE_URL`.
- Schemas: `lib/db/schema.ts` (core Orphia: `users`, `profiles`, `musicals`, `user_reviews`, `user_musical_status`, `follows`), `lib/db/showdle-schema.ts` (`puzzles`, `puzzle_results`), `lib/db/nts-schema.ts` (`nts_musicals`, `nts_songs`, `nts_results`).

**Auth** (`auth.ts`): NextAuth with a Credentials provider — bcrypt password check against the `users` table, JWT session strategy. The exported `auth` helper is used in middleware and server components. There is no Supabase session refresh anymore.

**Middleware** (`middleware.ts`): wraps `auth()` from NextAuth. Public routes: `/login`, `/u/*`, `/games/*`, `/api/showdle/*`, `/api/name-that-song/*`, `/auth/*`, `/api/auth/*`. Unauthenticated users on protected routes are redirected to `/games` (not `/login`). `/` and `/login` also redirect to `/games`. For authenticated users without a handle, queries Neon directly (raw SQL) and redirects to `/choose-handle`; caches an `x-has-handle` cookie for 5 minutes to avoid re-querying.

**Server Actions** (`app/actions.ts`): `addReview`, `editReview` — verify auth via NextAuth, mutate via the write service, redirect.

## Database

All data lives in a single Neon Postgres database. No Row Level Security — access control is enforced in application code (services + middleware + NextAuth). Schemas are defined in Drizzle under `lib/db/*-schema.ts`.

**Core Orphia tables:**
- **users** — credential auth: email, bcrypt password hash. Owned by NextAuth.
- **profiles** — user handles (unique, 3–20 chars, `[a-z0-9_]`).
- **musicals** — show catalog with optional `popularity_rank`. *Currently empty* — the curated ranking lives in `lib/showdle/puzzleGeneration.ts` (`TOP_MUSICALS`).
- **user_reviews** — user playbills (integer `rating_int` 1–5, optional `watch_date`). Multiple reviews per musical allowed.
- **user_musical_status** — per-user status per musical (`want_to_see` / `seen` / `skipped`). Composite PK `(user_id, musical_id)`.
- **follows** — social graph (composite PK, self-follow prevented).

**Game tables:**
- **puzzles**, **puzzle_results** — Showdle daily puzzles + per-user results.
- **nts_musicals**, **nts_songs**, **nts_results** — Name That Song catalog + results.

**Ratings are full-star integers only (1–5).** Historical half-star floats were migrated via `FLOOR(rating + 0.5)` (rounds .5 up). All validation, UI, and DB constraints enforce integer stars. The domain write service (`lib/services/musicalWriteService.ts`) is the single mutation path for reviews and statuses.

## Key patterns

- **Server Components** fetch data via services (`lib/services/*`) that call the shared Drizzle client from `lib/db`. Use `export const dynamic = "force-dynamic"` for pages that must not be cached.
- **Client Components** (`"use client"`) for interactive UI: search typeahead, follow toggle, nav dropdown, handle validation. Client mutations go through `/api/*` route handlers, not a browser DB client.
- **Optimistic updates** in FollowButton and MusicalCard — set state first, then fire the mutation.
- **Year-grouped galleries** on My Playbills and public profiles — shared component `YearGroupedGallery`.
- **Handle validation** uses debounced (300ms) uniqueness checks on the `profiles` table.

## Modularity rules

Follow these rules when adding or modifying features to keep the codebase modular:

1. **New UI pattern?** Check `app/components/` first. Extend an existing component before creating a new one.
2. **Need data from the DB?** Add a function to `musicalReadService.ts` or `profileService.ts` (or a game-specific service). Never write raw Drizzle queries in page files or API routes — go through a service.
3. **Protected page?** Start with `const user = await requireAuth()`. Never inline `auth()` + `redirect("/login")`.
4. **Dates?** Use `formatDate()` / `timeAgo()` from `lib/utils/formatDate.ts`. Never define date helpers inline.
5. **Stars?** `<StarRating>` for display, `<StarRatingInput>` for interaction. Never inline `"★".repeat()`.
6. **Empty content?** `<EmptyState>` with optional CTA children. Never create ad-hoc empty-state divs.
7. **Profile display?** `<ProfileHeader>` + `<YearGroupedGallery>`. Never duplicate profile header or year-grouping logic.
8. **Add/edit review forms?** `<ReviewForm mode="add|edit">`. Never duplicate form markup.
9. **Poster images?** `<PosterImage>` with `mode="fill"` or `mode="fixed"`. Never duplicate the image+emoji-fallback pattern.
10. **Legacy Supabase imports?** Don't add any. `lib/supabase/*` no longer exists. All new code uses `@/lib/db` (Drizzle + Neon).
11. **Mutations?** Always go through `musicalWriteService.ts` (reviews + statuses) or server actions in `app/actions.ts`. Never mutate directly from page files.

## Key locations

| Area | Files |
|------|-------|
| **Shared components** | `app/components/` — `StarRating`, `StarRatingInput`, `PosterImage`, `EmptyState`, `ProfileHeader`, `YearGroupedGallery`, `ReviewForm` |
| My Playbills (gallery) | `app/my-theatre-life/page.tsx` |
| Add / edit playbill | `app/add/[id]/page.tsx`, `app/edit/[reviewId]/page.tsx` (both use `ReviewForm`) |
| Public profile | `app/u/[handle]/page.tsx`, `app/u/[handle]/FollowButton.tsx` |
| Explore (home) | `app/page.tsx`, `app/ExploreCarousel.tsx`, `app/MusicalCard.tsx` |
| Browse | `app/browse/page.tsx`, `app/SearchableMusicalGrid.tsx`, `app/SearchBar.tsx` |
| Auth | `auth.ts` (NextAuth config), `app/login/page.tsx`, `app/choose-handle/page.tsx`, `middleware.ts` |
| **Server actions** | `app/actions.ts` |
| **DB client** | `lib/db/index.ts` — Drizzle over Neon |
| **DB schemas** | `lib/db/schema.ts` (core), `lib/db/showdle-schema.ts`, `lib/db/nts-schema.ts` |
| **Read service** | `lib/services/musicalReadService.ts` — all review/musical/status reads |
| **Write service** | `lib/services/musicalWriteService.ts` — all review/status mutations |
| **Profile service** | `lib/services/profileService.ts` — profiles + social graph queries |
| **Auth guard** | `lib/services/authGuard.ts` — `requireAuth()` for protected pages |
| Games | `app/games/page.tsx` (landing), `app/games/showdle/*`, `app/games/name-that-song/*` |
| Game APIs | `app/api/showdle/*`, `app/api/name-that-song/*` |
| Showdle generation | `lib/showdle/puzzleGeneration.ts` — `TOP_MUSICALS` ranked list + `getTopMusicals(n)` |
| Date utils | `lib/utils/formatDate.ts` — `formatDate()`, `timeAgo()` |
| Legacy (do not use) | `supabase/schema.sql` — historical only |
| Profile stats | `lib/profileStats.ts` (+ `.test.ts`) |
| Analytics | `lib/analytics.ts` — type-safe event tracking |
| Design system | `app/globals.css` |
| Seed scripts | `scripts/seed-showdle.ts`, `scripts/seed-nts.ts` |

## Showdle puzzle generation process

When asked to generate new Showdle puzzles, follow these steps:

1. **Pick target shows** from `PUZZLE_POOL_MUSICALS` in `lib/showdle/puzzleGeneration.ts`. Aim for variety across eras (golden age → contemporary). Up to 10 puzzles per show across a generation batch.
2. **Recall an iconic lyric** for the show — prioritize title songs, the most-streamed/most-quoted number, or memorable Act openers/closers. Target lyrics a casual fan would recognize.
3. **Choose the blank word** — the most "clickable" word in the lyric, usually the rhyme, punchline, or thematic keyword (e.g. `DEFYING`, `ARGENTINA`, `CLOWNS`). Never blank out function words (the, of, a).
4. **Assign difficulty 1–5**:
   - 1 = radio-famous, non-theatre fans know it
   - 2 = well-known within a mainstream show
   - 3 = deep cut of a famous show, or famous song from a less-mainstream show
   - 4–5 = requires real familiarity with the show
5. **Fill metadata**: show name, character who sings the line, original Broadway cast member in that role.
6. **Inline verification (per puzzle)** — immediately after drafting each puzzle, verify it against an authoritative source (lyrics site, Playbill, IBDB): the lyric is accurate and in the show, the character actually sings that specific line, and the OBC attribution matches the original Broadway cast (not a replacement or revival). If something can't be verified, replace the lyric/blank/character before moving on — don't carry unverified entries into the batch.
7. **Sanity-check the batch** — balance eras/composers, balance difficulty, no repeated answer words within the batch.
8. **Final dedupe pass against DB** — right before insert, query `puzzles` and reject any new puzzle whose `(answer, showName)` pair (or identical lyric) already exists. Replace rejected entries and re-verify them inline.
9. **Append, don't overwrite** — use an append-style seed script that starts after `max(scheduledDate)` so historical puzzles aren't rescheduled. See `scripts/seed-showdle-append.ts` as the pattern.

## Environment

See `.env.local.example` for required env vars:
- `DATABASE_URL` — Neon Postgres connection string (primary data path).
- `AUTH_SECRET` — NextAuth JWT secret.
- `NEXT_PUBLIC_SITE_URL` — public origin (used in absolute URLs).

Actual values in `.env.local` (git-ignored).
