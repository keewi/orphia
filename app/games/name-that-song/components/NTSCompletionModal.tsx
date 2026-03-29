"use client";
import { CompletionStats } from "../types";

interface NTSCompletionModalProps {
  status: "won" | "lost";
  songTitle: string;
  musicalName: string;
  stats: CompletionStats;
  onPlayAgain: () => void;
}

export default function NTSCompletionModal({
  status,
  songTitle,
  musicalName,
  stats,
  onPlayAgain,
}: NTSCompletionModalProps) {
  const isWon = status === "won";
  const pctRight = stats.totalUniqueLetters > 0
    ? Math.round((stats.rightLetters / stats.totalUniqueLetters) * 100)
    : 0;

  return (
    <div className="nts-sheet-overlay">
      <div className="nts-sheet">
        {/* Accent band */}
        <div className={isWon ? "nts-sheet-accent--win" : "nts-sheet-accent--loss"}>
          <div className="nts-verdict-row">
            <span className="nts-verdict-icon">{isWon ? "\u2713" : "\u2715"}</span>
            <span className="nts-verdict-text">{isWon ? "You got it!" : "Time\u2019s up"}</span>
          </div>
          <div className="nts-comp-song">{songTitle}</div>
          <div className="nts-comp-show">from {musicalName}</div>
        </div>

        {/* Body */}
        <div className="nts-sheet-body">
          {isWon ? (
            <div className="nts-solve-headline">
              Solved in <span className="nts-solve-headline-accent">{stats.timeSpent} seconds!</span>
            </div>
          ) : (
            <div className="nts-solve-headline nts-solve-headline--loss">
              {stats.rightLetters} of {stats.totalUniqueLetters} letters revealed
            </div>
          )}

          {/* Stat chips */}
          <div className="nts-stat-chips">
            <div className="nts-chip nts-chip--right">{"\u2713"} {stats.rightLetters} right</div>
            <div className="nts-chip nts-chip--wrong">{"\u2717"} {stats.wrongLetters} wrong</div>
            <div className="nts-chip nts-chip--pct">{pctRight}% correct</div>
            {stats.hintUsed && (
              <div className="nts-chip nts-chip--hint">Used Hint</div>
            )}
          </div>

          {/* Wins today chip */}
          <div className="nts-wins-chip">
            <span className="nts-wins-chip-icon">{"\u2605"}</span>
            <span className="nts-wins-chip-num">{stats.winsToday}</span>
            <span className="nts-wins-chip-label">
              {stats.winsToday === 1 ? "win" : "wins"} today
            </span>
          </div>

          <button className="nts-btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
