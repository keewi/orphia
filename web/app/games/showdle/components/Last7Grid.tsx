"use client";

interface Last7GridProps {
  days: { date: string; won: boolean | null; score: number }[];
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export default function Last7Grid({ days }: Last7GridProps) {
  return (
    <div className="sd-last7-grid">
      {days.map((d, i) => {
        const isToday = i === days.length - 1;
        const variant =
          d.won === true
            ? "sd-last7-cell--win"
            : d.won === false
              ? "sd-last7-cell--loss"
              : "sd-last7-cell--skip";
        const cls =
          "sd-last7-cell " + variant + (isToday ? " sd-last7-cell--today" : "");
        return (
          <div key={d.date} className={cls}>
            <span className="sd-last7-pts">{d.score}</span>
            <span className="sd-last7-day">{dayLabel(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}
