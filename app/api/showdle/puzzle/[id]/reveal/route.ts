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
      showName: puzzles.showName,
      characterName: puzzles.characterName,
      originalCast: puzzles.originalCast,
      difficulty: puzzles.difficulty,
      answer: puzzles.answer,
    })
    .from(puzzles)
    .where(eq(puzzles.id, params.id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
