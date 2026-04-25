"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressDataUrl } from "./cameraFallback";

// Modal in-app camera. Every upload in the game routes through this.
//
// Flow:
//   1. Mount → call getUserMedia({ video: { facingMode: "environment" } }).
//      The browser renders its OWN native "Allow camera?" prompt inline over
//      the page. No OS settings detour.
//   2. User allows → <video> shows the live feed. CAPTURE button freezes a
//      still onto a canvas, encoded as JPEG.
//   3. User chooses RETAKE → discards the still, re-plays the video feed.
//      User chooses USE PHOTO → compresses the JPEG and calls onCapture.
//   4. If permission is denied OR getUserMedia is unsupported, show an
//      error screen with a RETRY button that re-invokes getUserMedia. If
//      the browser has persistently blocked the origin, the retry still
//      fails instantly and the error stays; there is no fallback to the
//      file picker or the photo library. Camera is the only input.

type CameraState =
  | { kind: "requesting" }
  | { kind: "streaming" }
  | { kind: "captured"; dataUrl: string }
  | { kind: "error"; reason: "denied" | "unsupported" | "unknown"; message: string };

interface Props {
  open: boolean;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
}

export default function InAppCamera({ open, onCapture, onClose, title, hint }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ kind: "requesting" });
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const requestCamera = useCallback(async () => {
    setState({ kind: "requesting" });
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        kind: "error",
        reason: "unsupported",
        message: "Your browser does not support in-app camera capture. Use a recent version of Chrome or Safari.",
      });
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = s;
      setState({ kind: "streaming" });
    } catch (err) {
      const name = (err as { name?: string } | null)?.name || "";
      const denied = name === "NotAllowedError" || name === "SecurityError";
      setState({
        kind: "error",
        reason: denied ? "denied" : "unknown",
        message: denied
          ? "Camera access was blocked. Tap the lock icon in your browser's address bar, allow camera for this site, then retry."
          : "Could not start the camera. Check that no other app is using it, then retry.",
      });
    }
  }, []);

  // Every time the modal opens, re-request. If the browser prompt was
  // dismissed previously, this triggers it again (unless persistently blocked).
  useEffect(() => {
    if (!open) {
      stopStream();
      setState({ kind: "requesting" });
      return;
    }
    requestCamera();
    return stopStream;
  }, [open, requestCamera, stopStream]);

  // Bind the stream to the <video> after it mounts. Keeps srcObject in sync
  // with whatever stream we have when the streaming UI renders.
  useEffect(() => {
    if (state.kind === "streaming" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [state]);

  async function capture() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const raw = c.toDataURL("image/jpeg", 0.85);
    stopStream();
    setState({ kind: "captured", dataUrl: raw });
  }

  async function confirm() {
    if (state.kind !== "captured") return;
    setBusy(true);
    try {
      const compressed = await compressDataUrl(state.dataUrl);
      onCapture(compressed);
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    requestCamera();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3500,
        background: "rgba(5,5,14,.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(560px, 96vw)",
          background: "#0e0e25",
          border: "2px solid var(--acc1, #FFD700)",
          borderRadius: 14,
          padding: 16,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 20,
              letterSpacing: 2,
              color: "var(--acc1, #FFD700)",
              textTransform: "uppercase",
            }}
          >
            {title || "Take Photo"}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,.25)",
              color: "rgba(255,255,255,.8)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            CLOSE
          </button>
        </div>

        {hint && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>{hint}</div>
        )}

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            background: "#000",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          {state.kind === "streaming" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
          {state.kind === "captured" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.dataUrl}
              alt="Captured"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
          {state.kind === "requesting" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "rgba(255,255,255,.8)",
                fontSize: 14,
                textAlign: "center",
                padding: 20,
              }}
            >
              <div style={{ fontSize: 36 }}>{"\uD83D\uDCF7"}</div>
              <div>Requesting camera access...</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
                Tap <b>Allow</b> in your browser's prompt to continue.
              </div>
            </div>
          )}
          {state.kind === "error" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 36 }}>{"\u26A0\uFE0F"}</div>
              <div style={{ fontSize: 14, color: "#FF8A65", fontWeight: 700 }}>
                {state.reason === "denied" ? "Camera access blocked" : state.reason === "unsupported" ? "Camera not supported" : "Camera unavailable"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5, maxWidth: 360 }}>
                {state.message}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {state.kind === "streaming" && (
            <button
              type="button"
              onClick={capture}
              style={captureBtnStyle}
            >
              {"\uD83D\uDCF7"} Capture
            </button>
          )}
          {state.kind === "captured" && (
            <>
              <button type="button" onClick={retake} style={secondaryBtnStyle} disabled={busy}>
                Retake
              </button>
              <button type="button" onClick={confirm} style={captureBtnStyle} disabled={busy}>
                {busy ? "Uploading..." : "Use Photo"}
              </button>
            </>
          )}
          {state.kind === "error" && (
            <button type="button" onClick={requestCamera} style={captureBtnStyle}>
              Retry
            </button>
          )}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,.55)",
            textAlign: "center",
            letterSpacing: 0.5,
            lineHeight: 1.5,
          }}
        >
          Live camera only. Photos from your device files or photo library are not accepted.
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}

const captureBtnStyle: React.CSSProperties = {
  background: "var(--acc1, #FFD700)",
  color: "#0e0e25",
  border: "none",
  borderRadius: 8,
  padding: "10px 22px",
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 14,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "transparent",
  color: "rgba(255,255,255,.85)",
  border: "1.5px solid rgba(255,255,255,.35)",
  borderRadius: 8,
  padding: "10px 22px",
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 14,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor: "pointer",
};
