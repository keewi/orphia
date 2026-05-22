/**
 * GET /api/mobile/profile/:handle — get another user's public profile
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getProfileByIdOrHandle,
  getFollowCounts,
} from "@/lib/services/profileService";
import { getUserReviews, getMusicalsByIds } from "@/lib/services/musicalReadService";
import { getMobileUser } from "@/lib/services/mobileAuth";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { deriveProfileStats } from "@/lib/profileStats";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const profile = await getProfileByIdOrHandle(handle);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [followCountsData, reviews] = await Promise.all([
      getFollowCounts(profile.id),
      getUserReviews(profile.id),
    ]);

    const musicalIds = Array.from(new Set(reviews.map((r) => r.musical_id)));
    const musicalsMap = await getMusicalsByIds(musicalIds);

    const enrichedReviews = reviews.map((r) => ({
      ...r,
      musical: musicalsMap.get(r.musical_id) ?? null,
    }));

    const stats = deriveProfileStats(reviews);

    let isFollowing = false;
    const currentUser = await getMobileUser(request);
    if (currentUser && currentUser.id !== profile.id) {
      const followRows = await db
        .select({ count: count() })
        .from(follows)
        .where(
          and(
            eq(follows.follower_user_id, currentUser.id),
            eq(follows.following_user_id, profile.id)
          )
        );
      isFollowing = (followRows[0]?.count ?? 0) > 0;
    }

    return NextResponse.json({
      profile: { id: profile.id, handle: profile.handle, display_name: profile.display_name },
      followCounts: followCountsData,
      stats,
      reviews: enrichedReviews,
      isFollowing,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
