"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Musical } from "@/data/musicals";

/* ── Seen-entries store (multiple "seen" entries per musical) ── */
const ENTRIES_KEY = "musical-entries";

export interface SeenEntryRecord {
  musicalId: string;
  status: "seen";
  timestamp: number;
}

export function readAllEntries(): SeenEntryRecord[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSeenEntry(musicalId: string): SeenEntryRecord[] {
  const entries = readAllEntries();
  entries.push({ musicalId, status: "seen", timestamp: Date.now() });
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable — silently ignore
  }
  return entries;
}

function countForMusical(entries: SeenEntryRecord[], musicalId: string): number {
  return entries.filter((e) => e.musicalId === musicalId && e.status === "seen").length;
}

/* ── Saved-for-later store ── */
const SAVED_KEY = "musical-saved";

function readAllSaved(): Record<string, true> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeSaved(musicalId: string, saved: boolean) {
  try {
    const all = readAllSaved();
    if (saved) {
      all[musicalId] = true;
    } else {
      delete all[musicalId];
    }
    localStorage.setItem(SAVED_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export default function MusicalCard({ musical }: { musical: Musical }) {
  const [savedForLater, setSavedForLater] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const entries = readAllEntries();
    const count = countForMusical(entries, musical.id);
    setSeenCount(count);

    const isSaved = !!readAllSaved()[musical.id];
    // Defensive: a musical with seen entries should never be saved-for-later
    if (count > 0 && isSaved) {
      writeSaved(musical.id, false);
      setSavedForLater(false);
    } else {
      setSavedForLater(isSaved);
    }
  }, [musical.id]);

  const handleToggleSaved = useCallback(() => {
    const next = !savedForLater;
    setSavedForLater(next);
    writeSaved(musical.id, next);
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
            Seen {seenCount} {seenCount === 1 ? "time" : "times"}
          </p>
        )}
        {savedForLater && seenCount === 0 && (
          <p className="status-label status-saved">Saved for later</p>
        )}
        <Link href={`/add/${musical.id}`} className="btn btn-accent">
          Add Experience
        </Link>
      </div>
    </li>
  );
}
