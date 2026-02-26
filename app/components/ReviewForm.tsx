"use client";

import Link from "next/link";
import ExperienceForm from "@/app/ExperienceForm";

/**
 * Unified review form for both Add and Edit flows.
 *
 * In "add" mode, all fields start blank and submit via the addReview action.
 * In "edit" mode, fields are pre-filled and submit via the editReview action.
 */

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export interface ReviewFormDefaults {
  reviewId?: string;
  musicalId?: string;
  ratingInt?: number;
  reviewText?: string | null;
  watchDate?: string | null;
}

export default function ReviewForm({
  mode,
  action,
  musicalTitle,
  musicalYear,
  backHref,
  defaults = {},
}: {
  mode: "add" | "edit";
  action: (formData: FormData) => void;
  musicalTitle: string;
  musicalYear?: number;
  backHref: string;
  defaults?: ReviewFormDefaults;
}) {
  const isEdit = mode === "edit";

  return (
    <div className="form-wrapper">
      <Link href={backHref} className="back-link">
        &larr; {isEdit ? "Back to My Playbills" : "Back to Browse"}
      </Link>
      <div className="form-card">
        <h1>
          {isEdit ? "Edit Playbill Entry" : "Add to Playbill"}:{" "}
          {musicalTitle}
          {musicalYear != null && (
            <span
              style={{
                fontWeight: 400,
                color: "var(--text-muted)",
                fontSize: "1rem",
              }}
            >
              {" "}
              ({musicalYear})
            </span>
          )}
        </h1>
        <ExperienceForm action={action}>
          {/* Hidden IDs */}
          {defaults.musicalId && (
            <input type="hidden" name="musicalId" value={defaults.musicalId} />
          )}
          {defaults.reviewId && (
            <input type="hidden" name="reviewId" value={defaults.reviewId} />
          )}

          <div className="form-group">
            <label htmlFor="rating">Rating</label>
            <select
              id="rating"
              name="rating"
              required
              defaultValue={defaults.ratingInt ?? undefined}
            >
              {RATING_OPTIONS.map((val) => (
                <option key={val} value={val}>
                  {"\u2605".repeat(val)}
                  {"\u2606".repeat(5 - val)} ({val})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reviewText">Your Review</label>
            <textarea
              id="reviewText"
              name="reviewText"
              placeholder="What did you think of the show?"
              required={!isEdit}
              defaultValue={defaults.reviewText ?? ""}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateSeen">Date Attended (optional)</label>
            <input
              type="date"
              id="dateSeen"
              name="dateSeen"
              defaultValue={defaults.watchDate ?? ""}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-submit">
              {isEdit ? "Save Changes" : "Save to Playbill"}
            </button>
            <Link href={backHref} className="btn-cancel">
              Cancel
            </Link>
          </div>
        </ExperienceForm>
      </div>
    </div>
  );
}
