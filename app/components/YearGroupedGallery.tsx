import Link from "next/link";
import PosterImage from "./PosterImage";
import StarRating from "./StarRating";

/**
 * Year-grouped gallery of playbill tiles.
 *
 * Shared by My Playbills (tiles link to /edit/:id) and Public Profile (tiles are static).
 *
 * Server-safe — no "use client" needed.
 */

export interface GalleryReview {
  id: string;
  musical_id: string;
  rating_int: number;
  watch_date: string | null;
  created_at: string;
}

export interface GalleryMusical {
  id: string;
  title: string;
  image_url: string | null;
}

/** Group reviews by display year and sort years descending. */
export function groupReviewsByYear<T extends GalleryReview>(reviews: T[]) {
  const yearGroups = new Map<number, T[]>();
  for (const r of reviews) {
    const displayDate = r.watch_date
      ? new Date(r.watch_date + "T00:00:00")
      : new Date(r.created_at);
    const year = displayDate.getFullYear();
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year)!.push(r);
  }
  const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => b - a);
  return { yearGroups, sortedYears };
}

export default function YearGroupedGallery({
  reviews,
  musicalMap,
  linkToEdit = false,
}: {
  reviews: GalleryReview[];
  musicalMap: Map<string, GalleryMusical>;
  /** When true, each tile links to /edit/:reviewId (own profile). */
  linkToEdit?: boolean;
}) {
  const { yearGroups, sortedYears } = groupReviewsByYear(reviews);

  if (sortedYears.length === 0) return null;

  return (
    <>
      {sortedYears.map((year) => (
        <section key={year} className="gallery-year-group">
          <h4 className="gallery-year-header">{year}</h4>
          <div className="gallery-grid">
            {yearGroups.get(year)!.map((r) => {
              const musical = musicalMap.get(r.musical_id);
              const tile = (
                <>
                  <div className="gallery-poster">
                    <PosterImage
                      src={musical?.image_url}
                      alt={`${musical?.title ?? "Musical"} poster`}
                    />
                  </div>
                  <div className="gallery-tile-info">
                    <p className="gallery-tile-title">
                      {musical?.title ?? "Unknown Musical"}
                    </p>
                    <StarRating rating={r.rating_int} />
                  </div>
                </>
              );

              if (linkToEdit) {
                return (
                  <Link key={r.id} href={`/edit/${r.id}`} className="gallery-tile">
                    {tile}
                  </Link>
                );
              }

              return (
                <div key={r.id} className="gallery-tile">
                  {tile}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
