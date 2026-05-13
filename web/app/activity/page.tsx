import Link from "next/link";
import { requireAuth } from "@/lib/services/authGuard";
import {
  getReviewsForUsers,
  getWantToSeeForUsers,
  getMusicalsByIds,
} from "@/lib/services/musicalReadService";
import { getFollowedUserIds, getProfilesByIds } from "@/lib/services/profileService";
import { timeAgo, formatDate } from "@/lib/utils/formatDate";
import StarRating from "@/app/components/StarRating";
import PosterImage from "@/app/components/PosterImage";
import EmptyState from "@/app/components/EmptyState";

export const dynamic = "force-dynamic";

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
  const user = await requireAuth();

  const followedIds = await getFollowedUserIds(user.id);
  const userSet = [user.id, ...followedIds];

  // Parallel fetch: reviews + want_to_see statuses
  const [reviews, statusRows] = await Promise.all([
    getReviewsForUsers(userSet, 20),
    getWantToSeeForUsers(userSet, 20),
  ]);

  // Merge and sort
  const activities: ActivityItem[] = [
    ...reviews.map((r) => ({ ...r, type: "review" as const })),
    ...statusRows.map((s) => ({ ...s, type: "want_to_see" as const })),
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
  const [profileMap, musicalMap] = await Promise.all([
    getProfilesByIds(activityUserIds),
    getMusicalsByIds(activityMusicalIds),
  ]);

  return (
    <div className="page-container">
      <h2 className="section-title">Activity</h2>

      {activities.length === 0 ? (
        <EmptyState message="No activity yet. Follow some friends or log your first show!">
          <Link
            href="/find-friends"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Find Friends
          </Link>
        </EmptyState>
      ) : (
        <div className="activity-feed">
          {activities.map((activity) => {
            const profile = profileMap.get(activity.user_id);
            const musical = musicalMap.get(activity.musical_id);
            const handle = profile?.handle ?? "unknown";
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
                      <PosterImage
                        mode="fixed"
                        src={musical?.image_url}
                        alt={`${title} poster`}
                        width={56}
                        height={75}
                      />
                    </div>
                    <div className="activity-details">
                      <p className="activity-title">{title}</p>
                      <StarRating rating={activity.rating_int} />
                      {activity.review_text && (
                        <p className="activity-review-text">
                          {activity.review_text}
                        </p>
                      )}
                      {activity.watch_date && (
                        <p className="activity-date-seen">
                          Attended {formatDate(activity.watch_date)}
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
                    <PosterImage
                      mode="fixed"
                      src={musical?.image_url}
                      alt={`${title} poster`}
                      width={56}
                      height={75}
                    />
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
