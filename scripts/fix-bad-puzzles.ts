/**
 * Replace puzzles with inaccurate lyrics/answers with verified replacements.
 * Keyed on current (showName, answer) so we rewrite in place (keeping ids/dates).
 */
import { db } from "../lib/db";
import { puzzles } from "../lib/db/showdle-schema";
import { and, eq } from "drizzle-orm";

type Fix = {
  match: { showName: string; answer: string };
  set: {
    lyric: string;
    answer: string;
    showName: string;
    characterName: string;
    originalCast: string | null;
    songName: string;
    year: number;
    difficulty?: number;
  };
};

const FIXES: Fix[] = [
  // Sound of Music — real title-song lyric
  {
    match: { showName: "The Sound of Music", answer: "MUSIC" },
    set: {
      lyric: "The hills are alive with the sound of [BLANK]",
      answer: "MUSIC",
      showName: "The Sound of Music",
      characterName: "Maria",
      originalCast: "Mary Martin",
      songName: "The Sound of Music",
      year: 1959,
    },
  },
  // Pippin — Corner of the Sky
  {
    match: { showName: "Pippin", answer: "ALIVE" },
    set: {
      lyric: "Gotta find my corner of the [BLANK]",
      answer: "SKY",
      showName: "Pippin",
      characterName: "Pippin",
      originalCast: "John Rubinstein",
      songName: "Corner of the Sky",
      year: 1972,
    },
  },
  // West Side Story — real WSS lyric (Maria)
  {
    match: { showName: "West Side Story", answer: "SANDRA" },
    set: {
      lyric: "I just met a girl named [BLANK]",
      answer: "MARIA",
      showName: "West Side Story",
      characterName: "Tony",
      originalCast: "Larry Kert",
      songName: "Maria",
      year: 1957,
    },
  },
  // Titanic — Godspeed Titanic
  {
    match: { showName: "Titanic", answer: "GO" },
    set: {
      lyric: "Sail on, sail on, great ship [BLANK]",
      answer: "TITANIC",
      showName: "Titanic",
      characterName: "Company",
      originalCast: "Original Broadway Company",
      songName: "Godspeed Titanic",
      year: 1997,
    },
  },
  // Book of Mormon — I Believe
  {
    match: { showName: "The Book of Mormon", answer: "ROCK" },
    set: {
      lyric: "I [BLANK] that the Lord God created the universe",
      answer: "BELIEVE",
      showName: "The Book of Mormon",
      characterName: "Elder Price",
      originalCast: "Andrew Rannells",
      songName: "I Believe",
      year: 2011,
    },
  },
  // Thoroughly Modern Millie — title song
  {
    match: { showName: "Thoroughly Modern Millie", answer: "LADIES" },
    set: {
      lyric: "Everything today is thoroughly [BLANK]",
      answer: "MODERN",
      showName: "Thoroughly Modern Millie",
      characterName: "Millie Dillmount",
      originalCast: "Sutton Foster",
      songName: "Thoroughly Modern Millie",
      year: 2002,
    },
  },
];

async function main() {
  for (const f of FIXES) {
    const res = await db
      .update(puzzles)
      .set(f.set)
      .where(
        and(
          eq(puzzles.showName, f.match.showName),
          eq(puzzles.answer, f.match.answer),
        ),
      )
      .returning({ id: puzzles.id });
    if (res.length === 0) {
      console.warn(`  ✗ no match: ${f.match.showName} / ${f.match.answer}`);
    } else {
      console.log(
        `  ✓ ${f.match.showName} / ${f.match.answer} → ${f.set.answer} (${f.set.songName})`,
      );
    }
  }
}

main().then(() => process.exit(0));
