# PRD 1B: Route Shell & CSS

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 1 — Playable Game End-to-End (1B of 4)

---

## Goal

Scaffold the isolated Next.js route for Name That Song at `/games/name-that-song`. This PRD sets up the layout overlay, loads the font pair, creates the full `nts-` prefixed CSS design system, adds two API endpoints (random song + reveal), and registers the routes as public in middleware. After this ships, the route renders a blank cream-coloured overlay and the APIs return correct data — ready for UI components in PRD 1C.

## Prerequisites

- PRD 1A complete: `nts_musicals` and `nts_songs` tables exist and are seeded
- Showdle game route (`/games/showdle`) exists as a reference pattern
- `lib/db/index.ts` includes `ntsSchema`

## What This PRD Ships

- `app/games/name-that-song/layout.tsx` — isolated layout with fonts + CSS import
- `app/games/name-that-song/page.tsx` — Server Component placeholder (renders loading state for now; full wiring in 1D)
- `app/games/name-that-song/name-that-song.css` — complete `nts-` prefixed design system
- `app/api/name-that-song/song/random/route.ts` — GET random song (title withheld)
- `app/api/name-that-song/song/[id]/reveal/route.ts` — GET full song data
- `middleware.ts` updated to add NTS routes to public list

## What This PRD Does NOT Ship

- Any game UI components (PRD 1C)
- Game logic or state hook (PRD 1D)
- Full `page.tsx` with game wiring (PRD 1D replaces the placeholder)

## Visual Design Reference

No game UI in this PRD. The layout renders a blank cream page — visual correctness verified by confirming the overlay hides the host app and uses the correct background colour (`var(--nts-cream)`).

---

## Data Model

No new models. Reads from `ntsMusicals` and `ntsSongs` (PRD 1A).

---

## Implementation

### Step 1 — Create layout.tsx

```typescript
// app/games/name-that-song/layout.tsx
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./name-that-song.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--nts-font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--nts-font-ui",
});

export default function NTSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`nts-root ${playfair.variable} ${dmSans.variable}`}
      style={{ position: "fixed", inset: 0, overflow: "auto", zIndex: 999 }}
    >
      <div className="nts-container">{children}</div>
    </div>
  );
}
```

### Step 2 — Create placeholder page.tsx

```typescript
// app/games/name-that-song/page.tsx
// Placeholder — fully replaced in PRD 1D
export default function NTSPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "var(--nts-font-ui)" }}>
      Name That Song — coming soon
    </div>
  );
}
```

### Step 3 — Create name-that-song.css

Create `app/games/name-that-song/name-that-song.css` with the full design system below. Every token uses the `nts-` prefix to avoid collision with Showdle's `sd-` tokens.

