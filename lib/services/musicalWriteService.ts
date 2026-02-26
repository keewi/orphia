/**
 * Domain write service — the ONLY way the app mutates
 * user_musical_status and user_reviews.
 *
 * Server-only: uses the cookie-based Supabase client.
 * Callers must verify auth and pass a trusted userId.
 *
 * Supports both the new schema (user_musical_status + user_reviews)
 * and the legacy schema (saved_musicals + reviews) for backwards
 * compatibility when the migration has not yet been applied.
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { MusicalStatusValue } from "@/lib/types";

// ── Return types ──────────────────────────────────────────

export interface StatusChangeResult {
  previousStatus: MusicalStatusValue | null;
}

export interface MarkSeenResult {
  reviewId: string;
  previousStatus: MusicalStatusValue | null;
}

// ── Schema detection ─────────────────────────────────────

const TABLE_MISSING_CODE = "PGRST205";

function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === TABLE_MISSING_CODE;
}

// ── Helpers ───────────────────────────────────────────────

async function getCurrentStatus(
  userId: string,
  musicalId: string,
): Promise<MusicalStatusValue | null> {
  const supabase = createClient();

  // Try new table first
  const { data, error } = await supabase
    .from("user_musical_status")
    .select("status")
    .eq("user_id", userId)
    .eq("musical_id", musicalId)
    .maybeSingle();

  if (!error) {
    return (data?.status as MusicalStatusValue) ?? null;
  }

  // New table missing — check legacy tables
  if (isTableMissing(error)) {
    const { data: reviewed } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("musical_id", musicalId)
      .limit(1)
      .maybeSingle();
    if (reviewed) return "seen";

    const { data: saved } = await supabase
      .from("saved_musicals")
      .select("musical_id")
      .eq("user_id", userId)
      .eq("musical_id", musicalId)
      .maybeSingle();
    if (saved) return "want_to_see";

    return null;
  }

  // Some other error — treat as unknown
  return null;
}

async function upsertStatus(
  userId: string,
  musicalId: string,
  status: MusicalStatusValue,
): Promise<void> {
  const supabase = createClient();

  // Try new table first
  const { error } = await supabase.from("user_musical_status").upsert(
    {
      user_id: userId,
      musical_id: musicalId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id, musical_id" },
  );

  if (!error) return;

  // New table missing — fall back to legacy
  if (isTableMissing(error)) {
    if (status === "want_to_see") {
      // Legacy: insert into saved_musicals
      const { error: legacyError } = await supabase
        .from("saved_musicals")
        .upsert(
          { user_id: userId, musical_id: musicalId },
          { onConflict: "user_id, musical_id" },
        );
      if (legacyError) {
        throw new Error(
          `Failed to save musical (legacy): ${legacyError.message}`,
        );
      }
    }
    // "skipped" and "seen" have no legacy saved_musicals equivalent — skip silently.
    // ("seen" is tracked via the reviews table, handled in markSeen.)
    return;
  }

  throw new Error(`Failed to upsert musical status: ${error.message}`);
}

// ── Public API ────────────────────────────────────────────

/**
 * Mark a musical as "want to see".
 * Idempotent — safe to call multiple times.
 */
export async function markWantToSee({
  userId,
  musicalId,
}: {
  userId: string;
  musicalId: string;
}): Promise<StatusChangeResult> {
  const previousStatus = await getCurrentStatus(userId, musicalId);
  await upsertStatus(userId, musicalId, "want_to_see");
  return { previousStatus };
}

/**
 * Mark a musical as "skipped".
 * Idempotent — safe to call multiple times.
 */
export async function markSkipped({
  userId,
  musicalId,
}: {
  userId: string;
  musicalId: string;
}): Promise<StatusChangeResult> {
  const previousStatus = await getCurrentStatus(userId, musicalId);
  await upsertStatus(userId, musicalId, "skipped");
  return { previousStatus };
}

/**
 * Mark a musical as "seen" and create a new review.
 *
 * NOT idempotent — each call inserts a new review row.
 * Callers must guard against double-clicks at the UI level.
 */
export async function markSeen({
  userId,
  musicalId,
  ratingInt,
  reviewText,
  watchDate,
}: {
  userId: string;
  musicalId: string;
  ratingInt: number;
  reviewText?: string | null;
  watchDate?: string | null;
}): Promise<MarkSeenResult> {
  if (ratingInt < 1 || ratingInt > 5 || !Number.isInteger(ratingInt)) {
    throw new Error("ratingInt must be an integer between 1 and 5");
  }

  const previousStatus = await getCurrentStatus(userId, musicalId);

  // 1. Upsert status to 'seen'
  await upsertStatus(userId, musicalId, "seen");

  // 2. Insert a NEW review row (never update existing ones)
  const supabase = createClient();
  const { data: review, error } = await supabase
    .from("user_reviews")
    .insert({
      user_id: userId,
      musical_id: musicalId,
      rating_int: ratingInt,
      review_text: reviewText ?? null,
      watch_date: watchDate ?? null,
    })
    .select("id")
    .single();

  if (!error && review) {
    return { reviewId: review.id, previousStatus };
  }

  // New table missing — fall back to legacy reviews table
  if (isTableMissing(error)) {
    // Legacy reviews table requires musical_title — look it up
    const { data: musical } = await supabase
      .from("musicals")
      .select("title")
      .eq("id", musicalId)
      .single();

    const { data: legacyReview, error: legacyError } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        musical_id: musicalId,
        musical_title: musical?.title ?? "Unknown",
        rating: ratingInt, // legacy uses float, int is compatible
        review_text: reviewText ?? "", // legacy column is NOT NULL
        date_seen: watchDate ?? null,
      })
      .select("id")
      .single();

    if (legacyError || !legacyReview) {
      throw new Error(
        `Failed to insert review (legacy): ${legacyError?.message ?? "no data returned"}`,
      );
    }

    return { reviewId: legacyReview.id, previousStatus };
  }

  throw new Error(
    `Failed to insert review: ${error?.message ?? "no data returned"}`,
  );
}

