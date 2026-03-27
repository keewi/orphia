/**
 * Domain write service — the ONLY way the app mutates
 * user_musical_status and user_reviews.
 *
 * Server-only: uses the Drizzle client with Neon.
 * Callers must verify auth and pass a trusted userId.
 */

import { db } from "@/lib/db";
import { userMusicalStatus, userReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { MusicalStatusValue } from "@/lib/types";

// ── Return types ──────────────────────────────────────────

export interface StatusChangeResult {
  previousStatus: MusicalStatusValue | null;
}

export interface MarkSeenResult {
  reviewId: string;
  previousStatus: MusicalStatusValue | null;
}

// ── Helpers ───────────────────────────────────────────────

async function getCurrentStatus(
  userId: string,
  musicalId: string,
): Promise<MusicalStatusValue | null> {
  const rows = await db
    .select({ status: userMusicalStatus.status })
    .from(userMusicalStatus)
    .where(
      and(
        eq(userMusicalStatus.user_id, userId),
        eq(userMusicalStatus.musical_id, musicalId),
      ),
    )
    .limit(1);

  return (rows[0]?.status as MusicalStatusValue) ?? null;
}

async function upsertStatus(
  userId: string,
  musicalId: string,
  status: MusicalStatusValue,
): Promise<void> {
  await db
    .insert(userMusicalStatus)
    .values({
      user_id: userId,
      musical_id: musicalId,
      status,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: [userMusicalStatus.user_id, userMusicalStatus.musical_id],
      set: { status, updated_at: new Date() },
    });
}

// ── Public API ────────────────────────────────────────────

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
  const [review] = await db
    .insert(userReviews)
    .values({
      user_id: userId,
      musical_id: musicalId,
      rating_int: ratingInt,
      review_text: reviewText ?? null,
      watch_date: watchDate ?? null,
    })
    .returning({ id: userReviews.id });

  return { reviewId: review.id, previousStatus };
}

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

  await db
    .update(userReviews)
    .set({
      rating_int: ratingInt,
      review_text: reviewText ?? null,
      watch_date: watchDate ?? null,
    })
    .where(and(eq(userReviews.id, reviewId), eq(userReviews.user_id, userId)));

  return { success: true };
}

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

  await db
    .update(userReviews)
    .set({ rating_int: ratingInt })
    .where(and(eq(userReviews.id, reviewId), eq(userReviews.user_id, userId)));

  return { success: true };
}

export async function removeStatus({
  userId,
  musicalId,
}: {
  userId: string;
  musicalId: string;
}): Promise<{ success: boolean }> {
  await db
    .delete(userMusicalStatus)
    .where(
      and(
        eq(userMusicalStatus.user_id, userId),
        eq(userMusicalStatus.musical_id, musicalId),
      ),
    );

  return { success: true };
}

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

export async function deleteReview({
  userId,
  reviewId,
}: {
  userId: string;
  reviewId: string;
}): Promise<{ success: boolean }> {
  await db
    .delete(userReviews)
    .where(and(eq(userReviews.id, reviewId), eq(userReviews.user_id, userId)));

  return { success: true };
}
