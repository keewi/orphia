import { notFound } from "next/navigation";
import { musicals } from "@/data/musicals";
import { addReview } from "@/app/actions";
import Link from "next/link";
import ExperienceForm from "@/app/ExperienceForm";

const ratingOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function AddReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const musical = musicals.find((m) => m.id === params.id);

  if (!musical) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <Link href="/" className="back-link">
          ← Back to Orphia
        </Link>
        <div className="form-card">
          <h1>
            Review: {musical.title}{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "1rem" }}>
              ({musical.year})
            </span>
          </h1>
          <ExperienceForm action={addReview}>
            <input type="hidden" name="musicalId" value={musical.id} />

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <select id="rating" name="rating" required>
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
                placeholder="What did you think of the show?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateSeen">Date Seen (optional)</label>
              <input type="date" id="dateSeen" name="dateSeen" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-submit">
                Submit Review
              </button>
              <Link href="/" className="btn-cancel">
                Cancel
              </Link>
            </div>
          </ExperienceForm>
        </div>
      </div>
    </div>
  );
}
