import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/db/showdle-schema";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { guesses, won, guessCount, hintUsed } = body;

    // Validation
    if (typeof guessCount !== "number" || guessCount < 1 || guessCount > 6) {
      return NextResponse.json({ error: "Invalid guessCount" }, { status: 400 });
    }
    if (!Array.isArray(guesses) || guesses.length !== guessCount) {
      return NextResponse.json({ error: "Invalid guesses" }, { status: 400 });
    }
    if (typeof won !== "boolean") {
      return NextResponse.json({ error: "Invalid won" }, { status: 400 });
    }

    await db.insert(puzzleResults).values({
      puzzleId: params.id,
      guessCount,
      won: won ? 1 : 0,
      hintUsed: hintUsed ? 1 : 0,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    // Silently swallow errors (fire-and-forget from client)
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
