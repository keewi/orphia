/**
 * GET /api/mobile/friends/feed — activity feed from followed users
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireMobileUser,
  MobileAuthError,
} from "@/lib/services/mobileAuth";
import { getFollowedUserIds, getProfilesByIds } from "@/lib/services/profileService";
import {
  getReviewsForUsers,
  getWantToSeeForUsers,
  getMusicalsByIds,
} from "@/lib/services/musicalReadService";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const followedIds = await getFollowedUserIds(user.id);

    if (followedIds.length === 0) {
      return NextResponse.json({ feed: [], following: 0 });
    }

    const [reviews, wantToSee] = await Promise.all([
      getReviewsForUsers(followedIds, 30),
      getWantToSeeForUsers(followedIds, 20),
    ]);

    const allMusicalIds = [
      ...new Set([
        ...reviews.map((r) => r.musical_id),
        ...wantToSee.map((w) => w.musical_id),
      ]),
    ];
    const allUserIds = [
      ...new Set([
        ...reviews.map((r) => r.user_id),
        ...wantToSee.map((w) => w.user_id),
      ]),
    ];

    const [musicalsMap, profilesMap] = await Promise.all([
      getMusicalsByIds(allMusicalIds),
      getProfilesByIds(allUserIds),
    ]);

    const feedItems = [
      ...reviews.map((r) => ({
        type: "review" as const,
        userId: r.user_id,
        musicalId: r.musical_id,
        musical: musicalsMap.get(r.musical_id) ?? null,
        user: profilesMap.get(r.user_id) ?? null,
        ratingInt: r.rating_int,
        reviewText: r.review_text,
        createdAt: r.created_at,
      })),
      ...wantToSee.map((w) => ({
        type: "want_to_see" as const,
        userId: w.user_id,
        musicalId: w.musical_id,
        musical: musicalsMap.get(w.musical_id) ?? null,
        user: profilesMap.get(w.user_id) ?? null,
        ratingInt: null,
        reviewText: null,
        createdAt: w.created_at,
      })),
    ];

    feedItems.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      feed: feedItems.slice(0, 50),
      following: followedIds.length,
    });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
