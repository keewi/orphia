"use client";
import { useState } from "react";

interface NTSSolveModalProps {
  onSubmit: (guess: string) => void;
  onCancel: () => void;
}

export default function NTSSolveModal({ onSubmit, onCancel }: NTSSolveModalProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div className="nts-modal-overlay" onClick={onCancel}>
      <div className="nts-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="nts-modal-title">Guess the song</div>
          <div className="nts-modal-subtitle">Enter the full song title to solve</div>
        </div>
        <input
          className="nts-modal-input"
          placeholder="Song title..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <div className="nts-modal-actions">
          <button className="nts-btn-primary" style={{ flex: 1.4 }} onClick={handleSubmit}>
            Submit guess
          </button>
          <button className="nts-btn-solve" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "#7a7060", textAlign: "center" }}>
          Punctuation and case are ignored
        </div>
      </div>
    </div>
  );
}
