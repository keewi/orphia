/**
 * Barrel export for shared UI components.
 *
 * Usage:
 *   import { StarRating, EmptyState, PosterImage } from "@/app/components";
 */

export { default as StarRating } from "./StarRating";
export { default as StarRatingInput } from "./StarRatingInput";
export { default as PosterImage } from "./PosterImage";
export { default as EmptyState } from "./EmptyState";
export { default as ProfileHeader } from "./ProfileHeader";
export { default as YearGroupedGallery } from "./YearGroupedGallery";
export { default as ReviewForm } from "./ReviewForm";
export { groupReviewsByYear } from "./YearGroupedGallery";
export type { GalleryReview, GalleryMusical } from "./YearGroupedGallery";
export type { ReviewFormDefaults } from "./ReviewForm";
