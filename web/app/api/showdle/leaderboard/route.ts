import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/db/showdle-schema";
import { eq, desc } from "drizzle-orm";
import { computeStreaks } from "@/lib/showdle/stats";
import { auth } from "@/auth";

type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  currentStreak: number;
  isCurrentUser: boolean;
};

/** Monday 00:00 UTC of the current ISO week. */
function getISOWeekStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") === "weekly" ? "weekly" : "alltime";

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const weekStart = getISOWeekStart();

  // Top 10 aggregate by SUM(score), joined to profiles for display name.
  // Rank() so ties share a rank; users with no profile still show via COALESCE.
  const topQuery =
    tab === "weekly"
      ? sql`
        SELECT
          pr.user_id AS "userId",
          COALESCE(p.handle, 'player') AS "displayName",
          SUM(pr.score)::int AS score,
          RANK() OVER (ORDER BY SUM(pr.score) DESC) AS rank
        FROM puzzle_results pr
        LEFT JOIN profiles p ON p.id = pr.user_id
        WHERE pr.user_id IS NOT NULL AND pr.completed_at >= ${weekStart.toISOString()}
        GROUP BY pr.user_id, p.handle
        ORDER BY score DESC
        LIMIT 10
      `
      : sql`
        SELECT
          pr.user_id AS "userId",
          COALESCE(p.handle, 'player') AS "displayName",
          SUM(pr.score)::int AS score,
          RANK() OVER (ORDER BY SUM(pr.score) DESC) AS rank
        FROM puzzle_results pr
        LEFT JOIN profiles p ON p.id = pr.user_id
        WHERE pr.user_id IS NOT NULL
        GROUP BY pr.user_id, p.handle
        ORDER BY score DESC
        LIMIT 10
      `;

  const topRaw = (await db.execute(topQuery)) as unknown as {
    rows: { userId: string; displayName: string; score: number; rank: number | string }[];
  };

  // Compute currentStreak per top row by fetching each user's recent results.
  // Limited to top 10 — acceptable query count.
  const rows: LeaderboardRow[] = [];
  for (const r of topRaw.rows) {
    const hist = await db
      .select({
        won: puzzleResults.won,
        completedAt: puzzleResults.completedAt,
      })
      .from(puzzleResults)
      .where(eq(puzzleResults.userId, r.userId))
      .orderBy(desc(puzzleResults.completedAt));
    const { currentStreak } = computeStreaks(hist);
    rows.push({
      rank: Number(r.rank),
      userId: r.userId,
      displayName: r.displayName,
      score: r.score,
      currentStreak,
      isCurrentUser: currentUserId === r.userId,
    });
  }

  // If current user is outside the top 10, look up their rank + score.
  let currentUserRow: {
    rank: number;
    score: number;
    currentStreak: number;
  } | null = null;

  if (currentUserId && !rows.some((r) => r.userId === currentUserId)) {
    const rankQuery =
      tab === "weekly"
        ? sql`
          SELECT rank, score FROM (
            SELECT user_id, SUM(score)::int AS score,
                   RANK() OVER (ORDER BY SUM(score) DESC) AS rank
            FROM puzzle_results
            WHERE user_id IS NOT NULL AND completed_at >= ${weekStart.toISOString()}
            GROUP BY user_id
          ) ranked WHERE user_id = ${currentUserId}
        `
        : sql`
          SELECT rank, score FROM (
            SELECT user_id, SUM(score)::int AS score,
                   RANK() OVER (ORDER BY SUM(score) DESC) AS rank
            FROM puzzle_results
            WHERE user_id IS NOT NULL
            GROUP BY user_id
          ) ranked WHERE user_id = ${currentUserId}
        `;
    const userRankRaw = (await db.execute(rankQuery)) as unknown as {
      rows: { rank: number | string; score: number }[];
    };
    if (userRankRaw.rows.length > 0) {
      const { rank, score } = userRankRaw.rows[0];
      const hist = await db
        .select({
          won: puzzleResults.won,
          completedAt: puzzleResults.completedAt,
        })
        .from(puzzleResults)
        .where(eq(puzzleResults.userId, currentUserId))
        .orderBy(desc(puzzleResults.completedAt));
      const { currentStreak } = computeStreaks(hist);
      currentUserRow = { rank: Number(rank), score, currentStreak };
    }
  }

  return NextResponse.json({ rows, currentUserRow });
}
