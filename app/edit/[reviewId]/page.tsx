import { notFound, redirect } from "next/navigation";
import { editReview } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ratingOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default async function EditReviewPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", params.reviewId)
    .eq("user_id", user.id)
    .single();

  if (!review) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <Link href="/" className="back-link">
          ← Back to Orphia
        </Link>
        <div className="form-card">
          <h1>Edit Playbill Entry: {review.musical_title}</h1>
          <form action={editReview}>
            <input type="hidden" name="reviewId" value={review.id} />

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <select
                id="rating"
                name="rating"
                required
                defaultValue={review.rating}
              >
                {ratingOptions.map((val) => (
                  <option key={val} value={val}>
                    {"★".repeat(Math.floor(val))}
                    {val % 1 >= 0.5 ? "½" : ""}{" "}
                    ({val})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reviewText">Your Review</label>
              <textarea
                id="reviewText"
                name="reviewText"
                defaultValue={review.review_text}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateSeen">Date Attended (optional)</label>
              <input
                type="date"
                id="dateSeen"
                name="dateSeen"
                defaultValue={review.date_seen ?? ""}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-submit">
                Save Changes
              </button>
              <Link href="/" className="btn-cancel">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
