import Link from "next/link";

export interface Review {
  id: string;
  musical_id: string;
  musical_title: string;
  rating: number;
  review_text: string;
  date_seen: string | null;
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars">
      {"★".repeat(full)}
      {half && "½"}
      {"☆".repeat(empty)}
    </span>
  );
}

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
              <Stars rating={r.rating} />
              <Link href={`/edit/${r.id}`} className="btn btn-edit">
                Edit
              </Link>
            </div>
          </div>
          <p className="review-text">{r.review_text}</p>
          {r.date_seen && (
            <p className="review-date">Attended {r.date_seen}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
