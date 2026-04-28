"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CONNECTION_TYPES } from "../../lib/constants";

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
  const scoutChooseC1 = useMutation(api.mapPhase.scoutChooseC1);
  const players = useQuery(api.game.getPlayers, { sessionId });
  const soonToBeDamaged = new Set<string>();
  for (const p of damagedPairs) {
    soonToBeDamaged.add(p.aPlayerId);
    soonToBeDamaged.add(p.bPlayerId);
  }
  const targets = (players ?? []).filter(p => !p.isFacilitator && soonToBeDamaged.has(p._id));
  return (
    <ModalFrame
      title={`${roleLabel ?? "SCOUT"}: YOUR MOVE`}
      subtitle={`You privately see ${damagedPairs.length} connection${damagedPairs.length === 1 ? "" : "s"} will break this crisis. Choose how to warn the team.`}
    >
      {mode === "idle" && (
        <>
          <button style={btn("primary")} onClick={async () => {
            await scoutChooseC1({ sessionId, scoutId, mode: "public" });
            onDone();
          }}>
            Tell the team ({damagedPairs.length} will break)
          </button>
          <button style={btn("ghost")} onClick={() => setMode("dm")}>
            DM one specific person
          </button>
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
                  ? { background: "rgba(255,215,0,.22)", borderColor: "rgba(255,215,0,.85)" }
                  : {}),
              }}
              onClick={() => setTarget(t._id)}
            >
              {t.name}
            </button>
          ))}
          <button
            style={btn("primary")}
            disabled={!target}
            onClick={async () => {
              if (!target) return;
              await scoutChooseC1({ sessionId, scoutId, mode: "dm", targetPlayerId: target });
              onDone();
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
  return (
    <ModalFrame
      title={`${roleLabel ?? "SCOUT"}: FINAL CHOICE`}
      subtitle="Your district will break this crisis unless you protect it. Pick ONE:"
    >
      <button
        style={btn("danger")}
        onClick={async () => {
          await scoutChooseC2({ sessionId, scoutId, choice: "reveal" });
          onDone();
        }}
      >
        REVEAL THE PATTERN. MY DISTRICT BREAKS.
      </button>
      <div style={{
        textAlign: "center",
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 11,
        letterSpacing: 3,
        color: "rgba(255,255,255,.45)",
        margin: "10px 0 2px 0",
      }}>
        OR
      </div>
      <button
        style={btn("primary")}
        onClick={async () => {
          await scoutChooseC2({ sessionId, scoutId, choice: "protect" });
          onDone();
        }}
      >
        PROTECT MYSELF. TEAM GOES IN BLIND.
      </button>
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

  const allPicked = damagedPairs.every(p => p.newType);
  useEffect(() => {
    if (allPicked) onDone();
  }, [allPicked, onDone]);

  return (
    <ModalFrame
      title={`${roleLabel ?? "ENGINEER"}: DESIGN REBUILDS`}
      subtitle="For each destroyed connection, pick a new type the pair must build. Types they've already built are hidden."
    >
      {damagedPairs.map((dyad, i) => {
        if (dyad.newType) {
          return (
            <div key={i} style={{ padding: 8, marginTop: 6, fontSize: 12, color: "rgba(255,255,255,.6)", border: "1px dashed rgba(255,255,255,.15)", borderRadius: 6 }}>
              ✓ Dyad {i + 1}: {dyad.newType.toUpperCase()}
            </div>
          );
        }
        const a = (players ?? []).find(p => p._id === dyad.aPlayerId);
        const b = (players ?? []).find(p => p._id === dyad.bPlayerId);
        const aHist = (a?.connectionsBuiltHistory ?? []) as string[];
        const bHist = (b?.connectionsBuiltHistory ?? []) as string[];
        const options = typeList.filter(t => t.id !== dyad.originalType && !aHist.includes(t.id) && !bHist.includes(t.id));
        return (
          <div key={i} style={{ marginTop: 10, padding: 8, border: "1px solid rgba(255,255,255,.12)", borderRadius: 6 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>
              {a?.name} ↔ {b?.name} (was {dyad.originalType})
            </div>
            {options.length === 0 ? (
              <div style={{ fontSize: 11, color: "#ff8a80" }}>No eligible types. Skip.</div>
            ) : (
              options.map(t => (
                <button
                  key={t.id}
                  style={btn("ghost")}
                  onClick={async () => {
                    await pickType({ sessionId, engineerId, dyadIndex: i, newType: t.id });
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))
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
