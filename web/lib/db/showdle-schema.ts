import { pgTable, text, integer, boolean, timestamp, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./schema";

// ── Showdle: Daily lyric-guessing game ──────────────────

export const puzzles = pgTable("puzzles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lyric: text("lyric").notNull(),
  answer: text("answer").notNull(), // Stored uppercase
  showName: text("show_name").notNull(),
  songName: text("song_name").notNull().default(""),
  year: integer("year").notNull().default(0),
  characterName: text("character_name").notNull(),
  originalCast: text("original_cast"),
  difficulty: integer("difficulty").notNull(), // 1–6
  // [losses, 1-win, 2-win, 3-win, 4-win, 5-win, 6-win]
  guessDistribution: integer("guess_distribution")
    .array()
    .notNull()
    .default(sql`'{0,0,0,0,0,0,0}'`),
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
  // Nullable: logged-out users can still contribute to aggregate histograms.
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  guessCount: integer("guess_count"), // null on loss
  won: boolean("won").notNull().default(false),
  score: integer("score").notNull().default(0),
  hintUsed: boolean("hint_used").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("puzzle_results_puzzle_completed_idx").on(table.puzzleId, table.completedAt),
  // One result per logged-in user per puzzle; anonymous plays are unconstrained.
  uniqueIndex("puzzle_results_user_puzzle_idx")
    .on(table.userId, table.puzzleId)
    .where(sql`user_id IS NOT NULL`),
  index("puzzle_results_user_completed_idx").on(table.userId, table.completedAt),
  index("puzzle_results_score_idx").on(table.score),
]);
