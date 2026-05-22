/**
 * GET  /api/mobile/reviews — get current user's reviews
 * POST /api/mobile/reviews — create a new review (marks musical as "seen")
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireMobileUser,
  MobileAuthError,
} from "@/lib/services/mobileAuth";
import { getUserReviews, getMusicalsByIds } from "@/lib/services/musicalReadService";
import { markSeen } from "@/lib/services/musicalWriteService";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const reviews = await getUserReviews(user.id);

    const musicalIds = [...new Set(reviews.map((r) => r.musical_id))];
    const musicalsMap = await getMusicalsByIds(musicalIds);

    const enriched = reviews.map((r) => ({
      ...r,
      musical: musicalsMap.get(r.musical_id) ?? null,
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const body = await request.json();

    const { musicalId, ratingInt, reviewText, watchDate } = body;

    if (!musicalId || !ratingInt) {
      return NextResponse.json(
        { error: "musicalId and ratingInt are required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json(
        { error: "ratingInt must be an integer 1-5" },
        { status: 400 }
      );
    }

    const result = await markSeen({
      userId: user.id,
      musicalId,
      ratingInt,
      reviewText: reviewText ?? null,
      watchDate: watchDate ?? null,
    });

    return NextResponse.json({ reviewId: result.reviewId }, { status: 201 });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
