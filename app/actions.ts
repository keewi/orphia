"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  markSeen,
  markWantToSee,
  markSkipped,
  editReview as editReviewService,
  removeStatus,
  restoreStatus,
  deleteReview as deleteReviewService,
} from "@/lib/services/musicalWriteService";
import type { MusicalStatusValue } from "@/lib/types";

export async function addReview(formData: FormData) {
  const musicalId = formData.get("musicalId") as string;
  const ratingInt = parseInt(formData.get("rating") as string, 10);
  const reviewText = (formData.get("reviewText") as string) || null;
  const watchDate = (formData.get("dateSeen") as string) || null;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  await markSeen({
    userId: user.id,
    musicalId,
    ratingInt,
    reviewText,
    watchDate,
  });

  redirect("/browse");
}

export async function editReview(formData: FormData) {
  const reviewId = formData.get("reviewId") as string;
  const ratingInt = parseInt(formData.get("rating") as string, 10);
  const reviewText = (formData.get("reviewText") as string) || null;
  const watchDate = (formData.get("dateSeen") as string) || null;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  await editReviewService({
    userId: user.id,
    reviewId,
    ratingInt,
    reviewText,
    watchDate,
  });

  redirect("/my-theatre-life");
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { previousStatus } = await markWantToSee({
    userId: user.id,
    musicalId,
  });
  return { ok: true, actionType: "want_to_see", musicalId, previousStatus };
}

export async function exploreSkip(
  musicalId: string,
): Promise<ExploreActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { previousStatus } = await markSkipped({
    userId: user.id,
    musicalId,
  });
  return { ok: true, actionType: "skipped", musicalId, previousStatus };
}

export async function exploreSeen(
  musicalId: string,
  ratingInt: number,
): Promise<ExploreActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { reviewId, previousStatus } = await markSeen({
    userId: user.id,
    musicalId,
    ratingInt,
  });
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Restore or remove status
  if (payload.previousStatus === null) {
    await removeStatus({ userId: user.id, musicalId: payload.musicalId });
  } else {
    await restoreStatus({
      userId: user.id,
      musicalId: payload.musicalId,
      status: payload.previousStatus,
    });
  }

  // 2. If the action was "seen", also delete the newly created review
  if (payload.actionType === "seen" && payload.reviewId) {
    await deleteReviewService({
      userId: user.id,
      reviewId: payload.reviewId,
    });
  }

  return { ok: true };
}
