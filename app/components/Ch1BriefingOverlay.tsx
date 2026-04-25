"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  districtTerm: string;
  zoneTerm: string;
  mapTerm: string;
  /** The riddle that points at the target zone. Only this player sees it. */
  riddle?: string;
  onDismissed?: () => void;
}

// Blocking briefing shown to every non-fac player when Ch1 begins. Dismissing
// the overlay marks this player ready on the server; once every non-fac
// player is ready, the placement timer (CH1_PLACEMENT_SECONDS) starts for
// the whole session.
// Matches the visual + sessionStorage contract of the pair-build intro in
// PairBuildScreen.tsx (see `intro-seen:${sessionId}`).
export function Ch1BriefingOverlay({
  sessionId, playerId, districtTerm, zoneTerm, mapTerm, riddle, onDismissed,
}: Props) {
  const markCh1Ready = useMutation(api.game.markCh1Ready);

  const storageKey = `ch1-intro-seen:${sessionId}`;

  async function dismiss() {
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "1");
    try {
      await markCh1Ready({ playerId });
    } catch {
      // No-op. Server-side gate is idempotent, and the effect in
      // StoryMapScreen re-marks on reconnect if this fails.
    }
    onDismissed?.();
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(6,6,26,.97)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, zIndex: 500, overflowY: "auto",
        animation: "fadeIn .3s ease-out",
      }}
    >
      <div style={{ maxWidth: "min(520px, 92vw)", width: "100%" }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2,
          color: "var(--acc1)", marginBottom: 6, textAlign: "center",
        }}>
          CHAPTER 1: PLACE YOUR {districtTerm.toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: "var(--textd)", marginBottom: 18, textAlign: "center", lineHeight: 1.5 }}>
          When everyone is ready, a{" "}
          <strong style={{ color: "var(--acc1)" }}>2 minute timer</strong>
          {" "}starts. Place your {districtTerm} on the {mapTerm} before it runs out.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <Step n={1} accent="var(--acc1)" label="YOUR RIDDLE">
            Your riddle points at one {zoneTerm} on the {mapTerm}. It does not name the {zoneTerm}. You have to figure it out.
          </Step>
          <Step n={2} accent="var(--acc2)" label="DRAG TO PLACE">
            When the timer starts you get 2 minutes. Drop your {districtTerm} on the {zoneTerm} you think the riddle means. You can reposition as many times as you want while the timer is running.
          </Step>
          <Step n={3} accent="var(--acc4)" label="TIMER ENDS, POSITION LOCKS">
            When the 2 minutes are up, positions lock and the {mapTerm} is set for Chapter 2. If you never placed, you get dropped in a random {zoneTerm}.
          </Step>
        </div>

        {riddle && (
          <div style={{
            background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.3)",
            borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 14,
            color: "white", lineHeight: 1.6, textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 10, color: "var(--acc1)", letterSpacing: 2, marginBottom: 6,
            }}>
              YOUR RIDDLE
            </div>
            <div style={{ fontStyle: "italic", fontSize: 14 }}>
              &ldquo;{riddle}&rdquo;
            </div>
            <div style={{ fontSize: 10, color: "var(--textdd)", marginTop: 8 }}>
              Only you see this. Figure out which {zoneTerm} it means.
            </div>
          </div>
        )}

        <div style={{
          background: "rgba(255,255,255,.04)", border: "1px solid var(--border)",
          borderRadius: "var(--brick-radius)", padding: "10px 14px", marginBottom: 16,
          fontSize: 11, color: "var(--textd)", lineHeight: 1.6,
        }}>
          {"\u23F1"}{" "}
          <strong style={{ color: "white" }}>The timer starts only when everyone taps ready.</strong>
          {" "}Tap the button below to mark yourself ready.
        </div>

        <button
          className="lb lb-yellow"
          onClick={dismiss}
          style={{ width: "100%", padding: "14px 0", fontSize: 14, letterSpacing: 2 }}
        >
          I&apos;M READY {"\u2192"}
        </button>
      </div>
    </div>
  );
}

function Step({ n, accent, label, children }: { n: number; accent: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: `${accent}14`, border: `1px solid ${accent}55`,
      borderRadius: "var(--brick-radius)", padding: "12px 14px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 14,
        background: accent, color: "#0a0a12",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Black Han Sans', sans-serif", fontSize: 13,
      }}>{n}</div>
      <div>
        <div style={{ fontSize: 11, color: accent, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "white", lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