```css
/* ── NTS Design System ── */
.nts-root {
  /* Colours — from Orphia shared palette */
  --nts-ink:            #1a1108;
  --nts-cream:          #faf5ee;
  --nts-surface:        #ffffff;
  --nts-border:         #d4c9b8;
  --nts-border-light:   #e0d5c4;
  --nts-gold:           #c8922a;
  --nts-gold-light:     #f0c060;
  --nts-gold-bright:    #f5c842;  /* tile flash peak */
  --nts-gold-muted:     #a08060;
  --nts-gold-bg:        #fdf6e8;
  --nts-correct:        #2d6a2d;
  --nts-correct-bg:     #eaf4ea;
  --nts-error:          #b03a2e;
  --nts-error-bg:       #fcecea;
  /* Absent — two tokens, two roles */
  --nts-absent-bg:      #e8e0d4;  /* absent key background (context spec) */
  --nts-absent-key:     #787c7e;  /* absent key fill (Showdle-matching grey) */
  --nts-absent-text:    #7a7060;  /* muted text on cream */
  --nts-key-unused:     #ede8df;
  --nts-parchment:      #f0e8d8;
  --nts-timer-track:    #3a3020;  /* dark track behind timer bar */
  --nts-timer-warn:     #f08070;  /* timer number colour at ≤10s */

  /* Border radius */
  --nts-radius-sm:   4px;
  --nts-radius-md:   6px;
  --nts-radius-lg:   8px;
  --nts-radius-xl:   14px;
  --nts-radius-full: 9999px;

  /* Spacing — 4px base unit (matches Orphia --space-* system) */
  --nts-space-1:   4px;
  --nts-space-2:   8px;
  --nts-space-3:   12px;
  --nts-space-4:   16px;
  --nts-space-5:   20px;
  --nts-space-6:   24px;
  --nts-space-8:   32px;
  --nts-space-10:  40px;
  --nts-space-12:  48px;
}

.nts-root {
  background: var(--nts-cream);
  color: var(--nts-ink);
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  min-height: 100%;
}

.nts-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.nts-header {
  background: var(--nts-ink);
  padding: var(--nts-space-3) var(--nts-space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--nts-gold);
  flex-shrink: 0;
}

.nts-logo {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--nts-cream);
  letter-spacing: 0.06em;
}

.nts-logo-accent { color: var(--nts-gold); }

/* ── Timer ── */
.nts-timer {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nts-timer-track {
  width: 80px;
  height: 5px;
  background: var(--nts-timer-track);
  border-radius: 3px;
  overflow: hidden;
}

.nts-timer-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--nts-gold);
  transition: width 1s linear, background 0.5s;
}

.nts-timer-bar--warn { background: var(--nts-error); }

.nts-timer-num {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--nts-cream);
  min-width: 28px;
  text-align: right;
}

.nts-timer-num--warn { color: var(--nts-timer-warn); }

/* ── Game body ── */
.nts-game-body {
  padding: var(--nts-space-4) var(--nts-space-4) var(--nts-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--nts-space-3);
  flex: 1;
}

/* ── Feedback area ── */
.nts-feedback {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nts-radius-md);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  text-align: center;
  transition: opacity 0.3s;
}

.nts-feedback--empty    { background: transparent; }
.nts-feedback--prompt   { background: transparent; color: var(--nts-absent-text); font-weight: 400; font-style: italic; }
.nts-feedback--correct  { background: var(--nts-correct-bg); color: var(--nts-correct); }
.nts-feedback--absent   { background: var(--nts-absent-bg);  color: var(--nts-absent-text); }
.nts-feedback--error    { background: var(--nts-error-bg);   color: var(--nts-error); }

/* ── WoF Grid ── */
.nts-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
}

.nts-grid-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* Word-space gap — narrow invisible spacer between words on the same row */
.nts-tile-gap {
  width: 10px;
  height: 32px;
  flex-shrink: 0;
}

.nts-tile {
  width: 26px;
  height: 32px;
  border-radius: var(--nts-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 15px;
  font-weight: 700;
}

.nts-tile--blank {
  background: var(--nts-surface);
  border: 2px solid var(--nts-border);
}

.nts-tile--revealed {
  background: var(--nts-gold-bg);
  border: 2px solid var(--nts-gold);
  color: var(--nts-ink);
}

/* Punctuation: pre-filled parchment tile, never changes state */
.nts-tile--punct {
  background: var(--nts-key-unused);
  border: 2px solid var(--nts-border);
  color: var(--nts-ink);
  font-size: 16px;
}

/* Flash animation for newly revealed tiles */
@keyframes nts-tile-reveal {
  0%   { background: var(--nts-gold-bright); border-color: var(--nts-gold-bright); }
  40%  { background: var(--nts-gold-bright); border-color: var(--nts-gold-bright); }
  100% { background: var(--nts-gold-bg);     border-color: var(--nts-gold); }
}

.nts-tile--flash {
  animation: nts-tile-reveal 300ms ease-out forwards;
  color: var(--nts-ink);
}

/* ── Keyboard ── */
.nts-keyboard {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  padding: 4px 0;
}

.nts-key-row { display: flex; gap: 4px; }

.nts-key {
  height: 40px;
  min-width: 28px;
  padding: 0 3px;
  border-radius: var(--nts-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  color: var(--nts-ink);
  background: var(--nts-key-unused);
  user-select: none;
  transition: opacity 0.15s;
}

.nts-key--correct {
  background: var(--nts-gold);
  color: #fff;
  cursor: default;
  pointer-events: none;
}

/* Absent key: Showdle-matching grey */
.nts-key--absent {
  background: var(--nts-absent-key);
  color: #fff;
  cursor: default;
  pointer-events: none;
}

/* ── Action bar ── */
.nts-action-bar {
  display: flex;
  gap: var(--nts-space-2);
  padding-top: 4px;
}

/* Hint button — default state */
.nts-btn-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
  background: transparent;
  color: var(--nts-gold-muted);
  border: 1.5px solid var(--nts-border-light);
  border-radius: var(--nts-radius-lg);
  padding: 10px 12px;
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  font-size: 12px;
  cursor: pointer;
}

/* Hint button — revealed state (fades in over 100ms) */
@keyframes nts-hint-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.nts-btn-hint--revealed {
  background: var(--nts-gold-bg);
  color: var(--nts-gold-muted);
  border: 2px solid var(--nts-gold);
  cursor: default;
  pointer-events: none;
  font-size: 11.5px;
  animation: nts-hint-fade-in 100ms ease-in forwards;
}

/* Guess the song button */
.nts-btn-solve {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
  background: transparent;
  color: var(--nts-ink);
  border: 1.5px solid var(--nts-border);
  border-radius: var(--nts-radius-lg);
  padding: 10px 12px;
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

/* Primary gold button (Play Again) */
.nts-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: var(--nts-gold);
  color: #fff;
  border: none;
  border-radius: var(--nts-radius-lg);
  padding: 13px 16px;
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

/* ── Solve Modal ── */
.nts-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 17, 8, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.nts-modal-panel {
  background: var(--nts-cream);
  border-radius: var(--nts-radius-xl);
  padding: 24px 20px;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nts-modal-title {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--nts-ink);
}

.nts-modal-subtitle {
  font-size: 12px;
  color: var(--nts-gold-muted);
  margin-top: 5px;
}

.nts-modal-input {
  border: 1.5px solid var(--nts-border);
  border-radius: var(--nts-radius-md);
  padding: 10px 12px;
  font-family: var(--nts-font-ui, 'DM Sans', system-ui, sans-serif);
  font-size: 14px;
  background: var(--nts-surface);
  color: var(--nts-ink);
  width: 100%;
}

.nts-modal-input::placeholder { color: var(--nts-absent-text); }

.nts-modal-actions {
  display: flex;
  gap: var(--nts-space-2);
}

/* ── Completion Sheet ── */
.nts-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 17, 8, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.nts-sheet {
  background: var(--nts-cream);
  border-radius: var(--nts-radius-xl) var(--nts-radius-xl) 0 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

/* Win accent band */
.nts-sheet-accent--win {
  background: linear-gradient(135deg, var(--nts-gold) 0%, #e8a83a 100%);
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Loss accent band */
.nts-sheet-accent--loss {
  background: linear-gradient(135deg, #5a2020 0%, #7a3030 100%);
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nts-verdict-row {
  display: flex;
  align-items: center;
  gap: var(--nts-space-2);
}

.nts-verdict-icon { font-size: 20px; line-height: 1; }
.nts-verdict-text {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.nts-comp-song {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
}

.nts-comp-show {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  font-style: italic;
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  margin-top: 2px;
}

/* Sheet body */
.nts-sheet-body {
  padding: 20px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: var(--nts-space-3);
}

.nts-solve-headline {
  font-family: var(--nts-font-display, 'Playfair Display', Georgia, serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--nts-ink);
}

.nts-solve-headline-accent { color: var(--nts-gold); }

.nts-solve-headline--loss {
  font-size: 16px;
  color: var(--nts-error);
}

/* Stat chips */
.nts-stat-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.nts-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--nts-radius-full);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.nts-chip--right  { background: var(--nts-correct-bg); color: var(--nts-correct); }
.nts-chip--wrong  { background: var(--nts-absent-bg);  color: #fff; }
.nts-chip--pct    { background: var(--nts-gold-bg); color: var(--nts-gold-muted); border: 1px solid var(--nts-border-light); }
.nts-chip--hint   { background: var(--nts-absent-bg); color: #fff; }

/* Wins today chip */
.nts-wins-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--nts-radius-full);
  background: linear-gradient(135deg, rgba(200,146,42,0.15) 0%, rgba(200,146,42,0.08) 100%);
  border: 1px solid rgba(200,146,42,0.35);
  align-self: flex-start;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.nts-wins-chip-icon { font-size: 11px; color: var(--nts-gold); }
.nts-wins-chip-num  { font-size: 12px; font-weight: 500; color: var(--nts-gold); }
.nts-wins-chip-label { font-size: 12px; color: var(--nts-gold-muted); font-weight: 400; }

.nts-sheet-divider {
  height: 1px;
  background: var(--nts-border-light);
  margin: 4px 0;
}
```

