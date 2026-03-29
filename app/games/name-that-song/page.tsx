import { db } from "@/lib/db";
import { ntsSongs, ntsMusicals } from "@/lib/db/nts-schema";
import { eq, sql } from "drizzle-orm";
import NTSGame from "./NTSGame";

export default async function NTSPage() {
  const results = await db
    .select({
      id: ntsSongs.id,
      title: ntsSongs.title,
      musicalName: ntsMusicals.name,
    })
    .from(ntsSongs)
    .innerJoin(ntsMusicals, eq(ntsSongs.musicalId, ntsMusicals.id))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!results.length) {
    return (
      <div className="nts-game-body">
        No songs found. Please run the seed script.
      </div>
    );
  }

  const { id, title, musicalName } = results[0];

  return (
    <NTSGame
      songId={id}
      songTitle={title}
      musicalName={musicalName}
    />
  );
}
