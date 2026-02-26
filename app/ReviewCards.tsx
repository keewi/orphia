import Link from "next/link";
import StarRating from "@/app/components/StarRating";

export interface Review {
  id: string;
  musical_id: string;
  musical_title: string;
  rating_int: number;
  review_text: string | null;
  watch_date: string | null;
}

/** @deprecated Import StarRating from "@/app/components/StarRating" directly. */
export { default as Stars } from "@/app/components/StarRating";

export default function ReviewCards({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <span className="emoji">🎭</span>
        No playbills yet — explore a show above and collect your first!
      </div>
    );
  }

  return (
    <ul className="review-list">
      {reviews.map((r) => (
        <li key={r.id} className="review-card">
          <div className="review-header">
            <p className="review-title">{r.musical_title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <StarRating rating={r.rating_int} />
              <Link href={`/edit/${r.id}`} className="btn btn-edit">
                Edit
              </Link>
            </div>
          </div>
          {r.review_text && <p className="review-text">{r.review_text}</p>}
          {r.watch_date && (
            <p className="review-date">Attended {r.watch_date}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
