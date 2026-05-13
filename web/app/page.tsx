import { auth } from "@/auth";
import { getAllMusicals, getUserActedMusicalIds } from "@/lib/services/musicalReadService";
import type { Musical } from "@/lib/types";
import ExploreCarousel from "./ExploreCarousel";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await auth();
  const user = session?.user;

  const allMusicals = await getAllMusicals();

  // Filter to only unseen/un-acted musicals
  let musicals: Musical[] = allMusicals;
  if (user) {
    const actedSet = await getUserActedMusicalIds(user.id!);
    musicals = allMusicals.filter((m) => !actedSet.has(m.id));
  }

  return (
    <div className="page-container">
      <ExploreCarousel musicals={musicals} userId={user?.id ?? null} />
    </div>
  );
}
