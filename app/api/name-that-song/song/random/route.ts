import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db
      .select({
        id: ntsSongs.id,
        musicalName: ntsMusicals.name,
      })
      .from(ntsSongs)
      .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!results.length) {
      return NextResponse.json({ error: "No songs found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (err) {
    console.error("[NTS] random song error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
