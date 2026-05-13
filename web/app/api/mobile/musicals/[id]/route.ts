/**
 * GET /api/mobile/musicals/:id
 *
 * Get a single musical's details, plus the current user's reviews
 * and status for it (if authenticated).
 */

import { NextRequest, NextResponse } from "next/server";
import { getMusicalById } from "@/lib/services/musicalReadService";
import { getMobileUser } from "@/lib/services/mobileAuth";
import { db } from "@/lib/db";
import { userReviews, userMusicalStatus } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const musical = await getMusicalById(id);

    if (!musical) {
      return NextResponse.json(
        { error: "Musical not found" },
        { status: 404 }
      );
    }

    // If user is authenticated, include their reviews and status
    const user = await getMobileUser(request);
    let reviews: unknown[] = [];
    let status: string | null = null;

    if (user) {
      const [reviewRows, statusRows] = await Promise.all([
        db
          .select()
          .from(userReviews)
          .where(
            and(
              eq(userReviews.user_id, user.id),
              eq(userReviews.musical_id, id)
            )
          )
          .orderBy(desc(userReviews.created_at)),
        db
          .select({ status: userMusicalStatus.status })
          .from(userMusicalStatus)
          .where(
            and(
              eq(userMusicalStatus.user_id, user.id),
              eq(userMusicalStatus.musical_id, id)
            )
          )
          .limit(1),
      ]);

      reviews = reviewRows.map((r) => ({
        id: r.id,
        rating_int: r.rating_int,
        review_text: r.review_text,
        watch_date: r.watch_date,
        created_at: r.created_at.toISOString(),
      }));

      status = statusRows[0]?.status ?? null;
    }

    return NextResponse.json({
      musical,
      userReviews: reviews,
      userStatus: status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch musical" },
      { status: 500 }
    );
  }
}
