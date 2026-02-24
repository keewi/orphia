"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  profileUserId,
  currentUserId,
}: {
  profileUserId: string;
  currentUserId: string | null;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  // Hydrate follow status on mount
  useEffect(() => {
    if (!currentUserId || currentUserId === profileUserId) return;

    const supabase = createClient();
    supabase
      .from("follows")
      .select("follower_user_id")
      .eq("follower_user_id", currentUserId)
      .eq("following_user_id", profileUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data);
        setLoaded(true);
      });
  }, [currentUserId, profileUserId]);

  const handleToggle = useCallback(async () => {
    // Not logged in — redirect to login
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const supabase = createClient();
    const next = !isFollowing;
    setIsFollowing(next);

    if (next) {
      await supabase.from("follows").insert({
        follower_user_id: currentUserId,
        following_user_id: profileUserId,
      });
    } else {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_user_id", currentUserId)
        .eq("following_user_id", profileUserId);
    }
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

  // Wait for hydration before showing to avoid flash
  if (!loaded) return null;

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
