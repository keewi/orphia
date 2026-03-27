/**
 * Centralized read service for profiles and the social graph.
 *
 * Server-only: uses the Drizzle client with Neon.
 */

import { db } from "@/lib/db";
import { profiles, follows } from "@/lib/db/schema";
import { eq, inArray, count, desc } from "drizzle-orm";

// ── Row shapes ───────────────────────────────────────────

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string | null;
}

// ── Single profile ───────────────────────────────────────

export async function getProfileByIdOrHandle(
  param: string,
): Promise<ProfileRow | null> {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param,
    );

  const rows = await db
    .select({ id: profiles.id, handle: profiles.handle, display_name: profiles.display_name })
    .from(profiles)
    .where(isUUID ? eq(profiles.id, param) : eq(profiles.handle, param))
    .limit(1);

  return rows[0] ?? null;
}

export async function getProfileById(
  userId: string,
): Promise<ProfileRow | null> {
  const rows = await db
    .select({ id: profiles.id, handle: profiles.handle, display_name: profiles.display_name })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

// ── Follow counts ────────────────────────────────────────

export interface FollowCounts {
  followerCount: number;
  followingCount: number;
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followerRows, followingRows] = await Promise.all([
    db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.following_user_id, userId)),
    db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.follower_user_id, userId)),
  ]);

  return {
    followerCount: followerRows[0]?.count ?? 0,
    followingCount: followingRows[0]?.count ?? 0,
  };
}

// ── Social graph ─────────────────────────────────────────

export async function getFollowedUserIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ following_user_id: follows.following_user_id })
    .from(follows)
    .where(eq(follows.follower_user_id, userId));

  return rows.map((f) => f.following_user_id);
}

export async function getFollowedUsersOrdered(
  userId: string,
  limit = 50,
): Promise<{ following_user_id: string; created_at: string }[]> {
  const rows = await db
    .select({
      following_user_id: follows.following_user_id,
      created_at: follows.created_at,
    })
    .from(follows)
    .where(eq(follows.follower_user_id, userId))
    .orderBy(desc(follows.created_at))
    .limit(limit);

  return rows.map((r) => ({
    following_user_id: r.following_user_id,
    created_at: r.created_at.toISOString(),
  }));
}

export async function getProfilesByIds(
  ids: string[],
): Promise<Map<string, ProfileRow>> {
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({ id: profiles.id, handle: profiles.handle, display_name: profiles.display_name })
    .from(profiles)
    .where(inArray(profiles.id, ids));

  return new Map(rows.map((p) => [p.id, p]));
}
