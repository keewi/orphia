"use client";

/**
 * Shared histogram for guess distributions.
 * Used by RevealModal (per-puzzle aggregate) and StatsPage (per-user lifetime).
 *
 * Renders one row per guess count 1..6. Index 0 of `distribution` is losses,
 * which are not shown as a bar (they're implicit in `totalPlayers`).
 */
interface HistogramProps {
  distribution: number[]; // [losses, 1, 2, 3, 4, 5, 6]
  totalPlayers: number;
  /** Guess count (1..6) to highlight in gold. Null on loss. */
  highlightIndex: number | null;
  /** Label rendered above the histogram, e.g. "Today's puzzle — all players". */
  label: string;
}

export default function Histogram({
  distribution,
  highlightIndex,
  label,
}: HistogramProps) {
  const guessCounts = distribution.slice(1, 7); // indexes 1..6
  const maxCount = Math.max(0, ...guessCounts);

  return (
    <div className="sd-histogram">
      <p className="sd-histogram-label">{label}</p>
      {guessCounts.map((count, i) => {
        const guessNumber = i + 1;
        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const isHighlighted = highlightIndex === guessNumber;
        return (
          <div key={guessNumber} className="sd-histogram-row">
            <span className="sd-histogram-num">{guessNumber}</span>
            <div className="sd-histogram-track">
              {count > 0 && (
                <div
                  className={
                    "sd-histogram-bar" +
                    (isHighlighted ? " sd-histogram-bar--today" : "")
                  }
                  style={{ width: `${widthPct}%` }}
                >
                  {count}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
