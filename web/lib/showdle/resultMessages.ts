/** Rotating result copy for the reveal modal. */

const WIN_MESSAGES = ["Bravo!"];

const LOSS_MESSAGES = [
  "The understudy knew this one.",
  "Back to rehearsal.",
  "The director needs a word.",
];

export function getResultMessage(won: boolean): string {
  if (won) {
    return WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
  }
  return LOSS_MESSAGES[Math.floor(Math.random() * LOSS_MESSAGES.length)];
}
