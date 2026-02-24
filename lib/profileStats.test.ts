import { describe, it, expect } from "vitest";
import { deriveProfileStats, formatHeroStatement } from "./profileStats";

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

describe("formatHeroStatement", () => {
  it("returns null when seenCount is 0", () => {
    expect(formatHeroStatement({ seenCount: 0, sinceYear: null, uniqueShows: 0 })).toBeNull();
  });

  it("returns null when sinceYear is null", () => {
    expect(formatHeroStatement({ seenCount: 3, sinceYear: null, uniqueShows: 2 })).toBeNull();
  });

  it("uses singular for 1 playbill and 1 show", () => {
    const result = formatHeroStatement({ seenCount: 1, sinceYear: 2024, uniqueShows: 1 });
    expect(result).toBe("1 playbill collected since 2024 \u00b7 1 unique show");
  });

  it("uses plural for multiple playbills and shows", () => {
    const result = formatHeroStatement({ seenCount: 5, sinceYear: 2020, uniqueShows: 3 });
    expect(result).toBe("5 playbills collected since 2020 \u00b7 3 unique shows");
  });
});
