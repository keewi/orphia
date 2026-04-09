/**
 * Append additional Showdle puzzles after the latest scheduled date.
 * Run with: npx tsx --env-file=.env.local scripts/seed-showdle-append.ts
 *
 * Idempotent via upsert on scheduledDate. Starts the day AFTER the
 * current max(scheduledDate) in the table (or tomorrow if empty).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { puzzles } from "../lib/db/showdle-schema";
import { desc } from "drizzle-orm";

const newPuzzles = [
  { lyric: "The sun'll come out [BLANK]", answer: "TOMORROW", showName: "Annie", characterName: "Annie", originalCast: "Andrea McArdle", difficulty: 1 },
  { lyric: "[BLANK] of my soul", answer: "MUSIC", showName: "The Sound of Music", characterName: "Maria", originalCast: "Mary Martin", difficulty: 3 },
  { lyric: "Don't cry for me, [BLANK]", answer: "ARGENTINA", showName: "Evita", characterName: "Eva Perón", originalCast: "Patti LuPone", difficulty: 1 },
  { lyric: "Memory, all alone in the [BLANK]", answer: "MOONLIGHT", showName: "Cats", characterName: "Grizabella", originalCast: "Betty Buckley", difficulty: 2 },
  { lyric: "I dreamed a [BLANK] in time gone by", answer: "DREAM", showName: "Les Misérables", characterName: "Fantine", originalCast: "Randy Graff", difficulty: 1 },
  { lyric: "Five hundred twenty-five thousand six hundred [BLANK]", answer: "MINUTES", showName: "Rent", characterName: "Company", originalCast: "Original Broadway Cast", difficulty: 1 },
  { lyric: "Look at me, I'm [BLANK] Lee", answer: "SANDRA", showName: "West Side Story", characterName: "Riff", originalCast: "Mickey Calin", difficulty: 4 },
  { lyric: "I am the very model of a modern [BLANK]-General", answer: "MAJOR", showName: "The Pirates of Penzance", characterName: "Major-General Stanley", originalCast: "George Rose", difficulty: 5 },
  { lyric: "Tradition, [BLANK]!", answer: "TRADITION", showName: "Fiddler on the Roof", characterName: "Tevye", originalCast: "Zero Mostel", difficulty: 1 },
  { lyric: "I could have [BLANK] all night", answer: "DANCED", showName: "My Fair Lady", characterName: "Eliza Doolittle", originalCast: "Julie Andrews", difficulty: 2 },
  { lyric: "Some enchanted [BLANK], you may see a stranger", answer: "EVENING", showName: "South Pacific", characterName: "Emile de Becque", originalCast: "Ezio Pinza", difficulty: 3 },
  { lyric: "Getting to know [BLANK]", answer: "YOU", showName: "The King and I", characterName: "Anna Leonowens", originalCast: "Gertrude Lawrence", difficulty: 2 },
  { lyric: "Oh what a beautiful [BLANK]", answer: "MORNING", showName: "Oklahoma!", characterName: "Curly", originalCast: "Alfred Drake", difficulty: 2 },
  { lyric: "Seventy-six [BLANK] led the big parade", answer: "TROMBONES", showName: "The Music Man", characterName: "Harold Hill", originalCast: "Robert Preston", difficulty: 2 },
  { lyric: "Hello, [BLANK], well hello, Dolly", answer: "DOLLY", showName: "Hello, Dolly!", characterName: "Company", originalCast: "Carol Channing", difficulty: 1 },
  { lyric: "And all that [BLANK]", answer: "JAZZ", showName: "Chicago", characterName: "Velma Kelly", originalCast: "Chita Rivera", difficulty: 1 },
  { lyric: "The circle of [BLANK]", answer: "LIFE", showName: "The Lion King", characterName: "Rafiki", originalCast: "Tsidii Le Loka", difficulty: 1 },
  { lyric: "A whole new [BLANK]", answer: "WORLD", showName: "Aladdin", characterName: "Aladdin", originalCast: "Adam Jacobs", difficulty: 1 },
  { lyric: "Let it [BLANK], let it go", answer: "GO", showName: "Frozen", characterName: "Elsa", originalCast: "Caissie Levy", difficulty: 1 },
  { lyric: "I believe that the heart does [BLANK] on", answer: "GO", showName: "Titanic", characterName: "Company", originalCast: "Original Broadway Cast", difficulty: 4 },
  { lyric: "Greased lightnin', go grease [BLANK]", answer: "LIGHTNIN", showName: "Grease", characterName: "Danny Zuko", originalCast: "Barry Bostwick", difficulty: 3 },
  { lyric: "Waving through a [BLANK]", answer: "WINDOW", showName: "Dear Evan Hansen", characterName: "Evan Hansen", originalCast: "Ben Platt", difficulty: 2 },
  { lyric: "Wait for it, [BLANK] for it", answer: "WAIT", showName: "Hamilton", characterName: "Aaron Burr", originalCast: "Leslie Odom Jr.", difficulty: 2 },
  { lyric: "Way down [BLANK]way", answer: "HADES", showName: "Hadestown", characterName: "Hermes", originalCast: "André De Shields", difficulty: 3 },
  { lyric: "Welcome to the [BLANK] life", answer: "ROCK", showName: "The Book of Mormon", characterName: "Mafala Hatimbi", originalCast: "Michael Potts", difficulty: 4 },
  { lyric: "Divorced, beheaded, [BLANK]", answer: "DIED", showName: "Six", characterName: "The Queens", originalCast: "Original Broadway Cast", difficulty: 2 },
  { lyric: "Popular, you're gonna be [BLANK]", answer: "POPULAR", showName: "Wicked", characterName: "Glinda", originalCast: "Kristin Chenoweth", difficulty: 1 },
  { lyric: "Maybe this [BLANK], for the first time", answer: "TIME", showName: "Cabaret", characterName: "Sally Bowles", originalCast: "Jill Haworth", difficulty: 3 },
  { lyric: "Send in the [BLANK]", answer: "CLOWNS", showName: "A Little Night Music", characterName: "Desirée Armfeldt", originalCast: "Glynis Johns", difficulty: 2 },
  { lyric: "The [BLANK]'s gonna love my money", answer: "LADIES", showName: "Thoroughly Modern Millie", characterName: "Jimmy Smith", originalCast: "Gavin Creel", difficulty: 5 },
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = neon(dbUrl);
  const db = drizzle(client);

  // Find the latest scheduled date already in the table
  const latest = await db
    .select({ d: puzzles.scheduledDate })
    .from(puzzles)
    .orderBy(desc(puzzles.scheduledDate))
    .limit(1);

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  if (latest.length > 0) {
    const lastDate = new Date(latest[0].d);
    lastDate.setUTCHours(0, 0, 0, 0);
    if (lastDate >= start) {
      start.setTime(lastDate.getTime());
      start.setUTCDate(start.getUTCDate() + 1);
    } else {
      start.setUTCDate(start.getUTCDate() + 1);
    }
  } else {
    start.setUTCDate(start.getUTCDate() + 1);
  }

  console.log(`Appending ${newPuzzles.length} puzzles starting ${start.toISOString().split("T")[0]}...`);

  for (let i = 0; i < newPuzzles.length; i++) {
    const p = newPuzzles[i];
    const scheduledDate = new Date(start);
    scheduledDate.setUTCDate(start.getUTCDate() + i);

    await db
      .insert(puzzles)
      .values({
        lyric: p.lyric,
        answer: p.answer,
        showName: p.showName,
        characterName: p.characterName,
        originalCast: p.originalCast,
        difficulty: p.difficulty,
        scheduledDate,
      })
      .onConflictDoUpdate({
        target: puzzles.scheduledDate,
        set: {
          lyric: p.lyric,
          answer: p.answer,
          showName: p.showName,
          characterName: p.characterName,
          originalCast: p.originalCast,
          difficulty: p.difficulty,
        },
      });

    console.log(`  ✓ ${scheduledDate.toISOString().split("T")[0]} — "${p.answer}" (${p.showName})`);
  }

  console.log(`\nDone! Appended ${newPuzzles.length} puzzles.`);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
