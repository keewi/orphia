import { notFound, redirect } from "next/navigation";
import { editReview } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { isTableMissing, normalizeLegacyReview } from "@/lib/supabase/compat";
import Link from "next/link";

const ratingOptions = [1, 2, 3, 4, 5];

export default async function EditReviewPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviewData, error: reviewError } = await supabase
    .from("user_reviews")
    .select("*")
    .eq("id", params.reviewId)
    .eq("user_id", user.id)
    .single();

  let review = reviewData;
  if (!review && isTableMissing(reviewError)) {
    const { data: legacyData } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", params.reviewId)
      .eq("user_id", user.id)
      .single();
    if (legacyData) {
      review = normalizeLegacyReview(legacyData);
    }
  }

  if (!review) {
    notFound();
  }

  // Fetch musical title
  const { data: musical } = await supabase
    .from("musicals")
    .select("title")
    .eq("id", review.musical_id)
    .single();

  const musicalTitle = musical?.title ?? "Unknown Musical";

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <Link href="/my-theatre-life" className="back-link">
          ← Back to My Playbills
        </Link>
        <div className="form-card">
          <h1>Edit Playbill Entry: {musicalTitle}</h1>
          <form action={editReview}>
            <input type="hidden" name="reviewId" value={review.id} />

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <select
                id="rating"
                name="rating"
                required
                defaultValue={review.rating_int}
              >
                {ratingOptions.map((val) => (
                  <option key={val} value={val}>
                    {"★".repeat(val)}
                    {"☆".repeat(5 - val)}{" "}
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
                defaultValue={review.review_text ?? ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateSeen">Date Attended (optional)</label>
              <input
                type="date"
                id="dateSeen"
                name="dateSeen"
                defaultValue={review.watch_date ?? ""}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-submit">
                Save Changes
              </button>
              <Link href="/my-theatre-life" className="btn-cancel">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
