import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/showdle-schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const rows = await db
    .select({
      id: puzzles.id,
      lyric: puzzles.lyric,
      showName: puzzles.showName,
      songName: puzzles.songName,
      year: puzzles.year,
      characterName: puzzles.characterName,
      originalCast: puzzles.originalCast,
      difficulty: puzzles.difficulty,
      answer: puzzles.answer,
      guessDistribution: puzzles.guessDistribution,
    })
    .from(puzzles)
    .where(eq(puzzles.id, params.id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  const row = rows[0];
  const totalPlayers = row.guessDistribution.reduce((a, b) => a + b, 0);
  return NextResponse.json({ ...row, totalPlayers });
}
