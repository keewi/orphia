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
