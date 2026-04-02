import Link from "next/link";

export const metadata = {
  title: "Games — Orphia",
  description: "Musical theater games — test your knowledge!",
};

export default function GamesPage() {
  return (
    <div className="games-landing">
      <div className="games-landing-header">
        <h1 className="games-landing-title">Games</h1>
        <p className="games-landing-subtitle">
          Test your musical theater knowledge
        </p>
      </div>

      <div className="games-landing-grid">
        {/* Showdle card */}
        <Link href="/games/showdle" className="game-card">
          <div className="game-card-badge">Daily</div>
          <div className="game-card-icon">🎭</div>
          <h2 className="game-card-title">Showdle</h2>
          <p className="game-card-desc">
            Guess the mystery musical from a cryptic lyric clue. A new puzzle every day.
          </p>
          <div className="game-card-cta">
            Play today&rsquo;s puzzle &rarr;
          </div>
        </Link>

        {/* Name That Song card */}
        <Link href="/games/name-that-song" className="game-card">
          <div className="game-card-badge">Unlimited</div>
          <div className="game-card-icon">🎵</div>
          <h2 className="game-card-title">Name That Song</h2>
          <p className="game-card-desc">
            Reveal letters Wheel-of-Fortune style to guess the song title before time runs out.
          </p>
          <div className="game-card-cta">
            Play now &rarr;
          </div>
        </Link>
      </div>
    </div>
  );
}
