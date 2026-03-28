"use client";

interface HintButtonProps {
  disabled: boolean;
  used: boolean;
  showName: string | null;
  onHint: () => void;
}

export default function HintButton({ disabled, used, showName, onHint }: HintButtonProps) {
  if (used && showName) {
    return (
      <div className="sd-hint-used-label">
        💡 Hint used — {showName}
      </div>
    );
  }

  return (
    <div className="sd-hint-btn-wrapper">
      <button
        className={`sd-hint-btn ${disabled ? "sd-hint-btn--disabled" : ""}`}
        onClick={onHint}
        disabled={disabled}
        type="button"
      >
        <span className="sd-hint-btn-icon">💡</span>
        Need a hint?
      </button>
    </div>
  );
}
