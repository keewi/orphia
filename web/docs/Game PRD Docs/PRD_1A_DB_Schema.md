# PRD 1A: DB Schema & Seed

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 1 — Playable Game End-to-End (1A of 4)

---

## Goal

Create the Neon PostgreSQL schema for the NTS game and seed it with the canonical song data. After this PRD ships, the database has two tables — `nts_musicals` and `nts_songs` — populated with 10 musicals and 20 songs. No UI, no API. Pure data foundation.

## Prerequisites

- Neon database already provisioned and connected via `@neondatabase/serverless`
- `drizzle-orm` and `drizzle-kit` installed
- `lib/db/index.ts` and `drizzle.config.ts` already exist (as established by Showdle)
- `npx tsx` available for running seed scripts

## What This PRD Ships

- `lib/db/nts-schema.ts` — Drizzle schema for `nts_musicals` and `nts_songs`
- `drizzle.config.ts` updated to include the new schema file
- `lib/db/index.ts` updated to register new schema with the Drizzle client
- `scripts/seed-nts.ts` — seed script with all 20 songs across 10 musicals

## What This PRD Does NOT Ship

- API endpoints (PRD 1B)
- Any UI components (PRD 1C)
- Game logic (PRD 1D)

## Visual Design Reference

No UI in this PRD. Backend only.

---

## Data Model

```typescript
// lib/db/nts-schema.ts

import {
  pgTable, text, integer, timestamp, uniqueIndex, index
} from "drizzle-orm/pg-core";

export const ntsMusicals = pgTable("nts_musicals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("nts_musicals_name_idx").on(t.name),
]);

export const ntsSongs = pgTable("nts_songs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  musicalId: text("musical_id").references(() => ntsMusicals.id).notNull(),
  title: text("title").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("nts_songs_musical_id_idx").on(t.musicalId),
  uniqueIndex("nts_songs_title_musical_idx").on(t.musicalId, t.title),
]);
```

---

## Implementation

### Step 1 — Create schema file

Create `lib/db/nts-schema.ts` with the exact schema above.

### Step 2 — Register in Drizzle config

In `drizzle.config.ts`, add `"./lib/db/nts-schema.ts"` to the `schema` array:

```typescript
// drizzle.config.ts (modified)
schema: ["./lib/db/schema.ts", "./lib/db/showdle-schema.ts", "./lib/db/nts-schema.ts"],
```

### Step 3 — Register in DB client

In `lib/db/index.ts`, import and spread the new schema:

```typescript
import * as ntsSchema from "./nts-schema";
// Add to existing drizzle() call:
export const db = drizzle(sql, {
  schema: { ...schema, ...showdleSchema, ...ntsSchema }
});
```

### Step 4 — Push schema to Neon

```bash
npx drizzle-kit push
```

Verify no errors. Check Neon console that `nts_musicals` and `nts_songs` tables exist.

### Step 5 — Create seed script

