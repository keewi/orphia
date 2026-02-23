import Link from "next/link";
import { musicals } from "@/data/musicals";
import { createClient } from "@/lib/supabase/server";
import SearchableMusicalGrid from "./SearchableMusicalGrid";

export const dynamic = "force-dynamic";

interface Review {
  id: string;
  musical_id: string;
  musical_title: string;
  rating: number;
  review_text: string;
  date_seen: string | null;
}

function Stars({ rating }: { rating: number }) {
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

export default async function Home() {
  const supabase = createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  const reviewList: Review[] = reviews ?? [];

  return (
    <div className="page-container">
      <h2 className="section-title">Explore Shows</h2>
      <SearchableMusicalGrid musicals={musicals} />

      <h2 className="section-title">My Reviews</h2>
      {reviewList.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          No reviews yet — discover a show above and write your first review!
        </div>
      ) : (
        <ul className="review-list">
          {reviewList.map((r) => (
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
                <p className="review-date">Seen on {r.date_seen}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
