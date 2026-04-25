"use client";

import { useState } from "react";
import type { Ability } from "../../lib/constants";
import { getAbilityIllustration } from "./AbilityIllustrations";

type Props = {
  ability: Ability | null;
  onContinue: () => void;
};

// Only solid LEGO colors. Matches the classic LEGO palette in globals.css
// (--lego-red, --lego-yellow, --lego-blue, --lego-green).
const ABILITY_COLORS: Record<string, string> = {
  citizen:  "#E3000B", // lego-red (default)
  mender:   "#006DB7", // lego-blue
  scout:    "#FFD700", // lego-yellow
  engineer: "#E3000B", // lego-red
  anchor:   "#00A650", // lego-green
  diplomat: "#FFD700", // lego-yellow
};
const ABILITY_TEXT_ON: Record<string, string> = {
  citizen:  "#fff",
  mender:   "#fff",
  scout:    "#0a0a12",
  engineer: "#fff",
  anchor:   "#fff",
  diplomat: "#0a0a12",
};

function StudRow({ count = 6, color }: { count?: number; color: string }) {
  return (
    <div style={{
      display: "flex", gap: 10, justifyContent: "center",
      padding: "0 0 6px 0", position: "relative", marginTop: -12, zIndex: 3,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 24, height: 24, borderRadius: "50%",
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,.55), ${color} 55%, rgba(0,0,0,.25) 100%)`,
          boxShadow: "inset 0 -3px 5px rgba(0,0,0,.28), 0 2px 3px rgba(0,0,0,.35)",
          border: "1px solid rgba(0,0,0,.25)",
        }} />
      ))}
    </div>
  );
}

export default function RoleRevealCard({ ability, onContinue }: Props) {
  const [flipped, setFlipped] = useState(false);
  const abilityId = ability?.id ?? "citizen";
  const abilityColor = ABILITY_COLORS[abilityId] ?? "#E3000B";
  const abilityTextOn = ABILITY_TEXT_ON[abilityId] ?? "#fff";
  const AbilityArt = getAbilityIllustration(abilityId);
  const labelText = ability?.label ?? "Citizen";
  const identityText = ability?.description ?? "You are the heart of the team.";
  const c1Text = ability?.descriptionC1 ?? "";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(6,6,26,.96)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px", zIndex: 800, overflowY: "auto",
      }}
    >
      <div style={{
        maxWidth: 360, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "stretch", gap: 20,
      }}>
        {/* Stud row sits OUTSIDE the card so studs visually poke above the brick */}
        <div style={{ position: "relative" }}>
          <StudRow count={5} color="var(--lego-red)" />
          <div
            onClick={() => !flipped && setFlipped(true)}
            style={{
              width: "100%", perspective: "1400px",
              cursor: flipped ? "default" : "pointer",
              minHeight: 420,
            }}
          >
            <div
              style={{
                position: "relative", width: "100%", minHeight: 420,
                transformStyle: "preserve-3d",
                transition: "transform 720ms cubic-bezier(.2, .9, .3, 1.05)",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* FACE DOWN: big classic LEGO red brick.
                  Flat solid lego-red fill, dark flat drop-shadow under it,
                  faint top-edge highlight for the molded brick look, white
                  "YOUR ROLE" stamped on it. No gradients, no metallics. */}
              <div style={{
                position: "absolute", inset: 0, minHeight: 420,
                background: "var(--lego-red)",
                borderRadius: "var(--brick-radius)",
                boxShadow: "0 6px 0 rgba(0,0,0,.45), 0 14px 40px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.18), inset 0 -6px 0 rgba(0,0,0,.18)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "36px 28px", textAlign: "center",
                overflow: "hidden",
              }}>
                {/* Faint stud-grid texture to make it read as moulded plastic */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,.08) 1.4px, transparent 1.4px)",
                  backgroundSize: "18px 18px",
                  pointerEvents: "none",
                }} />

                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 4, color: "rgba(255,255,255,.75)", marginBottom: 18,
                  textTransform: "uppercase", position: "relative",
                }}>
                  Empowered Play
                </div>

                {/* Big stamped "YOUR ROLE" on the brick */}
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 54, letterSpacing: 4, color: "#fff",
                  textShadow: "0 3px 0 rgba(0,0,0,.35), 0 6px 14px rgba(0,0,0,.25)",
                  lineHeight: 0.95, position: "relative", marginBottom: 6,
                }}>
                  YOUR
                </div>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 54, letterSpacing: 4, color: "#fff",
                  textShadow: "0 3px 0 rgba(0,0,0,.35), 0 6px 14px rgba(0,0,0,.25)",
                  lineHeight: 0.95, position: "relative", marginBottom: 24,
                }}>
                  ROLE
                </div>

                {/* Yellow tap hint: classic LEGO yellow pill on red brick */}
                <div style={{
                  background: "var(--lego-yellow)",
                  color: "#0a0a12",
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 12, letterSpacing: 3,
                  padding: "9px 18px",
                  borderRadius: "var(--brick-radius)",
                  boxShadow: "0 3px 0 rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.35)",
                  position: "relative",
                  animation: "rolePulse 1.6s ease-in-out infinite",
                }}>
                  TAP TO REVEAL
                </div>
              </div>

              {/* FACE UP (revealed): ability-coloured LEGO brick on the top,
                  dark card body below with the ability art + description. */}
              <div style={{
                position: "absolute", inset: 0, minHeight: 420,
                background: "var(--bg2)",
                border: "2px solid var(--border)",
                borderRadius: "var(--brick-radius)",
                boxShadow: "0 6px 0 rgba(0,0,0,.4), 0 20px 60px rgba(0,0,0,.6)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}>
                {/* Solid colored LEGO brick top bar with label stamped on it */}
                <div style={{
                  background: abilityColor,
                  padding: "16px 16px 14px",
                  textAlign: "center",
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,.18), inset 0 -5px 0 rgba(0,0,0,.2)",
                }}>
                  <div style={{
                    fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                    letterSpacing: 3, color: abilityTextOn, opacity: 0.75, marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                    Your Role
                  </div>
                  <div style={{
                    fontFamily: "'Black Han Sans', sans-serif", fontSize: 26,
                    letterSpacing: 2, color: abilityTextOn,
                    textShadow: "0 2px 0 rgba(0,0,0,.18)",
                  }}>
                    {labelText.toUpperCase()}
                  </div>
                </div>

                <div style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "18px 20px 20px", gap: 12,
                }}>
                  <div style={{
                    width: "78%", maxWidth: 220, aspectRatio: "1 / 1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--brick-radius)", overflow: "hidden",
                    background: `radial-gradient(circle at 50% 35%, ${abilityColor}22, transparent 72%)`,
                    border: `1px solid ${abilityColor}33`,
                  }}>
                    <AbilityArt size={200} />
                  </div>
                  <div style={{
                    fontSize: 13, color: "white", lineHeight: 1.55, textAlign: "center",
                    padding: "0 4px",
                  }}>
                    {identityText}
                  </div>
                  {c1Text && (
                    <div style={{
                      fontSize: 12, color: "rgba(255,255,255,.78)", lineHeight: 1.5,
                      textAlign: "center", padding: "0 4px",
                      borderTop: "1px dashed rgba(255,255,255,.18)", paddingTop: 10, marginTop: 2,
                    }}>
                      <div style={{
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 10, letterSpacing: 2, color: abilityColor,
                        marginBottom: 6, textTransform: "uppercase",
                      }}>
                        When the crisis hits
                      </div>
                      {c1Text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className="lb lb-yellow"
          onClick={onContinue}
          disabled={!flipped}
          style={{
            padding: "14px 36px", fontSize: 13, width: "100%",
            opacity: flipped ? 1 : 0,
            pointerEvents: flipped ? "auto" : "none",
            transform: flipped ? "translateY(0)" : "translateY(8px)",
            transition: "opacity .4s ease .3s, transform .4s ease .3s",
          }}
        >
          CONTINUE {"\u2192"}
        </button>
      </div>

      <style jsx>{`
        @keyframes rolePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 3px 0 rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.35); }
          50% { transform: scale(1.05); box-shadow: 0 5px 0 rgba(0,0,0,.35), 0 0 20px rgba(255,215,0,.6), inset 0 1px 0 rgba(255,255,255,.35); }
        }
      `}</style>
    </div>
  );
}
