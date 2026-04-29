"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { playSound } from "../../lib/sound";
import {
  SCENARIOS,
  ABILITIES,
  getThemedAbility,
  DIPLOMAT_UNMUTE_CHAOS_END_MS,
  DIPLOMAT_UNMUTE_MAX_REMUTES_PER_PLAYER,
} from "../../lib/constants";

interface Props {
  sessionId: Id<"sessions">;
  diplomatId: Id<"players">;
  crisisIndex: number;
  startedAt: number;
  scenarioId: string;
  players: Array<{ _id: Id<"players">; name: string; ability?: string }>;
  onDone?: () => void;
  // When true, bypass Convex hooks. Used by /dev/diplomat-preview so the UI
  // can be eyeballed without a real session. Mutations no-op; mute state is
  // driven by local React state (tap → unmuted; nothing re-mutes).
  previewMode?: boolean;
}

const TOTAL_MS = 16_000;
const TICK_MS = 1_000;
const TAP_PULSE_MS = 260;
const CHAOS_FLASH_MS = 600;
const URGENT_MS = 4_000;
const OUTCOME_DISMISS_MS = 1_800;

export default function DiplomatUnmuteOverlay({
  sessionId,
  diplomatId,
  crisisIndex,
  startedAt,
  scenarioId,
  players,
  onDone,
  previewMode = false,
}: Props) {
  const muteState = useQuery(
    api.mapPhase.getDiplomatMuteState,
    previewMode ? "skip" : { sessionId, crisisIndex },
  );
  const tapUnmuteMut = useMutation(api.mapPhase.diplomatTapUnmute);
  const chaosTickMut = useMutation(api.mapPhase.diplomatChaosTick);

  const [now, setNow] = useState<number>(Date.now());

  // Preview-mode local mute state: starts all muted, tap → unmuted, no chaos
  // re-mutes. Lets the dev page render without a Convex session.
  const [previewMuted, setPreviewMuted] = useState<Set<string>>(() => {
    if (!previewMode) return new Set();
    return new Set(
      players
        .filter((p) => (p._id as unknown as string) !== (diplomatId as unknown as string))
        .map((p) => p._id as unknown as string),
    );
  });

  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(i);
  }, []);

  useEffect(() => {
    if (previewMode) return;
    const i = window.setInterval(() => {
      chaosTickMut({ sessionId }).catch(() => {});
    }, TICK_MS);
    return () => window.clearInterval(i);
  }, [sessionId, chaosTickMut, previewMode]);

  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, TOTAL_MS - elapsed);
  const secondsLeft = Math.ceil(remaining / 1000);
  const isUrgent = remaining < URGENT_MS && remaining > 0;

  const muteByPlayer = new Map<string, boolean>();
  if (previewMode) {
    for (const id of previewMuted) muteByPlayer.set(id, true);
  } else {
    for (const r of muteState ?? []) {
      muteByPlayer.set(r.playerId as unknown as string, r.muted);
    }
  }

  const teammates = players.filter(
    (p) => (p._id as unknown as string) !== (diplomatId as unknown as string),
  );
  const totalTeammates = teammates.length;
  const onlineCount = teammates.filter(
    (p) => muteByPlayer.get(p._id as unknown as string) !== true,
  ).length;
  const mutedCount = totalTeammates - onlineCount;

  // Themed role label (Envoy / Comms Officer / etc). Falls back to "Diplomat"
  // only if scenario lookup fails.
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const baseDip = ABILITIES.find((a) => a.id === "diplomat");
  const dipThemed = baseDip && scenario ? getThemedAbility(baseDip, scenario) : baseDip;
  const roleLabel = (dipThemed?.label ?? "Diplomat").toUpperCase();

  // Tap-pulse tracking: short-lived set of player ids that were just tapped.
  const [tappedIds, setTappedIds] = useState<Set<string>>(new Set());
  const triggerTapPulse = (id: string) => {
    setTappedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setTappedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, TAP_PULSE_MS);
  };

  // Chaos-flash tracking: detect online → muted transitions per player and
  // run a shake + red flash + warning pulse for CHAOS_FLASH_MS. The player
  // needs to actually see (and hear) when the crisis steals a voice back.
  const prevMutedRef = useRef<Map<string, boolean>>(new Map());
  const [chaosFlashedIds, setChaosFlashedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (previewMode) return;
    if (!muteState) return;
    const justReMuted: string[] = [];
    for (const r of muteState) {
      const id = r.playerId as unknown as string;
      const prev = prevMutedRef.current.get(id);
      if (prev === false && r.muted === true) {
        justReMuted.push(id);
      }
      prevMutedRef.current.set(id, r.muted);
    }
    if (justReMuted.length === 0) return;
    playSound("timer-warning");
    setChaosFlashedIds((prevSet) => {
      const next = new Set(prevSet);
      for (const id of justReMuted) next.add(id);
      return next;
    });
    // No cleanup-cancel: muteState updates often (every tap), and cancelling
    // would kill the flash within ~200ms. Each batch self-clears at
    // CHAOS_FLASH_MS independently.
    window.setTimeout(() => {
      setChaosFlashedIds((prevSet) => {
        if (prevSet.size === 0) return prevSet;
        const next = new Set(prevSet);
        for (const id of justReMuted) next.delete(id);
        return next;
      });
    }, CHAOS_FLASH_MS);
  }, [muteState]);

  // ── Preview-mode chaos loop ────────────────────────────────────────────
  // Mirrors the server-side diplomatChaosTick so /dev/diplomat-preview shows
  // the actual back-and-forth without a Convex backend. Same params: 80%
  // chance per tick, up to 2 re-mutes per tick, per-player cap = 4, chaos
  // window 0–15s.
  // teammates is recomputed (new array ref) every render and the overlay
  // re-renders every 200ms via the now ticker. If we listed teammates in the
  // deps, the interval would be cleared & recreated before its 1s tick ever
  // fired — so we read it via a ref instead.
  const previewReMuteCountsRef = useRef<Map<string, number>>(new Map());
  const teammatesRef = useRef(teammates);
  useEffect(() => {
    teammatesRef.current = teammates;
  });
  useEffect(() => {
    if (!previewMode) return;
    const i = window.setInterval(() => {
      const elapsedNow = Date.now() - startedAt;
      if (elapsedNow > DIPLOMAT_UNMUTE_CHAOS_END_MS) return;
      if (Math.random() >= 0.8) return;
      setPreviewMuted((prev) => {
        const allTeammateIds = teammatesRef.current.map(
          (p) => p._id as unknown as string,
        );
        const eligible = allTeammateIds.filter(
          (id) =>
            !prev.has(id) &&
            (previewReMuteCountsRef.current.get(id) ?? 0) <
              DIPLOMAT_UNMUTE_MAX_REMUTES_PER_PLAYER,
        );
        if (eligible.length === 0) return prev;
        const shuffled = [...eligible].sort(() => Math.random() - 0.5);
        const howMany = Math.min(2, shuffled.length);
        const next = new Set(prev);
        for (const id of shuffled.slice(0, howMany)) {
          next.add(id);
          previewReMuteCountsRef.current.set(
            id,
            (previewReMuteCountsRef.current.get(id) ?? 0) + 1,
          );
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(i);
  }, [previewMode, startedAt]);

  // Parallel chaos-flash detector for preview mode (the live one above is
  // gated on muteState which is "skip"'d in preview).
  const prevPreviewMutedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!previewMode) return;
    const justReMuted: string[] = [];
    for (const id of previewMuted) {
      if (!prevPreviewMutedRef.current.has(id)) justReMuted.push(id);
    }
    prevPreviewMutedRef.current = new Set(previewMuted);
    if (justReMuted.length === 0) return;
    playSound("timer-warning");
    setChaosFlashedIds((prevSet) => {
      const next = new Set(prevSet);
      for (const id of justReMuted) next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setChaosFlashedIds((prevSet) => {
        if (prevSet.size === 0) return prevSet;
        const next = new Set(prevSet);
        for (const id of justReMuted) next.delete(id);
        return next;
      });
    }, CHAOS_FLASH_MS);
  }, [previewMuted, previewMode]);

  // Outcome resolves only at timer expiry. Win iff all teammates unmuted at
  // that moment; otherwise time-up. Replaces the old early-success that fired
  // the moment mutedCount hit 0 — we now want the full 16s of back-and-forth.
  const [outcome, setOutcome] = useState<"playing" | "win" | "timeup">("playing");

  // Effect 1: detect timer expiry and flip outcome. Kept independent of the
  // dismiss-timer below so that flipping outcome doesn't cancel the dismissal
  // via this effect's cleanup (the bug that left the overlay stuck on the
  // success/timeup card with no return-to-map).
  useEffect(() => {
    if (outcome !== "playing") return;
    if (remaining > 0) return;
    if (!previewMode && muteState === undefined) return;
    const won = mutedCount === 0;
    setOutcome(won ? "win" : "timeup");
    playSound(won ? "complete-fanfare" : "timer-expired");
  }, [remaining, mutedCount, muteState, outcome, previewMode]);

  // Effect 2: once outcome is resolved, schedule dismissal after the success
  // animation. This effect's only cleanup path is unmount or a fresh crisis
  // restart (which re-arms playing → win), so the timeout actually fires.
  useEffect(() => {
    if (outcome === "playing") return;
    const t = window.setTimeout(() => onDone?.(), OUTCOME_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [outcome, onDone]);

  // Reset outcome when a new crisis starts (the parent keeps this component
  // mounted across both crises if neither dismisses).
  useEffect(() => {
    setOutcome("playing");
  }, [startedAt]);

  if (outcome === "win") return <DiplomatSuccessCard teammateCount={totalTeammates} />;
  if (outcome === "timeup") return <DiplomatTimeUpCard stillMuted={mutedCount} />;

  const ringSize = 132;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCirc * (1 - remaining / TOTAL_MS);
  const timerColor = isUrgent ? "#FF5252" : "#FFD740";

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: isUrgent
            ? "radial-gradient(circle at center, rgba(0,0,0,.78), rgba(70,8,8,.92))"
            : "rgba(0,0,0,.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          transition: "background 220ms ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "linear-gradient(180deg, rgba(255,215,64,.10), rgba(255,215,64,.02))",
            border: `2px solid ${isUrgent ? "rgba(255,82,82,.55)" : "rgba(255,215,64,.5)"}`,
            borderRadius: 16,
            padding: "20px 20px 18px",
            boxShadow: "0 18px 50px rgba(0,0,0,.6)",
            transition: "border-color 220ms ease",
          }}
        >
          {/* ── Themed header ───────────────────────────────────────── */}
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 12,
              letterSpacing: 3.2,
              color: isUrgent ? "#FF7B7B" : "#FFD740",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 14,
              transition: "color 220ms ease",
            }}
          >
            {roleLabel} {"·"} Restore Comms
          </div>

          {/* ── Radial timer ────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 16,
              animation: isUrgent ? "diplomatTimerPulse 600ms ease-in-out infinite" : undefined,
            }}
          >
            <div style={{ position: "relative", width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={timerColor}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringDashOffset}
                  style={{
                    transition: "stroke-dashoffset 200ms linear, stroke 220ms ease",
                    filter: `drop-shadow(0 0 8px ${timerColor}88)`,
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 38,
                    color: timerColor,
                    lineHeight: 1,
                    transition: "color 220ms ease",
                  }}
                >
                  {secondsLeft}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: 2,
                    color: "rgba(255,255,255,.55)",
                    marginTop: 4,
                  }}
                >
                  SECONDS
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 16,
                letterSpacing: 2.5,
                color: onlineCount === totalTeammates ? "#A6E89B" : "white",
                transition: "color 220ms ease",
              }}
            >
              {onlineCount === totalTeammates
                ? "ALL VOICES ONLINE"
                : `${onlineCount} / ${totalTeammates} VOICES ONLINE`}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "rgba(255,255,255,.55)",
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              Tap a muted teammate to bring their voice back. The crisis fights back.
            </div>
          </div>

          {/* ── Player cards ────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {teammates.map((p) => {
              const id = p._id as unknown as string;
              const isMuted = muteByPlayer.get(id) === true;
              const isTapped = tappedIds.has(id);
              const isChaosFlashed = chaosFlashedIds.has(id);

              const animations: string[] = [];
              if (isTapped) animations.push("diplomatTapPulse 260ms ease-out");
              if (isChaosFlashed) {
                animations.push("diplomatShake 350ms ease-in-out");
                animations.push("diplomatChaosFlash 600ms ease-out");
              }
              if (!isTapped && !isChaosFlashed && isMuted) {
                animations.push("diplomatMutedBreath 1400ms ease-in-out infinite");
              }

              return (
                <button
                  key={id}
                  onClick={() => {
                    if (!isMuted) return;
                    playSound("vote-cast");
                    triggerTapPulse(id);
                    if (previewMode) {
                      setPreviewMuted((prev) => {
                        if (!prev.has(id)) return prev;
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                    } else {
                      tapUnmuteMut({ sessionId, diplomatId, targetPlayerId: p._id }).catch(() => {});
                    }
                  }}
                  disabled={!isMuted}
                  style={{
                    position: "relative",
                    padding: "14px 10px 10px",
                    minHeight: 88,
                    flex: "0 1 140px",
                    minWidth: 140,
                    maxWidth: 200,
                    borderRadius: 12,
                    border: isMuted
                      ? "2.5px solid rgba(255,82,82,.75)"
                      : "2.5px solid rgba(102,187,106,.55)",
                    background: isMuted
                      ? "linear-gradient(180deg, rgba(255,82,82,.22), rgba(255,82,82,.06))"
                      : "linear-gradient(180deg, rgba(102,187,106,.18), rgba(102,187,106,.04))",
                    color: isMuted ? "#FFD7D7" : "#D1F2D4",
                    cursor: isMuted ? "pointer" : "default",
                    fontFamily: "'Black Han Sans', sans-serif",
                    textAlign: "center",
                    boxShadow: isMuted
                      ? "0 0 18px rgba(255,82,82,.18)"
                      : "0 0 12px rgba(102,187,106,.12)",
                    transition: "background 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 220ms ease",
                    animation: animations.length ? animations.join(", ") : undefined,
                  }}
                >
                  <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>
                    {isMuted ? "\u{1F507}" : "\u{1F50A}"}
                  </div>
                  <div style={{ fontSize: 14, letterSpacing: 0.6 }}>{p.name}</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 9,
                      letterSpacing: 1.6,
                      opacity: 0.8,
                    }}
                  >
                    {isMuted ? "TAP TO UNMUTE" : "ONLINE"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// Pass #32: shown for ~1.5s after the diplomat unmutes the last teammate.
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

// Sister to DiplomatSuccessCard. Shown at timer-end when ≥1 teammate is still
// muted. Amber to read as a draw, not a hard loss — the rest of the crisis
// still resolves either way.
function DiplomatTimeUpCard({ stillMuted }: { stillMuted: number }) {
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
          maxWidth: 420,
          background: "linear-gradient(180deg, rgba(40,28,8,.96), rgba(20,14,4,.96))",
          border: "2px solid rgba(255,167,38,.6)",
          borderRadius: 16,
          padding: "26px 22px 22px",
          boxShadow: "0 18px 50px rgba(0,0,0,.6)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22,
            letterSpacing: 3,
            color: "#FFA726",
          }}
        >
          TIME UP
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(245,225,200,.92)",
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          {stillMuted} {stillMuted === 1 ? "voice is" : "voices are"} still muted. The crisis is over.
        </div>
        <div
          aria-hidden
          style={{
            marginTop: 18,
            fontSize: 56,
            color: "#FFA726",
            lineHeight: 1,
            textShadow: "0 0 24px rgba(255,167,38,.55)",
          }}
        >
          {"⚠"}
        </div>
      </div>
    </div>
  );
}

const KEYFRAMES_CSS = `
@keyframes diplomatTimerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes diplomatTapPulse {
  0% { transform: scale(0.96); }
  45% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes diplomatShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
@keyframes diplomatChaosFlash {
  0% { background-color: rgba(255,82,82,.55); }
  100% { background-color: rgba(255,82,82,0); }
}
@keyframes diplomatMutedBreath {
  0%, 100% { opacity: 0.88; }
  50% { opacity: 1; }
}
`;
