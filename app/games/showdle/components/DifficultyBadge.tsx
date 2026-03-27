"use client";

const LABELS: Record<number, string> = {
  1: "Monday \u00b7 Easy",
  2: "Tuesday \u00b7 Easy",
  3: "Wednesday \u00b7 Medium",
  4: "Thursday \u00b7 Medium",
  5: "Friday \u00b7 Hard",
  6: "Saturday \u00b7 Hard",
};

function getBadgeClass(difficulty: number): string {
  if (difficulty <= 2) return "sd-badge--easy";
  if (difficulty <= 4) return "sd-badge--medium";
  return "sd-badge--hard";
}

export default function DifficultyBadge({ difficulty }: { difficulty: number }) {
  return (
    <span className={`sd-modal-badge ${getBadgeClass(difficulty)}`}>
      {LABELS[difficulty] || `Difficulty ${difficulty}`}
    </span>
  );
}
