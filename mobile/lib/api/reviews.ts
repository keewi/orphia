import { apiFetch } from "./client";
import type { Review } from "./musicals";

export async function getMyReviews(): Promise<Review[]> {
  const data = await apiFetch<{ reviews: Review[] }>("/api/mobile/reviews");
  return data.reviews;
}

export async function createReview(params: {
  musicalId: string;
  ratingInt: number;
  reviewText?: string | null;
  watchDate?: string | null;
}): Promise<{ reviewId: string }> {
  return apiFetch<{ reviewId: string }>("/api/mobile/reviews", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateReview(
  reviewId: string,
  params: {
    ratingInt: number;
    reviewText?: string | null;
    watchDate?: string | null;
  }
): Promise<void> {
  await apiFetch(`/api/mobile/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiFetch(`/api/mobile/reviews/${reviewId}`, {
    method: "DELETE",
  });
}
