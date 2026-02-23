import { describe, it, expect } from "vitest";
import { deriveProfileStats } from "./profileStats";

describe("deriveProfileStats", () => {
  it("returns correct stats with mixed date_seen values", () => {
    const reviews = [
      { musical_id: "hamilton", date_seen: "2024-03-15", created_at: "2024-03-20T00:00:00Z" },
      { musical_id: "hamilton", date_seen: null, created_at: "2025-01-10T00:00:00Z" },
      { musical_id: "wicked", date_seen: "2023-06-01", created_at: "2023-06-05T00:00:00Z" },
    ];

    const stats = deriveProfileStats(reviews);

    expect(stats.seenCount).toBe(3);
    expect(stats.uniqueShows).toBe(2);
    expect(stats.sinceYear).toBe(2023); // earliest date_seen is 2023-06-01
  });

  it("falls back to created_at when no date_seen exists", () => {
    const reviews = [
      { musical_id: "rent", date_seen: null, created_at: "2025-12-01T00:00:00Z" },
      { musical_id: "cats", date_seen: null, created_at: "2022-08-15T00:00:00Z" },
    ];

    const stats = deriveProfileStats(reviews);

    expect(stats.sinceYear).toBe(2022); // oldest created_at is 2022
    expect(stats.seenCount).toBe(2);
    expect(stats.uniqueShows).toBe(2);
  });
});
