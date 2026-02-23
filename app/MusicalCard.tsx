"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Musical } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function MusicalCard({ musical }: { musical: Musical }) {
  const [savedForLater, setSavedForLater] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  // Hydrate from Supabase on mount
  useEffect(() => {
    const supabase = createClient();

    async function fetchStatus() {
      // Get playbill count
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("musical_id", musical.id);

      const seen = count ?? 0;
      setSeenCount(seen);

      // Get saved status (only matters if not seen)
      if (seen === 0) {
        const { data } = await supabase
          .from("saved_musicals")
          .select("id")
          .eq("musical_id", musical.id)
          .maybeSingle();

        setSavedForLater(!!data);
      }
    }

    fetchStatus();
  }, [musical.id]);

  const handleToggleSaved = useCallback(async () => {
    const supabase = createClient();
    const next = !savedForLater;
    setSavedForLater(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (next) {
      await supabase
        .from("saved_musicals")
        .insert({ musical_id: musical.id, user_id: user.id });
    } else {
      await supabase
        .from("saved_musicals")
        .delete()
        .eq("musical_id", musical.id)
        .eq("user_id", user.id);
    }
  }, [savedForLater, musical.id]);

  return (
    <li className="musical-card">
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
    </li>
  );
}
