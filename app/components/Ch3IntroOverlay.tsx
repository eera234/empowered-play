"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS } from "../../lib/constants";

interface Props {
  playerId: Id<"players">;
  scenarioId: string;
  patternName: string | null;
  onDone: () => void;
}

// Carousel shown once on Ch3 entry. Three panels: crisis is over, here is the
// pattern task, your drag-to-your-slot instruction, a ready gate. Mirror of
// Ch2IntroOverlay in structure + styling. Blocks the Ch3 map until dismissed.
export default function Ch3IntroOverlay({ playerId, scenarioId, patternName, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const markReady = useMutation(api.mapPhase.markCh3Ready);

  const scenarioObj = SCENARIOS.find(s => s.id === scenarioId);
  const mapTerm = scenarioObj?.terminology?.map ?? "map";
  const districtTerm = scenarioObj?.terminology?.district ?? "district";
  const patternLabel = patternName ?? "formation";

  const panels: React.ReactNode[] = [
    <div key="closure">
      <h3 style={panelTitle}>CHAPTER 3</h3>
      <p style={panelBody}>
        The crisis is behind you. The {mapTerm} still stands, thanks to the work of everyone at the table.
        Now the team sets a shape that will define the recovery.
      </p>
    </div>,
    <div key="pattern">
      <h3 style={panelTitle}>THE PATTERN</h3>
      <p style={panelBody}>
        A <b style={{ color: "var(--acc1, #FFD700)" }}>{patternLabel}</b> will appear on the {mapTerm}.
        Each outline marks a slot your team needs to fill. Every player is assigned to one slot.
      </p>
      <div style={{
        marginTop: 12, padding: "12px 14px",
        border: "1px dashed rgba(90,200,250,.45)", borderRadius: 10,
        fontSize: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.55,
        wordBreak: "break-word",
      }}>
        Your {districtTerm} will highlight the slot it belongs to. Drag your {districtTerm} into the glowing slot to lock it in.
      </div>
    </div>,
    <div key="complete">
      <h3 style={panelTitle}>WHEN THE LAST DISTRICT LANDS</h3>
      <p style={panelBody}>
        The pattern glows. The {mapTerm} crossfades to its rebuilt state. No Facilitator tap required. Then the team moves to the final vote.
      </p>
    </div>,
    <div key="ready">
      <h3 style={panelTitle}>READY?</h3>
      <p style={panelBody}>
        Once every player taps ready, the pattern appears. Take your time.
      </p>
    </div>,
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2400,
      background: "rgba(5,5,15,.94)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "min(460px, 94vw)",
        background: "linear-gradient(180deg, rgba(14,14,37,1), rgba(8,8,22,1))",
        border: "2px solid rgba(255,215,0,.45)", borderRadius: 16,
        padding: 22, color: "white",
        boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
        animation: "fadeIn 260ms ease-out",
      }}>
        {panels[idx]}

        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "14px 0" }}>
          {panels.map((_, i) => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: i === idx ? "var(--acc1, #FFD700)" : "rgba(255,255,255,.2)",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {idx > 0 && (
            <button
              style={{ ...btnStyle("ghost"), flex: 1 }}
              onClick={() => setIdx(i => i - 1)}
            >
              Back
            </button>
          )}
          {idx < panels.length - 1 ? (
            <button
              style={{ ...btnStyle("primary"), flex: 2 }}
              onClick={() => setIdx(i => i + 1)}
            >
              Next
            </button>
          ) : (
            <button
              style={{ ...btnStyle("primary"), flex: 2 }}
              onClick={async () => {
                try { await markReady({ playerId }); } catch { /* server gate will catch */ }
                onDone();
              }}
            >
              I&apos;m ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const panelTitle: React.CSSProperties = {
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 20, letterSpacing: 2, color: "var(--acc1, #FFD700)",
  margin: 0, marginBottom: 8,
};

const panelBody: React.CSSProperties = {
  fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.55, margin: 0,
};

function btnStyle(variant: "primary" | "ghost"): React.CSSProperties {
  return {
    padding: "11px 14px", borderRadius: 8,
    fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
    background: variant === "primary" ? "rgba(255,215,0,.22)" : "rgba(255,255,255,.04)",
    border: variant === "primary" ? "1.5px solid rgba(255,215,0,.6)" : "1.5px solid rgba(255,255,255,.2)",
    color: variant === "primary" ? "var(--acc1, #FFD700)" : "rgba(255,255,255,.8)",
  };
}
