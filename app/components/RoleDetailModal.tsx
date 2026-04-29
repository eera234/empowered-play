"use client";

import { useEffect, useState } from "react";
import type { Ability, Scenario } from "../../lib/constants";
import { getThemedAbility } from "../../lib/constants";
import AbilityBadge from "./AbilityBadge";

interface Props {
  ability: Ability;
  scenario: Scenario;
  color: string;
  onClose: () => void;
}

export default function RoleDetailModal({ ability, scenario, color, onClose }: Props) {
  const themed = getThemedAbility(ability, scenario);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2300,
        background: "rgba(5,5,15,.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        opacity: open ? 1 : 0,
        transition: "opacity .2s ease",
        fontFamily: "'Nunito', sans-serif",
        perspective: 1200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(540px, 94vw)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--bg1, #0e0e25)",
          border: "2px solid rgba(255,255,255,.12)",
          borderRadius: 14,
          color: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,.55)",
          transform: open
            ? "rotateY(0deg) scale(1)"
            : "rotateY(-12deg) scale(.85)",
          opacity: open ? 1 : 0,
          transition: "transform .26s cubic-bezier(.2,.9,.3,1.1), opacity .22s ease",
          transformOrigin: "center center",
        }}
      >
        <div style={{
          background: color,
          padding: "20px 18px 18px",
          position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center",
          borderTopLeftRadius: 12, borderTopRightRadius: 12,
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,.12) 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            pointerEvents: "none",
          }} />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute", top: 10, right: 10,
              width: 32, height: 32, borderRadius: 16,
              background: "rgba(0,0,0,.35)",
              border: "1px solid rgba(255,255,255,.3)",
              color: "white",
              fontSize: 18, fontWeight: 900, lineHeight: 1,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2,
            }}
          >
            ×
          </button>
          <div style={{ position: "relative", zIndex: 1 }}>
            <AbilityBadge ability={themed} size={120} />
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 24, letterSpacing: 2,
            color: "#fff",
            textShadow: "0 2px 4px rgba(0,0,0,.35)",
            marginTop: 10, position: "relative", zIndex: 1,
            textTransform: "uppercase",
          }}>
            {themed.label}
          </div>
        </div>

        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Section heading="Identity" body={themed.description} />
          <Section heading="Facilitator insight" body={ability.assignmentHint} />

          <button
            onClick={onClose}
            style={{
              marginTop: 4, padding: "11px 14px",
              background: "rgba(255,215,0,.18)",
              border: "1.5px solid rgba(255,215,0,.55)",
              borderRadius: 8,
              color: "var(--acc1, #FFD700)",
              fontSize: 13, fontWeight: 900, letterSpacing: 1.2,
              textTransform: "uppercase", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 11, letterSpacing: 1.6,
        color: "rgba(255,255,255,.55)",
        textTransform: "uppercase",
      }}>
        {heading}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.92)", lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  );
}
