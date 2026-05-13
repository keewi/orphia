import { apiFetch } from "./client";

export interface FeedItem {
  type: "review" | "want_to_see";
  userId: string;
  musicalId: string;
  musical: { id: string; title: string; image_url: string | null } | null;
  user: { id: string; handle: string; display_name: string | null } | null;
  ratingInt: number | null;
  reviewText: string | null;
  createdAt: string;
}

export async function getFriendsFeed(): Promise<{
  feed: FeedItem[];
  following: number;
}> {
  return apiFetch<{ feed: FeedItem[]; following: number }>(
    "/api/mobile/friends/feed"
  );
}
