"use client";
import { FeedbackType } from "../types";

interface NTSFeedbackProps {
  type: FeedbackType;
  message?: string;
}

const DEFAULTS: Record<FeedbackType, string> = {
  empty:   "",
  prompt:  "Pick a letter to start guessing!",
  correct: "",
  absent:  "",
  error:   "",
};

export default function NTSFeedback({ type, message }: NTSFeedbackProps) {
  const text = message ?? DEFAULTS[type];
  return (
    <div className={`nts-feedback nts-feedback--${type}`}>
      {text}
    </div>
  );
}
