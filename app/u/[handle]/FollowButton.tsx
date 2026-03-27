"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/app/actions";

export default function FollowButton({
  profileUserId,
  currentUserId,
  initialIsFollowing = false,
}: {
  profileUserId: string;
  currentUserId: string | null;
  initialIsFollowing?: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [hovering, setHovering] = useState(false);
  const router = useRouter();

  const handleToggle = useCallback(async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const next = !isFollowing;
    setIsFollowing(next);
    await toggleFollow(profileUserId, next);
  }, [isFollowing, currentUserId, profileUserId, router]);

  // Not logged in — show Follow button that redirects to login
  if (!currentUserId) {
    return (
      <button
        type="button"
        className="btn-follow"
        onClick={() => router.push("/login")}
      >
        Follow
      </button>
    );
  }

  // Don't render on own profile
  if (currentUserId === profileUserId) return null;

  if (isFollowing) {
    return (
      <button
        type="button"
        className="btn-following"
        onClick={handleToggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {hovering ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button type="button" className="btn-follow" onClick={handleToggle}>
      Follow
    </button>
  );
}
