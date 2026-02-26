import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTableMissing, normalizeLegacyReview } from "@/lib/supabase/compat";
import { deriveProfileStats } from "@/lib/profileStats";
import { Stars } from "@/app/ReviewCards";
import FollowButton from "./FollowButton";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = createClient();

  // Detect UUID vs handle — UUIDs contain hyphens, handles never do
  const param = params.handle;
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

  const { data: profile } = isUUID
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

  if (!profile) {
    notFound();
  }

  // Parallelize: reviews, auth, follower count, following count
  const [
    { data: reviewData, error: reviewError },
    {
      data: { user },
    },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from("user_reviews")
      .select(
        "id, musical_id, rating_int, review_text, watch_date, created_at",
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_user_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", profile.id),
  ]);

  let reviews = reviewData;
  if (isTableMissing(reviewError)) {
    const { data: legacyData } = await supabase
      .from("reviews")
      .select("id, musical_id, rating, review_text, date_seen, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    reviews = (legacyData ?? []).map(normalizeLegacyReview);
  }

  const currentUserId = user?.id ?? null;
  const isOwnProfile = currentUserId === profile.id;
  if (isOwnProfile) redirect("/my-theatre-life");

  const { seenCount, sinceYear, uniqueShows } = deriveProfileStats(
    reviews ?? [],
  );

  // Fetch musicals for reviewed shows (title + poster)
  const musicalIds = Array.from(
    new Set((reviews ?? []).map((r) => r.musical_id)),
  );
  const { data: musicalRows } =
    musicalIds.length > 0
      ? await supabase
          .from("musicals")
          .select("id, title, image_url")
          .in("id", musicalIds)
      : { data: [] };
  const musicalMap = new Map(
    (musicalRows ?? []).map((m) => [m.id, m]),
  );

  // Group reviews by year
  const yearGroups: Map<number, typeof reviews> = new Map();
  if (reviews) {
    for (const r of reviews) {
      const displayDate = r.watch_date
        ? new Date(r.watch_date + "T00:00:00")
        : new Date(r.created_at);
      const year = displayDate.getFullYear();
      if (!yearGroups.has(year)) yearGroups.set(year, []);
      yearGroups.get(year)!.push(r);
    }
  }
  const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);

  const displayName = profile.display_name || profile.handle;

  return (
    <div className="page-container">
      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-header-top">
          <div>
            <h2 className="profile-display-name">{displayName}</h2>
            <p className="profile-handle">@{profile.handle}</p>
          </div>
          <FollowButton
            profileUserId={profile.id}
            currentUserId={currentUserId}
          />
        </div>

        {seenCount > 0 && sinceYear && (
          <p className="profile-opener">
            {seenCount} {seenCount === 1 ? "playbill" : "playbills"} collected
            since {sinceYear} · {uniqueShows} unique{" "}
            {uniqueShows === 1 ? "show" : "shows"}
          </p>
        )}

        <div className="profile-follow-counts">
          <span>
            <strong>{followerCount ?? 0}</strong>{" "}
            {followerCount === 1 ? "follower" : "followers"}
          </span>
          <span>
            <strong>{followingCount ?? 0}</strong> following
          </span>
        </div>
      </div>

      {/* ── Playbills Gallery ── */}
      <h3 className="subsection-title">Playbills</h3>

      {sortedYears.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          {`@${profile.handle} hasn't collected any playbills yet.`}
        </div>
      ) : (
        sortedYears.map((year) => (
          <section key={year} className="gallery-year-group">
            <h4 className="gallery-year-header">{year}</h4>
            <div className="gallery-grid">
              {yearGroups.get(year)!.map((r) => {
                const musical = musicalMap.get(r.musical_id);
                return (
                  <div key={r.id} className="gallery-tile">
                    <div className="gallery-poster">
                      {musical?.image_url ? (
                        <Image
                          src={musical.image_url}
                          alt={`${musical?.title ?? "Musical"} poster`}
                          fill
                          sizes="140px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        "🎭"
                      )}
                    </div>
                    <div className="gallery-tile-info">
                      <p className="gallery-tile-title">{musical?.title ?? "Unknown Musical"}</p>
                      <Stars rating={r.rating_int} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
