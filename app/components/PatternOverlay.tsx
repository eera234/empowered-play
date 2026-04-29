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
  // The local player's id, used to highlight "your" slot distinctly so each
  // player knows where to drop. Optional — facilitator passes undefined.
  localPlayerId?: string;
}

// Draws the target polygon outline + per-slot marker. Slots glow blue when a
// player's district is in them, and the whole shape glows gold when complete.
// The local player's slot is rendered with a gold ring + "YOU" label so each
// player can find their own target without confusing it with neighbours'.
export default function PatternOverlay({ slots, playerInTargetMap, patternName, allComplete, localPlayerId }: Props) {
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

  const edgeColor = (done: boolean) => (allComplete ? "#FFD700" : done ? "#5AC8FA" : "rgba(255,255,255,.75)");
  const edgeStroke = allComplete ? "3" : "2";
  const edgeDasharray = (done: boolean) => (done ? "0" : "4 4");

  const mySlot = localPlayerId ? slots.find(s => s.assignedTo === localPlayerId) : undefined;

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
          const isMine = !!localPlayerId && s.assignedTo === localPlayerId;
          return (
            <g key={s.slotId}>
              {isMine && !allComplete && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="5.4"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="0.8"
                  strokeOpacity={0.7}
                  vectorEffect="non-scaling-stroke"
                  style={{ animation: "patternMyPulse 1.6s ease-in-out infinite" }}
                />
              )}
              <circle
                cx={s.x}
                cy={s.y}
                r={allComplete ? "3.2" : isMine ? "3.4" : inSlot ? "3.0" : "2.8"}
                fill={allComplete ? "#FFD700" : isMine ? "#FFD700" : inSlot ? "#5AC8FA" : "rgba(255,255,255,.42)"}
                stroke={allComplete ? "#FFF" : isMine ? "#FFF" : inSlot ? "#FFF" : "rgba(255,255,255,.95)"}
                strokeWidth={allComplete || inSlot || isMine ? "0.8" : "1"}
                vectorEffect="non-scaling-stroke"
                style={{ transition: "fill .3s ease, r .3s ease" }}
              />
            </g>
          );
        })}
      </svg>
      {mySlot && !allComplete && (
        <div
          style={{
            position: "absolute",
            left: `${mySlot.x}%`,
            top: `${mySlot.y}%`,
            transform: "translate(-50%, -150%)",
            zIndex: 7,
            pointerEvents: "none",
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 9,
            letterSpacing: 2,
            color: "#FFD700",
            background: "rgba(10,10,18,.85)",
            border: "1px solid rgba(255,215,0,.5)",
            padding: "2px 7px",
            borderRadius: 999,
            textTransform: "uppercase",
            textShadow: "0 0 6px rgba(255,215,0,.5)",
            whiteSpace: "nowrap",
          }}
        >
          You
        </div>
      )}
      <style>{`
        @keyframes patternMyPulse {
          0%, 100% { stroke-opacity: 0.35; }
          50% { stroke-opacity: 0.95; }
        }
      `}</style>
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
