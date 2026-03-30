"use client";
import { useState, useEffect } from "react";
import { CompletionStats } from "../types";
import type { LeaderboardEntry } from "@/app/api/name-that-song/leaderboard/route";

interface NTSCompletionModalProps {
  status: "won" | "lost";
  songTitle: string;
  musicalName: string;
  stats: CompletionStats;
  onPlayAgain: () => void;
  deviceId: string;
  songId: string;
  lastUsername: string;
  onSaveUsername: (name: string) => void;
}

export default function NTSCompletionModal({
  status, songTitle, musicalName, stats, onPlayAgain,
  deviceId, songId, lastUsername, onSaveUsername,
}: NTSCompletionModalProps) {
  const isWon = status === "won";
  const pctRight = stats.totalUniqueLetters > 0
    ? Math.round((stats.rightLetters / stats.totalUniqueLetters) * 100)
    : 0;

  const [username, setUsername] = useState(lastUsername);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/name-that-song/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLbLoading(false);
      })
      .catch(() => setLbLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    onSaveUsername(username.trim());

    try {
      await fetch("/api/name-that-song/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          username: username.trim(),
          songId,
          outcome: status,
          hintUsed: stats.hintUsed,
          timeSpent: stats.timeSpent,
          rightLetters: stats.rightLetters,
          wrongLetters: stats.wrongLetters,
        }),
      });

      // Refresh leaderboard after submit
      const res = await fetch("/api/name-that-song/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard ?? []);
      setSubmitted(true);
    } catch {
      // Fire-and-forget: fail silently
    } finally {
      setSubmitting(false);
    }
  };

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

          {/* Play Again sits ABOVE leaderboard */}
          <button className="nts-btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>

          <div className="nts-sheet-divider" />

          {/* Leaderboard section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{
              fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em",
              color: "var(--nts-gold-muted)", textTransform: "uppercase"
            }}>
              Leaderboard — wins without hint
            </div>

            {/* Username input + submit */}
            {!submitted ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  style={{
                    flex: 1, border: "1.5px solid var(--nts-border)",
                    borderRadius: "var(--nts-radius-md)", padding: "8px 10px",
                    fontFamily: "var(--nts-font-ui, 'DM Sans', system-ui, sans-serif)",
                    fontSize: "13px", background: "var(--nts-surface)", color: "var(--nts-ink)",
                  }}
                  placeholder="Enter a username"
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  style={{
                    background: username.trim() ? "var(--nts-gold)" : "var(--nts-absent-bg)",
                    color: username.trim() ? "#fff" : "var(--nts-absent-text)",
                    border: "none", borderRadius: "var(--nts-radius-md)",
                    padding: "8px 14px",
                    fontFamily: "var(--nts-font-ui, 'DM Sans', system-ui, sans-serif)",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                  onClick={handleSubmit}
                  disabled={!username.trim() || submitting}
                >
                  {submitting ? "..." : "Submit score"}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "var(--nts-gold-muted)", fontStyle: "italic" }}>
                Score submitted as {username}
              </div>
            )}

            {/* Leaderboard table */}
            {lbLoading ? (
              <div style={{ fontSize: "12px", color: "var(--nts-absent-text)" }}>Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--nts-absent-text)" }}>
                No scores yet — be the first!
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Username", "Wins"].map((h, i) => (
                      <th key={h} style={{
                        fontSize: "10px", fontWeight: 500, color: "var(--nts-absent-text)",
                        textAlign: i === 2 ? "right" : "left",
                        padding: "4px 6px", borderBottom: "1px solid var(--nts-border-light)",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isMe = entry.username.toLowerCase() === username.toLowerCase() && submitted;
                    return (
                      <tr key={entry.rank} style={isMe ? { background: "var(--nts-gold-bg)" } : {}}>
                        <td style={{ fontSize: "11px", color: "var(--nts-absent-text)", padding: "6px 6px" }}>
                          {entry.rank}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--nts-ink)", padding: "6px 6px",
                          fontWeight: isMe ? 500 : 400 }}>
                          {entry.username}
                        </td>
                        <td style={{ fontSize: "12px", fontWeight: 500, color: "var(--nts-ink)",
                          textAlign: "right", padding: "6px 6px" }}>
                          {entry.winsNoHint}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
