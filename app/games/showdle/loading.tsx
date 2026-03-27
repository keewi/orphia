export default function ShowdleLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="sd-header">
        <div className="sd-skeleton" style={{ width: 160, height: 28, margin: "0 auto 8px" }} />
        <div className="sd-skeleton" style={{ width: 120, height: 10, margin: "0 auto 4px" }} />
        <div className="sd-skeleton" style={{ width: 100, height: 10, margin: "0 auto" }} />
      </div>
      {/* Lyric skeleton */}
      <div className="sd-lyric-box">
        <div className="sd-skeleton" style={{ width: "80%", height: 16, marginBottom: 8 }} />
        <div className="sd-skeleton" style={{ width: "60%", height: 16 }} />
      </div>
      {/* Board skeleton */}
      <div className="sd-board">
        {Array.from({ length: 6 }).map((_, r) => (
          <div className="sd-board-row" key={r}>
            {Array.from({ length: 5 }).map((_, c) => (
              <div className="sd-tile sd-skeleton" key={c} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
