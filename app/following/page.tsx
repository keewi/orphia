import Link from "next/link";
import { requireAuth } from "@/lib/services/authGuard";
import { getReviewStatsForUsers } from "@/lib/services/musicalReadService";
import {
  getFollowedUsersOrdered,
  getProfilesByIds,
} from "@/lib/services/profileService";
import { deriveProfileStats, formatHeroStatement } from "@/lib/profileStats";
import EmptyState from "@/app/components/EmptyState";
import LinkCard from "@/app/components/LinkCard";

export const dynamic = "force-dynamic";

const FindFriendsCTA = () => (
  <Link href="/find-friends" className="find-friends-cta">
    <span className="find-friends-cta-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>
    Find friends on ORPHEA
  </Link>
);

export default async function FollowingPage() {
  const user = await requireAuth();

  let followRows: { following_user_id: string; created_at: string }[];
  try {
    followRows = await getFollowedUsersOrdered(user.id);
  } catch {
    return (
      <div className="page-container">
        <div className="following-header">
          <h2 className="section-title">Following</h2>
          <FindFriendsCTA />
        </div>
        <EmptyState emoji="&#9888;&#65039;" message="Something went wrong loading your follows.">
          <a
            href="/following"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Try again
          </a>
        </EmptyState>
      </div>
    );
  }

  const followedUserIds = followRows.map((f) => f.following_user_id);

  // Empty state
  if (followedUserIds.length === 0) {
    return (
      <div className="page-container">
        <div className="following-header">
          <h2 className="section-title">Following</h2>
        </div>
        <EmptyState emoji="&#128064;" message="Not following anyone yet.">
          <Link
            href="/find-friends"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Find Friends
          </Link>
        </EmptyState>
      </div>
    );
  }

  // Batch-fetch profiles and reviews in parallel
  const [profileMap, allReviews] = await Promise.all([
    getProfilesByIds(followedUserIds),
    getReviewStatsForUsers(followedUserIds),
  ]);

  // Group reviews by user_id
  const reviewsByUser = new Map<
    string,
    { musical_id: string; watch_date: string | null; created_at: string }[]
  >();
  for (const r of allReviews) {
    if (!reviewsByUser.has(r.user_id)) reviewsByUser.set(r.user_id, []);
    reviewsByUser.get(r.user_id)!.push(r);
  }

  // Maintain original follow order (most recent first)
  const orderedCards = followedUserIds
    .map((uid) => profileMap.get(uid))
    .filter(Boolean) as { id: string; handle: string; display_name: string | null }[];

  return (
    <div className="page-container">
      <div className="following-header">
        <div className="following-title-row">
          <h2 className="section-title">Following</h2>
          <span className="following-count">{orderedCards.length}</span>
        </div>
        <FindFriendsCTA />
      </div>

      <div className="following-grid">
        {orderedCards.map((profile, index) => {
          const reviews = reviewsByUser.get(profile.id) ?? [];
          const stats = deriveProfileStats(reviews);
          const hero = formatHeroStatement(stats);
          return (
            <LinkCard
              key={profile.id}
              href={`/u/${profile.id}`}
              className="following-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {stats.seenCount > 0 && (
                <span className="following-card-badge">
                  <span className="following-card-badge-count">{stats.seenCount}</span>
                  <span className="following-card-badge-label">
                    {stats.seenCount === 1 ? "playbill" : "playbills"}
                  </span>
                </span>
              )}
              <p className="following-card-name">@{profile.handle}</p>
              {hero && <p className="following-card-hero">{hero}</p>}
            </LinkCard>
          );
        })}
      </div>
    </div>
  );
}
