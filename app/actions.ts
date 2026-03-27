"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, profiles, follows, userMusicalStatus } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  markSeen,
  markWantToSee,
  markSkipped,
  editReview as editReviewService,
  updateRatingOnly,
  removeStatus,
  restoreStatus,
  deleteReview as deleteReviewService,
} from "@/lib/services/musicalWriteService";
import type { MusicalStatusValue } from "@/lib/types";

// ── Auth helper ──

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ── Registration ──

export async function registerUser(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!email || !password || password.length < 6) {
    return { ok: false, error: "Email and password (min 6 chars) required" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists" };
  }

  const hash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email: email.toLowerCase(), password_hash: hash });

  return { ok: true };
}

// ── Handle claiming ──

export async function claimHandle(
  handle: string,
): Promise<{ ok: boolean; error?: string }> {
  const userId = await getAuthUserId();

  try {
    await db.insert(profiles).values({ id: userId, handle });
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return { ok: false, error: "Handle already taken" };
    }
    return { ok: false, error: msg };
  }
}

export async function checkHandleAvailability(
  handle: string,
): Promise<{ taken: boolean }> {
  const rows = await db
    .select({ handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.handle, handle))
    .limit(1);

  return { taken: rows.length > 0 };
}

// ── Follow toggle ──

export async function toggleFollow(targetUserId: string, follow: boolean) {
  const userId = await getAuthUserId();

  if (follow) {
    await db
      .insert(follows)
      .values({ follower_user_id: userId, following_user_id: targetUserId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.follower_user_id, userId),
          eq(follows.following_user_id, targetUserId),
        ),
      );
  }
}

// ── Save musical toggle ──

export async function toggleSaveMusical(musicalId: string, save: boolean) {
  const userId = await getAuthUserId();

  if (save) {
    await db
      .insert(userMusicalStatus)
      .values({
        user_id: userId,
        musical_id: musicalId,
        status: "want_to_see",
      })
      .onConflictDoUpdate({
        target: [userMusicalStatus.user_id, userMusicalStatus.musical_id],
        set: { status: "want_to_see", updated_at: new Date() },
      });
  } else {
    await db
      .delete(userMusicalStatus)
      .where(
        and(
          eq(userMusicalStatus.user_id, userId),
          eq(userMusicalStatus.musical_id, musicalId),
        ),
      );
  }
}

// ── Review actions ──

export async function addReview(formData: FormData) {
  const musicalId = formData.get("musicalId") as string;
  const ratingInt = parseInt(formData.get("rating") as string, 10);
  const reviewText = (formData.get("reviewText") as string) || null;
  const watchDate = (formData.get("dateSeen") as string) || null;

  const userId = await getAuthUserId();

  await markSeen({ userId, musicalId, ratingInt, reviewText, watchDate });

  redirect("/browse");
}

export async function editReview(formData: FormData) {
  const reviewId = formData.get("reviewId") as string;
  const ratingInt = parseInt(formData.get("rating") as string, 10);
  const reviewText = (formData.get("reviewText") as string) || null;
  const watchDate = (formData.get("dateSeen") as string) || null;

  const userId = await getAuthUserId();

  await editReviewService({ userId, reviewId, ratingInt, reviewText, watchDate });

  redirect("/my-theatre-life");
}

// ── Inline gallery actions (no redirect) ──

export async function quickRate(reviewId: string, ratingInt: number) {
  const userId = await getAuthUserId();
  await updateRatingOnly({ userId, reviewId, ratingInt });
  return { ok: true };
}

export async function removePlaybill(reviewId: string) {
  const userId = await getAuthUserId();
  await deleteReviewService({ userId, reviewId });
  return { ok: true };
}

// ── Explore carousel actions (no redirect — return undo payload) ──

export type ExploreActionResult = {
  ok: true;
  actionType: "want_to_see" | "skipped" | "seen";
  musicalId: string;
  previousStatus: MusicalStatusValue | null;
  reviewId?: string;
  ratingInt?: number;
};

export async function exploreWantToSee(
  musicalId: string,
): Promise<ExploreActionResult> {
  const userId = await getAuthUserId();
  const { previousStatus } = await markWantToSee({ userId, musicalId });
  revalidatePath("/");
  return { ok: true, actionType: "want_to_see", musicalId, previousStatus };
}

export async function exploreSkip(
  musicalId: string,
): Promise<ExploreActionResult> {
  const userId = await getAuthUserId();
  const { previousStatus } = await markSkipped({ userId, musicalId });
  revalidatePath("/");
  return { ok: true, actionType: "skipped", musicalId, previousStatus };
}

export async function exploreSeen(
  musicalId: string,
  ratingInt: number,
): Promise<ExploreActionResult> {
  const userId = await getAuthUserId();
  const { reviewId, previousStatus } = await markSeen({ userId, musicalId, ratingInt });
  revalidatePath("/");
  return {
    ok: true,
    actionType: "seen",
    musicalId,
    previousStatus,
    reviewId,
    ratingInt,
  };
}

// ── Explore undo ──

export async function exploreUndo(payload: {
  actionType: "want_to_see" | "skipped" | "seen";
  musicalId: string;
  previousStatus: MusicalStatusValue | null;
  reviewId?: string;
}) {
  const userId = await getAuthUserId();

  if (payload.previousStatus === null) {
    await removeStatus({ userId, musicalId: payload.musicalId });
  } else {
    await restoreStatus({
      userId,
      musicalId: payload.musicalId,
      status: payload.previousStatus,
    });
  }

  if (payload.actionType === "seen" && payload.reviewId) {
    await deleteReviewService({ userId, reviewId: payload.reviewId });
  }

  revalidatePath("/");
  return { ok: true };
}
