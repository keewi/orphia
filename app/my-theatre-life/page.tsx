import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    { data: reviews },
    { data: profile },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, musical_id, musical_title, rating, review_text, date_seen, created_at")
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

  if (!profile) redirect("/choose-handle");

  const { seenCount, sinceYear, uniqueShows } = deriveProfileStats(reviews ?? []);
  const mostRecent = reviews?.[0] ?? null;

  // Fetch poster images for reviewed musicals
  const musicalIds = Array.from(new Set((reviews ?? []).map((r) => r.musical_id)));
  const { data: musicalImages } = musicalIds.length > 0
    ? await supabase.from("musicals").select("id, image_url").in("id", musicalIds)
    : { data: [] };
  const imageMap = new Map<string, string | null>(
    (musicalImages ?? []).map((m) => [m.id, m.image_url])
  );

  // Group reviews by year (displayDate = date_seen ?? created_at)
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

      {/* ── Find Friends CTA ── */}
      <Link href="/find-friends" className="find-friends-cta">
        <span className="find-friends-cta-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        Find friends on Orphia
      </Link>

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
              {imageMap.get(mostRecent.musical_id) ? (
                <Image
                  src={imageMap.get(mostRecent.musical_id)!}
                  alt={`${mostRecent.musical_title} poster`}
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
                <p className="highlight-title">{mostRecent.musical_title}</p>
                <Stars rating={mostRecent.rating} />
              </div>
              {mostRecent.review_text ? (
                <p className="highlight-note">{mostRecent.review_text}</p>
              ) : (
                <p className="highlight-note highlight-note-empty">No notes yet</p>
              )}
            </div>
          </div>

          {/* ── Footer: date ── */}
          {mostRecent.date_seen && (
            <div className="highlight-footer">
              <p className="highlight-date">Attended {formatDate(mostRecent.date_seen)}</p>
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
            href="/"
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
              {yearGroups.get(year)!.map((r) => (
                <Link
                  key={r.id}
                  href={`/edit/${r.id}`}
                  className="gallery-tile"
                >
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
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
