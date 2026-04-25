"use client";

import React from "react";

type PlayerShape = {
  _id: string;
  ability?: string;
  districtDamaged?: boolean;
  crisisContribution?: string;
};

type ConnectionShape = {
  fromSlotId: string;
  toSlotId: string;
  built?: boolean;
};

type SessionShape = {
  crisisCardId?: string;
  crisisSubPhase?: string;
  ch2ConnectionsComplete?: boolean;
};

interface Props {
  me: PlayerShape | null;
  connections: ConnectionShape[];
  session: SessionShape | null;
}

// Pass #18: compact persistent banner that tells a Ch2 player exactly what
// to do next. Kept short (one line), renders sticky at the top of the map.
// Dismissed only by the game advancing — no close button.
export default function Ch2NextStepBanner({ me, connections, session }: Props) {
  if (!me) return null;

  const myBuilt = connections.filter(
    (c) => c.built && (c.fromSlotId === me._id || c.toSlotId === me._id),
  ).length;

  const isAnchor = me.ability === "anchor";
  const required = isAnchor ? 2 : 1;

  const crisisActive = !!session?.crisisCardId;
  const crisisSub = session?.crisisSubPhase;

  let message: string;
  let tone: "neutral" | "warn" | "ok" = "neutral";

  if (me.districtDamaged) {
    message = "Your connection broke. Rebuild it and take a fresh photo.";
    tone = "warn";
  } else if (crisisActive && crisisSub === "pre") {
    message = "Crisis incoming. If you have a role action, take it now.";
    tone = "warn";
  } else if (crisisActive && crisisSub === "announced") {
    message = "Crisis active. Damaged connections must be rebuilt.";
    tone = "warn";
  } else if (myBuilt < required) {
    const remaining = required - myBuilt;
    if (isAnchor) {
      message = `Anchor: build ${remaining} more connection${remaining > 1 ? "s" : ""}. Tap a teammate's district.`;
    } else {
      message = "Tap a teammate's district to propose a connection.";
    }
    tone = "neutral";
  } else if (!session?.ch2ConnectionsComplete) {
    message = "Your connections are built. Waiting for teammates to finish.";
    tone = "ok";
  } else {
    message = "All connections built. Waiting for the facilitator to deal a crisis.";
    tone = "ok";
  }

  const bg = tone === "warn"
    ? "linear-gradient(90deg, rgba(255,167,38,.18), rgba(255,167,38,.08))"
    : tone === "ok"
      ? "linear-gradient(90deg, rgba(102,187,106,.18), rgba(102,187,106,.08))"
      : "linear-gradient(90deg, rgba(79,195,247,.18), rgba(79,195,247,.08))";
  const border = tone === "warn"
    ? "1px solid rgba(255,167,38,.45)"
    : tone === "ok"
      ? "1px solid rgba(102,187,106,.45)"
      : "1px solid rgba(79,195,247,.45)";
  const dotColor = tone === "warn" ? "#FFA726" : tone === "ok" ? "#66BB6A" : "#4FC3F7";

  return (
    <div
      style={{
        position: "sticky",
        top: 8,
        zIndex: 30,
        margin: "8px 12px 0",
        padding: "10px 14px",
        borderRadius: 999,
        background: bg,
        border,
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        color: "white",
        fontWeight: 500,
        letterSpacing: 0.2,
        boxShadow: "0 4px 12px rgba(0,0,0,.35)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>{message}</span>
      {!crisisActive && myBuilt < required && isAnchor && (
        <span
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 10,
            letterSpacing: 1.5,
            color: "#FFA726",
            padding: "2px 8px",
            borderRadius: 999,
            background: "rgba(255,167,38,.15)",
            border: "1px solid rgba(255,167,38,.4)",
          }}
        >
          {myBuilt}/{required}
        </span>
      )}
    </div>
  );
}
