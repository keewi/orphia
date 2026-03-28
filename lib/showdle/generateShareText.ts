import type { TileState } from "./evaluateGuess";

interface ShareState {
  evaluations: TileState[][];
  status: "won" | "lost";
  wordLength: number;
  scheduledDate: string;
  hintUsed: boolean;
  isArchive?: boolean;
}

const EMOJI_MAP: Record<TileState, string> = {
  correct: "\u{1F7E9}", // 🟩
  present: "\u{1F7E8}", // 🟨
  absent: "\u2B1B",      // ⬛
  hint: "\u2B1C",        // ⬜
};

export function generateShareText(state: ShareState): string {
  // Header line
  const d = new Date(state.scheduledDate);
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const header = state.isArchive
    ? `Showdle \u{1F3AD} \u00B7 Archive \u00B7 ${date}`
    : `Showdle \u{1F3AD} \u00B7 ${date}`;

  // Emoji grid
  const gridLines: string[] = [];
  for (const row of state.evaluations) {
    const isHintRow = row.every((t) => t === "hint");
    if (isHintRow) {
      gridLines.push(EMOJI_MAP.hint.repeat(state.wordLength));
    } else {
      gridLines.push(row.map((t) => EMOJI_MAP[t]).join(""));
    }
  }

  // Result line — appended to the last grid row
  const guessCount = state.evaluations.length;
  const hintSuffix = state.hintUsed ? " (hint used)" : "";
  const resultPart =
    state.status === "won"
      ? `${guessCount}/6${hintSuffix}`
      : `X/6${hintSuffix}`;

  // Append result to last grid line
  gridLines[gridLines.length - 1] += ` ${resultPart}`;

  // URL
  const url = "showdle.com";

  return [header, ...gridLines, url].join("\n");
}
