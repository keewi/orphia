import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTableMissing, normalizeLegacyReview } from "@/lib/supabase/compat";
import { deriveProfileStats } from "@/lib/profileStats";
import { Stars } from "@/app/ReviewCards";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MyTheatreLife() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: reviewData, error: reviewError },
    { data: profile },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from("user_reviews")
      .select("id, musical_id, rating_int, review_text, watch_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, handle, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_user_id", user.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", user.id),
  ]);

  let reviews = reviewData;
  if (isTableMissing(reviewError)) {
    const { data: legacyData } = await supabase
      .from("reviews")
      .select("id, musical_id, rating, review_text, date_seen, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    reviews = (legacyData ?? []).map(normalizeLegacyReview);
  }

  if (!profile) redirect("/choose-handle");

  const { seenCount, sinceYear, uniqueShows } = deriveProfileStats(reviews ?? []);
  const mostRecent = reviews?.[0] ?? null;

  // Fetch musicals for reviewed shows (title + poster)
  const musicalIds = Array.from(new Set((reviews ?? []).map((r) => r.musical_id)));
  const { data: musicalRows } = musicalIds.length > 0
    ? await supabase.from("musicals").select("id, title, image_url").in("id", musicalIds)
    : { data: [] };
  const musicalMap = new Map(
    (musicalRows ?? []).map((m) => [m.id, m]),
  );

  // Group reviews by year (displayDate = watch_date ?? created_at)
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

  // Sort year keys descending; within each group, already sorted by created_at desc
  const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);

  return (
    <div className="page-container">
      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-header-top">
          <div>
            <h2 className="profile-display-name">@{profile.handle}</h2>
          </div>
        </div>

        {seenCount > 0 && sinceYear && (
          <p className="profile-opener">
            {seenCount} {seenCount === 1 ? "playbill" : "playbills"} collected since {sinceYear} · {uniqueShows} unique {uniqueShows === 1 ? "show" : "shows"}
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

      {/* ── Most Recently Added ── */}
      {mostRecent && (
        <div className="highlight-card">
          {/* ── Banner ── */}
          <div className="highlight-banner">
            <p className="highlight-header">Most Recently Added</p>
            <p className="highlight-subtext">Your latest Playbill</p>
          </div>

          {/* ── Body: poster + content ── */}
          <div className="highlight-body">
            <div className="highlight-poster">
              {musicalMap.get(mostRecent.musical_id)?.image_url ? (
                <Image
                  src={musicalMap.get(mostRecent.musical_id)!.image_url!}
                  alt={`${musicalMap.get(mostRecent.musical_id)?.title ?? "Musical"} poster`}
                  width={88}
                  height={88}
                  style={{ objectFit: "cover", borderRadius: "12px" }}
                />
              ) : (
                "🎭"
              )}
            </div>
            <div className="highlight-content">
              <div className="highlight-title-row">
                <p className="highlight-title">
                  {musicalMap.get(mostRecent.musical_id)?.title ?? "Unknown Musical"}
                </p>
                <Stars rating={mostRecent.rating_int} />
              </div>
              {mostRecent.review_text ? (
                <p className="highlight-note">{mostRecent.review_text}</p>
              ) : (
                <p className="highlight-note highlight-note-empty">No notes yet</p>
              )}
            </div>
          </div>

          {/* ── Footer: date ── */}
          {mostRecent.watch_date && (
            <div className="highlight-footer">
              <p className="highlight-date">Attended {formatDate(mostRecent.watch_date)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Your Playbills Gallery ── */}
      <h3 className="subsection-title">Your Playbills</h3>

      {sortedYears.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎭</span>
          No Playbills yet — log your first show to start your collection.
          <br />
          <Link
            href="/browse"
            className="btn btn-accent"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Log a show
          </Link>
        </div>
      ) : (
        sortedYears.map((year) => (
          <section key={year} className="gallery-year-group">
            <h4 className="gallery-year-header">{year}</h4>
            <div className="gallery-grid">
              {yearGroups.get(year)!.map((r) => {
                const musical = musicalMap.get(r.musical_id);
                return (
                  <Link
                    key={r.id}
                    href={`/edit/${r.id}`}
                    className="gallery-tile"
                  >
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
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
