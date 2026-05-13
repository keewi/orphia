/**
 * Canonical Showdle scoring.
 *
 * Used by:
 * - `useGameState` hook (derives current score for the reveal modal)
 * - `POST /api/showdle/puzzle/[id]/complete` (re-validates server-side)
 * - `lib/showdle/stats.ts` (re-exports for convenience)
 */

export const SCORE_TABLE: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 25,
  6: 10,
};

/**
 * - Loss = 0
 * - Win: base points per guess count (1→100 … 6→10)
 * - Hint used = ×0.5 multiplier, rounded
 *
 * `guessCount` is the number of real guesses excluding the HINT pseudo-row.
 * Null is permitted on loss (server route uses null; client may pass 0).
 */
export function calculateScore(
  won: boolean,
  guessCount: number | null,
  hintUsed: boolean,
): number {
  if (!won) return 0;
  const base = SCORE_TABLE[guessCount ?? 0] ?? 0;
  return hintUsed ? Math.round(base * 0.5) : base;
}
