# Orphia Games — Development Context for Claude Chat

Use this document when designing PRDs or specs for new games in the Orphia app. It covers the tech stack, design system, infrastructure patterns, and existing game architecture.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2, App Router (Server Components by default, `"use client"` when interactive) |
| Language | TypeScript 5 |
| UI | React 18 |
| Database | Neon PostgreSQL (serverless) via `@neondatabase/serverless` |
| ORM | Drizzle ORM (`drizzle-orm` + `drizzle-kit`) |
| Auth | NextAuth v5 (beta) with credentials provider |
| Styling | CSS custom properties (no Tailwind). Each game gets its own isolated `.css` file |
| Testing | Vitest |
| Fonts | `next/font/google` for loading (avoids FOUT) |
| Hosting | Vercel |

**Key dependencies** (from package.json):
- `next@14.2.35`, `react@18`, `drizzle-orm@0.45.1`, `next-auth@5.0.0-beta.30`
- `@neondatabase/serverless@1.0.2`, `bcryptjs`, `sharp`

---

## 2. Design System — Showdle Reference

All games share a common visual language. Each game gets its own CSS file with **prefixed tokens** to avoid collisions (Showdle uses `sd-`). A new game should define its own prefix (e.g., `nts-` for Name That Song).

### 2.1 Color Palette

```
Ink (text):        #1a1108
Cream (bg):        #faf5ee
Surface (cards):   #ffffff
Parchment (hover): #f0e8d8
Border:            #d4c9b8
Border-light:      #e0d5c4

Gold (accent):     #c8922a
Gold-light:        #f0c060
Gold-muted (meta): #a08060

Correct (green):   #2d6a2d
Present (yellow):  #c8922a  (same as gold)
Absent:            #e8e0d4
Error:             #b03a2e
```

### 2.2 Typography

Two font stacks loaded via `next/font/google`:

| Variable | Font | Usage |
|----------|------|-------|
| `--font-display` | Playfair Display (400, 700, italic) | Logos, lyrics, show names, headings |
| `--font-ui` | DM Sans (400, 500) | Buttons, labels, keyboard, body text |

### 2.3 Spacing

4px base unit: `--space-1` (4px) through `--space-12` (48px).

### 2.4 Border Radius

`--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (14px), `--radius-full` (9999px).

### 2.5 Component Patterns

| Component | Pattern |
|-----------|---------|
| **Header** | Dark ink background, gold accent border-bottom, Playfair Display logo with letter-spacing |
| **Cards** | White surface, `border-light`, `border-radius: lg` |
| **Buttons (primary)** | Gold background, white text, full-width |
| **Buttons (secondary)** | Transparent, ink text, bordered |
| **Modal** | Fixed backdrop (ink @ 55% opacity), cream panel, `border-radius: xl`, enter animation |
| **Toast** | Fixed at top, ink background, cream text, auto-dismiss |
| **Difficulty badges** | Easy=green, Medium=amber, Hard=red (each has bg + text token pairs) |

---

## 3. Game Architecture Pattern (from Showdle)

Every game follows this structure:

### 3.1 File Structure
```
app/games/[game-name]/
├── layout.tsx              # Isolated layout with fonts + CSS import
├── page.tsx                # Server Component (fetches today's puzzle from DB)
├── [GameName]Game.tsx      # Client Component (game orchestrator)
├── [game-name].css         # Isolated design system (prefixed tokens)
├── hooks/
│   └── useGameState.ts     # All game state + localStorage persistence
└── components/
    ├── Header.tsx
    ├── Toast.tsx
    ├── RevealModal.tsx
    └── ...game-specific components
```

### 3.2 Layout Pattern
```tsx
// layout.tsx — Isolated overlay that hides host app
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./[game-name].css";

export default function GameLayout({ children }) {
  return (
    <div
      className="[prefix]-root ..."
      style={{ position: "fixed", inset: 0, overflow: "auto", zIndex: 999 }}
    >
      <div className="[prefix]-container">{children}</div>
    </div>
  );
}
```
The `position: fixed; inset: 0; z-index: 999` overlay hides the host Orphia app completely.

### 3.3 Server → Client Data Flow
```
page.tsx (Server Component)
  ↓ fetches puzzle from Neon via Drizzle
  ↓ passes props (id, clue, answer, metadata)