```typescript
// scripts/seed-nts.ts

import { db } from "../lib/db";
import { ntsMusicals, ntsSongs } from "../lib/db/nts-schema";

const SEED_DATA = [
  {
    name: "Hamilton",
    displayOrder: 1,
    songs: [
      { title: "My Shot", displayOrder: 1 },
      { title: "The Room Where It Happens", displayOrder: 2 },
      { title: "Alexander Hamilton", displayOrder: 3 },
    ],
  },
  {
    name: "Les Misérables",
    displayOrder: 2,
    songs: [
      { title: "I Dreamed a Dream", displayOrder: 1 },
      { title: "One Day More", displayOrder: 2 },
      { title: "On My Own", displayOrder: 3 },
    ],
  },
  {
    name: "Wicked",
    displayOrder: 3,
    songs: [
      { title: "Defying Gravity", displayOrder: 1 },
      { title: "Popular", displayOrder: 2 },
    ],
  },
  {
    name: "The Phantom of the Opera",
    displayOrder: 4,
    songs: [
      { title: "The Music of the Night", displayOrder: 1 },
      { title: "Think of Me", displayOrder: 2 },
    ],
  },
  {
    name: "Chicago",
    displayOrder: 5,
    songs: [
      { title: "All That Jazz", displayOrder: 1 },
      { title: "Cell Block Tango", displayOrder: 2 },
    ],
  },
  {
    name: "Rent",
    displayOrder: 6,
    songs: [
      { title: "Seasons of Love", displayOrder: 1 },
      { title: "La Vie Bohème", displayOrder: 2 },
    ],
  },
  {
    name: "Grease",
    displayOrder: 7,
    songs: [
      { title: "You're the One That I Want", displayOrder: 1 },
      { title: "Summer Nights", displayOrder: 2 },
    ],
  },
  {
    name: "The Lion King",
    displayOrder: 8,
    songs: [
      { title: "Circle of Life", displayOrder: 1 },
    ],
  },
  {
    name: "Mamma Mia",
    displayOrder: 9,
    songs: [
      { title: "Dancing Queen", displayOrder: 1 },
    ],
  },
  {
    name: "Sweeney Todd",
    displayOrder: 10,
    songs: [
      { title: "The Worst Pies in London", displayOrder: 1 },
    ],
  },
];

async function seed() {
  console.log("Seeding NTS musicals and songs...");

  for (const musical of SEED_DATA) {
    // Upsert musical
    const [inserted] = await db
      .insert(ntsMusicals)
      .values({
        name: musical.name,
        displayOrder: musical.displayOrder,
      })
      .onConflictDoUpdate({
        target: ntsMusicals.name,
        set: { displayOrder: musical.displayOrder },
      })
      .returning();

    // Upsert songs
    for (const song of musical.songs) {
      await db
        .insert(ntsSongs)
        .values({
          musicalId: inserted.id,
          title: song.title,
          displayOrder: song.displayOrder,
        })
        .onConflictDoUpdate({
          target: [ntsSongs.musicalId, ntsSongs.title],
          set: { displayOrder: song.displayOrder },
        });
    }

    console.log(`  ✓ ${musical.name} (${musical.songs.length} songs)`);
  }

  const totalSongs = SEED_DATA.reduce((acc, m) => acc + m.songs.length, 0);
  console.log(`\nDone. ${SEED_DATA.length} musicals, ${totalSongs} songs.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

### Step 6 — Run seed

```bash
npx tsx scripts/seed-nts.ts
```

Expected output: 10 musicals listed with song counts, total = 20 songs. Re-running must produce no errors (upsert guards).

---

## API Routes

None in this PRD.

---

## Testing Checklist

1. `npx drizzle-kit push` completes with no errors
2. Neon console shows `nts_musicals` and `nts_songs` tables
3. `npx tsx scripts/seed-nts.ts` prints 10 musicals, 20 songs total
4. Re-running seed script produces no duplicate-key errors
5. `SELECT COUNT(*) FROM nts_songs` returns 20
6. `SELECT * FROM nts_songs JOIN nts_musicals ON nts_songs.musical_id = nts_musicals.id` returns 20 rows, all with non-null `title`, `name`, `display_order`

---

## Acceptance Criteria

- [ ] `lib/db/nts-schema.ts` exists and exports `ntsMusicals` and `ntsSongs`
- [ ] `drizzle.config.ts` includes `nts-schema.ts` in the schema array
- [ ] `lib/db/index.ts` registers `ntsSchema` in the Drizzle client
- [ ] Tables exist in Neon after `drizzle-kit push`
- [ ] Seed script runs successfully and inserts exactly 20 songs across 10 musicals
- [ ] Re-running seed script is safe (upsert, not insert)

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `lib/db/nts-schema.ts` | Create | New schema file |
| `drizzle.config.ts` | Modify | Add nts-schema to schema array |
| `lib/db/index.ts` | Modify | Register ntsSchema in drizzle client |
| `scripts/seed-nts.ts` | Create | Seed script with upsert logic |

---

## Notes for Developer

1. **Check existing Drizzle patterns first.** Look at `lib/db/showdle-schema.ts` for the exact import style and `onConflictDoUpdate` patterns used in the existing seed script — match them exactly.
2. **`crypto.randomUUID()` requires Node 19+** or a polyfill. If the project uses an older Node, replace with `import { randomUUID } from 'crypto'` and use that instead.
3. **The `displayOrder` field on songs is per-musical**, not global. Songs from different musicals can share the same `displayOrder` value — that is intentional.
4. **20 songs total** — count carefully when adding or removing songs from SEED_DATA. The test checks for exactly 20.
