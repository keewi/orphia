import { apiFetch } from "./client";

export interface Musical {
  id: string;
  title: string;
  year: number;
  description: string;
  image_url: string | null;
  popularity_rank?: number | null;
}

export interface Review {
  id: string;
  rating_int: number;
  review_text: string | null;
  watch_date: string | null;
  created_at: string;
  musical_id?: string;
  musical?: { id: string; title: string; image_url: string | null } | null;
}

export async function getMusicals(
  sort: "popularity" | "alpha" = "popularity",
  search?: string
): Promise<Musical[]> {
  const params = new URLSearchParams({ sort });
  if (search) params.set("search", search);
  const data = await apiFetch<{ musicals: Musical[] }>(`/api/mobile/musicals?${params}`);
  return data.musicals;
}

export async function getMusicalDetail(id: string) {
  return apiFetch<{ musical: Musical; userReviews: Review[]; userStatus: string | null }>(
    `/api/mobile/musicals/${id}`
  );
}
