/**
 * GET /api/mobile/musicals
 *
 * Browse the full musicals catalog.
 * Optional query params: ?search=term&sort=alpha|popularity
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllMusicals, getAllMusicalsAlpha } from "@/lib/services/musicalReadService";

export async function GET(request: NextRequest) {
  try {
    const sort = request.nextUrl.searchParams.get("sort") ?? "popularity";
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase();

    let musicalsData =
      sort === "alpha" ? await getAllMusicalsAlpha() : await getAllMusicals();

    if (search) {
      musicalsData = musicalsData.filter((m) =>
        m.title.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ musicals: musicalsData });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch musicals" },
      { status: 500 }
    );
  }
}
