/**
 * GET /api/mobile/profile — get current user's profile with stats
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireMobileUser,
  MobileAuthError,
} from "@/lib/services/mobileAuth";
import { getProfileById, getFollowCounts } from "@/lib/services/profileService";
import { getUserReviews } from "@/lib/services/musicalReadService";
import { getMusicalsByIds } from "@/lib/services/musicalReadService";
import { deriveProfileStats } from "@/lib/profileStats";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);

    const [profile, followCounts, reviews] = await Promise.all([
      getProfileById(user.id),
      getFollowCounts(user.id),
      getUserReviews(user.id),
    ]);

    // Enrich reviews with musical data for stats
    const musicalIds = [...new Set(reviews.map((r) => r.musical_id))];
    const musicalsMap = await getMusicalsByIds(musicalIds);

    const enrichedReviews = reviews.map((r) => ({
      ...r,
      musical: musicalsMap.get(r.musical_id) ?? null,
    }));

    // Derive profile stats (awards, counts)
    const stats = deriveProfileStats(reviews);

    return NextResponse.json({
      profile: profile
        ? {
            id: profile.id,
            handle: profile.handle,
            display_name: profile.display_name,
          }
        : null,
      followCounts,
      stats,
      reviews: enrichedReviews,
    });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
