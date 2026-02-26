import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const [reviews, { data: { user } }, { followerCount, followingCount }] =
    await Promise.all([
      getUserReviews(profile.id),
      supabase.auth.getUser(),
      getFollowCounts(profile.id),
    ]);

  const currentUserId = user?.id ?? null;
  if (currentUserId === profile.id) redirect("/my-theatre-life");

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
