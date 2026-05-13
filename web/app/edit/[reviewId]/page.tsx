import { notFound } from "next/navigation";
import { editReview } from "@/app/actions";
import { requireAuth } from "@/lib/services/authGuard";
import { getReviewById, getMusicalById } from "@/lib/services/musicalReadService";
import ReviewForm from "@/app/components/ReviewForm";

export default async function EditReviewPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const user = await requireAuth();

  const review = await getReviewById(params.reviewId, user.id);
  if (!review) notFound();

  const musical = await getMusicalById(review.musical_id);
  const musicalTitle = musical?.title ?? "Unknown Musical";

  return (
    <div className="page-container">
      <ReviewForm
        mode="edit"
        action={editReview}
        musicalTitle={musicalTitle}
        backHref="/my-theatre-life"
        defaults={{
          reviewId: review.id,
          ratingInt: review.rating_int,
          reviewText: review.review_text,
          watchDate: review.watch_date,
        }}
      />
    </div>
  );
}
