/**
 * Backfill songName and year for existing puzzles.
 * Keyed by (showName, answer) since that pair is unique across the current set.
 * year = original Broadway (or West End) opening year of the show.
 */
import { db } from "../lib/db";
import { puzzles } from "../lib/db/showdle-schema";
import { and, eq } from "drizzle-orm";

type Entry = { showName: string; answer: string; songName: string; year: number };

const ENTRIES: Entry[] = [
  { showName: "The Phantom of the Opera", answer: "MUSIC", songName: "The Music of the Night", year: 1988 },
  { showName: "Wicked", answer: "WICKED", songName: "No One Mourns the Wicked", year: 2003 },
  { showName: "The Phantom of the Opera", answer: "PHANTOM", songName: "The Phantom of the Opera", year: 1988 },
  { showName: "Wicked", answer: "DEFYING", songName: "Defying Gravity", year: 2003 },
  { showName: "Rent", answer: "GLORY", songName: "One Song Glory", year: 1996 },
  { showName: "1776", answer: "MADMAN", songName: "Sit Down, John", year: 1969 },
  { showName: "Pippin", answer: "ALIVE", songName: "Corner of the Sky", year: 1972 },
  { showName: "Gypsy", answer: "ROSES", songName: "Everything's Coming Up Roses", year: 1959 },
  { showName: "Sunday in the Park with George", answer: "MORTAR", songName: "Putting It Together", year: 1984 },
  { showName: "Hamilton", answer: "THROWING", songName: "My Shot", year: 2015 },
  { showName: "Annie", answer: "TOMORROW", songName: "Tomorrow", year: 1977 },
  { showName: "The Sound of Music", answer: "MUSIC", songName: "The Sound of Music", year: 1959 },
  { showName: "Evita", answer: "ARGENTINA", songName: "Don't Cry for Me Argentina", year: 1979 },
  { showName: "Cats", answer: "MOONLIGHT", songName: "Memory", year: 1982 },
  { showName: "Les Misérables", answer: "DREAM", songName: "I Dreamed a Dream", year: 1987 },
  { showName: "Rent", answer: "MINUTES", songName: "Seasons of Love", year: 1996 },
  { showName: "West Side Story", answer: "SANDRA", songName: "Look at Me, I'm Sandra Dee", year: 1957 },
  { showName: "The Pirates of Penzance", answer: "MAJOR", songName: "I Am the Very Model of a Modern Major-General", year: 1879 },
  { showName: "Fiddler on the Roof", answer: "TRADITION", songName: "Tradition", year: 1964 },
  { showName: "My Fair Lady", answer: "DANCED", songName: "I Could Have Danced All Night", year: 1956 },
  { showName: "South Pacific", answer: "EVENING", songName: "Some Enchanted Evening", year: 1949 },
  { showName: "The King and I", answer: "YOU", songName: "Getting to Know You", year: 1951 },
  { showName: "Oklahoma!", answer: "MORNING", songName: "Oh, What a Beautiful Mornin'", year: 1943 },
  { showName: "The Music Man", answer: "TROMBONES", songName: "Seventy-Six Trombones", year: 1957 },
  { showName: "Hello, Dolly!", answer: "DOLLY", songName: "Hello, Dolly!", year: 1964 },
  { showName: "Chicago", answer: "JAZZ", songName: "All That Jazz", year: 1975 },
  { showName: "The Lion King", answer: "LIFE", songName: "Circle of Life", year: 1997 },
  { showName: "Aladdin", answer: "WORLD", songName: "A Whole New World", year: 2014 },
  { showName: "Frozen", answer: "GO", songName: "Let It Go", year: 2018 },
  { showName: "Titanic", answer: "GO", songName: "My Heart Will Go On", year: 1997 },
  { showName: "Grease", answer: "LIGHTNIN", songName: "Greased Lightnin'", year: 1972 },
  { showName: "Dear Evan Hansen", answer: "WINDOW", songName: "Waving Through a Window", year: 2016 },
  { showName: "Hamilton", answer: "WAIT", songName: "Wait for It", year: 2015 },
  { showName: "Hadestown", answer: "HADES", songName: "Way Down Hadestown", year: 2019 },
  { showName: "The Book of Mormon", answer: "ROCK", songName: "Hello!", year: 2011 },
  { showName: "Six", answer: "DIED", songName: "Ex-Wives", year: 2020 },
  { showName: "Wicked", answer: "POPULAR", songName: "Popular", year: 2003 },
  { showName: "Cabaret", answer: "TIME", songName: "Maybe This Time", year: 1966 },
  { showName: "A Little Night Music", answer: "CLOWNS", songName: "Send in the Clowns", year: 1973 },
  { showName: "Thoroughly Modern Millie", answer: "LADIES", songName: "What Do I Need with Love", year: 2002 },
];

async function main() {
  let updated = 0;
  let missed = 0;
  for (const e of ENTRIES) {
    const res = await db
      .update(puzzles)
      .set({ songName: e.songName, year: e.year })
      .where(and(eq(puzzles.showName, e.showName), eq(puzzles.answer, e.answer)))
      .returning({ id: puzzles.id });
    if (res.length === 0) {
      console.warn(`  ✗ no match: ${e.showName} / ${e.answer}`);
      missed++;
    } else {
      updated += res.length;
    }
  }
  console.log(`\nUpdated ${updated} puzzles, ${missed} unmatched.`);
}

main().then(() => process.exit(0));
