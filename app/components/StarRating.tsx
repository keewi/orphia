/**
 * Display-only star rating (1-5 filled stars).
 *
 * Server-safe — no "use client" needed.
 */

export default function StarRating({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(1, Math.round(rating)));
  const empty = 5 - full;
  return (
    <span className="stars">
      {"\u2605".repeat(full)}
      {"\u2606".repeat(empty)}
    </span>
  );
}
