"use client";

import React, { useEffect, useState } from "react";

export interface ProtectionEvent {
  savedPlayerId: string;
  protectorPlayerId?: string;
  protectorRole: string; // "anchor" | "engineer" | "scout" | ...
  at: number;
}

interface Props {
  events: ProtectionEvent[];
  playersById: Record<string, string>;
  /** ms the banner stays on screen after the event timestamp. */
  lifetimeMs?: number;
}

// Public save banner. Renders for ~6 seconds after runResolveDamage records a
// protection. One stacked row per saved player. Auto-dismissed client-side by
// filtering out events older than `lifetimeMs`; no clear-mutation needed.
// aria-live announces the saves to screen readers.
export default function ProtectionBanner({ events, playersById, lifetimeMs = 6000 }: Props) {
  const [now, setNow] = useState(() => Date.now());

  const freshEvents = events.filter((e) => now - e.at < lifetimeMs);

  // Tick only while there is something visible. Once it empties, we stop the
  // interval so the component idles.
  useEffect(() => {
    if (freshEvents.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [freshEvents.length]);

  if (freshEvents.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: 68,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 140,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
        width: "min(92vw, 440px)",
      }}
    >
      {freshEvents.map((e, i) => {
        const savedName = playersById[e.savedPlayerId] ?? "A teammate";
        const roleLabel = labelForRole(e.protectorRole);
        const ageMs = now - e.at;
        const fade = Math.max(0, 1 - Math.max(0, ageMs - (lifetimeMs - 800)) / 800);
        return (
          <div
            key={`${e.savedPlayerId}-${e.at}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(24,34,14,0.96), rgba(10,14,6,0.96))",
              border: "1px solid rgba(144,238,144,0.35)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(169,240,169,0.08) inset",
              opacity: fade,
              transform: ageMs < 300 ? `translateY(${Math.max(0, 8 - (ageMs / 300) * 8)}px)` : "translateY(0)",
              transition: "opacity 200ms linear, transform 200ms ease-out",
            }}
          >
            <ShieldGlyph />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "rgba(180,240,160,0.9)",
                  textTransform: "uppercase",
                }}
              >
                Shielded
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "white",
                  lineHeight: 1.35,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {roleLabel} shielded <strong>{savedName}</strong>. Their district survived.
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function labelForRole(role: string): string {
  switch (role) {
    case "anchor": return "Anchor";
    case "engineer": return "Engineer";
    case "scout": return "Scout";
    case "mender": return "Mender";
    case "diplomat": return "Diplomat";
    case "citizen": return "Citizen";
    default: return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

function ShieldGlyph() {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="pb-shield" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a9f0a9" />
          <stop offset="1" stopColor="#4ca14c" />
        </linearGradient>
      </defs>
      <path
        d="M14 3 L23 6 V13 Q23 20 14 25 Q5 20 5 13 V6 Z"
        fill="url(#pb-shield)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1}
      />
      <path
        d="M9.5 14 L12.5 17 L18 11"
        stroke="#0b1d0b"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
