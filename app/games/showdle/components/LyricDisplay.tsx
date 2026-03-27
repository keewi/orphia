"use client";

interface LyricDisplayProps {
  lyric: string;
  wordLength: number;
  hintShowName?: string | null;
}

export default function LyricDisplay({ lyric, wordLength, hintShowName }: LyricDisplayProps) {
  // Replace [BLANK] with N underscore spans where N = wordLength
  const parts = lyric.split("[BLANK]");

  const blanks = Array.from({ length: wordLength }).map((_, i) => (
    <span key={i} className="sd-lyric-blank" style={{ width: 16 }}>
      &nbsp;
    </span>
  ));

  return (
    <div className="sd-lyric-box">
      <p className="sd-lyric-text">
        &ldquo;{parts[0]}
        {blanks}
        {parts[1]}&rdquo;
      </p>
      {hintShowName && (
        <p className="sd-lyric-hint">💡 From: {hintShowName}</p>
      )}
    </div>
  );
}
