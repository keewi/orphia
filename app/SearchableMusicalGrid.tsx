"use client";

import { useState, useMemo } from "react";
import type { Musical } from "@/data/musicals";
import SearchBar from "./SearchBar";
import MusicalCard from "./MusicalCard";

export default function SearchableMusicalGrid({
  musicals,
}: {
  musicals: Musical[];
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
        <div className="empty-state">
          <span className="emoji">🔍</span>
          No musicals match your search.
        </div>
      ) : (
        <ul className="musical-grid">
          {filteredMusicals.map((m) => (
            <MusicalCard key={m.id} musical={m} />
          ))}
        </ul>
      )}
    </>
  );
}
