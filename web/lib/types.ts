export interface Musical {
  id: string;
  title: string;
  year: number;
  description: string;
  image_url: string | null;
  popularity_rank?: number | null;
}

export type MusicalStatusValue = "want_to_see" | "seen" | "skipped";

export interface UserMusicalStatus {
  user_id: string;
  musical_id: string;
  status: MusicalStatusValue;
  created_at: string;
  updated_at: string;
}

export interface UserReview {
  id: string;
  user_id: string;
  musical_id: string;
  rating_int: number; // integer 1–5
  review_text: string | null;
  watch_date: string | null; // ISO date "YYYY-MM-DD"
  created_at: string; // ISO timestamptz
  updated_at: string; // ISO timestamptz
}

/** Row from the user_latest_reviews view — same shape as UserReview,
 *  one row per (user_id, musical_id). */
export type UserLatestReview = UserReview;
