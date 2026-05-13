import {
  pgTable, text, integer, timestamp, boolean, uniqueIndex, index
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

export const ntsResults = pgTable("nts_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text("device_id").notNull(),
  username: text("username").notNull(),
  songId: text("song_id").references(() => ntsSongs.id).notNull(),
  outcome: text("outcome").notNull(),
  hintUsed: boolean("hint_used").notNull(),
  timeSpent: integer("time_spent").notNull(),
  rightLetters: integer("right_letters").notNull(),
  wrongLetters: integer("wrong_letters").notNull(),
  playedDate: text("played_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("nts_results_device_id_idx").on(t.deviceId),
  index("nts_results_played_date_idx").on(t.playedDate),
  index("nts_results_outcome_hint_idx").on(t.outcome, t.hintUsed),
]);
