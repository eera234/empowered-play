"use client";

interface PhaseBarProps {
  current: number;
  total?: number;
}

export default function PhaseBar({ current, total = 5 }: PhaseBarProps) {
  return (
    <div className="phase-row" style={{ flex: 1, padding: "0 14px", background: "transparent", border: "none" }}>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const isDone = idx < current;
        const isNow = idx === current;
        return (
          <span key={i}>
            <div className={`ph${isDone ? " done" : ""}${isNow ? " now" : ""}`} />
            {i < total - 1 && <div className={`ph-sep${isDone ? " done" : ""}`} />}
          </span>
        );
      })}
      <div className="ph-lbl">
        Phase <span>{current}</span> of {total}
      </div>
    </div>
  );
}
