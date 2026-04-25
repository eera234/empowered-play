"use client";

interface PatternSlot {
  slotId: string;
  x: number;  // percentage 0-100
  y: number;
  assignedTo?: string; // player id
}

interface Props {
  slots: PatternSlot[];
  // map of playerId → whether their district is currently in target slot
  playerInTargetMap: Record<string, boolean>;
  patternName?: string;
  allComplete: boolean;
}

// Draws the target polygon outline + per-slot marker. Slots glow blue when a
// player's district is in them, and the whole shape glows gold when complete.
export default function PatternOverlay({ slots, playerInTargetMap, patternName, allComplete }: Props) {
  if (slots.length < 3) return null;
  const edges: { x1: number; y1: number; x2: number; y2: number; complete: boolean }[] = [];
  for (let i = 0; i < slots.length; i++) {
    const a = slots[i];
    const b = slots[(i + 1) % slots.length];
    const aInSlot = a.assignedTo ? !!playerInTargetMap[a.assignedTo] : false;
    const bInSlot = b.assignedTo ? !!playerInTargetMap[b.assignedTo] : false;
    edges.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      complete: aInSlot && bInSlot,
    });
  }

  const edgeColor = (done: boolean) => (allComplete ? "#FFD700" : done ? "#5AC8FA" : "rgba(255,255,255,.45)");
  const edgeStroke = allComplete ? "3" : "2";
  const edgeDasharray = (done: boolean) => (done ? "0" : "4 4");

  return (
    <>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 6,
          transition: "filter .6s ease",
          filter: allComplete ? "drop-shadow(0 0 12px #FFD700)" : "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={edgeColor(e.complete)}
            strokeWidth={edgeStroke}
            strokeDasharray={edgeDasharray(e.complete)}
            vectorEffect="non-scaling-stroke"
            opacity={allComplete ? 1 : 0.85}
            style={{ transition: "stroke .4s ease" }}
          />
        ))}
        {slots.map((s) => {
          const inSlot = s.assignedTo ? !!playerInTargetMap[s.assignedTo] : false;
          return (
            <g key={s.slotId}>
              <circle
                cx={s.x}
                cy={s.y}
                r={allComplete ? "3.2" : inSlot ? "2.8" : "2.2"}
                fill={allComplete ? "#FFD700" : inSlot ? "#5AC8FA" : "rgba(255,255,255,.18)"}
                stroke={allComplete ? "#FFF" : inSlot ? "#FFF" : "rgba(255,255,255,.55)"}
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                style={{ transition: "fill .3s ease, r .3s ease" }}
              />
            </g>
          );
        })}
      </svg>
      {/* Pass #19: pull the "<PATTERN> COMPLETE" banner out of the SVG.
          The SVG uses preserveAspectRatio="none" so the map can fill any
          container shape, which stretched the SVG <text> horizontally.
          HTML text respects CSS and stays at its natural width. */}
      {patternName && allComplete && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            pointerEvents: "none",
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: "clamp(20px, 4vw, 34px)",
            letterSpacing: 3,
            color: "#FFD700",
            textShadow: "0 0 10px rgba(0,0,0,.75), 0 2px 4px rgba(0,0,0,.6)",
            textTransform: "uppercase",
            textAlign: "center",
            maxWidth: "90vw",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "4px 12px",
          }}
        >
          {patternName} COMPLETE
        </div>
      )}
    </>
  );
}
