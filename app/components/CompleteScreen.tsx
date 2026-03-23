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
          <svg viewBox="0 0 120 140" width="120" height="140">
            <defs>
              <radialGradient id="tg" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity=".4" />
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="tcup" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#E8A820" />
              </linearGradient>
            </defs>
            {/* Glow */}
            <circle cx="60" cy="55" r="50" fill="url(#tg)" />
            {/* Cup body */}
            <path d="M38 22 L82 22 L78 62 Q60 76 42 62 Z" fill="url(#tcup)" />
            <path d="M38 22 L82 22 L78 62 Q60 76 42 62 Z" fill="none" stroke="#C8A200" strokeWidth="1.5" />
            {/* Cup rim */}
            <rect x="35" y="18" width="50" height="6" rx="3" fill="#FFD700" stroke="#C8A200" strokeWidth="1" />
            {/* Studs on rim */}
            <circle cx="47" cy="17" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth="1" />
            <circle cx="60" cy="17" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth="1" />
            <circle cx="73" cy="17" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth="1" />
            {/* Cup highlight */}
            <path d="M48 30 Q52 50 58 60" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Left handle */}
            <path d="M38 30 C28 30 22 36 22 44 C22 52 28 56 38 56" fill="#E8A820" stroke="#C8A200" strokeWidth="1.5" />
            <path d="M38 34 C32 34 28 38 28 44 C28 50 32 52 38 52" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
            {/* Right handle */}
            <path d="M82 30 C92 30 98 36 98 44 C98 52 92 56 82 56" fill="#E8A820" stroke="#C8A200" strokeWidth="1.5" />
            {/* Star */}
            <path d="M60 34 L63 42 L71 43 L65 48 L67 56 L60 52 L53 56 L55 48 L49 43 L57 42 Z" fill="#FFF176" stroke="#C8A200" strokeWidth=".8" />
            {/* Stem */}
            <rect x="53" y="70" width="14" height="18" rx="2" fill="#E8A820" stroke="#C8A200" strokeWidth="1" />
            <rect x="53" y="70" width="14" height="3" rx="1" fill="#FFD700" />
            {/* Top base brick */}
            <rect x="38" y="88" width="44" height="14" rx="2" fill="#FFD700" stroke="#C8A200" strokeWidth="1" />
            <rect x="38" y="88" width="44" height="2" rx="1" fill="#FFF176" opacity=".3" />
            {/* Studs on top base */}
            <circle cx="49" cy="86" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth=".8" />
            <circle cx="60" cy="86" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth=".8" />
            <circle cx="71" cy="86" r="3.5" fill="#E8A820" stroke="#C8A200" strokeWidth=".8" />
            {/* Bottom base brick */}
            <rect x="32" y="102" width="56" height="14" rx="2" fill="#E8A820" stroke="#C8A200" strokeWidth="1" />
            <rect x="32" y="102" width="56" height="2" rx="1" fill="#FFD700" opacity=".3" />
            {/* Studs on bottom base */}
            <circle cx="42" cy="100" r="3.5" fill="#D4941A" stroke="#C8A200" strokeWidth=".8" />
            <circle cx="53" cy="100" r="3.5" fill="#D4941A" stroke="#C8A200" strokeWidth=".8" />
            <circle cx="67" cy="100" r="3.5" fill="#D4941A" stroke="#C8A200" strokeWidth=".8" />
            <circle cx="78" cy="100" r="3.5" fill="#D4941A" stroke="#C8A200" strokeWidth=".8" />
          </svg>
        </div>
        <div className="comp-title">THE CITY STANDS</div>
        <div className="comp-sub">
          Every district connected. Every constraint met. Your team built something no single
          person could have built alone.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="lb lb-yellow" onClick={() => goTo("s-entry")}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