### Step 4 — Create random song API

```typescript
// app/api/name-that-song/song/random/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db
      .select({
        id: ntsSongs.id,
        musicalName: ntsMusicals.name,
      })
      .from(ntsSongs)
      .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!results.length) {
      return NextResponse.json({ error: "No songs found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (err) {
    console.error("[NTS] random song error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 5 — Create reveal API

```typescript
// app/api/name-that-song/song/[id]/reveal/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const results = await db
      .select({
        id: ntsSongs.id,
        title: ntsSongs.title,
        musicalName: ntsMusicals.name,
      })
      .from(ntsSongs)
      .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
      .where(eq(ntsSongs.id, params.id))
      .limit(1);

    if (!results.length) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (err) {
    console.error("[NTS] reveal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 6 — Update middleware

In `middleware.ts`, add NTS routes to the public list:

```typescript
const isPublicRoute =
  pathname.startsWith("/games/showdle") ||
  pathname.startsWith("/api/showdle") ||
  pathname.startsWith("/games/name-that-song") ||    // ADD
  pathname.startsWith("/api/name-that-song");         // ADD
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/name-that-song/song/random` | Returns `{ id, musicalName }` — title withheld |
| GET | `/api/name-that-song/song/[id]/reveal` | Returns `{ id, title, musicalName }` |

**Response types:**

```typescript
// GET /random
interface RandomSongResponse {
  id: string;
  musicalName: string;
}

// GET /reveal
interface RevealSongResponse {
  id: string;
  title: string;
  musicalName: string;
}
```

---

## Testing Checklist

1. `/games/name-that-song` renders without errors — shows cream background, no host app visible
2. `GET /api/name-that-song/song/random` returns `{ id, musicalName }` with no `title` field
3. Calling the random endpoint 5 times produces at least 2 different songs (randomness check)
4. `GET /api/name-that-song/song/[id]/reveal` with a valid id returns `{ id, title, musicalName }`
5. Reveal endpoint with a fake id returns 404
6. Both API routes return 500 (not crash) if the database is unavailable
7. Navigating to `/games/name-that-song` while logged out works (public route)

---

## Acceptance Criteria

- [ ] `app/games/name-that-song/layout.tsx` loads Playfair Display and DM Sans via `next/font/google`
- [ ] `name-that-song.css` exists with full `nts-` prefixed token set
- [ ] Route renders a full-screen cream overlay at z-index 999, hiding host app
- [ ] `GET /api/name-that-song/song/random` returns `{ id, musicalName }` only
- [ ] `GET /api/name-that-song/song/[id]/reveal` returns `{ id, title, musicalName }`
- [ ] Middleware allows unauthenticated access to both routes

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `app/games/name-that-song/layout.tsx` | Create | Isolated layout with font loading |
| `app/games/name-that-song/page.tsx` | Create | Placeholder only — replaced in 1D |
| `app/games/name-that-song/name-that-song.css` | Create | Full nts- design system |
| `app/api/name-that-song/song/random/route.ts` | Create | Random song endpoint |
| `app/api/name-that-song/song/[id]/reveal/route.ts` | Create | Reveal endpoint |
| `middleware.ts` | Modify | Add NTS to public routes |

---

## Notes for Developer

1. **Copy the layout pattern from Showdle exactly** (`/games/showdle/layout.tsx`) — the `position: fixed; inset: 0; z-index: 999` overlay is intentional. It hides the Orphia host app completely while the game is active.
2. **The CSS file must be imported in layout.tsx**, not in any component. Component-level CSS imports in Next.js App Router can cause ordering issues.
3. **`RANDOM()` is Postgres-specific.** The `sql` template tag from drizzle-orm handles this. Do not use `Math.random()` in application code for song selection.
4. **The reveal endpoint is called by the Server Component** at render time — it is not called from the client during gameplay. The song title flows as a prop and never leaves the server-rendered HTML except as part of the page payload. This is an accepted tradeoff (title visible in page source) documented in the PRD Progression.
5. **Check the existing Showdle middleware pattern** before modifying `middleware.ts` — the exact condition format may differ from what's shown above.
6. **Absent colour — two tokens, two roles.** `--nts-absent-bg: #e8e0d4` (light parchment) is used for the absent feedback area background, matching the Orphia context spec. `--nts-absent-key: #787c7e` (Showdle grey) is used for absent keyboard keys with white text, matching Showdle's visual language. Do not conflate them.
7. **Spacing tokens.** The CSS defines `--nts-space-1` through `--nts-space-12` matching the Orphia 4px base unit system. Use these throughout component styles — do not introduce raw `px` values for layout spacing.
8. **API route deviation from context pattern.** The context doc specifies `/api/[game]/puzzle/today` and `/puzzle/[id]/reveal`. NTS uses `/api/name-that-song/song/random` and `/song/[id]/reveal` because there is no "puzzle" concept — songs are drawn randomly from a pool, not scheduled daily. This is an intentional, documented deviation from the Showdle pattern.
