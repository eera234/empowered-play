"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS, CONNECTION_TYPES } from "../../lib/constants";
import { TapPartnerGlyph, BridgeSceneGlyph } from "./Glyphs";
import ConnectionTypeArt, { type ConnectionTypeKind } from "./ConnectionTypeArt";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  roleId: string;     // kept in props for caller compatibility
  theme: "water" | "space" | "ocean" | "forest";
  scenarioId: string;
  onDone: () => void;
}

// Carousel shown once on Ch2 entry. Three panels: tap-to-pair-up, kinds-of-
// connections grid, build-and-photograph. We deliberately do not warn the
// player that a crisis is coming or repeat their role here — they will see
// those when they happen. P2 shows the four themed connection variants for
// the active scenario so players recognise what they are being asked to
// build when their pair forms — the server picks which one each pair gets.
export default function Ch2IntroOverlay({ playerId, scenarioId, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const markReady = useMutation(api.mapPhase.markCh2ReadyV13);

  const scenarioObj = SCENARIOS.find(s => s.id === scenarioId);
  const districtTerm = scenarioObj?.terminology?.district ?? "district";
  const mapTheme = (scenarioObj?.mapTheme ?? "water") as "water" | "space" | "ocean" | "forest";
  const themedTypes = CONNECTION_TYPES[mapTheme] ?? CONNECTION_TYPES.water;

  const panels: React.ReactNode[] = [
    <div key="tap" style={panelCenter}>
      <div style={{ marginBottom: 12 }}>
        <TapPartnerGlyph size={160} />
      </div>
      <h3 style={panelTitle}>TAP TO PAIR UP</h3>
      <p style={panelBody}>
        Tap your own {districtTerm} first. Then tap a teammate&apos;s {districtTerm} to send them a connection request.
      </p>
    </div>,
    <div key="kinds" style={panelCenter}>
      <h3 style={{ ...panelTitle, marginBottom: 8 }}>KINDS OF CONNECTIONS</h3>
      <p style={{ ...panelBody, marginBottom: 14 }}>
        When you pair up, the game gives you one of these to build with LEGO together.
      </p>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        width: "100%", maxWidth: 300,
      }}>
        {themedTypes.map(t => (
          <div key={t.id} style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,215,0,.28)",
            borderRadius: 10, padding: "10px 6px 8px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 6,
          }}>
            <ConnectionTypeArt type={t.id as ConnectionTypeKind} theme={mapTheme} size={80} />
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 11, letterSpacing: 1.4, color: "var(--acc1, #FFD700)",
              textAlign: "center", lineHeight: 1.1,
            }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>,
    <div key="build" style={panelCenter}>
      <div style={{ marginBottom: 12 }}>
        <BridgeSceneGlyph size={160} />
      </div>
      <h3 style={panelTitle}>BUILD AND PHOTOGRAPH</h3>
      <p style={panelBody}>
        Build the connection in real life between your two {districtTerm}s. Both of you take a photo and upload it when it&apos;s done.
      </p>
    </div>,
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
                await markReady({ playerId });
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
  fontSize: 13, color: "rgba(255,255,255,.85)", lineHeight: 1.55, margin: 0, maxWidth: 320,
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
