/**
 * Seed script for NTS (Name That Song) game.
 * Run with: npx tsx scripts/seed-nts.ts
 *
 * Re-running is safe (upserts on unique constraints).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ntsMusicals, ntsSongs } from "../lib/db/nts-schema";

const SEED_DATA = [
  {
    name: "Hamilton",
    displayOrder: 1,
    songs: [
      { title: "My Shot", displayOrder: 1 },
      { title: "The Room Where It Happens", displayOrder: 2 },
      { title: "Alexander Hamilton", displayOrder: 3 },
    ],
  },
  {
    name: "Les Misérables",
    displayOrder: 2,
    songs: [
      { title: "I Dreamed a Dream", displayOrder: 1 },
      { title: "One Day More", displayOrder: 2 },
      { title: "On My Own", displayOrder: 3 },
    ],
  },
  {
    name: "Wicked",
    displayOrder: 3,
    songs: [
      { title: "Defying Gravity", displayOrder: 1 },
      { title: "Popular", displayOrder: 2 },
    ],
  },
  {
    name: "The Phantom of the Opera",
    displayOrder: 4,
    songs: [
      { title: "The Music of the Night", displayOrder: 1 },
      { title: "Think of Me", displayOrder: 2 },
    ],
  },
  {
    name: "Chicago",
    displayOrder: 5,
    songs: [
      { title: "All That Jazz", displayOrder: 1 },
      { title: "Cell Block Tango", displayOrder: 2 },
    ],
  },
  {
    name: "Rent",
    displayOrder: 6,
    songs: [
      { title: "Seasons of Love", displayOrder: 1 },
      { title: "La Vie Bohème", displayOrder: 2 },
    ],
  },
  {
    name: "Grease",
    displayOrder: 7,
    songs: [
      { title: "You're the One That I Want", displayOrder: 1 },
      { title: "Summer Nights", displayOrder: 2 },
    ],
  },
  {
    name: "The Lion King",
    displayOrder: 8,
    songs: [
      { title: "Circle of Life", displayOrder: 1 },
      { title: "Can You Feel the Love Tonight", displayOrder: 2 },
    ],
  },
  {
    name: "Mamma Mia",
    displayOrder: 9,
    songs: [
      { title: "Dancing Queen", displayOrder: 1 },
    ],
  },
  {
    name: "Sweeney Todd",
    displayOrder: 10,
    songs: [
      { title: "The Worst Pies in London", displayOrder: 1 },
    ],
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

  console.log("Seeding NTS musicals and songs...");

  for (const musical of SEED_DATA) {
    // Upsert musical
    const [inserted] = await db
      .insert(ntsMusicals)
      .values({
        name: musical.name,
        displayOrder: musical.displayOrder,
      })
      .onConflictDoUpdate({
        target: ntsMusicals.name,
        set: { displayOrder: musical.displayOrder },
      })
      .returning();

    // Upsert songs
    for (const song of musical.songs) {
      await db
        .insert(ntsSongs)
        .values({
          musicalId: inserted.id,
          title: song.title,
          displayOrder: song.displayOrder,
        })
        .onConflictDoUpdate({
          target: [ntsSongs.musicalId, ntsSongs.title],
          set: { displayOrder: song.displayOrder },
        });
    }

    console.log(`  ✓ ${musical.name} (${musical.songs.length} songs)`);
  }

  const totalSongs = SEED_DATA.reduce((acc, m) => acc + m.songs.length, 0);
  console.log(`\nDone. ${SEED_DATA.length} musicals, ${totalSongs} songs.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
