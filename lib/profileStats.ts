interface ReviewRow {
  musical_id: string;
  date_seen: string | null;
  created_at: string;
}

export interface ProfileStats {
  seenCount: number;
  sinceYear: number | null;
  uniqueShows: number;
}

export function deriveProfileStats(reviews: ReviewRow[]): ProfileStats {
  const seenCount = reviews.length;

  // Earliest date_seen, falling back to oldest created_at
  const earliestDateSeen = reviews
    .filter((r) => r.date_seen)
    .sort(
      (a, b) =>
        new Date(a.date_seen!).getTime() - new Date(b.date_seen!).getTime(),
    )[0]?.date_seen;

  const fallbackDate =
    reviews.length > 0
      ? reviews.reduce((oldest, r) =>
          new Date(r.created_at).getTime() < new Date(oldest.created_at).getTime()
            ? r
            : oldest,
        ).created_at
      : null;

  const sinceYear = earliestDateSeen
    ? new Date(earliestDateSeen).getFullYear()
    : fallbackDate
      ? new Date(fallbackDate).getFullYear()
      : null;

  // Unique shows by musical_id
  const uniqueShows = new Set(reviews.map((r) => r.musical_id)).size;

  return { seenCount, sinceYear, uniqueShows };
}

export function formatHeroStatement(stats: ProfileStats): string | null {
  if (stats.seenCount === 0 || !stats.sinceYear) return null;
  const playbills = stats.seenCount === 1 ? "playbill" : "playbills";
  const shows = stats.uniqueShows === 1 ? "show" : "shows";
  return `${stats.seenCount} ${playbills} collected since ${stats.sinceYear} · ${stats.uniqueShows} unique ${shows}`;
}
