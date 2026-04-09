import { neon } from "@neondatabase/serverless";
import { computeStreaks, computeLast7 } from "../lib/showdle/stats";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const uid = "6b7678f0-e188-4f29-be07-ad441ae9a19c";
  const rows = (await sql`
    SELECT won, guess_count as "guessCount", score, completed_at as "completedAt"
    FROM puzzle_results WHERE user_id = ${uid} ORDER BY completed_at DESC
  `) as { won: boolean; guessCount: number | null; score: number; completedAt: string }[];
  const results = rows.map((r) => ({ ...r, completedAt: new Date(r.completedAt) }));
  const totalPlayed = results.length;
  const wins = results.filter((r) => r.won);
  const winRate = totalPlayed === 0 ? 0 : Math.round((wins.length / totalPlayed) * 100);
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const avgGuesses =
    wins.length === 0
      ? null
      : Math.round((wins.reduce((s, r) => s + (r.guessCount ?? 0), 0) / wins.length) * 10) / 10;
  const dist = [0, 0, 0, 0, 0, 0, 0];
  for (const r of results) {
    if (!r.won) dist[0]++;
    else if (r.guessCount && r.guessCount >= 1 && r.guessCount <= 6) dist[r.guessCount]++;
  }
  const streaks = computeStreaks(results);
  const last7 = computeLast7(results);
  console.log(
    JSON.stringify(
      {
        totalPlayed,
        winRate,
        totalScore,
        avgGuesses,
        guessDistribution: dist,
        ...streaks,
        last7,
      },
      null,
      2,
    ),
  );
}

main();
