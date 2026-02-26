"use client";

/**
 * Interactive star selector — click to set a rating 1-5.
 *
 * Used in ExploreCarousel and ReviewForm.
 */

export default function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (star: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="explore-stars" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`explore-star${value !== null && star <= value ? " explore-star--filled" : ""}`}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          disabled={disabled}
        >
          {value !== null && star <= value ? "\u2605" : "\u2606"}
        </button>
      ))}
    </div>
  );
}
