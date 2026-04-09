"use client";

/**
 * Black lyric reveal panel for the result modal.
 * Shows the lyric with the answer word coloured green (correct) or red (wrong).
 * The result message (e.g. "Bravo!") sits above the lyric.
 */

interface LyricRevealProps {
  lyric: string; // e.g. "I just met a girl named [BLANK]"
  answer: string; // e.g. "MARIA"
  won: boolean;
  resultMessage: string;
}

export default function LyricReveal({
  lyric,
  answer,
  won,
  resultMessage,
}: LyricRevealProps) {
  // Replace [BLANK] with the answer word, wrapped in a styled span
  const parts = lyric.split("[BLANK]");

  return (
    <div className="sd-modal-lyric-wrap">
      <p className={won ? "sd-result-win" : "sd-result-loss"}>
        {resultMessage}
      </p>
      <p className="sd-modal-lyric">
        &ldquo;
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span
                className={
                  won
                    ? "sd-modal-lyric-word--correct"
                    : "sd-modal-lyric-word--wrong"
                }
              >
                {answer.toLowerCase()}
              </span>
            )}
          </span>
        ))}
        &rdquo;
      </p>
    </div>
  );
}
