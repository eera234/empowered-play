"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CONNECTION_TYPES } from "../../lib/constants";
import ConnectionTypeArt, { type ConnectionTypeKind } from "./ConnectionTypeArt";

// Equal-weight choice tile used for the Scout's C1/C2 prompts. Two of these
// stack inside a modal; both share the same neutral palette so the colour
// never telegraphs which option is "correct". The glyph + title + consequence
// subtitle are the *only* signal the player gets — that's the point.
function ChoiceTile({
  glyph,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  glyph: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      style={{
        width: "100%",
        marginTop: 14,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        minHeight: 84,
        background: "rgba(20,22,42,.85)",
        border: pressed
          ? "2px solid rgba(255,255,255,.85)"
          : "1px solid rgba(255,255,255,.22)",
        borderRadius: 12,
        color: "white",
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transform: pressed ? "translateY(2px)" : "translateY(0)",
        transition:
          "transform 80ms ease-out, border-color 120ms ease-out, opacity 120ms ease-out",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,.92)",
        }}
      >
        {glyph}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 15,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "white",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "rgba(255,255,255,.7)",
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function MegaphoneGlyph() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 12 L5 20 L11 20 L22 26 L22 6 L11 12 Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,.06)" />
      <path d="M25 12 Q28 16 25 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function WhisperGlyph() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 27 Q4 19 12 19 Q20 19 20 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M22 8 Q26 12 22 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M25 6 Q30 12 25 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

function EyeGlyph() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M3 16 Q16 5 29 16 Q16 27 3 16 Z" stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,.06)" />
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 L26 7 V15 Q26 23 16 29 Q6 23 6 15 V7 Z"
        stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,.06)" strokeLinejoin="round" />
      <path d="M11 16 L15 19 L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Shared modal chrome
function ModalFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2500,
      background: "rgba(5,5,15,.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "min(440px, 92vw)", background: "var(--bg1, #0e0e25)",
        border: "2px solid rgba(255,215,0,.45)", borderRadius: 14,
        padding: 18, color: "white",
        boxShadow: "0 12px 40px rgba(0,0,0,.7)",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 18, letterSpacing: 2, color: "var(--acc1, #FFD700)",
          marginBottom: 4,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 12, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function btn(variant: "primary" | "ghost" | "danger" = "primary"): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 14px",
    marginTop: 10,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    // Pass #30: ghost variant was white text on a near-white tint — washed
    // out against the modal's dark backdrop. Switch to a clearly dark fill
    // so white text reads cleanly. Primary/danger already had enough tint.
    background:
      variant === "primary" ? "rgba(255,215,0,.22)"
      : variant === "danger" ? "rgba(244,67,54,.22)"
      : "rgba(20,22,42,.85)",
    border:
      variant === "primary" ? "2px solid rgba(255,215,0,.85)"
      : variant === "danger" ? "2px solid rgba(244,67,54,.85)"
      : "2px solid rgba(255,255,255,.35)",
    color:
      variant === "primary" ? "var(--acc1, #FFD700)"
      : variant === "danger" ? "#FF8A80"
      : "white",
  };
}

