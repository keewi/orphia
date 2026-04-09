import { pgTable, text, integer, timestamp, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema";

// ── Showdle: Daily lyric-guessing game ──────────────────

export const puzzles = pgTable("puzzles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lyric: text("lyric").notNull(),
  answer: text("answer").notNull(), // Stored uppercase
  showName: text("show_name").notNull(),
  characterName: text("character_name").notNull(),
  originalCast: text("original_cast"),
  difficulty: integer("difficulty").notNull(), // 1–6
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("puzzles_scheduled_date_idx").on(table.scheduledDate),
]);

export const puzzleResults = pgTable("puzzle_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  puzzleId: text("puzzle_id")
    .references(() => puzzles.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  guessCount: integer("guess_count").notNull(),
  won: integer("won").notNull(), // 1 = true, 0 = false (boolean via int for portability)
  hintUsed: integer("hint_used").default(0).notNull(), // Pre-built for Slice 2
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("puzzle_results_puzzle_completed_idx").on(table.puzzleId, table.completedAt),
  uniqueIndex("puzzle_results_user_puzzle_idx").on(table.userId, table.puzzleId),
]);
