/**
 * POST /api/mobile/follow — follow or unfollow a user
 *
 * Body: { targetUserId: string, follow: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireMobileUser,
  MobileAuthError,
} from "@/lib/services/mobileAuth";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const { targetUserId, follow } = await request.json();

    if (!targetUserId || typeof follow !== "boolean") {
      return NextResponse.json(
        { error: "targetUserId and follow (boolean) are required" },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    if (follow) {
      await db
        .insert(follows)
        .values({ follower_user_id: user.id, following_user_id: targetUserId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.follower_user_id, user.id),
            eq(follows.following_user_id, targetUserId)
          )
        );
    }

    return NextResponse.json({ success: true, following: follow });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update follow" },
      { status: 500 }
    );
  }
}
