import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserReviews, getMusicalsByIds } from "@/lib/services/musicalReadService";
import { getProfileByIdOrHandle, getFollowCounts } from "@/lib/services/profileService";
import { deriveProfileStats } from "@/lib/profileStats";
import ProfileHeader from "@/app/components/ProfileHeader";
import YearGroupedGallery from "@/app/components/YearGroupedGallery";
import EmptyState from "@/app/components/EmptyState";
import FollowButton from "./FollowButton";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const profile = await getProfileByIdOrHandle(params.handle);
  if (!profile) notFound();

  // Parallelize: reviews, auth, follow counts
  const [reviews, session, { followerCount, followingCount }] =
    await Promise.all([
      getUserReviews(profile.id),
      auth(),
      getFollowCounts(profile.id),
    ]);

  const currentUserId = session?.user?.id ?? null;
  if (currentUserId === profile.id) redirect("/my-theatre-life");

  // Check if current user follows this profile
  let initialIsFollowing = false;
  if (currentUserId && currentUserId !== profile.id) {
    const row = await db
      .select({ follower_user_id: follows.follower_user_id })
      .from(follows)
      .where(
        and(
          eq(follows.follower_user_id, currentUserId),
          eq(follows.following_user_id, profile.id),
        ),
      )
      .limit(1);
    initialIsFollowing = row.length > 0;
  }

  const stats = deriveProfileStats(reviews);

  // Batch-fetch musicals for poster/title display
  const musicalIds = Array.from(new Set(reviews.map((r) => r.musical_id)));
  const musicalMap = await getMusicalsByIds(musicalIds);

  return (
    <div className="page-container">
      {/* ── Profile Header ── */}
      <ProfileHeader
        handle={profile.handle}
        displayName={profile.display_name || profile.handle}
        stats={stats}
        followerCount={followerCount}
        followingCount={followingCount}
      >
        <FollowButton
          profileUserId={profile.id}
          currentUserId={currentUserId}
          initialIsFollowing={initialIsFollowing}
        />
      </ProfileHeader>

      {/* ── Playbills Gallery ── */}
      <h3 className="subsection-title">Playbills</h3>

      {reviews.length === 0 ? (
        <EmptyState
          message={`@${profile.handle} hasn't collected any playbills yet.`}
        />
      ) : (
        <YearGroupedGallery reviews={reviews} musicalMap={musicalMap} />
      )}
    </div>
  );
}
