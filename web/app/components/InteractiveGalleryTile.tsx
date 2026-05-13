"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import PosterImage from "./PosterImage";
import StarRatingInput from "./StarRatingInput";
import { quickRate, removePlaybill } from "@/app/actions";

export default function InteractiveGalleryTile({
  reviewId,
  initialRating,
  imageUrl,
  title,
}: {
  reviewId: string;
  musicalId: string;
  initialRating: number;
  imageUrl: string | null;
  title: string;
}) {
  const [rating, setRating] = useState(initialRating);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRate = useCallback(
    (star: number) => {
      const prev = rating;
      setRating(star);
      startTransition(async () => {
        try {
          await quickRate(reviewId, star);
        } catch {
          setRating(prev);
        }
      });
    },
    [rating, reviewId],
  );

  const handleRemove = useCallback(() => {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    setRemoved(true);
    startTransition(async () => {
      try {
        await removePlaybill(reviewId);
      } catch {
        setRemoved(false);
        setConfirmingRemove(false);
      }
    });
  }, [confirmingRemove, reviewId]);

  if (removed) return null;

  return (
    <div className="gallery-tile gallery-tile--interactive">
      <button
        type="button"
        className={`gallery-tile-remove${confirmingRemove ? " gallery-tile-remove--confirming" : ""}`}
        onClick={handleRemove}
        onBlur={() => setConfirmingRemove(false)}
        aria-label={confirmingRemove ? "Confirm remove" : "Remove from collection"}
      >
        &times;
      </button>

      <Link href={`/edit/${reviewId}`} className="gallery-poster gallery-poster--link">
        <PosterImage src={imageUrl} alt={`${title} poster`} />
      </Link>

      <div className="gallery-tile-info">
        <Link href={`/edit/${reviewId}`} className="gallery-tile-title-link">
          <p className="gallery-tile-title">{title}</p>
        </Link>
        <StarRatingInput
          value={rating}
          onChange={handleRate}
          disabled={isPending}
          size="compact"
        />
      </div>
    </div>
  );
}
