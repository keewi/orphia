"use client";

import { useState } from "react";

const THEATRICAL_COPY = [
  "Dimming the house lights\u2026",
  "Warming up the orchestra pit\u2026",
  "Raising the curtain\u2026",
  "Cuing the spotlight\u2026",
  "Checking the playbill\u2026",
  "Seating the audience\u2026",
  "Tuning the overture\u2026",
  "Setting the stage\u2026",
];

type Variant = "explore" | "profile" | "activity" | "following" | "public-profile";

function Line({ width, height = 16 }: { width: string | number; height?: number }) {
  return (
    <div
      className="skeleton-line skeleton-shimmer"
      style={{ width, height }}
    />
  );
}

function Block({ height, style }: { height: number | string; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton-block skeleton-shimmer"
      style={{ height, width: "100%", ...style }}
    />
  );
}

function ExploreSkeleton() {
  return (
    <>
      <Line width={160} height={28} />
      <div style={{ marginTop: "1rem" }}>
        <Block height={52} />
      </div>
      <div className="musical-grid" style={{ marginTop: "1.5rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} height={300} />
        ))}
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Line width={180} height={32} />
      <div style={{ marginTop: 8 }}>
        <Line width={260} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Line width={200} />
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <Block height={140} />
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <Line width={140} height={22} />
      </div>
      <div className="gallery-grid" style={{ marginTop: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} height={0} style={{ aspectRatio: "3 / 4" }} />
        ))}
      </div>
    </>
  );
}

function PublicProfileSkeleton() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Line width={180} height={32} />
          <div style={{ marginTop: 4 }}>
            <Line width={120} height={14} />
          </div>
        </div>
        <div
          className="skeleton-shimmer"
          style={{ width: 90, height: 36, borderRadius: 20 }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <Line width={260} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Line width={200} />
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <Line width={140} height={22} />
      </div>
      <div className="gallery-grid" style={{ marginTop: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} height={0} style={{ aspectRatio: "3 / 4" }} />
        ))}
      </div>
    </>
  );
}

function ActivitySkeleton() {
  return (
    <>
      <Line width={120} height={28} />
      <div className="activity-feed" style={{ marginTop: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--card-bg)",
              borderRadius: "var(--radius)",
              padding: "1rem 1.25rem",
            }}
          >
            <Line width="70%" height={14} />
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
              <div
                className="skeleton-shimmer"
                style={{ width: 56, height: 75, borderRadius: 8, flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Line width={200} height={18} />
                <Line width={80} height={14} />
                <Line width="90%" height={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FollowingSkeleton() {
  return (
    <>
      <Line width={140} height={28} />
      <div className="following-grid" style={{ marginTop: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--card-bg)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Line width={120} height={20} />
            <div style={{ marginTop: 8 }}>
              <Line width={180} height={14} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const VARIANTS: Record<Variant, () => React.JSX.Element> = {
  explore: ExploreSkeleton,
  profile: ProfileSkeleton,
  activity: ActivitySkeleton,
  following: FollowingSkeleton,
  "public-profile": PublicProfileSkeleton,
};

export default function TheatricalLoader({
  variant,
  showMicrocopy = true,
}: {
  variant: Variant;
  showMicrocopy?: boolean;
}) {
  const [phrase] = useState(
    () => THEATRICAL_COPY[Math.floor(Math.random() * THEATRICAL_COPY.length)],
  );

  const Skeleton = VARIANTS[variant];

  return (
    <div className="page-container">
      {showMicrocopy && <p className="skeleton-microcopy">{phrase}</p>}
      <Skeleton />
    </div>
  );
}
