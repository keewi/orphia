# PRD 3A: Results API & Schema

**Version:** 1.0
**Date:** March 29, 2026
**Audience:** Developer implementing in Claude Code
**Part of:** PRD 3 — Global Leaderboard (3A of 2)

---

## Goal

Add the `nts_results` database table and two API endpoints: one to submit a game result and one to fetch the top-10 leaderboard. After this PRD ships, the leaderboard data layer is complete and testable via curl before any UI is built.

## Prerequisites

- PRD 1A complete: `nts_songs` table exists (results reference it)
- PRD 2A complete: `deviceId` from `useNTSSession` is available in the client

## What This PRD Ships

- `lib/db/nts-schema.ts` updated — add `ntsResults` table
- `app/api/name-that-song/results/submit/route.ts` — POST game result
- `app/api/name-that-song/leaderboard/route.ts` — GET top-10 leaderboard

## What This PRD Does NOT Ship

- Leaderboard UI (PRD 3B)
- Username input (PRD 3B)
- Anti-cheat or rate limiting (deferred)

## Visual Design Reference

No UI in this PRD. Backend only.

---

## Data Model

```typescript
// Add to lib/db/nts-schema.ts

import { boolean } from "drizzle-orm/pg-core"; // add to existing imports

export const ntsResults = pgTable("nts_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text("device_id").notNull(),
  username: text("username").notNull(),         // max 20 chars, validated server-side
  songId: text("song_id").references(() => ntsSongs.id).notNull(),
  outcome: text("outcome").notNull(),           // 'won' | 'lost'
  hintUsed: boolean("hint_used").notNull(),
  timeSpent: integer("time_spent").notNull(),   // seconds
  rightLetters: integer("right_letters").notNull(),
  wrongLetters: integer("wrong_letters").notNull(),
  playedDate: text("played_date").notNull(),    // 'YYYY-MM-DD' UTC
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("nts_results_device_id_idx").on(t.deviceId),
  index("nts_results_played_date_idx").on(t.playedDate),
  index("nts_results_outcome_hint_idx").on(t.outcome, t.hintUsed), // for leaderboard query
]);
```

---

## Implementation

### Step 1 — Update schema file and push

Add `ntsResults` to `lib/db/nts-schema.ts` (do not remove existing `ntsMusicals` and `ntsSongs`).

Run:
```bash
npx drizzle-kit push
```

Verify `nts_results` table exists in Neon.

### Step 2 — Submit endpoint

```typescript
// app/api/name-that-song/results/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsResults } from "@/lib/db/nts-schema";

interface SubmitBody {
  deviceId: string;
  username: string;
  songId: string;
  outcome: "won" | "lost";
  hintUsed: boolean;
  timeSpent: number;
  rightLetters: number;
  wrongLetters: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SubmitBody;

    // Validate
    if (!body.deviceId || !body.username || !body.songId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["won", "lost"].includes(body.outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }
    if (body.username.length > 20) {
      return NextResponse.json({ error: "Username max 20 chars" }, { status: 400 });
    }
    if (typeof body.timeSpent !== "number" || typeof body.rightLetters !== "number" || typeof body.wrongLetters !== "number") {
      return NextResponse.json({ error: "Invalid stats" }, { status: 400 });
    }

    const playedDate = new Date().toISOString().slice(0, 10); // UTC date

    await db.insert(ntsResults).values({
      deviceId: body.deviceId,
      username: body.username.trim(),
      songId: body.songId,
      outcome: body.outcome,
      hintUsed: body.hintUsed,
      timeSpent: body.timeSpent,
      rightLetters: body.rightLetters,
      wrongLetters: body.wrongLetters,
      playedDate,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NTS] submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 3 — Leaderboard endpoint

```typescript
// app/api/name-that-song/leaderboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsResults } from "@/lib/db/nts-schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  winsNoHint: number;
}

export async function GET() {
  try {
    // Aggregate wins without hint per username, top 10
    const rows = await db
      .select({
        username: ntsResults.username,
        winsNoHint: sql<number>`COUNT(*)::int`,
      })
      .from(ntsResults)
      .where(
        and(
          eq(ntsResults.outcome, "won"),
          eq(ntsResults.hintUsed, false)
        )
      )
      .groupBy(ntsResults.username)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    const leaderboard: LeaderboardEntry[] = rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      winsNoHint: row.winsNoHint,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[NTS] leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/name-that-song/results/submit` | Store a completed game result |
| GET | `/api/name-that-song/leaderboard` | Return top-10 ranked by wins without hint |

**Response types:**

```typescript
// POST /submit — success
{ ok: true }

// POST /submit — error
{ error: string }  // 400 or 500

// GET /leaderboard — success
{
  leaderboard: Array<{
    rank: number;
    username: string;
    winsNoHint: number;
  }>
}
```

---

## Testing Checklist

1. `npx drizzle-kit push` succeeds with `nts_results` table added
2. `POST /api/name-that-song/results/submit` with valid body → `{ ok: true }`, row in DB
3. POST with `username` > 20 chars → 400 error
4. POST with missing `deviceId` → 400 error
5. POST with invalid `outcome` value → 400 error
6. `GET /api/name-that-song/leaderboard` with no data → `{ leaderboard: [] }`
7. Submit 3 wins-no-hint as "alice", 2 as "bob" → leaderboard returns alice rank 1, bob rank 2
8. Submit a win-with-hint as "alice" → does NOT appear in leaderboard count
9. Submit a loss as "alice" → does NOT appear in leaderboard count
10. Leaderboard returns max 10 entries even with 15+ users

---

## Acceptance Criteria

- [ ] `nts_results` table exists in Neon with all specified columns
- [ ] Submit endpoint validates all required fields and returns 400 on missing/invalid data
- [ ] Submit endpoint stores row with correct `playedDate` (UTC)
- [ ] Leaderboard endpoint returns top 10 by `winsNoHint` descending
- [ ] Wins-with-hint and losses are excluded from leaderboard count
- [ ] Both endpoints return 500 gracefully on DB failure

---

## Files to Create or Modify

| Path | Action | Notes |
|------|--------|-------|
| `lib/db/nts-schema.ts` | Modify | Add `ntsResults` table |
| `app/api/name-that-song/results/submit/route.ts` | Create | POST endpoint |
| `app/api/name-that-song/leaderboard/route.ts` | Create | GET endpoint |

---

## Notes for Developer

1. **Add `boolean` to Drizzle imports** in `nts-schema.ts` — it may not be in the existing import list.
2. **`COUNT(*)::int` cast** is needed because Drizzle returns aggregate counts as strings in some configurations. The `::int` Postgres cast ensures the TypeScript type is `number`.
3. **The leaderboard ranks by username**, not by deviceId. Two different devices that both submit as "alice" will have their wins combined under the same username. This is intentional — no authentication means usernames are not unique by design.
4. **No duplicate prevention on the server.** The localStorage dedup guard in PRD 2A prevents client-side double-submission. The server endpoint does not deduplicate — it trusts the client. This is acceptable for a hobby game.
5. **Add both new routes to middleware.ts public list** if not already covered by the `/api/name-that-song` prefix added in PRD 1B.
