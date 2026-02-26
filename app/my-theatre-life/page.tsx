import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/services/authGuard";
import { getUserReviews, getMusicalsByIds } from "@/lib/services/musicalReadService";
import { getProfileById, getFollowCounts } from "@/lib/services/profileService";
import { deriveProfileStats } from "@/lib/profileStats";
import { formatDate } from "@/lib/utils/formatDate";
import ProfileHeader from "@/app/components/ProfileHeader";
import YearGroupedGallery from "@/app/components/YearGroupedGallery";
import EmptyState from "@/app/components/EmptyState";
import PosterImage from "@/app/components/PosterImage";
import StarRating from "@/app/components/StarRating";

export const dynamic = "force-dynamic";

export default async function MyTheatreLife() {
  const user = await requireAuth();

  const [reviews, profile, { followerCount, followingCount }] =
    await Promise.all([
      getUserReviews(user.id),
      getProfileById(user.id),
      getFollowCounts(user.id),
    ]);

  if (!profile) redirect("/choose-handle");

  const stats = deriveProfileStats(reviews);
  const mostRecent = reviews[0] ?? null;

  // Batch-fetch musicals for poster/title display
  const musicalIds = Array.from(new Set(reviews.map((r) => r.musical_id)));
  const musicalMap = await getMusicalsByIds(musicalIds);

  return (
    <div className="page-container">
      {/* ── Profile Header ── */}
      <ProfileHeader
        handle={profile.handle}
        stats={stats}
        followerCount={followerCount}
        followingCount={followingCount}
      />

      {/* ── Most Recently Added ── */}
      {mostRecent && (
        <div className="highlight-card">
          <div className="highlight-banner">
            <p className="highlight-header">Most Recently Added</p>
            <p className="highlight-subtext">Your latest Playbill</p>
          </div>

          <div className="highlight-body">
            <div className="highlight-poster">
              <PosterImage
                mode="fixed"
                src={musicalMap.get(mostRecent.musical_id)?.image_url}
                alt={`${musicalMap.get(mostRecent.musical_id)?.title ?? "Musical"} poster`}
                width={88}
                height={88}
                borderRadius={12}
              />
            </div>
            <div className="highlight-content">
              <div className="highlight-title-row">
                <p className="highlight-title">
                  {musicalMap.get(mostRecent.musical_id)?.title ?? "Unknown Musical"}
                </p>
                <StarRating rating={mostRecent.rating_int} />
              </div>
              {mostRecent.review_text ? (
                <p className="highlight-note">{mostRecent.review_text}</p>
              ) : (
                <p className="highlight-note highlight-note-empty">No notes yet</p>
              )}
            </div>
          </div>

          {mostRecent.watch_date && (
            <div className="highlight-footer">
              <p className="highlight-date">
                Attended {formatDate(mostRecent.watch_date)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Your Playbills Gallery ── */}
      <h3 className="subsection-title">Your Playbills</h3>

      {reviews.length === 0 ? (
        <EmptyState message="No Playbills yet — log your first show to start your collection.">
          <Link
            href="/browse"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Log a show
          </Link>
        </EmptyState>
      ) : (
        <YearGroupedGallery
          reviews={reviews}
          musicalMap={musicalMap}
          linkToEdit
        />
      )}
    </div>
  );
}
