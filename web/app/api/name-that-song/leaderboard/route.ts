import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsResults } from "@/lib/db/nts-schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  winsNoHint: number;
}

export async function GET() {
  try {
    const rows = await db
      .select({
        username: ntsResults.username,
        winsNoHint: sql<number>`COUNT(*)::int`,
      })
      .from(ntsResults)
      .where(
        and(
          eq(ntsResults.outcome, "won"),
          eq(ntsResults.hintUsed, false)
        )
      )
      .groupBy(ntsResults.username)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    const leaderboard: LeaderboardEntry[] = rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      winsNoHint: row.winsNoHint,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[NTS] leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
