/**
 * Centralized read service for musicals, reviews, and statuses.
 *
 * Server-only: uses the Drizzle client with Neon.
 */

import { db } from "@/lib/db";
import { musicals, userReviews, userMusicalStatus } from "@/lib/db/schema";
import { eq, inArray, and, desc, asc, sql } from "drizzle-orm";

// ── Shared row shapes ────────────────────────────────────

export interface ReviewRow {
  id: string;
  user_id: string;
  musical_id: string;
  rating_int: number;
  review_text: string | null;
  watch_date: string | null;
  created_at: string;
}

export interface MusicalRow {
  id: string;
  title: string;
  image_url: string | null;
}

export interface MusicalFull {
  id: string;
  title: string;
  year: number;
  description: string;
  image_url: string | null;
  popularity_rank?: number | null;
}

// ── Helpers ──────────────────────────────────────────────

function toReviewRow(r: typeof userReviews.$inferSelect): ReviewRow {
  return {
    id: r.id,
    user_id: r.user_id,
    musical_id: r.musical_id,
    rating_int: r.rating_int,
    review_text: r.review_text,
    watch_date: r.watch_date,
    created_at: r.created_at.toISOString(),
  };
}

// ── Reviews ──────────────────────────────────────────────

export async function getUserReviews(userId: string): Promise<ReviewRow[]> {
  const rows = await db
    .select()
    .from(userReviews)
    .where(eq(userReviews.user_id, userId))
    .orderBy(desc(userReviews.created_at));

  return rows.map(toReviewRow);
}

export async function getReviewsForUsers(
  userIds: string[],
  limit = 20,
): Promise<ReviewRow[]> {
  if (userIds.length === 0) return [];

  const rows = await db
    .select()
    .from(userReviews)
    .where(inArray(userReviews.user_id, userIds))
    .orderBy(desc(userReviews.created_at))
    .limit(limit);

  return rows.map(toReviewRow);
}

export async function getReviewStatsForUsers(
  userIds: string[],
): Promise<{ user_id: string; musical_id: string; watch_date: string | null; created_at: string }[]> {
  if (userIds.length === 0) return [];

  const rows = await db
    .select({
      user_id: userReviews.user_id,
      musical_id: userReviews.musical_id,
      watch_date: userReviews.watch_date,
      created_at: userReviews.created_at,
    })
    .from(userReviews)
    .where(inArray(userReviews.user_id, userIds));

  return rows.map((r) => ({
    user_id: r.user_id,
    musical_id: r.musical_id,
    watch_date: r.watch_date,
    created_at: r.created_at.toISOString(),
  }));
}

// ── Single review (for edit page) ────────────────────────

export async function getReviewById(
  reviewId: string,
  userId: string,
): Promise<ReviewRow | null> {
  const rows = await db
    .select()
    .from(userReviews)
    .where(and(eq(userReviews.id, reviewId), eq(userReviews.user_id, userId)))
    .limit(1);

  return rows[0] ? toReviewRow(rows[0]) : null;
}

// ── Statuses ─────────────────────────────────────────────

export async function getWantToSeeForUsers(
  userIds: string[],
  limit = 20,
): Promise<{ user_id: string; musical_id: string; created_at: string }[]> {
  if (userIds.length === 0) return [];

  const rows = await db
    .select({
      user_id: userMusicalStatus.user_id,
      musical_id: userMusicalStatus.musical_id,
      created_at: userMusicalStatus.created_at,
    })
    .from(userMusicalStatus)
    .where(
      and(
        inArray(userMusicalStatus.user_id, userIds),
        eq(userMusicalStatus.status, "want_to_see"),
      ),
    )
    .orderBy(desc(userMusicalStatus.created_at))
    .limit(limit);

  return rows.map((r) => ({
    user_id: r.user_id,
    musical_id: r.musical_id,
    created_at: r.created_at.toISOString(),
  }));
}

export async function getUserActedMusicalIds(
  userId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ musical_id: userMusicalStatus.musical_id })
    .from(userMusicalStatus)
    .where(eq(userMusicalStatus.user_id, userId));

  return new Set(rows.map((r) => r.musical_id));
}

export async function getBrowseStatusMap(
  userId: string,
): Promise<Record<string, { seenCount: number; savedForLater: boolean }>> {
  const [reviewRows, savedRows] = await Promise.all([
    db
      .select({ musical_id: userReviews.musical_id })
      .from(userReviews)
      .where(eq(userReviews.user_id, userId)),
    db
      .select({ musical_id: userMusicalStatus.musical_id })
      .from(userMusicalStatus)
      .where(
        and(
          eq(userMusicalStatus.user_id, userId),
          eq(userMusicalStatus.status, "want_to_see"),
        ),
      ),
  ]);

  const seenCounts = new Map<string, number>();
  for (const r of reviewRows) {
    seenCounts.set(r.musical_id, (seenCounts.get(r.musical_id) ?? 0) + 1);
  }
  const savedSet = new Set(savedRows.map((s) => s.musical_id));

  const statusMap: Record<string, { seenCount: number; savedForLater: boolean }> = {};
  seenCounts.forEach((count, id) => {
    statusMap[id] = { seenCount: count, savedForLater: savedSet.has(id) };
  });
  savedSet.forEach((id) => {
    if (!statusMap[id]) {
      statusMap[id] = { seenCount: 0, savedForLater: true };
    }
  });

  return statusMap;
}

// ── Musicals catalog ─────────────────────────────────────

export async function getAllMusicals(): Promise<MusicalFull[]> {
  const rows = await db
    .select()
    .from(musicals)
    .orderBy(
      sql`${musicals.popularity_rank} ASC NULLS LAST`,
      asc(musicals.title),
    );

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    year: m.year,
    description: m.description,
    image_url: m.image_url,
    popularity_rank: m.popularity_rank,
  }));
}

export async function getAllMusicalsAlpha(): Promise<MusicalFull[]> {
  const rows = await db
    .select()
    .from(musicals)
    .orderBy(asc(musicals.title));

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    year: m.year,
    description: m.description,
    image_url: m.image_url,
  }));
}

export async function getMusicalsByIds(
  ids: string[],
): Promise<Map<string, MusicalRow>> {
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({ id: musicals.id, title: musicals.title, image_url: musicals.image_url })
    .from(musicals)
    .where(inArray(musicals.id, ids));

  return new Map(rows.map((m) => [m.id, m]));
}

export async function getMusicalById(
  id: string,
): Promise<MusicalFull | null> {
  const rows = await db
    .select()
    .from(musicals)
    .where(eq(musicals.id, id))
    .limit(1);

  const m = rows[0];
  if (!m) return null;

  return {
    id: m.id,
    title: m.title,
    year: m.year,
    description: m.description,
    image_url: m.image_url,
  };
}
