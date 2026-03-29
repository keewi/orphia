export type LetterState = 'unused' | 'correct' | 'absent';
export type GameStatus = 'playing' | 'won' | 'lost';
export type FeedbackType = 'empty' | 'prompt' | 'correct' | 'absent' | 'error';

export interface GuessedLetters {
  [letter: string]: LetterState;
}

export interface CompletionStats {
  timeSpent: number;        // seconds (60 − timeRemaining)
  rightLetters: number;     // unique letters guessed correctly
  wrongLetters: number;     // unique letters guessed incorrectly
  totalUniqueLetters: number; // total unique letters in song title
  hintUsed: boolean;
  winsToday: number;
}
