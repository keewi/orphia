/**
 * Pure helpers for Showdle stats (streak + last-7 computation).
 * Scoring lives in `./score.ts` and is re-exported here for convenience.
 */

export { calculateScore, SCORE_TABLE } from "./score";

type StreakResult = { won: boolean; completedAt: Date };

/**
 * Walks backwards from today. A loss on a played day breaks the current
 * streak. A skipped calendar day also breaks it (with the exception of
 * "today not yet played" — we don't penalize a missing today).
 *
 * `maxStreak` is tracked across the full history (last 365 days).
 */
export function computeStreaks(results: StreakResult[]): {
  currentStreak: number;
  maxStreak: number;
} {
  if (results.length === 0) return { currentStreak: 0, maxStreak: 0 };

  const byDate = new Map<string, boolean>();
  for (const r of results) {
    const key = r.completedAt.toISOString().slice(0, 10);
    // If somehow two rows exist for a day, prefer a win.
    byDate.set(key, byDate.get(key) || r.won);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  let currentStreak = 0;
  let countingCurrent = true;
  let runningStreak = 0;
  let maxStreak = 0;

  const checking = new Date(today);
  // If user hasn't played today, skip today and start from yesterday so a
  // streak earned up through yesterday is still considered "current".
  if (!byDate.has(todayKey)) {
    checking.setUTCDate(checking.getUTCDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = checking.toISOString().slice(0, 10);
    const played = byDate.has(key);
    if (played) {
      const won = byDate.get(key)!;
      if (won) {
        runningStreak++;
        if (countingCurrent) currentStreak++;
        if (runningStreak > maxStreak) maxStreak = runningStreak;
      } else {
        // Loss: breaks both current and running streak.
        countingCurrent = false;
        runningStreak = 0;
      }
    } else {
      // Skipped calendar day: breaks both.
      countingCurrent = false;
      runningStreak = 0;
    }
    checking.setUTCDate(checking.getUTCDate() - 1);
  }

  return { currentStreak, maxStreak };
}

type Last7Result = { won: boolean; score: number; completedAt: Date };

/**
 * Returns the last 7 days (oldest -> newest), with `won: null` for skipped
 * calendar days. `date` is an ISO date string (UTC).
 */
export function computeLast7(results: Last7Result[]): {
  date: string;
  won: boolean | null;
  score: number;
}[] {
  const byDate = new Map<string, { won: boolean; score: number }>();
  for (const r of results) {
    const key = r.completedAt.toISOString().slice(0, 10);
    byDate.set(key, { won: r.won, score: r.score });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days: { date: string; won: boolean | null; score: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    days.push({
      date: key,
      won: row ? row.won : null,
      score: row?.score ?? 0,
    });
  }
  return days;
}
