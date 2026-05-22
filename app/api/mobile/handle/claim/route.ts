/**
 * POST /api/mobile/handle/claim
 *
 * Body: { handle: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, MobileAuthError } from "@/lib/services/mobileAuth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);
    const { handle } = await request.json();

    if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
      return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
    }

    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.handle, handle))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== user.id) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    }

    const userProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (userProfile.length > 0) {
      await db.update(profiles).set({ handle }).where(eq(profiles.id, user.id));
    } else {
      await db.insert(profiles).values({ id: user.id, handle });
    }

    return NextResponse.json({ success: true, handle });
  } catch (err) {
    if (err instanceof MobileAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to claim handle" }, { status: 500 });
  }
}
