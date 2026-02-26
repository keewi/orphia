/**
 * Schema compatibility helpers.
 *
 * The migration (migration-multi-review.sql) renames:
 *   reviews          → user_reviews      (rating→rating_int, date_seen→watch_date)
 *   saved_musicals   → user_musical_status
 *
 * These helpers let read-paths work against whichever schema is live.
 */

const TABLE_MISSING = "PGRST205";

export function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === TABLE_MISSING;
}

/**
 * Map a legacy `reviews` row to the `user_reviews` column shape.
 * Safe to call on rows that are already in the new shape.
 */
export function normalizeLegacyReview<
  T extends Record<string, unknown>,
>(row: T): T & { rating_int: number; watch_date: string | null } {
  const raw = row as Record<string, unknown>;
  const rating = raw.rating;
  return {
    ...row,
    rating_int:
      typeof raw.rating_int === "number"
        ? (raw.rating_int as number)
        : typeof rating === "number"
          ? Math.round(rating)
          : 0,
    watch_date:
      (raw.watch_date as string | null) ??
      (raw.date_seen as string | null) ??
      null,
  };
}
