import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const results = await db
      .select({
        id: ntsSongs.id,
        title: ntsSongs.title,
        musicalName: ntsMusicals.name,
      })
      .from(ntsSongs)
      .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
      .where(eq(ntsSongs.id, id))
      .limit(1);

    if (!results.length) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (err) {
    console.error("[NTS] reveal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
