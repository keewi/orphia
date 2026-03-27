export type TileState = "correct" | "present" | "absent" | "hint";

/**
 * Evaluate a guess against the answer using two-pass Wordle algorithm.
 * Both inputs must be uppercase. Lengths must match.
 * Handles duplicate letters correctly — does not over-mark present.
 */
export function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = new Array(guess.length).fill("absent");
  const answerChars = answer.split("");
  const remaining: (string | null)[] = [...answerChars];

  // Pass 1: mark exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining[i] = null; // consumed
    }
  }

  // Pass 2: mark present letters (not yet matched)
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      remaining[idx] = null; // consumed
    }
  }

  return result;
}
