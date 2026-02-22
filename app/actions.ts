"use server";

import { redirect } from "next/navigation";
import { musicals } from "@/data/musicals";
import { reviews, getNextId } from "@/data/reviews";

export async function addReview(formData: FormData) {
  const musicalId = formData.get("musicalId") as string;
  const rating = parseFloat(formData.get("rating") as string);
  const reviewText = formData.get("reviewText") as string;
  const dateSeen = (formData.get("dateSeen") as string) || null;

  const musical = musicals.find((m) => m.id === musicalId);
  if (!musical) {
    throw new Error("Musical not found");
  }

  reviews.push({
    id: getNextId(),
    musicalId,
    musicalTitle: musical.title,
    rating,
    reviewText,
    dateSeen,
  });

  redirect("/");
}

export async function editReview(formData: FormData) {
  const reviewId = formData.get("reviewId") as string;
  const rating = parseFloat(formData.get("rating") as string);
  const reviewText = formData.get("reviewText") as string;
  const dateSeen = (formData.get("dateSeen") as string) || null;

  const review = reviews.find((r) => r.id === reviewId);
  if (!review) {
    throw new Error("Review not found");
  }

  review.rating = rating;
  review.reviewText = reviewText;
  review.dateSeen = dateSeen;

  redirect("/");
}
