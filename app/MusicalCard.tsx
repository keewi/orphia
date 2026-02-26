"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Musical } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function MusicalCard({
  musical,
  initialSeenCount = 0,
  initialSavedForLater = false,
}: {
  musical: Musical;
  initialSeenCount?: number;
  initialSavedForLater?: boolean;
}) {
  const [savedForLater, setSavedForLater] = useState(initialSavedForLater);
  const [seenCount] = useState(initialSeenCount);

  const handleToggleSaved = useCallback(async () => {
    const supabase = createClient();
    const next = !savedForLater;
    setSavedForLater(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (next) {
      const { error } = await supabase.from("user_musical_status").upsert(
        {
          user_id: user.id,
          musical_id: musical.id,
          status: "want_to_see" as const,
        },
        { onConflict: "user_id, musical_id" },
      );
      // Fall back to legacy saved_musicals table if user_musical_status doesn't exist
      if (error?.code === "PGRST205") {
        await supabase.from("saved_musicals").upsert(
          { user_id: user.id, musical_id: musical.id },
          { onConflict: "user_id, musical_id" },
        );
      }
    } else {
      const { error } = await supabase
        .from("user_musical_status")
        .delete()
        .eq("musical_id", musical.id)
        .eq("user_id", user.id);
      // Fall back to legacy saved_musicals table
      if (error?.code === "PGRST205") {
        await supabase
          .from("saved_musicals")
          .delete()
          .eq("musical_id", musical.id)
          .eq("user_id", user.id);
      }
    }
  }, [savedForLater, musical.id]);

  return (
    <li
      className={`musical-card${musical.image_url ? " musical-card--has-image" : ""}`}
      style={
        musical.image_url
          ? { backgroundImage: `url(${musical.image_url})` }
          : undefined
      }
    >
      {musical.image_url && <div className="musical-card__overlay" />}
      <div className="musical-card__content">
        {seenCount === 0 && (
          <button
            type="button"
            className={`btn-save-toggle${savedForLater ? " btn-save-active" : ""}`}
            onClick={handleToggleSaved}
            aria-label={savedForLater ? "Remove from saved" : "Save for later"}
          >
            {savedForLater ? "\u2713" : "+"}
          </button>
        )}
        <div>
          <p className="title">{musical.title}</p>
          <p className="year">{musical.year}</p>
          <p className="description">{musical.description}</p>
        </div>
        <div className="card-actions">
          {seenCount > 0 && (
            <p className="status-label status-seen">
              Collected {seenCount} {seenCount === 1 ? "playbill" : "playbills"}
            </p>
          )}
          {savedForLater && seenCount === 0 && (
            <p className="status-label status-saved">Saved for later</p>
          )}
          <Link href={`/add/${musical.id}`} className="btn btn-accent">
            Add to Playbill
          </Link>
        </div>
      </div>
    </li>
  );
}
