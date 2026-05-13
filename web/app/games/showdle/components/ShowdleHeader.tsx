"use client";

export default function ShowdleHeader() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="sd-header">
      <div className="sd-header-logo">SHOWDLE</div>
      <div className="sd-header-subline">A Daily Musical Puzzle</div>
      <div className="sd-header-date">{dateStr}</div>
    </div>
  );
}