/**
 * Edit an existing review. Only updates the specified fields.
 * RLS enforces that only the owner can update.
 */
export async function editReview({
  userId,
  reviewId,
  ratingInt,
  reviewText,
  watchDate,
}: {
  userId: string;
  reviewId: string;
  ratingInt: number;
  reviewText?: string | null;
  watchDate?: string | null;
}): Promise<{ success: boolean }> {
  if (ratingInt < 1 || ratingInt > 5 || !Number.isInteger(ratingInt)) {
    throw new Error("ratingInt must be an integer between 1 and 5");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("user_reviews")
    .update({
      rating_int: ratingInt,
      review_text: reviewText ?? null,
      watch_date: watchDate ?? null,
    })
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (!error) return { success: true };

  // Fall back to legacy reviews table
  if (isTableMissing(error)) {
    const { error: legacyError } = await supabase
      .from("reviews")
      .update({
        rating: ratingInt,
        review_text: reviewText ?? null,
        date_seen: watchDate ?? null,
      })
      .eq("id", reviewId)
      .eq("user_id", userId);

    if (legacyError) {
      throw new Error(
        `Failed to update review (legacy): ${legacyError.message}`,
      );
    }
    return { success: true };
  }

  throw new Error(`Failed to update review: ${error.message}`);
}

/**
 * Update only the rating of an existing review.
 * Does not touch review_text or watch_date.
 */
export async function updateRatingOnly({
  userId,
  reviewId,
  ratingInt,
}: {
  userId: string;
  reviewId: string;
  ratingInt: number;
}): Promise<{ success: boolean }> {
  if (ratingInt < 1 || ratingInt > 5 || !Number.isInteger(ratingInt)) {
    throw new Error("ratingInt must be an integer between 1 and 5");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("user_reviews")
    .update({ rating_int: ratingInt })
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (!error) return { success: true };

  if (isTableMissing(error)) {
    const { error: legacyError } = await supabase
      .from("reviews")
      .update({ rating: ratingInt })
      .eq("id", reviewId)
      .eq("user_id", userId);

    if (legacyError) {
      throw new Error(
        `Failed to update rating (legacy): ${legacyError.message}`,
      );
    }
    return { success: true };
  }

  throw new Error(`Failed to update rating: ${error.message}`);
}

/**
 * Remove a musical status entry entirely (for undo).
 */
export async function removeStatus({
  userId,
  musicalId,
}: {
  userId: string;
  musicalId: string;
}): Promise<{ success: boolean }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_musical_status")
    .delete()
    .eq("user_id", userId)
    .eq("musical_id", musicalId);

  if (!error) return { success: true };

  // Fall back to legacy: remove from saved_musicals
  if (isTableMissing(error)) {
    await supabase
      .from("saved_musicals")
      .delete()
      .eq("user_id", userId)
      .eq("musical_id", musicalId);
    return { success: true };
  }

  throw new Error(`Failed to remove musical status: ${error.message}`);
}

/**
 * Restore a musical status to a specific value (for undo).
 * Idempotent — uses upsert.
 */
export async function restoreStatus({
  userId,
  musicalId,
  status,
}: {
  userId: string;
  musicalId: string;
  status: MusicalStatusValue;
}): Promise<{ success: boolean }> {
  await upsertStatus(userId, musicalId, status);
  return { success: true };
}

/**
 * Delete a single review row by ID (for undo).
 * RLS enforces that only the owner can delete.
 */
export async function deleteReview({
  userId,
  reviewId,
}: {
  userId: string;
  reviewId: string;
}): Promise<{ success: boolean }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (!error) return { success: true };

  // Fall back to legacy reviews table
  if (isTableMissing(error)) {
    // Try with the regular client first
    const { data: deletedRows, error: legacyError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", userId)
      .select("id");

    if (legacyError) {
      throw new Error(
        `Failed to delete review (legacy): ${legacyError.message}`,
      );
    }

    // If the regular client succeeded, we're done
    if (deletedRows && deletedRows.length > 0) {
      return { success: true };
    }

    // RLS may silently block DELETE (no policy → 0 rows, no error).
    // Fall back to admin client which bypasses RLS.
    const admin = createAdminClient();
    if (admin) {
      const { data: adminDeleted, error: adminError } = await admin
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", userId)
        .select("id");

      if (adminError) {
        throw new Error(
          `Failed to delete review (admin): ${adminError.message}`,
        );
      }
      if (adminDeleted && adminDeleted.length > 0) {
        return { success: true };
      }
    }

    throw new Error(
      "Could not undo — review deletion was blocked. " +
      "Ensure SUPABASE_SERVICE_ROLE_KEY is set or run " +
      "supabase/migration-fix-reviews-delete-policy.sql",
    );
  }

  throw new Error(`Failed to delete review: ${error.message}`);
}
