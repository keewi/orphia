import { apiFetch } from "./client";
import type { Review } from "./musicals";

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
}

export interface FollowCounts {
  followerCount: number;
  followingCount: number;
}

export interface ProfileData {
  profile: Profile | null;
  followCounts: FollowCounts;
  stats: Record<string, unknown>;
  reviews: Review[];
}

export interface PublicProfileData extends ProfileData {
  isFollowing: boolean;
}

export async function getMyProfile(): Promise<ProfileData> {
  return apiFetch<ProfileData>("/api/mobile/profile");
}

export async function getPublicProfile(
  handle: string
): Promise<PublicProfileData> {
  return apiFetch<PublicProfileData>(`/api/mobile/profile/${handle}`);
}

export async function toggleFollow(
  targetUserId: string,
  follow: boolean
): Promise<void> {
  await apiFetch("/api/mobile/follow", {
    method: "POST",
    body: JSON.stringify({ targetUserId, follow }),
  });
}
