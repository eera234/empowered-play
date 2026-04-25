"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props { sessionId: Id<"sessions">; }

// HR-facing panel to approve/reject rebuild photos submitted during a crisis.
export default function HRValidateRebuildPanel({ sessionId }: Props) {
  const connections = useQuery(api.mapPhase.getConnections, { sessionId });
  const players = useQuery(api.game.getPlayers, { sessionId });
  const validate = useMutation(api.mapPhase.hrValidateRebuild);
  const pById: Record<string, string> = {};
  for (const p of (players ?? [])) pById[p._id] = p.name;

  // Pass #20: rebuilds now auto-complete on a single photo, but keep the
  // panel ready for cases where HR is reviewing pre-auto-validate (e.g. a
  // partial photo somehow lands without auto-clearing). Single-photo entries
  // are valid; loosen the filter from && to ||.
  const pending = (connections ?? []).filter(c =>
    c.destroyedByCrisisIndex && c.destroyedByCrisisIndex > 0 &&
    !c.rebuildValidatedByHR &&
    (c.rebuildPhotoA || c.rebuildPhotoB)
  );

  if (!pending.length) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: "rgba(255,255,255,.55)" }}>
        No rebuild photos awaiting validation.
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 13, letterSpacing: 2, color: "var(--acc1, #FFD700)",
        marginBottom: 8,
      }}>
        REBUILD VALIDATION QUEUE
      </div>
      {pending.map(c => (
        <div key={c._id} style={{
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 8, padding: 10, marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 6 }}>
            {pById[c.fromSlotId] ?? "A"} ↔ {pById[c.toSlotId] ?? "B"} —{" "}
            <b>{(c.rebuildNewType ?? c.connectionType ?? "bridge").toUpperCase()}</b>
          </div>
          {(() => {
            const hasA = !!c.rebuildPhotoA;
            const hasB = !!c.rebuildPhotoB;
            const both = hasA && hasB;
            const photoWidth = both ? "48%" : "100%";
            return (
              <div style={{ display: "flex", gap: 6 }}>
                {hasA && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.rebuildPhotoA} alt="A" style={{ width: photoWidth, borderRadius: 4, border: "1px solid rgba(255,255,255,.2)" }} />
                )}
                {hasB && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.rebuildPhotoB} alt="B" style={{ width: photoWidth, borderRadius: 4, border: "1px solid rgba(255,255,255,.2)" }} />
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 6,
                background: "rgba(76,175,80,.2)", border: "1px solid rgba(76,175,80,.5)",
                color: "#a5d6a7", fontSize: 11, fontWeight: 800, letterSpacing: 1,
                textTransform: "uppercase", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
              onClick={() => validate({ connectionId: c._id, approved: true })}
            >
              ✓ Approve
            </button>
            <button
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 6,
                background: "rgba(244,67,54,.15)", border: "1px solid rgba(244,67,54,.5)",
                color: "#ff8a80", fontSize: 11, fontWeight: 800, letterSpacing: 1,
                textTransform: "uppercase", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
              onClick={() => validate({ connectionId: c._id, approved: false })}
            >
              ✗ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
