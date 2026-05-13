"use client";

/* eslint-disable @next/next/no-img-element */

interface LyricDisplayProps {
  lyric: string;
  wordLength: number;
  hintShowName?: string | null;
  onHintTap?: () => void;
  hintDisabled?: boolean;
}

export default function LyricDisplay({
  lyric,
  wordLength,
  hintShowName,
  // onHintTap,     // hint icon commented out
  // hintDisabled,  // hint icon commented out
}: LyricDisplayProps) {
  const parts = lyric.split("[BLANK]");
  const blanks = Array.from({ length: wordLength }).map((_, i) => (
    <span key={i} className="sd-lyric-blank" style={{ width: 16 }}>
      &nbsp;
    </span>
  ));

  const lyricContent = (
    <p className="sd-lyric-text" style={{ flex: hintShowName ? undefined : 1, margin: 0 }}>
      &ldquo;{parts[0]}
      {blanks}
      {parts[1]}&rdquo;
    </p>
  );

  if (hintShowName) {
    // After hint: lyric text above, reveal strip below with divider
    return (
      <div className="sd-lyric-box">
        <div className="sd-lyric-box-inner sd-lyric-box-inner--revealed">
          {lyricContent}
        </div>
        <div className="sd-lyric-reveal-strip">
          <img src="/green icon.png" alt="" width={16} height={18} style={{ objectFit: "contain" }} />
          <span className="sd-lyric-reveal-name">Hint: This line is from <em>{hintShowName}</em></span>
        </div>
      </div>
    );
  }

  // Before hint: lyric text only (hint icon commented out)
  return (
    <div className="sd-lyric-box">
      <div className="sd-lyric-box-inner">
        {lyricContent}
        {/* Hint icon removed — uncomment to restore
        <div
          className={`sd-playbill-tap ${hintDisabled ? "sd-playbill-tap--disabled" : ""}`}
          onClick={!hintDisabled ? onHintTap : undefined}
          role="button"
          tabIndex={hintDisabled ? -1 : 0}
          aria-label="Get a hint"
        >
          <img src="/yellow icon.png" alt="Hint" width={22} height={25} style={{ objectFit: "contain" }} />
        </div>
        */}
      </div>
    </div>
  );
}
