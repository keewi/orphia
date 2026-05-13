"use client";

interface NTSHintButtonProps {
  hintUsed: boolean;
  musicalName: string;   // shown after hint used
  onHint: () => void;
}

// Info circle SVG icon
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default function NTSHintButton({ hintUsed, musicalName, onHint }: NTSHintButtonProps) {
  if (hintUsed) {
    return (
      <div className="nts-btn-hint nts-btn-hint--revealed">
        <InfoIcon />
        Show: {musicalName}
      </div>
    );
  }
  return (
    <button className="nts-btn-hint" onClick={onHint}>
      <InfoIcon />
      Hint: Reveal show
    </button>
  );
}
