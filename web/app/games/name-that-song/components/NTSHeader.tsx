"use client";

interface NTSHeaderProps {
  timeRemaining: number; // 0-60
  maxTime?: number;      // default 60
}

export default function NTSHeader({ timeRemaining, maxTime = 60 }: NTSHeaderProps) {
  const pct = (timeRemaining / maxTime) * 100;
  const isWarn = timeRemaining <= 10;

  return (
    <div className="nts-header">
      <span className="nts-logo">
        Name That <span className="nts-logo-accent">Song</span>
      </span>
      <div className="nts-timer">
        <div className="nts-timer-track">
          <div
            className={`nts-timer-bar${isWarn ? " nts-timer-bar--warn" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`nts-timer-num${isWarn ? " nts-timer-num--warn" : ""}`}>
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
