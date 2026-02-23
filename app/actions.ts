"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addReview(formData: FormData) {
  const musicalId = formData.get("musicalId") as string;
  const rating = parseFloat(formData.get("rating") as string);
  const reviewText = formData.get("reviewText") as string;
  const dateSeen = (formData.get("dateSeen") as string) || null;

  const supabase = createClient();

  // Look up musical title from Supabase
  const { data: musical } = await supabase
    .from("musicals")
    .select("title")
    .eq("id", musicalId)
    .single();

  if (!musical) {
    throw new Error("Musical not found");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Insert review
  const { error: reviewError } = await supabase.from("reviews").insert({
    user_id: user.id,
    musical_id: musicalId,
    musical_title: musical.title,
    rating,
    review_text: reviewText,
    date_seen: dateSeen,
  });

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  // Remove from saved-for-later if it was saved
  await supabase
    .from("saved_musicals")
    .delete()
    .eq("user_id", user.id)
    .eq("musical_id", musicalId);

  redirect("/");
}

export async function editReview(formData: FormData) {
  const reviewId = formData.get("reviewId") as string;
  const rating = parseFloat(formData.get("rating") as string);
  const reviewText = formData.get("reviewText") as string;
  const dateSeen = (formData.get("dateSeen") as string) || null;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      rating,
      review_text: reviewText,
      date_seen: dateSeen,
    })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}
