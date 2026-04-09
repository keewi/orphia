/**
 * One-off schema migration for Showdle stats + leaderboard (PRD-1).
 * Run with: npx tsx --env-file=.env.local scripts/alter-showdle-tables.ts
 *
 * Idempotent: uses IF NOT EXISTS / DROP IF EXISTS where possible and
 * no-ops cleanly on re-run.
 */

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = neon(url);

  console.log("— puzzles: add song_name, year, guess_distribution");
  await sql`ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS song_name text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS year integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS guess_distribution integer[] NOT NULL DEFAULT '{0,0,0,0,0,0,0}'`;

  console.log("— puzzle_results: relax nullability");
  await sql`ALTER TABLE puzzle_results ALTER COLUMN user_id DROP NOT NULL`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN guess_count DROP NOT NULL`;

  console.log("— puzzle_results: convert won/hint_used to boolean");
  // DROP DEFAULT first, then change type, then set the new default.
  await sql`ALTER TABLE puzzle_results ALTER COLUMN won DROP DEFAULT`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN won TYPE boolean USING (won <> 0)`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN won SET DEFAULT false`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN won SET NOT NULL`;

  await sql`ALTER TABLE puzzle_results ALTER COLUMN hint_used DROP DEFAULT`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN hint_used TYPE boolean USING (hint_used <> 0)`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN hint_used SET DEFAULT false`;
  await sql`ALTER TABLE puzzle_results ALTER COLUMN hint_used SET NOT NULL`;

  console.log("— puzzle_results: add score column");
  await sql`ALTER TABLE puzzle_results ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0`;

  console.log("— puzzle_results: swap unique index for partial (where user_id is not null)");
  await sql`DROP INDEX IF EXISTS puzzle_results_user_puzzle_idx`;
  await sql`CREATE UNIQUE INDEX puzzle_results_user_puzzle_idx ON puzzle_results (user_id, puzzle_id) WHERE user_id IS NOT NULL`;

  console.log("— puzzle_results: add (user_id, completed_at) and (score) indexes");
  await sql`CREATE INDEX IF NOT EXISTS puzzle_results_user_completed_idx ON puzzle_results (user_id, completed_at)`;
  await sql`CREATE INDEX IF NOT EXISTS puzzle_results_score_idx ON puzzle_results (score)`;

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
