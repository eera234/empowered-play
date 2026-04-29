"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { RiddleGlyph, DragToZoneGlyph, TimerLockGlyph } from "./Glyphs";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  districtTerm: string;
  zoneTerm: string;
  mapTerm: string;
  /** The riddle that points at the target zone. Only this player sees it. */
  riddle?: string;
  onDismissed?: () => void;
}

// Blocking briefing shown to every non-fac player when Ch1 begins. Dismissing
// the overlay marks this player ready on the server; once every non-fac
// player is ready, the placement timer (CH1_PLACEMENT_SECONDS) starts for
// the whole session.
export function Ch1BriefingOverlay({
  sessionId, playerId, districtTerm, zoneTerm, mapTerm, riddle, onDismissed,
}: Props) {
  const markCh1Ready = useMutation(api.game.markCh1Ready);
  const [idx, setIdx] = useState(0);

  const storageKey = `ch1-intro-seen:${sessionId}`;

  async function dismiss() {
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "1");
    try {
      await markCh1Ready({ playerId });
    } catch {
      // No-op. Server-side gate is idempotent.
    }
    onDismissed?.();
  }

  const panels: React.ReactNode[] = [
    <div key="riddle" style={panelCenter}>
      <div style={{ marginBottom: 12 }}>
        <RiddleGlyph size={160} />
      </div>
      <h3 style={panelTitle}>YOUR PRIVATE CLUE</h3>
      <p style={panelBody}>
        You get a private clue. It hints at one spot on the {mapTerm}. Only you can see it. Read it carefully and figure out where it points.
      </p>
      {riddle && (
        <div style={{
          marginTop: 14,
          background: "rgba(255,215,0,.08)",
          border: "1px solid rgba(255,215,0,.35)",
          borderRadius: "var(--brick-radius)",
          padding: "12px 14px", color: "white", lineHeight: 1.55,
          maxWidth: 320,
        }}>
          <div style={{ fontStyle: "italic", fontSize: 13 }}>
            &ldquo;{riddle}&rdquo;
          </div>
        </div>
      )}
    </div>,
    <div key="drag" style={panelCenter}>
      <div style={{ marginBottom: 12 }}>
        <DragToZoneGlyph size={160} />
      </div>
      <h3 style={panelTitle}>DRAG YOUR {districtTerm.toUpperCase()}</h3>
      <p style={panelBody}>
        Drag your {districtTerm} onto the spot you think your clue means. You can move it as many times as you like before the timer ends.
      </p>
    </div>,
    <div key="lock" style={panelCenter}>
      <div style={{ marginBottom: 12 }}>
        <TimerLockGlyph size={160} />
      </div>
      <h3 style={panelTitle}>TWO MINUTES</h3>
      <p style={panelBody}>
        You have two minutes to place your {districtTerm}. When the timer ends, your final position locks in.
      </p>
    </div>,
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(6,6,26,.97)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 500, overflowY: "auto",
        animation: "fadeIn .3s ease-out",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
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
              onClick={dismiss}
            >
              I&apos;M READY {"→"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const panelCenter: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const panelTitle: React.CSSProperties = {
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 22, letterSpacing: 2.4, color: "var(--acc1, #FFD700)",
  margin: 0, marginBottom: 8,
};

const panelBody: React.CSSProperties = {
  fontSize: 13, color: "rgba(255,255,255,.85)", lineHeight: 1.55,
  margin: 0, maxWidth: 320,
};

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
