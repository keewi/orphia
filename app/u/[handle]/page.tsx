import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    { data: reviews },
    {
      data: { user },
    },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, musical_id, musical_title, rating, review_text, date_seen, created_at",
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

  const currentUserId = user?.id ?? null;
  const isOwnProfile = currentUserId === profile.id;

  const { seenCount, sinceYear, uniqueShows } = deriveProfileStats(
    reviews ?? [],
  );

  // Fetch poster images (depends on review IDs, so runs after Promise.all)
  const musicalIds = Array.from(
    new Set((reviews ?? []).map((r) => r.musical_id)),
  );
  const { data: musicalImages } =
    musicalIds.length > 0
      ? await supabase
          .from("musicals")
          .select("id, image_url")
          .in("id", musicalIds)
      : { data: [] };
  const imageMap = new Map<string, string | null>(
    (musicalImages ?? []).map((m) => [m.id, m.image_url]),
  );

  // Group reviews by year
  const yearGroups: Map<number, typeof reviews> = new Map();
  if (reviews) {
    for (const r of reviews) {
      const displayDate = r.date_seen
        ? new Date(r.date_seen + "T00:00:00")
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
          {!isOwnProfile && (
            <FollowButton
              profileUserId={profile.id}
              currentUserId={currentUserId}
            />
          )}
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

      {/* ── Find Friends CTA (own profile only) ── */}
      {isOwnProfile && (
        <Link href="/find-friends" className="find-friends-cta">
          <span className="find-friends-cta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          Find friends on Orphia
        </Link>
      )}

      {/* ── Playbills Gallery ── */}
      <h3 className="subsection-title">
        {isOwnProfile ? "Your Playbills" : "Playbills"}
      </h3>

      {sortedYears.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          {isOwnProfile
            ? "No Playbills yet — log your first show to start your collection."
            : `@${profile.handle} hasn't collected any playbills yet.`}
        </div>
      ) : (
        sortedYears.map((year) => (
          <section key={year} className="gallery-year-group">
            <h4 className="gallery-year-header">{year}</h4>
            <div className="gallery-grid">
              {yearGroups.get(year)!.map((r) => (
                <div key={r.id} className="gallery-tile">
                  <div className="gallery-poster">
                    {imageMap.get(r.musical_id) ? (
                      <Image
                        src={imageMap.get(r.musical_id)!}
                        alt={`${r.musical_title} poster`}
                        fill
                        sizes="140px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      "🎭"
                    )}
                  </div>
                  <div className="gallery-tile-info">
                    <p className="gallery-tile-title">{r.musical_title}</p>
                    <Stars rating={r.rating} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
