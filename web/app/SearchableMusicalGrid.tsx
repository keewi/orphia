"use client";

import { useState, useMemo } from "react";
import type { Musical } from "@/lib/types";
import SearchBar from "./SearchBar";
import MusicalCard from "./MusicalCard";
import EmptyState from "@/app/components/EmptyState";

export default function SearchableMusicalGrid({
  musicals,
  statusMap,
}: {
  musicals: Musical[];
  statusMap: Record<string, { seenCount: number; savedForLater: boolean }>;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMusicals = useMemo(() => {
    if (!searchQuery.trim()) return musicals;
    const q = searchQuery.toLowerCase();
    return musicals.filter((m) => m.title.toLowerCase().includes(q));
  }, [searchQuery, musicals]);

  return (
    <>
      <SearchBar musicals={musicals} onSearch={setSearchQuery} />
      {filteredMusicals.length === 0 ? (
        <EmptyState emoji="🔍" message="No musicals match your search." />
      ) : (
        <ul className="musical-grid">
          {filteredMusicals.map((m) => (
            <MusicalCard
              key={m.id}
              musical={m}
              initialSeenCount={statusMap[m.id]?.seenCount ?? 0}
              initialSavedForLater={statusMap[m.id]?.savedForLater ?? false}
            />
          ))}
        </ul>
      )}
    </>
  );
}