[Game]Game.tsx (Client Component)
  ↓ calls useGameState(puzzleId, ..., answer)
  ↓ renders UI components
```

### 3.4 State Management Pattern
```
useGameState hook:
  - useState with lazy initializer (loads from localStorage)
  - useEffect to persist on every state change
  - useEffect for fire-and-forget completion POST
  - useCallback actions (addLetter, deleteLetter, submitGuess, etc.)
  - Derived state computed outside setState (letterStates, etc.)

localStorage key: `[game]-v1-[puzzleId]` (versioned for safe migrations)
```

### 3.5 API Routes
```
app/api/[game-name]/puzzle/today/route.ts    — GET today's puzzle (no answer)
app/api/[game-name]/puzzle/[id]/reveal/route.ts — GET full puzzle data (post-game)
app/api/[game-name]/puzzle/[id]/complete/route.ts — POST completion (fire-and-forget)
```

### 3.6 Middleware
Games are public (no login required). Add the route prefix to the public routes list in `middleware.ts`:
```ts
const isPublicRoute = pathname.startsWith("/games/[game-name]") || pathname.startsWith("/api/[game-name]");
```

---

## 4. Database Pattern

### 4.1 Schema Definition (Drizzle)
Each game gets its own schema file: `lib/db/[game-name]-schema.ts`

```ts
import { pgTable, text, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const [game]Puzzles = pgTable("[game]_puzzles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // ...game-specific columns
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("[game]_puzzles_scheduled_date_idx").on(table.scheduledDate),
]);

export const [game]Results = pgTable("[game]_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  puzzleId: text("puzzle_id").references(() => [game]Puzzles.id).notNull(),
  // ...result columns
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 4.2 Register in Drizzle Config
```ts
// drizzle.config.ts
schema: ["./lib/db/schema.ts", "./lib/db/showdle-schema.ts", "./lib/db/[game]-schema.ts"],
```

### 4.3 Register in DB Client
```ts
// lib/db/index.ts
import * as [game]Schema from "./[game]-schema";
export const db = drizzle(sql, { schema: { ...schema, ...showdleSchema, ...[game]Schema } });
```

### 4.4 Seed Script
Each game has a seed script: `scripts/seed-[game].ts` that inserts initial puzzles.
Run with: `npx tsx scripts/seed-[game].ts`

---

## 5. Key Constraints

1. **No Tailwind** — CSS custom properties only, in an isolated CSS file per game
2. **No external state libraries** — React hooks + localStorage only
3. **Public by default** — games don't require login
4. **Daily puzzle model** — one puzzle per day, scheduled via `scheduled_date` column
5. **Mobile-first responsive** — 480px breakpoint for desktop enhancements
6. **Client-side evaluation** — answer passed as server component prop, evaluation happens in the browser (keeps game fast, no network round-trips per guess)
7. **Fire-and-forget completion** — POST results for analytics, don't block the UI
8. **CSS class prefix** — every game isolates its styles with a unique prefix (sd- for Showdle)
9. **Font loading** — always use `next/font/google` in the layout, expose as CSS variables
10. **Container max-width: 480px** — games are designed for a narrow, phone-friendly viewport

---

## 6. Existing Game: Showdle Summary

**Concept:** Daily Wordle-style lyric guessing game for musical theater fans.
**Route:** `/games/showdle`
**Mechanic:** Given a lyric with a blank word, guess the missing word in 6 tries. Color-coded feedback (green=correct position, gold=wrong position, grey=not in word).
**Key UI:** Header → Lyric card → Tile board (6 rows × N cols) → QWERTY keyboard (sticky bottom on mobile).
**State:** `useGameState` hook manages guesses, evaluations, current input, win/loss status, and hint tracking. Persisted to localStorage.
**Post-game:** RevealModal shows result, show name, cast info, difficulty badge, and a 6-row mini scoreboard.
