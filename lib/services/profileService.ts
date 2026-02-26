/**
 * Centralized read service for profiles and the social graph.
 *
 * Server-only: uses the cookie-based Supabase client.
 */

import { createClient } from "@/lib/supabase/server";

// ── Row shapes ───────────────────────────────────────────

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string | null;
}

// ── Single profile ───────────────────────────────────────

/**
 * Look up a profile by UUID or by handle (auto-detected).
 */
export async function getProfileByIdOrHandle(
  param: string,
): Promise<ProfileRow | null> {
  const supabase = createClient();
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param,
    );

  const { data } = isUUID
    ? await supabase
        .from("profiles")
        .select("id, handle, display_name")
        .eq("id", param)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select("id, handle, display_name")
        .eq("handle", param)
        .maybeSingle();

  return data ?? null;
}

/**
 * Fetch the current user's own profile.
 */
export async function getProfileById(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("id", userId)
    .maybeSingle();

  return data ?? null;
}

// ── Follow counts ────────────────────────────────────────

export interface FollowCounts {
  followerCount: number;
  followingCount: number;
}

/**
 * Get follower and following counts for a user.
 */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const supabase = createClient();

  const [{ count: followerCount }, { count: followingCount }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_user_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_user_id", userId),
    ]);

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
  };
}

// ── Social graph ─────────────────────────────────────────

/**
 * Get the list of user IDs the given user is following.
 */
export async function getFollowedUserIds(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("follows")
    .select("following_user_id")
    .eq("follower_user_id", userId);

  return (data ?? []).map((f) => f.following_user_id);
}

/**
 * Fetch who the user follows, ordered by most-recent, with a limit.
 * Returns { following_user_id, created_at } rows.
 */
export async function getFollowedUsersOrdered(
  userId: string,
  limit = 50,
): Promise<{ following_user_id: string; created_at: string }[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("follows")
    .select("following_user_id, created_at")
    .eq("follower_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Batch-fetch profiles by IDs. Returns a Map for O(1) access.
 */
export async function getProfilesByIds(
  ids: string[],
): Promise<Map<string, ProfileRow>> {
  if (ids.length === 0) return new Map();
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", ids);

  return new Map((data ?? []).map((p) => [p.id, p]));
}
