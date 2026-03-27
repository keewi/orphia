import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles, follows } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const rawHandle = request.nextUrl.searchParams.get("handle") ?? "";
  const handle = rawHandle.trim().toLowerCase().replace(/^@/, "");

  if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json(
      { code: "INVALID_HANDLE" },
      { status: 400 },
    );
  }

  const session = await auth();
  const user = session?.user;

  if (user?.id) {
    const ownProfile = await db
      .select({ handle: profiles.handle })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (ownProfile[0]?.handle === handle) {
      return NextResponse.json(
        { code: "CANNOT_ADD_SELF" },
        { status: 400 },
      );
    }
  }

  // Look up the target profile
  const profileRows = await db
    .select({ id: profiles.id, handle: profiles.handle, display_name: profiles.display_name })
    .from(profiles)
    .where(eq(profiles.handle, handle))
    .limit(1);

  const profile = profileRows[0];

  if (!profile) {
    return NextResponse.json(
      { code: "USER_NOT_FOUND" },
      { status: 404 },
    );
  }

  // Check if already following (informational)
  if (user?.id) {
    const followRows = await db
      .select({ count: count() })
      .from(follows)
      .where(
        and(
          eq(follows.follower_user_id, user.id),
          eq(follows.following_user_id, profile.id),
        ),
      );

    if (followRows[0]?.count && followRows[0].count > 0) {
      return NextResponse.json(
        { code: "ALREADY_FOLLOWING", handle: profile.handle },
        { status: 200 },
      );
    }
  }

  return NextResponse.json(
    { code: "OK", handle: profile.handle },
    { status: 200 },
  );
}
