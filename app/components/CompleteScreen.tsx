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
          <svg viewBox="0 0 120 130" fill="none">
            {/* Glow behind trophy */}
            <circle cx="60" cy="55" r="40" fill="url(#trophyGlow)" opacity=".4" />
            {/* Trophy cup body */}
            <path d="M36 20h48v8c0 18-10 34-24 40-14-6-24-22-24-40v-8z" fill="rgba(255,215,0,.3)" stroke="#FFD700" strokeWidth="2.5" />
            {/* Left handle */}
            <path d="M36 28h-8c-5 0-9 4-9 9v4c0 5 4 9 9 9h8" stroke="#FFD700" strokeWidth="2.5" fill="rgba(255,215,0,.1)" />
            {/* Right handle */}
            <path d="M84 28h8c5 0 9 4 9 9v4c0 5-4 9-9 9h-8" stroke="#FFD700" strokeWidth="2.5" fill="rgba(255,215,0,.1)" />
            {/* Cup highlight */}
            <path d="M46 28c0 0 3 20 14 30" stroke="rgba(255,255,255,.2)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Star on cup */}
            <path d="M60 36l3.5 7 7.7 1.1-5.6 5.4 1.3 7.7L60 53.4l-6.9 3.8 1.3-7.7-5.6-5.4 7.7-1.1z" fill="rgba(255,215,0,.6)" stroke="#FFD700" strokeWidth="1.2" />
            {/* Stem */}
            <rect x="54" y="68" width="12" height="16" rx="2" fill="rgba(255,215,0,.2)" stroke="#FFD700" strokeWidth="2" />
            {/* Brick base - LEGO style */}
            <rect x="34" y="84" width="52" height="14" rx="3" fill="rgba(255,215,0,.2)" stroke="#FFD700" strokeWidth="2" />
            {/* Bottom brick layer */}
            <rect x="30" y="98" width="60" height="14" rx="3" fill="rgba(255,215,0,.15)" stroke="#FFD700" strokeWidth="2" />
            {/* Studs on top brick */}
            <circle cx="44" cy="84" r="4.5" fill="rgba(255,215,0,.35)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="56" cy="84" r="4.5" fill="rgba(255,215,0,.35)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="68" cy="84" r="4.5" fill="rgba(255,215,0,.35)" stroke="#FFD700" strokeWidth="1.5" />
            {/* Studs on bottom brick */}
            <circle cx="40" cy="98" r="4.5" fill="rgba(255,215,0,.25)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="52" cy="98" r="4.5" fill="rgba(255,215,0,.25)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="64" cy="98" r="4.5" fill="rgba(255,215,0,.25)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="76" cy="98" r="4.5" fill="rgba(255,215,0,.25)" stroke="#FFD700" strokeWidth="1.5" />
            {/* Studs on top of trophy cup */}
            <circle cx="50" cy="18" r="5" fill="rgba(255,215,0,.35)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="60" cy="16" r="5" fill="rgba(255,215,0,.4)" stroke="#FFD700" strokeWidth="1.5" />
            <circle cx="70" cy="18" r="5" fill="rgba(255,215,0,.35)" stroke="#FFD700" strokeWidth="1.5" />
            <defs>
              <radialGradient id="trophyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity=".5" />
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        <div className="comp-title">THE CITY STANDS</div>
        <div className="comp-sub">
          Every district connected. Every constraint met. Your team built something no single
          person could have built alone.
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
