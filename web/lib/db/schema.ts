import {
  pgTable,
  pgEnum,
  text,
  integer,
  uuid,
  timestamp,
  date,
  primaryKey,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────

export const musicalStatusEnum = pgEnum("musical_status", [
  "want_to_see",
  "seen",
  "skipped",
]);

// ── Users (replaces Supabase auth.users) ─────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  password_hash: text("password_hash"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Musicals catalog ─────────────────────────────────────

export const musicals = pgTable("musicals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  description: text("description").notNull(),
  image_url: text("image_url"),
  popularity_rank: integer("popularity_rank"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── User musical status ──────────────────────────────────

export const userMusicalStatus = pgTable(
  "user_musical_status",
  {
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    musical_id: text("musical_id")
      .references(() => musicals.id, { onDelete: "cascade" })
      .notNull(),
    status: musicalStatusEnum("status").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.musical_id] }),
  ],
);

// ── User reviews ─────────────────────────────────────────

export const userReviews = pgTable(
  "user_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    musical_id: text("musical_id")
      .references(() => musicals.id, { onDelete: "cascade" })
      .notNull(),
    rating_int: integer("rating_int").notNull(),
    review_text: text("review_text"),
    watch_date: date("watch_date"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("rating_check", sql`${table.rating_int} >= 1 AND ${table.rating_int} <= 5`),
    index("idx_user_reviews_user_musical_created").on(
      table.user_id,
      table.musical_id,
      table.created_at,
    ),
    index("idx_user_reviews_user_id").on(table.user_id, table.created_at),
  ],
);

// ── Profiles ─────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .references(() => users.id, { onDelete: "cascade" })
      .primaryKey(),
    handle: text("handle").unique().notNull(),
    display_name: text("display_name"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("handle_format", sql`${table.handle} ~ '^[a-z0-9_]{3,20}$'`),
  ],
);

// ── Follows ──────────────────────────────────────────────

export const follows = pgTable(
  "follows",
  {
    follower_user_id: uuid("follower_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    following_user_id: uuid("following_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.follower_user_id, table.following_user_id] }),
    check("no_self_follow", sql`${table.follower_user_id} != ${table.following_user_id}`),
  ],
);
