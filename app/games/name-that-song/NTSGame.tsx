"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNTSGameState } from "./hooks/useNTSGameState";
import { useNTSSession } from "./hooks/useNTSSession";
import NTSHeader from "./components/NTSHeader";
import NTSFeedback from "./components/NTSFeedback";
import NTSGrid from "./components/NTSGrid";
import NTSKeyboard from "./components/NTSKeyboard";
import NTSHintButton from "./components/NTSHintButton";
import NTSSolveModal from "./components/NTSSolveModal";
import NTSCompletionModal from "./components/NTSCompletionModal";

interface NTSGameProps {
  songId: string;
  songTitle: string;
  musicalName: string;
}

export default function NTSGame({
  songId,
  songTitle,
  musicalName,
}: NTSGameProps) {
  const router = useRouter();
  const session = useNTSSession();
  const game = useNTSGameState(songId, songTitle, musicalName);
  const resultRecorded = useRef(false);

  // Record result exactly once when game ends
  useEffect(() => {
    if (game.gameStatus === "playing" || resultRecorded.current) return;
    resultRecorded.current = true;

    const stats = game.getCompletionStats(0);
    // PRD 3: pass session.deviceId for leaderboard submission
    session.recordResult({
      songId,
      outcome: game.gameStatus,
      hintUsed: game.hintUsed,
      timeSpent: stats.timeSpent,
      rightLetters: stats.rightLetters,
      wrongLetters: stats.wrongLetters,
    });
  }, [game.gameStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPlaying = game.gameStatus === "playing";

  return (
    <>
      <NTSHeader timeRemaining={game.timeRemaining} />

      <div className="nts-game-body">
        <NTSFeedback type={game.feedbackType} message={game.feedbackMessage} />

        <NTSGrid
          title={songTitle}
          guessedLetters={game.guessedLetters}
          flashLetters={game.flashLetters}
        />

        <NTSKeyboard
          guessedLetters={game.guessedLetters}
          onKey={game.guessLetter}
          disabled={!isPlaying}
        />

        <div className="nts-action-bar">
          <NTSHintButton
            hintUsed={game.hintUsed}
            musicalName={musicalName}
            onHint={game.useHint}
          />
          <button className="nts-btn-solve" onClick={game.openSolveModal} disabled={!isPlaying}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            Guess the song
          </button>
        </div>
      </div>

      {game.solveModalOpen && (
        <NTSSolveModal
          onSubmit={game.submitSolve}
          onCancel={game.closeSolveModal}
        />
      )}

      {game.gameStatus !== "playing" && (
        <NTSCompletionModal
          status={game.gameStatus}
          songTitle={songTitle}
          musicalName={musicalName}
          stats={game.getCompletionStats(session.todayStats.wins)}
          onPlayAgain={() => router.refresh()}
          deviceId={session.deviceId}
          songId={songId}
          lastUsername={session.lastUsername}
          onSaveUsername={session.saveUsername}
        />
      )}
    </>
  );
}
