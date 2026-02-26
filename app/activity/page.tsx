import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTableMissing, normalizeLegacyReview } from "@/lib/supabase/compat";
import { Stars } from "@/app/ReviewCards";

export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type ActivityItem =
  | {
      type: "review";
      id: string;
      user_id: string;
      musical_id: string;
      rating_int: number;
      review_text: string | null;
      watch_date: string | null;
      created_at: string;
    }
  | {
      type: "want_to_see";
      user_id: string;
      musical_id: string;
      created_at: string;
    };

export default async function ActivityPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch followed user IDs
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_user_id")
    .eq("follower_user_id", user.id);

  const followedIds = (followRows ?? []).map((f) => f.following_user_id);
  const userSet = [user.id, ...followedIds];

  // Parallel fetch: reviews + want_to_see statuses
  const [
    { data: reviewData, error: reviewError },
    { data: statusData, error: statusError },
  ] = await Promise.all([
    supabase
      .from("user_reviews")
      .select(
        "id, user_id, musical_id, rating_int, review_text, watch_date, created_at",
      )
      .in("user_id", userSet)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_musical_status")
      .select("user_id, musical_id, created_at")
      .in("user_id", userSet)
      .eq("status", "want_to_see")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let reviews = reviewData;
  if (isTableMissing(reviewError)) {
    const { data: legacyData } = await supabase
      .from("reviews")
      .select("id, user_id, musical_id, rating, review_text, date_seen, created_at")
      .in("user_id", userSet)
      .order("created_at", { ascending: false })
      .limit(20);
    reviews = (legacyData ?? []).map(normalizeLegacyReview);
  }

  let statusRows = statusData;
  if (isTableMissing(statusError)) {
    const { data: legacyStatus } = await supabase
      .from("saved_musicals")
      .select("user_id, musical_id, created_at")
      .in("user_id", userSet)
      .order("created_at", { ascending: false })
      .limit(20);
    statusRows = legacyStatus;
  }

  // Merge and sort
  const activities: ActivityItem[] = [
    ...(reviews ?? []).map((r) => ({ ...r, type: "review" as const })),
    ...(statusRows ?? []).map((s) => ({
      ...s,
      type: "want_to_see" as const,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 20);

  // Collect unique IDs for batch fetch
  const activityUserIds = Array.from(
    new Set(activities.map((a) => a.user_id)),
  );
  const activityMusicalIds = Array.from(
    new Set(activities.map((a) => a.musical_id)),
  );

  // Batch fetch profiles + musicals
  const [{ data: profiles }, { data: musicals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", activityUserIds),
    activityMusicalIds.length > 0
      ? supabase
          .from("musicals")
          .select("id, title, image_url")
          .in("id", activityMusicalIds)
      : Promise.resolve({
          data: [] as { id: string; title: string; image_url: string | null }[],
        }),
  ]);

  // Build lookup maps
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );
  const musicalMap = new Map(
    (musicals ?? []).map((m) => [m.id, m]),
  );

  return (
    <div className="page-container">
      <h2 className="section-title">Activity</h2>

      {activities.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          No activity yet. Follow some friends or log your first show!
          <br />
          <Link
            href="/find-friends"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Find Friends
          </Link>
        </div>
      ) : (
        <div className="activity-feed">
          {activities.map((activity) => {
            const profile = profileMap.get(activity.user_id);
            const musical = musicalMap.get(activity.musical_id);
            const handle = profile?.handle ?? "unknown";
            const imageUrl = musical?.image_url ?? null;
            const title = musical?.title ?? "Unknown Musical";

            if (activity.type === "review") {
              return (
                <article
                  key={`review-${activity.id}`}
                  className="activity-card"
                >
                  <div className="activity-card-header">
                    <Link
                      href={`/u/${handle}`}
                      className="activity-handle"
                    >
                      @{handle}
                    </Link>
                    <span className="activity-verb">reviewed</span>
                    <span className="activity-time">
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                  <div className="activity-card-body">
                    <div className="activity-poster">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${title} poster`}
                          width={56}
                          height={75}
                          style={{
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        "🎭"
                      )}
                    </div>
                    <div className="activity-details">
                      <p className="activity-title">{title}</p>
                      <Stars rating={activity.rating_int} />
                      {activity.review_text && (
                        <p className="activity-review-text">
                          {activity.review_text}
                        </p>
                      )}
                      {activity.watch_date && (
                        <p className="activity-date-seen">
                          Attended{" "}
                          {new Date(
                            activity.watch_date + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            }

            // want_to_see
            return (
              <article
                key={`save-${activity.user_id}-${activity.musical_id}`}
                className="activity-card activity-card--save"
              >
                <div className="activity-card-header">
                  <Link
                    href={`/u/${handle}`}
                    className="activity-handle"
                  >
                    @{handle}
                  </Link>
                  <span className="activity-verb">wants to see</span>
                  <span className="activity-time">
                    {timeAgo(activity.created_at)}
                  </span>
                </div>
                <div className="activity-card-body">
                  <div className="activity-poster">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${title} poster`}
                        width={56}
                        height={75}
                        style={{
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      "🎭"
                    )}
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">{title}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
