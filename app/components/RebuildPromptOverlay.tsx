"use client";

import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import InAppCamera from "./InAppCamera";
import { CONNECTION_TYPES } from "../../lib/constants";
import { isDevHost } from "../../lib/env";
import ConnectionTypeArt, { type ConnectionTypeKind } from "./ConnectionTypeArt";
import { toast } from "sonner";

interface Props {
  sessionId: Id<"sessions">;
  playerId: Id<"players">;
  partnerName: string;
  connectionId: Id<"connections">;
  newType: string;
  originalType: string;
  theme: "water" | "space" | "ocean" | "forest";
  alreadyUploadedByMe: boolean;
  // Pass #18: absolute ms deadline for the rebuild window. Undefined before
  // announceCrisis fires. Overlay renders a countdown when present.
  rebuildDeadline?: number;
}

// Shown to each player whose connection was destroyed and not healed.
// Camera-only (uses InAppCamera with getUserMedia; no file picker anywhere).
export default function RebuildPromptOverlay({
  sessionId, playerId, partnerName, connectionId,
  newType, originalType, theme, alreadyUploadedByMe,
  rebuildDeadline,
}: Props) {
  const submit = useMutation(api.mapPhase.submitRebuildPhoto);
  const detectBlocks = useAction(api.detectLego.detectBuildingBlocks);
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const typeMeta = (CONNECTION_TYPES[theme] ?? CONNECTION_TYPES.water).find(t => t.id === newType);

  useEffect(() => {
    if (!rebuildDeadline) return;
    const i = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(i);
  }, [rebuildDeadline]);

  const remainingMs = rebuildDeadline ? Math.max(0, rebuildDeadline - now) : null;
  const secondsLeft = remainingMs != null ? Math.ceil(remainingMs / 1000) : null;

  async function handleCaptured(dataUrl: string) {
    setCameraOpen(false);
    setBusy(true);
    try {
      let isLego = true;
      // Skip the paid detection call on localhost to avoid burning credits
      // during dev. Production runs detection as before.
      if (!isDevHost()) {
        try {
          const result = await detectBlocks({ imageBase64: dataUrl.split(",")[1] });
          isLego = !!result.isLego;
        } catch {
          isLego = true; // fail-open on action errors
        }
      }
      if (!isLego) {
        toast("No building blocks detected. Retake with your build in frame.");
        return;
      }
      await submit({ sessionId, connectionId, playerId, photoDataUrl: dataUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2200,
      background: "rgba(5,5,15,.9)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "min(440px, 92vw)", background: "var(--bg1, #0e0e25)",
        border: "2px solid #FF5252", borderRadius: 14,
        padding: 20, color: "white",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22, letterSpacing: 2, color: "#FF5252",
          }}>
            YOUR CONNECTION BROKE
          </div>
          {secondsLeft != null && secondsLeft > 0 && (
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 22, letterSpacing: 1,
              color: secondsLeft <= 15 ? "#FF5252" : "#FFD740",
              minWidth: 60, textAlign: "right",
            }}>
              {secondsLeft}s
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
          Connection to <b>{partnerName}</b> was destroyed (was {originalType.toUpperCase()}).
          Rebuild it as a <b>{(typeMeta?.label ?? newType).toUpperCase()}</b>.
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: 10 }}>
          <ConnectionTypeArt type={newType as ConnectionTypeKind} theme={theme} size={96} />
        </div>
        {typeMeta && (
          <div style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,.6)", textAlign: "center", marginTop: 6 }}>
            {typeMeta.hint}
          </div>
        )}
        {/* Pass #20: rebuild auto-completes on this single upload, so the overlay
            unmounts on success. The legacy "waiting for partner" branch is gone. */}
        <button
          disabled={busy || alreadyUploadedByMe}
          onClick={() => setCameraOpen(true)}
          style={{
            width: "100%", marginTop: 14, padding: "12px 14px",
            background: "rgba(255,215,0,.22)", border: "1.5px solid rgba(255,215,0,.6)",
            borderRadius: 8, color: "var(--acc1, #FFD700)",
            fontSize: 14, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
            cursor: "pointer", fontFamily: "'Nunito', sans-serif",
            opacity: (busy || alreadyUploadedByMe) ? 0.5 : 1,
          }}
        >
          {busy ? "Uploading\u2026" : alreadyUploadedByMe ? "Photo uploaded" : "Take photo of new build"}
        </button>
        <div style={{
          marginTop: 8, fontSize: 10, color: "rgba(255,255,255,.55)",
          textAlign: "center", letterSpacing: 0.5,
        }}>
          Live camera only. Gallery uploads are not allowed.
        </div>
      </div>
      <InAppCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCaptured}
        title="Rebuild Photo"
        hint={`Rebuild your connection as a ${(typeMeta?.label ?? newType).toUpperCase()}, then take a live photo of the new build.`}
      />
    </div>
  );
}
