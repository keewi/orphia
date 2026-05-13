import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ handle: null }, { status: 401 });
  }

  const rows = await db
    .select({ handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  return NextResponse.json({ handle: rows[0]?.handle ?? null });
}
