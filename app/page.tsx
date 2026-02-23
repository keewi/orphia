import { musicals } from "@/data/musicals";
import SearchableMusicalGrid from "./SearchableMusicalGrid";

export default function Home() {
  return (
    <div className="page-container">
      <h2 className="section-title">Explore Shows</h2>
      <SearchableMusicalGrid musicals={musicals} />
    </div>
  );
}
