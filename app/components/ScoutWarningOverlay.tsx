"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  text: string;
}

// Pass #30: Private warning from the Scout. Mounted only for the player whose
// id matches session.scoutWarning.targetPlayerId. Fullscreen so it can't be
// missed under a chat panel or banner.
export default function ScoutWarningOverlay({ sessionId, playerId, text }: Props) {
  const ack = useMutation(api.mapPhase.acknowledgeScoutWarning);
  const [busy, setBusy] = useState(false);

  async function handleAck() {
    setBusy(true);
    try {
      await ack({ sessionId, playerId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2400,
        background: "rgba(5,5,15,.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(420px, 92vw)",
          background: "var(--bg1, #0e0e25)",
          border: "2px solid #FFD740",
          borderRadius: 14,
          padding: 22,
          color: "white",
          boxShadow: "0 12px 40px rgba(255,215,64,.18)",
        }}
      >
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22,
            letterSpacing: 2,
            color: "#FFD740",
            marginBottom: 10,
          }}
        >
          PRIVATE INTEL
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.5,
            color: "rgba(255,215,64,.75)",
            marginBottom: 14,
          }}
        >
          From your Scout. Only you can see this.
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(255,255,255,.92)",
            marginBottom: 20,
          }}
        >
          {text}
        </div>
        <button
          disabled={busy}
          onClick={handleAck}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "rgba(255,215,64,.22)",
            border: "1.5px solid rgba(255,215,64,.6)",
            borderRadius: 8,
            color: "#FFD740",
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 14,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Acknowledging…" : "Acknowledge"}
        </button>
      </div>
    </div>
  );
}
