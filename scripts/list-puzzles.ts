import { db } from "../lib/db";
import { puzzles } from "../lib/db/showdle-schema";

async function main() {
  const r = await db
    .select({
      id: puzzles.id,
      showName: puzzles.showName,
      answer: puzzles.answer,
      lyric: puzzles.lyric,
      characterName: puzzles.characterName,
      songName: puzzles.songName,
      year: puzzles.year,
      scheduledDate: puzzles.scheduledDate,
    })
    .from(puzzles)
    .orderBy(puzzles.scheduledDate);
  console.log(JSON.stringify(r, null, 2));
}

main().then(() => process.exit(0));
