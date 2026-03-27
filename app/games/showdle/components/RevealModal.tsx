"use client";

import { useEffect, useState } from "react";
import DifficultyBadge from "./DifficultyBadge";

interface RevealData {
  showName: string;
  characterName: string;
  originalCast: string | null;
  difficulty: number;
  answer: string;
}

interface RevealModalProps {
  puzzleId: string;
  won: boolean;
  guessCount: number;
}

export default function RevealModal({ puzzleId, won, guessCount }: RevealModalProps) {
  const [data, setData] = useState<RevealData | null>(null);

  useEffect(() => {
    fetch(`/api/showdle/puzzle/${puzzleId}/reveal`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [puzzleId]);

  if (!data) return null;

  const resultText = won
    ? `Correct! ${guessCount}/6`
    : `Nice try! X/6`;

  const castLine = data.originalCast
    ? `${data.characterName} \u2022 ${data.originalCast}`
    : data.characterName;

  return (
    <div className="sd-modal-backdrop">
      <div className="sd-modal-panel">
        <p className="sd-modal-result">{resultText}</p>
        <p className="sd-modal-show">{data.showName}</p>
        <p className="sd-modal-detail">{castLine}</p>
        <DifficultyBadge difficulty={data.difficulty} />

        {/* TODO: Slice 3 — Share card button */}

        <div style={{ marginTop: 12 }}>
          <button
            className="sd-btn sd-btn--secondary"
            onClick={() => {
              /* TODO: Slice 4 — Navigate to archive */
            }}
          >
            Play Archive
          </button>
        </div>
      </div>
    </div>
  );
}
