import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/db/showdle-schema";
import { calculateScore } from "@/lib/showdle/stats";
import { auth } from "@/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { won, guessCount, score: clientScore, hintUsed } = body as {
      won: unknown;
      guessCount: unknown;
      score: unknown;
      hintUsed: unknown;
    };

    // Shape validation
    if (typeof won !== "boolean") {
      return NextResponse.json({ error: "Invalid won" }, { status: 400 });
    }
    if (typeof hintUsed !== "boolean") {
      return NextResponse.json({ error: "Invalid hintUsed" }, { status: 400 });
    }
    if (won) {
      if (typeof guessCount !== "number" || guessCount < 1 || guessCount > 6) {
        return NextResponse.json({ error: "Invalid guessCount" }, { status: 400 });
      }
    } else if (guessCount !== null && guessCount !== undefined) {
      return NextResponse.json({ error: "guessCount must be null on loss" }, { status: 400 });
    }
    if (typeof clientScore !== "number") {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    // Re-derive score server-side. Trust the server value. Log mismatches
    // but don't reject — keep completion fire-and-forget for the client.
    const normalizedGuessCount = won ? (guessCount as number) : null;
    const serverScore = calculateScore(won, normalizedGuessCount, hintUsed);
    if (serverScore !== clientScore) {
      console.warn(
        `[showdle/complete] score mismatch for puzzle ${params.id}: client=${clientScore} server=${serverScore}`,
      );
    }

    // Session (nullable — anonymous plays still contribute to the aggregate
    // histogram but are ignored for personal stats and leaderboard).
    const session = await auth();
    const userId = session?.user?.id ?? null;

    await db.insert(puzzleResults).values({
      puzzleId: params.id,
      userId,
      won,
      guessCount: normalizedGuessCount,
      score: serverScore,
      hintUsed,
    });

    // Atomically bump the per-puzzle aggregate distribution.
    // Postgres arrays are 1-indexed:
    //   guess_distribution[1] = losses
    //   guess_distribution[2..7] = wins in 1..6 guesses
    const pgIndex = won ? (normalizedGuessCount as number) + 1 : 1;
    await db.execute(
      sql`UPDATE puzzles
          SET guess_distribution[${sql.raw(String(pgIndex))}] = guess_distribution[${sql.raw(String(pgIndex))}] + 1
          WHERE id = ${params.id}`,
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[showdle/complete] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
