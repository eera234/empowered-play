"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ConnectionTypeArt, { type ConnectionTypeKind } from "./ConnectionTypeArt";
import { ABILITIES, CONNECTION_TYPES, SCENARIOS, getThemedAbility } from "../../lib/constants";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  roleId: string;     // player's assigned role
  theme: "water" | "space" | "ocean" | "forest";
  scenarioId: string;
  onDone: () => void;
}

// Carousel shown once on Ch2 entry. Covers flow, how to connect, connection
// types, your role's first-crisis action, and a ready gate. No C2 spoilers.
export default function Ch2IntroOverlay({ playerId, roleId, theme, scenarioId, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const markReady = useMutation(api.mapPhase.markCh2ReadyV13);

  const baseRole = ABILITIES.find(a => a.id === roleId);
  const scenarioObj = SCENARIOS.find(s => s.id === scenarioId);
  const role = baseRole && scenarioObj ? getThemedAbility(baseRole, scenarioObj) : baseRole;
  const connTypes = CONNECTION_TYPES[theme] ?? CONNECTION_TYPES.water;

  const panels: React.ReactNode[] = [
    <div key="flow">
      <h3 style={panelTitle}>CHAPTER 2</h3>
      <p style={panelBody}>
        A crisis is coming. Before it lands, the team builds connections so you can face it together.
        Every role has a part to play.
      </p>
    </div>,
    <div key="how">
      <h3 style={panelTitle}>HOW TO CONNECT</h3>
      <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.5 }}>
          <b style={{ color: "var(--acc1, #FFD700)" }}>1. Find a partner.</b> Tap another district on the map. Agree in chat to build together.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.5 }}>
          <b style={{ color: "var(--acc1, #FFD700)" }}>2. Build the LEGO bridge.</b> With leftover LEGO pieces, physically construct a small bridge between your builds.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.5 }}>
          <b style={{ color: "var(--acc1, #FFD700)" }}>3. Photograph it.</b> The camera opens. Capture the bridge. Both partners take a photo to lock it in.
        </div>
      </div>
    </div>,
    <div key="types">
      <h3 style={panelTitle}>CONNECTION TYPES</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        {connTypes.map(t => (
          <div
            key={t.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 6,
              padding: 10,
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8,
              background: "rgba(255,255,255,.02)",
            }}
          >
            <div style={{ width: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ConnectionTypeArt type={t.id as ConnectionTypeKind} theme={theme} size={96} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "var(--acc1, #FFD700)", textAlign: "center" }}>{t.label}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", textAlign: "center", lineHeight: 1.4 }}>{t.hint}</div>
          </div>
        ))}
      </div>
    </div>,
    <div key="role">
      <h3 style={panelTitle}>YOUR KIT</h3>
      <div style={{ ...panelBody, marginBottom: 10 }}>
        <b>Role:</b> {role?.label ?? roleId} <br />
        <span style={{ fontSize: 12, opacity: .8 }}>{role?.description}</span>
      </div>
      {role?.descriptionC1 && (
        <div style={{ padding: 10, border: "1px dashed rgba(90,200,250,.45)", borderRadius: 6, marginBottom: 10, fontSize: 12, color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, color: "#5AC8FA", marginBottom: 4 }}>
            WHEN THE CRISIS HITS
          </div>
          {role.descriptionC1}
        </div>
      )}
      <p style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
        Your role comes with a paired power. The two fire together the moment a crisis strikes.
      </p>
    </div>,
    <div key="ready">
      <h3 style={panelTitle}>READY?</h3>
      <p style={panelBody}>
        Once everyone taps READY, the Facilitator can start the round. Take your time.
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
        width: "min(460px, 94vw)", background: "var(--bg1, #0e0e25)",
        border: "2px solid rgba(255,215,0,.45)", borderRadius: 16,
        padding: 22, color: "white",
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

const panelTitle: React.CSSProperties = {
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 20, letterSpacing: 2, color: "var(--acc1, #FFD700)",
  margin: 0, marginBottom: 8,
};

const panelBody: React.CSSProperties = {
  fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.5, margin: 0,
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
