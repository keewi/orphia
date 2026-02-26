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

**Orphia** — Next.js 14 App Router app for tracking musicals. Users collect playbills, rate shows, and follow other fans.

**Stack:** Next.js 14.2, React 18, TypeScript 5, Supabase (PostgreSQL + Auth + Storage), Vitest.

**Two Supabase clients:**
- `lib/supabase/server.ts` — Server Components & Server Actions (cookie-based auth via `@supabase/ssr`)
- `lib/supabase/client.ts` — Client Components (browser-only, for interactive mutations)

**Middleware** (`middleware.ts`): refreshes Supabase session on every request, redirects unauthenticated users to `/login` (except public routes `/u/*`, `/auth/*`), redirects users without a handle to `/choose-handle`.

**Server Actions** (`app/actions.ts`): `addReview`, `editReview` — verify auth, mutate, redirect.

## Database

Five tables + one view with Row Level Security. Full DDL in `supabase/schema.sql`.

- **musicals** — show catalog (read-only for users, includes optional `popularity_rank`)
- **user_reviews** — user playbills (integer `rating_int` 1–5, optional `watch_date`). Multiple reviews per musical allowed. Publicly readable.
- **user_musical_status** — per-user status per musical (`want_to_see` / `seen` / `skipped`). Composite PK `(user_id, musical_id)`. Publicly readable.
- **profiles** — user handles (unique, 3–20 chars, `[a-z0-9_]`). Publicly readable.
- **follows** — social graph (composite PK, self-follow prevented). Publicly readable.
- **user_latest_reviews** (view) — latest review per `(user_id, musical_id)`, built with `DISTINCT ON`.

RLS pattern: most tables publicly readable; writes restricted to `auth.uid() = user_id`.

**Ratings are full-star integers only (1–5).** Historical half-star floats were migrated via `FLOOR(rating + 0.5)` (rounds .5 up). All validation, UI, and DB constraints enforce integer stars. The domain write service (`lib/services/musicalWriteService.ts`) is the single mutation path for reviews and statuses.

## Key patterns

- **Server Components** fetch data with `await createClient()` + `export const dynamic = "force-dynamic"`.
- **Client Components** (`"use client"`) for interactive UI: search typeahead, follow toggle, nav dropdown, handle validation.
- **Optimistic updates** in FollowButton and MusicalCard — set state first, then fire Supabase mutation.
- **Year-grouped galleries** on My Playbills and public profiles — shared logic in `lib/profileStats.ts`.
- **Handle validation** uses debounced (300ms) uniqueness checks on the `profiles` table.

## Key locations

| Area | Files |
|------|-------|
| My Playbills (gallery) | `app/my-theatre-life/page.tsx` |
| Add / edit playbill | `app/add/[id]/page.tsx`, `app/edit/[reviewId]/page.tsx` |
| Public profile | `app/u/[handle]/page.tsx`, `app/u/[handle]/FollowButton.tsx` |
| Explore (home) | `app/page.tsx`, `app/SearchableMusicalGrid.tsx`, `app/MusicalCard.tsx` |
| Auth | `app/login/page.tsx`, `app/choose-handle/page.tsx`, `middleware.ts` |
| Server actions | `app/actions.ts` |
| Supabase clients | `lib/supabase/server.ts`, `lib/supabase/client.ts` |
| Profile stats | `lib/profileStats.ts` (+ `.test.ts`) |
| Design system | `app/globals.css` |
| DB schema | `supabase/schema.sql` |

## Environment

See `.env.local.example` for required Supabase env vars. Actual values in `.env.local` (git-ignored).
