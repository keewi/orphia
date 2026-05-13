import { notFound } from "next/navigation";
import { addReview } from "@/app/actions";
import { getMusicalById } from "@/lib/services/musicalReadService";
import ReviewForm from "@/app/components/ReviewForm";

export default async function AddReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const musical = await getMusicalById(params.id);
  if (!musical) notFound();

  return (
    <div className="page-container">
      <ReviewForm
        mode="add"
        action={addReview}
        musicalTitle={musical.title}
        musicalYear={musical.year}
        backHref="/browse"
        defaults={{ musicalId: musical.id }}
      />
    </div>
  );
}
