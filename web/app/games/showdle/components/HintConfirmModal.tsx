"use client";

interface HintConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function HintConfirmModal({ onCancel, onConfirm }: HintConfirmModalProps) {
  return (
    <div className="sd-hint-modal-backdrop">
      <div className="sd-hint-modal-panel">
        <p className="sd-hint-modal-heading">Reveal the show name?</p>
        <p className="sd-hint-modal-body">
          This will use one of your remaining guesses.
        </p>
        <div className="sd-hint-modal-actions">
          <button
            className="sd-btn sd-btn--secondary sd-hint-modal-btn"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="sd-btn sd-btn--primary sd-hint-modal-btn"
            onClick={onConfirm}
            type="button"
          >
            Reveal
          </button>
        </div>
      </div>
    </div>
  );
}
