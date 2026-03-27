import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/showdle-schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      id: puzzles.id,
      lyric: puzzles.lyric,
      answer: puzzles.answer,
      difficulty: puzzles.difficulty,
      scheduledDate: puzzles.scheduledDate,
    })
    .from(puzzles)
    .where(sql`DATE(${puzzles.scheduledDate}) = DATE(${today.toISOString()})`)
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No puzzle today" }, { status: 404 });
  }

  const puzzle = rows[0];

  return NextResponse.json(
    {
      id: puzzle.id,
      lyric: puzzle.lyric,
      wordLength: puzzle.answer.length,
      difficulty: puzzle.difficulty,
      scheduledDate: puzzle.scheduledDate,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
      },
    },
  );
}
