"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS } from "../../lib/constants";
import { NewPositionsGlyph, DragToZoneGlyph, LastDropGlyph } from "./Glyphs";

interface Props {
  playerId: Id<"players">;
  scenarioId: string;
  patternName: string | null;
  onDone: () => void;
}

// Carousel shown once on Ch3 entry. Three panels: crisis is over, here is the
// pattern task, your drag-to-your-slot instruction, a ready gate. Mirror of
// Ch2IntroOverlay in structure + styling. Blocks the Ch3 map until dismissed.
export default function Ch3IntroOverlay({ playerId, scenarioId, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const markReady = useMutation(api.mapPhase.markCh3Ready);

  const scenarioObj = SCENARIOS.find(s => s.id === scenarioId);
  const mapTerm = scenarioObj?.terminology?.map ?? "map";
  const districtTerm = scenarioObj?.terminology?.district ?? "district";

  const panels: React.ReactNode[] = [
    <Panel key="pattern" glyph={<NewPositionsGlyph size={160} />} headline="A PATTERN APPEARS">
      A pattern will appear on the {mapTerm}. Every {districtTerm} has its own spot in it. Rearrange yourselves into the pattern.
    </Panel>,
    <Panel key="drag" glyph={<DragToZoneGlyph size={160} />} headline="DRAG INTO YOUR SPOT">
      Your {districtTerm} glows on the spot you belong in. Drag it into the glowing space.
    </Panel>,
    <Panel key="complete" glyph={<LastDropGlyph size={160} />} headline="EVERYONE IN PLACE">
      When every {districtTerm} is in its spot, the round is complete.
    </Panel>,
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2400,
      background: "rgba(5,5,15,.94)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
      animation: "fadeIn .3s ease-out",
    }}>
      <div style={{
        width: "min(480px, 94vw)",
        background: "linear-gradient(180deg, rgba(14,14,37,1), rgba(8,8,22,1))",
        border: "2px solid rgba(255,215,0,.45)", borderRadius: 16,
        padding: 22, color: "white",
        boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
      }}>
        <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {panels[idx]}
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "16px 0" }}>
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

function Panel({
  glyph,
  headline,
  children,
}: {
  glyph: React.ReactNode;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ marginBottom: 12 }}>{glyph}</div>
      <h3 style={{
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 22, letterSpacing: 2.4, color: "var(--acc1, #FFD700)",
        margin: 0, marginBottom: 8,
      }}>
        {headline}
      </h3>
      <p style={{
        fontSize: 13, color: "rgba(255,255,255,.85)", lineHeight: 1.55,
        margin: 0, maxWidth: 320,
      }}>
        {children}
      </p>
    </div>
  );
}

function btnStyle(variant: "primary" | "ghost"): React.CSSProperties {
  return {
    padding: "12px 14px", borderRadius: 8,
    fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase",
    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
    background: variant === "primary" ? "rgba(255,215,0,.22)" : "rgba(255,255,255,.04)",
    border: variant === "primary" ? "1.5px solid rgba(255,215,0,.6)" : "1.5px solid rgba(255,255,255,.2)",
    color: variant === "primary" ? "var(--acc1, #FFD700)" : "rgba(255,255,255,.8)",
  };
}
