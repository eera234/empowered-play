"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { playSound } from "../../lib/sound";

interface Props {
  sessionId: Id<"sessions">;
  diplomatId: Id<"players">;
  crisisIndex: number;
  startedAt: number;
  players: Array<{ _id: Id<"players">; name: string; ability?: string }>;
  onDone?: () => void;
}

const TOTAL_MS = 15_000;
const TICK_MS = 2_000;

// Pass #18: Diplomat's chat-unmute mini-game. Renders only for the player
// whose role is Diplomat while the crisis's mute window is live. Taps on a
// teammate card unmute them; the server may re-mute during 0-12s. Ends at
// TOTAL_MS or when all teammates are unmuted.
export default function DiplomatUnmuteOverlay({
  sessionId,
  diplomatId,
  crisisIndex,
  startedAt,
  players,
  onDone,
}: Props) {
  const muteState = useQuery(api.mapPhase.getDiplomatMuteState, {
    sessionId,
    crisisIndex,
  });
  const tapUnmute = useMutation(api.mapPhase.diplomatTapUnmute);
  const chaosTick = useMutation(api.mapPhase.diplomatChaosTick);

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(i);
  }, []);

  useEffect(() => {
    const i = window.setInterval(() => {
      chaosTick({ sessionId }).catch(() => {});
    }, TICK_MS);
    return () => window.clearInterval(i);
  }, [sessionId, chaosTick]);

  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, TOTAL_MS - elapsed);
  const secondsLeft = Math.ceil(remaining / 1000);

  const muteByPlayer = new Map<string, boolean>();
  for (const r of muteState ?? []) {
    muteByPlayer.set(r.playerId as unknown as string, r.muted);
  }

  const teammates = players.filter(
    (p) => (p._id as unknown as string) !== (diplomatId as unknown as string),
  );
  const mutedCount = teammates.filter(
    (p) => muteByPlayer.get(p._id as unknown as string) === true,
  ).length;

  // Pass #32: success state. When the diplomat unmutes the last teammate we
  // lock into a one-shot "TEAM RESTORED" beat, play a fanfare, and dismiss
  // the overlay 1500ms later instead of letting it sit through the rest of
  // the 15s timer. sawMutedRef guards against the page-refresh case where the
  // game is already over and we'd otherwise re-celebrate on every reload.
  const sawMutedRef = useRef(false);
  const succeededRef = useRef(false);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (mutedCount > 0) sawMutedRef.current = true;
  }, [mutedCount]);

  useEffect(() => {
    if (succeededRef.current) return;
    if (!sawMutedRef.current) return;
    if (muteState === undefined) return;
    if (mutedCount !== 0) return;
    succeededRef.current = true;
    setSucceeded(true);
    playSound("complete-fanfare");
    const t = window.setTimeout(() => onDone?.(), 1500);
    return () => window.clearTimeout(t);
  }, [mutedCount, muteState, onDone]);

  // Reset the success lock when a new crisis starts (the parent keeps this
  // component mounted across both crises if neither dismisses).
  useEffect(() => {
    succeededRef.current = false;
    sawMutedRef.current = false;
    setSucceeded(false);
  }, [startedAt]);

  useEffect(() => {
    if (remaining <= 0 && onDone) onDone();
  }, [remaining, onDone]);

  if (succeeded) return <DiplomatSuccessCard teammateCount={teammates.length} />;
  if (remaining <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "linear-gradient(180deg, rgba(255,215,64,.12), rgba(255,215,64,.04))",
          border: "2px solid rgba(255,215,64,.5)",
          borderRadius: 16,
          padding: "22px 20px 18px",
          boxShadow: "0 18px 50px rgba(0,0,0,.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 11,
              letterSpacing: 3,
              color: "#FFD740",
              textTransform: "uppercase",
            }}
          >
            Diplomat {"\u00B7"} Unmute Game
          </div>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 22,
              color: remaining < 4000 ? "#FF5252" : "#FFD740",
              letterSpacing: 1,
            }}
          >
            {secondsLeft}s
          </div>
        </div>

        <div style={{ fontSize: 13, color: "white", lineHeight: 1.5, margin: "4px 0 14px" }}>
          Tap each muted teammate to bring their voice back. Some will get re-muted by the crisis.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {teammates.map((p) => {
            const isMuted = muteByPlayer.get(p._id as unknown as string) === true;
            return (
              <button
                key={p._id as unknown as string}
                onClick={() => {
                  if (!isMuted) return;
                  tapUnmute({ sessionId, diplomatId, targetPlayerId: p._id }).catch(() => {});
                }}
                disabled={!isMuted}
                style={{
                  padding: "14px 10px",
                  borderRadius: 10,
                  border: isMuted
                    ? "2px solid rgba(255,82,82,.7)"
                    : "2px solid rgba(102,187,106,.5)",
                  background: isMuted
                    ? "linear-gradient(180deg, rgba(255,82,82,.2), rgba(255,82,82,.05))"
                    : "linear-gradient(180deg, rgba(102,187,106,.15), rgba(102,187,106,.03))",
                  color: isMuted ? "#FFD7D7" : "#D1F2D4",
                  cursor: isMuted ? "pointer" : "default",
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 13,
                  letterSpacing: 1,
                  textAlign: "center",
                  transition: "all 150ms ease",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>
                  {isMuted ? "\u{1F507}" : "\u{1F50A}"}
                </div>
                {p.name}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: "var(--textd)", textAlign: "center" }}>
          {mutedCount === 0
            ? "All teammates are back online."
            : `${mutedCount} muted`}
        </div>

        <div
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(remaining / TOTAL_MS) * 100}%`,
              height: "100%",
              background: remaining < 4000
                ? "linear-gradient(90deg, #FF5252, #FFA726)"
                : "linear-gradient(90deg, #FFD740, #FFA726)",
              transition: "width 200ms linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Pass #32: shown for ~1.5s after the diplomat unmutes the last teammate.
// Reuses ch1CelebrateHalo from globals.css for the green halo bloom and
// pulse for the checkmark glow. Visual palette borrows from
// ProtectionBanner.tsx so the success reads as part of the same family.
function DiplomatSuccessCard({ teammateCount }: { teammateCount: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="diplomat-success-bloom"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(180deg, rgba(24,34,14,.96), rgba(10,14,6,.96))",
          border: "2px solid rgba(144,238,144,.55)",
          borderRadius: 16,
          padding: "26px 22px 22px",
          boxShadow: "0 18px 50px rgba(0,0,0,.6)",
          textAlign: "center",
          animation: "ch1CelebrateHalo 1600ms ease-out 1",
        }}
      >
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22,
            letterSpacing: 3,
            color: "#A6E89B",
          }}
        >
          TEAM RESTORED
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(220,240,210,.92)",
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          All {teammateCount} {teammateCount === 1 ? "voice is" : "voices are"} back online.
        </div>
        <div
          aria-hidden
          style={{
            marginTop: 18,
            fontSize: 56,
            color: "#A6E89B",
            lineHeight: 1,
            animation: "pulse 1200ms ease-in-out infinite",
            textShadow: "0 0 24px rgba(105,240,174,.55)",
          }}
        >
          {"✓"}
        </div>
      </div>
    </div>
  );
}
