import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ntsResults } from "@/lib/db/nts-schema";

interface SubmitBody {
  deviceId: string;
  username: string;
  songId: string;
  outcome: "won" | "lost";
  hintUsed: boolean;
  timeSpent: number;
  rightLetters: number;
  wrongLetters: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitBody;

    if (!body.deviceId || !body.username || !body.songId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["won", "lost"].includes(body.outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }
    if (body.username.length > 20) {
      return NextResponse.json({ error: "Username max 20 chars" }, { status: 400 });
    }
    if (typeof body.timeSpent !== "number" || typeof body.rightLetters !== "number" || typeof body.wrongLetters !== "number") {
      return NextResponse.json({ error: "Invalid stats" }, { status: 400 });
    }

    const playedDate = new Date().toISOString().slice(0, 10);

    await db.insert(ntsResults).values({
      deviceId: body.deviceId,
      username: body.username.trim(),
      songId: body.songId,
      outcome: body.outcome,
      hintUsed: body.hintUsed,
      timeSpent: body.timeSpent,
      rightLetters: body.rightLetters,
      wrongLetters: body.wrongLetters,
      playedDate,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NTS] submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
