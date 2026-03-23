"use client";

import { useEffect, useState } from "react";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

const CONFETTI_COLORS = ["#FFD700", "#4FC3F7", "#FF5252", "#69F0AE", "#E3000B", "#006DB7", "#00A650"];

function ConfettiAnimation() {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setPieces(newPieces);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-wrap">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function CompleteScreen() {
  const { goTo } = useGame();

  return (
    <div className="screen active" id="s-complete">
      <ConfettiAnimation />
      <BrandBar>
        <div
          style={{
            marginLeft: 6,
            background: "rgba(255,215,0,.2)",
            border: "1px solid rgba(255,215,0,.4)",
            color: "var(--acc1)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1,
            padding: "3px 9px",
            borderRadius: 4,
            zIndex: 1,
            position: "relative",
          }}
        >
          COMPLETE
        </div>
      </BrandBar>
      <div className="comp-inner">
        <div className="comp-trophy">
          <svg viewBox="0 0 96 96" fill="none">
            {/* Trophy cup */}
            <path d="M30 22h36v6c0 14-8 26-18 30-10-4-18-16-18-30v-6z" fill="rgba(255,215,0,.25)" stroke="#FFD700" strokeWidth="2" />
            {/* Left handle */}
            <path d="M30 28h-6c-4 0-7 3-7 7v2c0 4 3 7 7 7h6" stroke="#FFD700" strokeWidth="2" fill="none" />
            {/* Right handle */}
            <path d="M66 28h6c4 0 7 3 7 7v2c0 4-3 7-7 7h-6" stroke="#FFD700" strokeWidth="2" fill="none" />
            {/* Stem */}
            <rect x="44" y="56" width="8" height="12" rx="1" fill="rgba(255,215,0,.2)" stroke="#FFD700" strokeWidth="1.5" />
            {/* Base */}
            <rect x="34" y="68" width="28" height="6" rx="2" fill="rgba(255,215,0,.15)" stroke="#FFD700" strokeWidth="1.5" />
            {/* Studs on top of trophy */}
            <circle cx="42" cy="20" r="4" fill="rgba(255,215,0,.3)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="54" cy="20" r="4" fill="rgba(255,215,0,.3)" stroke="#FFD700" strokeWidth="1.5" />
            {/* Highlight on cup */}
            <path d="M38 28c0 0 2 16 10 22" stroke="rgba(255,255,255,.15)" strokeWidth="2" strokeLinecap="round" />
            {/* Star */}
            <path d="M48 34l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="rgba(255,215,0,.5)" stroke="#FFD700" strokeWidth="1" />
            {/* Glow */}
            <circle cx="48" cy="40" r="20" fill="url(#trophyGlow)" opacity=".3" />
            <defs>
              <radialGradient id="trophyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity=".4" />
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        <div className="comp-title">THE CITY STANDS</div>
        <div className="comp-sub">
          Every district connected. Every constraint met. Your team just built something no single
          person could have built alone.
        </div>
        <div className="comp-note">
          <div className="comp-note-lbl">FACILITATOR &mdash; BEFORE YOU CLOSE</div>
          <div className="comp-note-text">
            Screenshot the city map. The layout &mdash; who placed where, who was central, who ended
            up at the edges &mdash; often maps closely to your team&apos;s real communication
            patterns. It&apos;s data worth keeping.
            <br /><br />
            <strong>The real question for your next session:</strong> what would it look like if The
            Last Builder placed first?
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="lb lb-yellow" onClick={() => goTo("s-entry")}>
            &larr; Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
