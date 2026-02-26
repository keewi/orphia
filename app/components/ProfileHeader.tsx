import type { ProfileStats } from "@/lib/profileStats";

/**
 * Shared profile header used by My Playbills and Public Profile pages.
 *
 * Server-safe — no "use client" needed.
 */

export default function ProfileHeader({
  handle,
  displayName,
  stats,
  followerCount,
  followingCount,
  children,
}: {
  handle: string;
  /** When set (e.g. on public profiles) renders as the primary name with @handle below. */
  displayName?: string | null;
  stats: ProfileStats;
  followerCount: number;
  followingCount: number;
  /** Optional trailing element in the top row (e.g. FollowButton). */
  children?: React.ReactNode;
}) {
  const { seenCount, sinceYear, uniqueShows } = stats;

  return (
    <div className="profile-header">
      <div className="profile-header-top">
        <div>
          <h2 className="profile-display-name">
            {displayName ?? `@${handle}`}
          </h2>
          {displayName && <p className="profile-handle">@{handle}</p>}
        </div>
        {children}
      </div>

      {seenCount > 0 && sinceYear && (
        <p className="profile-opener">
          {seenCount} {seenCount === 1 ? "playbill" : "playbills"} collected
          since {sinceYear} &middot; {uniqueShows} unique{" "}
          {uniqueShows === 1 ? "show" : "shows"}
        </p>
      )}

      <div className="profile-follow-counts">
        <span>
          <strong>{followerCount}</strong>{" "}
          {followerCount === 1 ? "follower" : "followers"}
        </span>
        <span>
          <strong>{followingCount}</strong> following
        </span>
      </div>
    </div>
  );
}
