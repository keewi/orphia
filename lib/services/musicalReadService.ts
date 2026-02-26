/**
 * Centralized read service for musicals, reviews, and statuses.
 *
 * Every read query goes through here so that legacy-schema fallback
 * logic exists in exactly ONE place instead of being duplicated in
 * every page component.
 *
 * Server-only: uses the cookie-based Supabase client.
 */

import { createClient } from "@/lib/supabase/server";
import { isTableMissing, normalizeLegacyReview } from "@/lib/supabase/compat";

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

// ── Reviews ──────────────────────────────────────────────

/**
 * Fetch all reviews for a single user (newest first).
 * Transparently falls back to the legacy `reviews` table.
 */
export async function getUserReviews(userId: string): Promise<ReviewRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, user_id, musical_id, rating_int, review_text, watch_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!error) return data ?? [];

  if (isTableMissing(error)) {
    const { data: legacy } = await supabase
      .from("reviews")
      .select("id, user_id, musical_id, rating, review_text, date_seen, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (legacy ?? []).map(normalizeLegacyReview) as ReviewRow[];
  }

  return [];
}

/**
 * Fetch reviews for multiple users (newest first, with limit).
 */
export async function getReviewsForUsers(
  userIds: string[],
  limit = 20,
): Promise<ReviewRow[]> {
  if (userIds.length === 0) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, user_id, musical_id, rating_int, review_text, watch_date, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!error) return data ?? [];

  if (isTableMissing(error)) {
    const { data: legacy } = await supabase
      .from("reviews")
      .select("id, user_id, musical_id, rating, review_text, date_seen, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (legacy ?? []).map(normalizeLegacyReview) as ReviewRow[];
  }

  return [];
}

/**
 * Fetch minimal review rows for multiple users (for following page stats).
 */
export async function getReviewStatsForUsers(
  userIds: string[],
): Promise<{ user_id: string; musical_id: string; watch_date: string | null; created_at: string }[]> {
  if (userIds.length === 0) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_reviews")
    .select("user_id, musical_id, watch_date, created_at")
    .in("user_id", userIds);

  if (!error) return data ?? [];

  if (isTableMissing(error)) {
    const { data: legacy } = await supabase
      .from("reviews")
      .select("user_id, musical_id, date_seen, created_at")
      .in("user_id", userIds);
    return (legacy ?? []).map((r) => ({
      ...r,
      watch_date:
        (r as Record<string, unknown>).date_seen as string | null ?? null,
    }));
  }

  return [];
}

// ── Single review (for edit page) ────────────────────────

/**
 * Fetch a single review by ID, scoped to the owning user.
 */
export async function getReviewById(
  reviewId: string,
  userId: string,
): Promise<ReviewRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, user_id, musical_id, rating_int, review_text, watch_date, created_at")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();

  if (!error && data) return data as ReviewRow;

  if (isTableMissing(error)) {
    const { data: legacy } = await supabase
      .from("reviews")
      .select("id, user_id, musical_id, rating, review_text, date_seen, created_at")
      .eq("id", reviewId)
      .eq("user_id", userId)
      .single();
    if (legacy) return normalizeLegacyReview(legacy) as unknown as ReviewRow;
  }

  return null;
}

// ── Statuses ─────────────────────────────────────────────

/**
 * Fetch "want to see" statuses for multiple users (newest first, with limit).
 */
export async function getWantToSeeForUsers(
  userIds: string[],
  limit = 20,
): Promise<{ user_id: string; musical_id: string; created_at: string }[]> {
  if (userIds.length === 0) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_musical_status")
    .select("user_id, musical_id, created_at")
    .in("user_id", userIds)
    .eq("status", "want_to_see")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!error) return data ?? [];

  if (isTableMissing(error)) {
    const { data: legacy } = await supabase
      .from("saved_musicals")
      .select("user_id, musical_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(limit);
    return legacy ?? [];
  }

  return [];
}

