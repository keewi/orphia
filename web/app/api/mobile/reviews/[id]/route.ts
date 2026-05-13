/**
 * PUT    /api/mobile/reviews/:id — edit a review
 * DELETE /api/mobile/reviews/:id — delete a review
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireMobileUser,
  MobileAuthError,
} from "@/lib/services/mobileAuth";
import { editReview, deleteReview } from "@/lib/services/musicalWriteService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: reviewId } = await params;
    const body = await request.json();

    const { ratingInt, reviewText, watchDate } = body;

    if (
      !ratingInt ||
      !Number.isInteger(ratingInt) ||
      ratingInt < 1 ||
      ratingInt > 5
    ) {
      return NextResponse.json(
        { error: "ratingInt must be an integer 1-5" },
        { status: 400 }
      );
    }

    await editReview({
      userId: user.id,
      reviewId,
      ratingInt,
      reviewText: reviewText ?? null,
      watchDate: watchDate ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: reviewId } = await params;

    await deleteReview({ userId: user.id, reviewId });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
