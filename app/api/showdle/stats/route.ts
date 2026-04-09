import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/db/showdle-schema";
import { computeStreaks, computeLast7 } from "@/lib/showdle/stats";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const results = await db
    .select({
      won: puzzleResults.won,
      guessCount: puzzleResults.guessCount,
      score: puzzleResults.score,
      completedAt: puzzleResults.completedAt,
    })
    .from(puzzleResults)
    .where(eq(puzzleResults.userId, userId))
    .orderBy(desc(puzzleResults.completedAt));

  const totalPlayed = results.length;
  const wins = results.filter((r) => r.won);
  const winRate = totalPlayed === 0 ? 0 : Math.round((wins.length / totalPlayed) * 100);
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgGuesses =
    wins.length === 0
      ? null
      : Math.round(
          (wins.reduce((s, r) => s + (r.guessCount ?? 0), 0) / wins.length) * 10,
        ) / 10;

  // Personal [losses, 1, 2, 3, 4, 5, 6]
  const guessDistribution = [0, 0, 0, 0, 0, 0, 0];
  for (const r of results) {
    if (!r.won) {
      guessDistribution[0]++;
    } else if (r.guessCount && r.guessCount >= 1 && r.guessCount <= 6) {
      guessDistribution[r.guessCount]++;
    }
  }

  const { currentStreak, maxStreak } = computeStreaks(results);
  const last7 = computeLast7(results);

  return NextResponse.json({
    totalPlayed,
    winRate,
    currentStreak,
    maxStreak,
    totalScore,
    avgGuesses,
    guessDistribution,
    last7,
  });
}