/**
 * Get musical IDs where a user has any status (for explore filtering).
 */
export async function getUserActedMusicalIds(
  userId: string,
): Promise<Set<string>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_musical_status")
    .select("musical_id")
    .eq("user_id", userId);

  if (!error && data) {
    return new Set(data.map((s) => s.musical_id));
  }

  if (error?.code === "PGRST205") {
    const [{ data: savedRows }, { data: reviewRows }] = await Promise.all([
      supabase
        .from("saved_musicals")
        .select("musical_id")
        .eq("user_id", userId),
      supabase.from("reviews").select("musical_id").eq("user_id", userId),
    ]);
    const ids = new Set<string>();
    for (const r of savedRows ?? []) ids.add(r.musical_id);
    for (const r of reviewRows ?? []) ids.add(r.musical_id);
    return ids;
  }

  return new Set();
}

/**
 * Build a status map for the Browse page: { musicalId → { seenCount, savedForLater } }.
 */
export async function getBrowseStatusMap(
  userId: string,
): Promise<Record<string, { seenCount: number; savedForLater: boolean }>> {
  const supabase = createClient();

  const [
    { data: reviewData, error: reviewError },
    { data: savedData, error: savedError },
  ] = await Promise.all([
    supabase.from("user_reviews").select("musical_id").eq("user_id", userId),
    supabase
      .from("user_musical_status")
      .select("musical_id")
      .eq("user_id", userId)
      .eq("status", "want_to_see"),
  ]);

  let reviewRows = reviewData;
  if (isTableMissing(reviewError)) {
    const { data: legacy } = await supabase
      .from("reviews")
      .select("musical_id")
      .eq("user_id", userId);
    reviewRows = legacy;
  }

  let savedRows = savedData;
  if (isTableMissing(savedError)) {
    const { data: legacy } = await supabase
      .from("saved_musicals")
      .select("musical_id")
      .eq("user_id", userId);
    savedRows = legacy;
  }

  const seenCounts = new Map<string, number>();
  for (const r of reviewRows ?? []) {
    seenCounts.set(r.musical_id, (seenCounts.get(r.musical_id) ?? 0) + 1);
  }
  const savedSet = new Set((savedRows ?? []).map((s) => s.musical_id));

  const statusMap: Record<string, { seenCount: number; savedForLater: boolean }> = {};
  // Only populate for musicals that have either reviews or saves
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

/**
 * Fetch all musicals, ordered by popularity_rank then title.
 * Falls back to title-only ordering if popularity_rank column doesn't exist.
 */
export async function getAllMusicals(): Promise<MusicalFull[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("musicals")
    .select("id, title, year, description, image_url, popularity_rank")
    .order("popularity_rank", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  if (!error) return data ?? [];

  // popularity_rank column may not exist yet
  const fallback = await supabase
    .from("musicals")
    .select("id, title, year, description, image_url")
    .order("title", { ascending: true });

  return fallback.data ?? [];
}

/**
 * Fetch all musicals ordered by title (for browse page).
 */
export async function getAllMusicalsAlpha(): Promise<MusicalFull[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("musicals")
    .select("id, title, year, description, image_url")
    .order("title");

  return data ?? [];
}

/**
 * Batch-fetch musicals by IDs (for poster/title lookup).
 * Returns a Map for O(1) access.
 */
export async function getMusicalsByIds(
  ids: string[],
): Promise<Map<string, MusicalRow>> {
  if (ids.length === 0) return new Map();
  const supabase = createClient();

  const { data } = await supabase
    .from("musicals")
    .select("id, title, image_url")
    .in("id", ids);

  return new Map((data ?? []).map((m) => [m.id, m]));
}

/**
 * Fetch a single musical by ID.
 */
export async function getMusicalById(
  id: string,
): Promise<MusicalFull | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("musicals")
    .select("id, title, year, description, image_url")
    .eq("id", id)
    .single();

  return data ?? null;
}
