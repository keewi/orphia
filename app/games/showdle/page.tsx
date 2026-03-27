import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/showdle-schema";
import { sql } from "drizzle-orm";
import ShowdleGame from "./ShowdleGame";

export const dynamic = "force-dynamic";

export default async function ShowdlePage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(puzzles)
    .where(sql`DATE(${puzzles.scheduledDate}) = DATE(${today.toISOString()})`)
    .limit(1);

  if (rows.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1a1108" }}>
          No puzzle today
        </h2>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#a08060", marginTop: 8 }}>
          Check back tomorrow for a new Showdle!
        </p>
      </div>
    );
  }

  const puzzle = rows[0];

  return (
    <ShowdleGame
      puzzle={{
        id: puzzle.id,
        lyric: puzzle.lyric,
        wordLength: puzzle.answer.length,
        difficulty: puzzle.difficulty,
        answer: puzzle.answer,
        showName: puzzle.showName,
      }}
    />
  );
}
