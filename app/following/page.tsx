import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveProfileStats, formatHeroStatement } from "@/lib/profileStats";

export const dynamic = "force-dynamic";

const FindFriendsCTA = () => (
  <Link href="/find-friends" className="find-friends-cta">
    <span className="find-friends-cta-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>
    Find friends on Orphia
  </Link>
);

export default async function FollowingPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch who the current user follows (most recent first, limit 50)
  const { data: followRows, error: followError } = await supabase
    .from("follows")
    .select("following_user_id, created_at")
    .eq("follower_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (followError) {
    return (
      <div className="page-container">
        <div className="following-header">
          <h2 className="section-title">Following</h2>
          <FindFriendsCTA />
        </div>
        <div className="empty-state">
          <span className="emoji">&#9888;&#65039;</span>
          Something went wrong loading your follows.
          <br />
          <a
            href="/following"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  const followedUserIds = (followRows ?? []).map((f) => f.following_user_id);

  // Empty state
  if (followedUserIds.length === 0) {
    return (
      <div className="page-container">
        <div className="following-header">
          <h2 className="section-title">Following</h2>
        </div>
        <div className="empty-state">
          <span className="emoji">&#128064;</span>
          Not following anyone yet.
          <br />
          <Link
            href="/find-friends"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Find Friends
          </Link>
        </div>
      </div>
    );
  }

  // Batch-fetch profiles and reviews in parallel
  const [{ data: profiles }, { data: allReviews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", followedUserIds),
    supabase
      .from("reviews")
      .select("user_id, musical_id, date_seen, created_at")
      .in("user_id", followedUserIds),
  ]);

  // Group reviews by user_id
  const reviewsByUser = new Map<
    string,
    { musical_id: string; date_seen: string | null; created_at: string }[]
  >();
  for (const r of allReviews ?? []) {
    if (!reviewsByUser.has(r.user_id)) reviewsByUser.set(r.user_id, []);
    reviewsByUser.get(r.user_id)!.push(r);
  }

  // Profile map for O(1) lookup
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

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
            <Link
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