// ═══════════ Scout Crisis 1 ═══════════
export function ScoutC1Modal({
  sessionId, scoutId, damagedPairs, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; scoutId: Id<"players">;
  damagedPairs: Array<{ aPlayerId: Id<"players">; bPlayerId: Id<"players"> }>;
  roleLabel?: string;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "dm">("idle");
  const [target, setTarget] = useState<Id<"players"> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scoutChooseC1 = useMutation(api.mapPhase.scoutChooseC1);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const soonToBeDamaged = new Set<string>();
  for (const p of damagedPairs) {
    soonToBeDamaged.add(p.aPlayerId);
    soonToBeDamaged.add(p.bPlayerId);
  }
  const targets = (players ?? []).filter(p => !p.isFacilitator && soonToBeDamaged.has(p._id));
  const count = damagedPairs.length;
  return (
    <ModalFrame
      title={`${roleLabel ?? "SCOUT"}: YOUR MOVE`}
      subtitle={`You privately see ${count} connection${count === 1 ? "" : "s"} will break this crisis. Choose how to warn the team.`}
    >
      {mode === "idle" && (
        <>
          <ChoiceTile
            glyph={<MegaphoneGlyph />}
            title="Tell the whole team"
            subtitle={`Everyone learns ${count} connection${count === 1 ? "" : "s"} will break. No one knows which.`}
            disabled={submitting}
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              try {
                await scoutChooseC1({ sessionId, scoutId, mode: "public" });
                onDone();
              } finally {
                setSubmitting(false);
              }
            }}
          />
          <ChoiceTile
            glyph={<WhisperGlyph />}
            title="Warn one person privately"
            subtitle="Send a private heads-up to one teammate. The rest go in blind."
            disabled={submitting}
            onClick={() => setMode("dm")}
          />
        </>
      )}
      {mode === "dm" && (
        <>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", margin: "6px 0" }}>
            Pick who to warn:
          </div>
          {targets.map(t => (
            <button
              key={t._id}
              style={{
                ...btn("ghost"),
                ...(target === t._id
                  ? { background: "rgba(255,255,255,.12)", borderColor: "rgba(255,255,255,.85)" }
                  : {}),
              }}
              onClick={() => setTarget(t._id)}
            >
              {t.name}
            </button>
          ))}
          <button
            style={btn("ghost")}
            disabled={!target || submitting}
            onClick={async () => {
              if (!target || submitting) return;
              setSubmitting(true);
              try {
                await scoutChooseC1({ sessionId, scoutId, mode: "dm", targetPlayerId: target });
                onDone();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Send private warning
          </button>
          <button style={btn("ghost")} onClick={() => setMode("idle")}>Back</button>
        </>
      )}
    </ModalFrame>
  );
}

// ═══════════ Scout Crisis 2 ═══════════
export function ScoutC2Modal({
  sessionId, scoutId, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; scoutId: Id<"players">; roleLabel?: string; onDone: () => void;
}) {
  const scoutChooseC2 = useMutation(api.mapPhase.scoutChooseC2);
  const [submitting, setSubmitting] = useState(false);
  return (
    <ModalFrame
      title={`${roleLabel ?? "SCOUT"}: FINAL CHOICE`}
      subtitle="Your district will break this crisis unless you protect it. Pick ONE:"
    >
      <ChoiceTile
        glyph={<EyeGlyph />}
        title="Reveal the pattern"
        subtitle="Everyone learns the Chapter 3 shape. Your own district breaks."
        disabled={submitting}
        onClick={async () => {
          if (submitting) return;
          setSubmitting(true);
          try {
            await scoutChooseC2({ sessionId, scoutId, choice: "reveal" });
            onDone();
          } finally {
            setSubmitting(false);
          }
        }}
      />
      <ChoiceTile
        glyph={<ShieldGlyph />}
        title="Protect yourself"
        subtitle="You alone keep the secret. Your district survives. The team goes in blind."
        disabled={submitting}
        onClick={async () => {
          if (submitting) return;
          setSubmitting(true);
          try {
            await scoutChooseC2({ sessionId, scoutId, choice: "protect" });
            onDone();
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </ModalFrame>
  );
}

// ═══════════ Engineer rebuild-type picker (both crises) ═══════════
export function EngineerC2Modal({
  sessionId, engineerId, damagedPairs, theme, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; engineerId: Id<"players">;
  damagedPairs: Array<{ aPlayerId: Id<"players">; bPlayerId: Id<"players">; originalType: string; newType?: string }>;
  theme: string;
  roleLabel?: string;
  onDone: () => void;
}) {
  const pickType = useMutation(api.mapPhase.engineerPickRebuildType);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const typeList = CONNECTION_TYPES[theme] ?? CONNECTION_TYPES.water;
  const themeKind = (theme as "water" | "space" | "ocean" | "forest");
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const allPicked = damagedPairs.length > 0 && damagedPairs.every(p => p.newType);
  // When the last dyad gets a type assigned, hold the modal on a confirmation
  // card for ~1.5s so the engineer sees they finished, then dismiss. Without
  // this beat the modal blinks closed and the engineer wonders if anything
  // went out.
  useEffect(() => {
    if (!allPicked) return;
    setShowConfirmation(true);
    const t = window.setTimeout(() => onDone(), 1500);
    return () => window.clearTimeout(t);
  }, [allPicked, onDone]);

  if (showConfirmation) {
    return (
      <ModalFrame title={`${roleLabel ?? "ENGINEER"}: SENT`}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 10, padding: "18px 8px 6px",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32,
            background: "rgba(166,232,155,.16)",
            border: "2px solid rgba(166,232,155,.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#A6E89B", fontSize: 32, lineHeight: 1,
          }}>
            ✓
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 16, letterSpacing: 2, color: "#A6E89B",
            marginTop: 4,
          }}>
            PATTERN DISPATCHED
          </div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,.7)", textAlign: "center",
            lineHeight: 1.5, maxWidth: 320,
          }}>
            Your rebuild plans have been sent to the affected players. They can now begin rebuilding.
          </div>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      title={`${roleLabel ?? "ENGINEER"}: DESIGN REBUILDS`}
      subtitle="For each destroyed connection, pick a new type the pair must build. Types they've already built are hidden."
    >
      {damagedPairs.map((dyad, i) => {
        if (dyad.newType) {
          const meta = typeList.find(t => t.id === dyad.newType);
          return (
            <div
              key={i}
              style={{
                padding: 10, marginTop: 8, display: "flex", alignItems: "center", gap: 10,
                fontSize: 12, color: "rgba(255,255,255,.7)",
                border: "1px dashed rgba(166,232,155,.4)", borderRadius: 8,
                background: "rgba(166,232,155,.06)",
              }}
            >
              <ConnectionTypeArt type={dyad.newType as ConnectionTypeKind} theme={themeKind} size={48} />
              <div>
                <div style={{ fontSize: 11, color: "rgba(166,232,155,.85)", letterSpacing: 1 }}>SENT</div>
                <div style={{ fontSize: 13, color: "white" }}>{(meta?.label ?? dyad.newType).toUpperCase()}</div>
              </div>
            </div>
          );
        }
        const a = (players ?? []).find(p => p._id === dyad.aPlayerId);
        const b = (players ?? []).find(p => p._id === dyad.bPlayerId);
        const aHistSet = new Set((a?.connectionsBuiltHistory ?? []) as string[]);
        const bHistSet = new Set((b?.connectionsBuiltHistory ?? []) as string[]);
        const strictOptions = typeList.filter(t =>
          t.id !== dyad.originalType
          && !aHistSet.has(t.id)
          && !bHistSet.has(t.id)
        );
        // In a 4-type theme, "anything but original" guarantees 3 options.
        // The "nothing built before" filter is a nice-to-have, not a correctness
        // rule — fall back when it would shrink the list below 3 so the engineer
        // always has a real choice.
        const options = strictOptions.length >= 3
          ? strictOptions
          : typeList.filter(t => t.id !== dyad.originalType);
        return (
          <div
            key={i}
            style={{
              marginTop: 12,
              padding: 10,
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 8, color: "rgba(255,255,255,.85)" }}>
              {a?.name} ↔ {b?.name}{" "}
              <span style={{ color: "rgba(255,255,255,.5)" }}>
                (was {dyad.originalType})
              </span>
            </div>
            {options.length === 0 ? (
              <div style={{ fontSize: 11, color: "#ff8a80" }}>No eligible types. Skip.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: options.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: 8,
                }}
              >
                {options.map((t, idx) => {
                  const isWideOrphan = options.length === 3 && idx === 2;
                  const isSingle = options.length === 1;
                  const horizontal = isWideOrphan || isSingle;
                  return (
                    <button
                      key={t.id}
                      disabled={submitting !== null}
                      onClick={async () => {
                        if (submitting !== null) return;
                        setSubmitting(i);
                        try {
                          await pickType({ sessionId, engineerId, dyadIndex: i, newType: t.id });
                        } finally {
                          setSubmitting(null);
                        }
                      }}
                      style={{
                        display: "flex",
                        flexDirection: horizontal ? "row" : "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: horizontal ? 14 : 6,
                        padding: horizontal ? "10px 16px" : "10px 8px",
                        gridColumn: isWideOrphan ? "1 / -1" : undefined,
                        background: "rgba(20,22,42,.85)",
                        border: "1px solid rgba(255,255,255,.22)",
                        borderRadius: 10,
                        color: "white",
                        cursor: submitting !== null ? "default" : "pointer",
                        fontFamily: "'Nunito', sans-serif",
                        opacity: submitting !== null && submitting !== i ? 0.5 : 1,
                      }}
                    >
                      <ConnectionTypeArt type={t.id as ConnectionTypeKind} theme={themeKind} size={56} />
                      <div
                        style={{
                          fontFamily: "'Black Han Sans', sans-serif",
                          fontSize: 12,
                          letterSpacing: 1.4,
                          textTransform: "uppercase",
                        }}
                      >
                        {t.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </ModalFrame>
  );
}

// ═══════════ Mender restore ═══════════
export function MenderModal({
  sessionId, menderId, damagedPairs, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; menderId: Id<"players">;
  damagedPairs: Array<{ aPlayerId: Id<"players">; bPlayerId: Id<"players"> }>;
  roleLabel?: string;
  onDone: () => void;
}) {
  const heal = useMutation(api.mapPhase.menderRestore);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const pById: Record<string, string> = {};
  for (const p of (players ?? [])) pById[p._id] = p.name;
  return (
    <ModalFrame
      title={`${roleLabel ?? "MENDER"}: HEAL ONE`}
      subtitle="Pick a damaged connection to restore. You cannot heal yourself."
    >
      {damagedPairs.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", padding: "8px 0" }}>No damaged connections.</div>
      )}
      {damagedPairs.map((dyad, i) => {
        const isSelf = dyad.aPlayerId === menderId || dyad.bPlayerId === menderId;
        return (
          <button
            key={i}
            disabled={isSelf}
            style={{ ...btn("ghost"), opacity: isSelf ? 0.35 : 1 }}
            onClick={async () => {
              await heal({ sessionId, menderId, pairIndex: i });
              onDone();
            }}
          >
            {isSelf ? "🚫" : "🩹"} {pById[dyad.aPlayerId]} ↔ {pById[dyad.bPlayerId]}
          </button>
        );
      })}
    </ModalFrame>
  );
}

// ═══════════ Anchor immunity ═══════════
export function AnchorModal({
  sessionId, anchorId, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; anchorId: Id<"players">; roleLabel?: string; onDone: () => void;
}) {
  const pick = useMutation(api.mapPhase.anchorPickImmune);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const connections = useQuery(api.mapPhase.getConnections, { sessionId });
  const connected = new Set<string>();
  for (const c of (connections ?? [])) {
    if (c.fromSlotId === anchorId) connected.add(c.toSlotId);
    if (c.toSlotId === anchorId) connected.add(c.fromSlotId);
  }
  const options = (players ?? []).filter(p => connected.has(p._id));
  return (
    <ModalFrame
      title={`${roleLabel ?? "ANCHOR"}: IMMUNITY`}
      subtitle="Pick one of your connected teammates. Their district is immune to this crisis."
    >
      {options.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", padding: "8px 0" }}>No connections to leverage.</div>
      )}
      {options.map(o => (
        <button
          key={o._id}
          style={btn("ghost")}
          onClick={async () => {
            await pick({ sessionId, anchorId, targetPlayerId: o._id });
            onDone();
          }}
        >
          🛡️ {o.name}
        </button>
      ))}
    </ModalFrame>
  );
}

// ═══════════ Citizen vote ═══════════
export function CitizenVoteModal({
  sessionId, citizenId, roleLabel, onDone,
}: {
  sessionId: Id<"sessions">; citizenId: Id<"players">; roleLabel?: string; onDone: () => void;
}) {
  const vote = useMutation(api.mapPhase.citizenVote);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const options = (players ?? []).filter(p => !p.isFacilitator && p._id !== citizenId);
  return (
    <ModalFrame
      title={`${roleLabel ?? "CITIZEN"}: CAST VOTE`}
      subtitle="Vote to destroy one teammate's district. If there are 2 Citizens, you must both agree for it to count."
    >
      {options.map(o => (
        <button
          key={o._id}
          style={btn("ghost")}
          onClick={async () => {
            try {
              await vote({ sessionId, citizenId, targetPlayerId: o._id });
              onDone();
            } catch (e) {
              alert((e as Error).message);
            }
          }}
        >
          💥 {o.name}
        </button>
      ))}
    </ModalFrame>
  );
}
