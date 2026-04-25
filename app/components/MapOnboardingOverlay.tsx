"use client";

import { useEffect, useState } from "react";
import {
  TapGlyph,
  BrickGlyph,
  CameraGlyph,
  PatternGlyph,
  RepairGlyph,
} from "./Glyphs";

// Legacy map Ch2 / Ch3 onboarding modal. Retired in Pass #16 in favor of the
// blocking Ch2IntroOverlay + Ch3IntroOverlay ready gates. Kept in-tree for
// any path that still imports it; no active caller in StoryMapScreen. Glyphs
// factored out to ./Glyphs so the design gallery can render them directly.

type Phase = "map_ch2" | "map_ch3";

interface MapOnboardingOverlayProps {
  phase: Phase;
  visible: boolean;
  onDismiss: () => void;
}

interface Panel {
  heading: string;
  body: string;
  art: React.ReactNode;
}

const CH2_PANELS: Panel[] = [
  { heading: "FIND YOUR PARTNER", body: "Pick another district on the map. Agree with that player in chat to build a bridge together.", art: <TapGlyph /> },
  { heading: "BUILD THE BRIDGE", body: "Use leftover LEGO to physically construct a small bridge brick. You have a few minutes. A countdown is visible above the map.", art: <BrickGlyph /> },
  { heading: "PHOTOGRAPH THE BRIDGE", body: "Tap your district, then tap your partner\u2019s. The camera opens. Hold the LEGO bridge above both districts and capture the photo.", art: <CameraGlyph /> },
];

const CH3_PANELS: Panel[] = [
  { heading: "THE WORLD IS REBUILDING", body: "The crisis hit and the map is scarred. A hidden pattern has emerged. Match it together and the world comes back.", art: <PatternGlyph /> },
  { heading: "REARRANGE THE LINKS", body: "Tap two districts again to add a connection. Tap an existing connection to remove it. Work with the team to match the pattern.", art: <TapGlyph /> },
  { heading: "REPAIR WHAT WAS LOST", body: "The Mender can restore the connection the crisis severed. If no Mender was assigned, the facilitator will handle the repair.", art: <RepairGlyph /> },
];

export default function MapOnboardingOverlay({ phase, visible, onDismiss }: MapOnboardingOverlayProps) {
  const panels = phase === "map_ch2" ? CH2_PANELS : CH3_PANELS;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (visible) setIdx(0);
  }, [visible, phase]);

  if (!visible) return null;

  const panel = panels[idx];
  const isLast = idx === panels.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,4,14,.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn .3s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
          border: "2px solid var(--acc1)",
          borderRadius: 16,
          boxShadow: "0 12px 36px rgba(0,0,0,.6)",
          padding: "22px 22px 18px",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 3, color: "var(--acc2)" }}>
          {phase === "map_ch2" ? "CHAPTER 2 \u00B7 HOW TO CONNECT" : "CHAPTER 3 \u00B7 HOW TO REBUILD"}
        </div>
        <div style={{ marginTop: 18, marginBottom: 10, display: "flex", justifyContent: "center" }}>
          {panel.art}
        </div>
        <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, letterSpacing: 1.2, color: "var(--acc1)" }}>
          {panel.heading}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.55, marginTop: 8, minHeight: 72 }}>
          {panel.body}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {panels.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === idx ? "var(--acc1)" : "rgba(255,255,255,.25)",
                transition: "background .2s",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {idx > 0 && (
            <button
              className="lb lb-ghost"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => setIdx(idx - 1)}
            >
              BACK
            </button>
          )}
          {!isLast && (
            <button
              className="lb lb-yellow"
              style={{ flex: 2, fontSize: 11 }}
              onClick={() => setIdx(idx + 1)}
            >
              NEXT {"\u2192"}
            </button>
          )}
          {isLast && (
            <button
              className="lb lb-green"
              style={{ flex: 2, fontSize: 11 }}
              onClick={onDismiss}
            >
              GOT IT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
