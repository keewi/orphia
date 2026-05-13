/**
 * Seed script for Showdle puzzles.
 * Run with: npx tsx scripts/seed-showdle.ts
 *
 * Uses relative dates — puzzle index 0 = today.
 * Re-running is safe (upserts on scheduledDate).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { puzzles } from "../lib/db/showdle-schema";
import { sql } from "drizzle-orm";

const puzzleData = [
  {
    lyric: "To the [BLANK] of the night",
    answer: "MUSIC",
    showName: "The Phantom of the Opera",
    characterName: "The Phantom",
    originalCast: "Michael Crawford",
    difficulty: 2,
  },
  {
    lyric: "No one mourns the [BLANK]",
    answer: "WICKED",
    showName: "Wicked",
    characterName: "Glinda",
    originalCast: "Kristin Chenoweth",
    difficulty: 1,
  },
  {
    lyric: "The [BLANK] of the opera is here",
    answer: "PHANTOM",
    showName: "The Phantom of the Opera",
    characterName: "Christine Daaé",
    originalCast: "Sarah Brightman",
    difficulty: 1,
  },
  {
    lyric: "I'm [BLANK] gravity",
    answer: "DEFYING",
    showName: "Wicked",
    characterName: "Elphaba",
    originalCast: "Idina Menzel",
    difficulty: 2,
  },
  {
    lyric: "One song, [BLANK], one song before I go",
    answer: "GLORY",
    showName: "Rent",
    characterName: "Roger Davis",
    originalCast: "Adam Pascal",
    difficulty: 3,
  },
  {
    lyric: "Sit down, John, you fat [BLANK]",
    answer: "MADMAN",
    showName: "1776",
    characterName: "John Adams",
    originalCast: "William Daniels",
    difficulty: 5,
  },
  {
    lyric: "Being [BLANK] is not a sin",
    answer: "ALIVE",
    showName: "Pippin",
    characterName: "Pippin",
    originalCast: "Ben Vereen",
    difficulty: 4,
  },
  {
    lyric: "Everything's coming up [BLANK]",
    answer: "ROSES",
    showName: "Gypsy",
    characterName: "Mama Rose",
    originalCast: "Ethel Merman",
    difficulty: 2,
  },
  {
    lyric: "Putting it together, bit by bit, [BLANK] by brick",
    answer: "MORTAR",
    showName: "Sunday in the Park with George",
    characterName: "George",
    originalCast: "Mandy Patinkin",
    difficulty: 6,
  },
  {
    lyric: "I am not [BLANK] away my shot",
    answer: "THROWING",
    showName: "Hamilton",
    characterName: "Alexander Hamilton",
    originalCast: "Lin-Manuel Miranda",
    difficulty: 3,
  },
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = neon(dbUrl);
  const db = drizzle(client);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log("Seeding Showdle puzzles...");

  for (let i = 0; i < puzzleData.length; i++) {
    const p = puzzleData[i];
    const scheduledDate = new Date(today);
    scheduledDate.setUTCDate(today.getUTCDate() + i);

    // Upsert: insert or update on scheduledDate conflict
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

  console.log("\nDone! Seeded 10 puzzles.");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
