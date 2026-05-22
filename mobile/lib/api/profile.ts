import { apiFetch } from "./client";
import type { Review } from "./musicals";

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
}

export interface ProfileData {
  profile: Profile | null;
  followCounts: { followerCount: number; followingCount: number };
  stats: Record<string, unknown>;
  reviews: Review[];
}

export async function getMyProfile(): Promise<ProfileData> {
  return apiFetch("/api/mobile/profile");
}

export async function getPublicProfile(handle: string): Promise<ProfileData & { isFollowing: boolean }> {
  return apiFetch(`/api/mobile/profile/${handle}`);
}

export async function toggleFollow(targetUserId: string, follow: boolean): Promise<void> {
  await apiFetch("/api/mobile/follow", { method: "POST", body: JSON.stringify({ targetUserId, follow }) });
}
