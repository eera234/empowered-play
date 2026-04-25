"use client";

import React, { useEffect, useRef, useState } from "react";
import ConnectionTypeArt, { ConnectionTypeKind } from "./ConnectionTypeArt";
import InAppCamera from "./InAppCamera";
import { PER_CONNECTION_BUILD_SECONDS } from "../../lib/constants";

type Theme = "water" | "space" | "ocean" | "forest";

export interface ConnectionBuildCardProps {
  partnerName: string;
  typeId: string;
  typeLabel: string;
  typeHint: string;
  theme: Theme;
  // flags derived on the server from the connection row
  amSideA: boolean;
  aReady: boolean;
  bReady: boolean;
  buildStartedAt: number | undefined;
  myPhotoUploaded: boolean;
  partnerPhotoUploaded: boolean;
  // callbacks
  onReady: () => Promise<void> | void;
  onPhotoCaptured: (dataUrl: string) => Promise<void> | void;
}

// Full-lifecycle card shown for each non-built connection a player is on.
// Phases:
//   (1) Type reveal + ready gate — both sides tap "I'm ready to build".
//   (2) Build window — countdown + camera. Pass #29: when the timer hits
//       zero, the card stays mounted and a red "TIME'S UP" CTA appears;
//       uploads still go through, the connection is built when both sides
//       have a photo in.
// Parent filters out built rows; this card never renders for built=true.
export default function ConnectionBuildCard(p: ConnectionBuildCardProps) {
  const {
    partnerName, typeId, typeLabel, typeHint, theme,
    amSideA, aReady, bReady, buildStartedAt,
    myPhotoUploaded, partnerPhotoUploaded,
    onReady, onPhotoCaptured,
  } = p;

  const myReady = amSideA ? aReady : bReady;
  const theirReady = amSideA ? bReady : aReady;
  const [cameraOpen, setCameraOpen] = useState(false);

  // Countdown after buildStartedAt is stamped. Ticks every 250ms. Stops
  // ticking once the deadline is past — the force-CTA below handles the
  // post-zero state, no need to keep re-rendering the timer.
  const [now, setNow] = useState(() => Date.now());
  const buildMs = PER_CONNECTION_BUILD_SECONDS * 1000;
  const deadline = buildStartedAt ? buildStartedAt + buildMs : undefined;
  const msLeft = deadline ? Math.max(0, deadline - now) : undefined;
  const secondsLeft = msLeft !== undefined ? Math.ceil(msLeft / 1000) : undefined;
  useEffect(() => {
    if (!buildStartedAt) return;
    if (msLeft === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [buildStartedAt, msLeft]);

  // Pass #29: deadline expiry is a UI signal, NOT a server-side lock. Flip
  // a flag so the force-CTA banner renders; the upload flow stays mounted
  // and uploads still go through past zero. Reset on buildStartedAt change
  // so a re-request (different timestamp) starts cleanly.
  const expiredHandledRef = useRef(false);
  const [deadlineExpired, setDeadlineExpired] = useState(false);
  useEffect(() => {
    setDeadlineExpired(false);
    expiredHandledRef.current = false;
    if (!buildStartedAt) return;
    const fire = () => {
      if (expiredHandledRef.current) return;
      expiredHandledRef.current = true;
      setDeadlineExpired(true);
    };
    const remaining = (buildStartedAt + buildMs) - Date.now();
    if (remaining <= 0) { fire(); return; }
    const t = setTimeout(fire, remaining);
    return () => clearTimeout(t);
  }, [buildStartedAt, buildMs]);

  // ─── Phase 1: ready gate ───
  if (!buildStartedAt) {
    return (
      <Shell tone="accent">
        <Header label={typeLabel} partnerName={partnerName} tag="READY UP" tagTone="accent" />

        <div style={artRow}>
          <div style={artFrame}>
            <ConnectionTypeArt type={typeId as ConnectionTypeKind} size={64} theme={theme} />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
            {typeHint}
          </div>
        </div>

        {/* Pair-ready row: your state + partner state, always visible. */}
        <div style={pairRow}>
          <ReadyPill label="You" ready={!!myReady} />
          <div style={pairDivider} aria-hidden="true" />
          <ReadyPill label={partnerName} ready={!!theirReady} truncate />
        </div>

        {myReady ? (
          <div style={statusBox}>
            {"\u2713"} You&rsquo;re ready. Waiting on <strong style={{ color: "white" }}>{partnerName}</strong>.
          </div>
        ) : (
          <button
            className="lb lb-yellow"
            onClick={() => Promise.resolve(onReady()).catch(() => {})}
            style={primaryButton}
          >
            I&rsquo;M READY TO BUILD
          </button>
        )}

        <div style={helperText}>
          When both partners tap ready, a 2-minute timer starts and the camera unlocks on both sides.
        </div>
      </Shell>
    );
  }

  // ─── Phase 2: build window ───
  const fmtMMSS = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const timerLabel = secondsLeft !== undefined
    ? fmtMMSS(secondsLeft)
    : fmtMMSS(PER_CONNECTION_BUILD_SECONDS);
  const urgent = (secondsLeft ?? PER_CONNECTION_BUILD_SECONDS) <= 15;
  const timerColor = urgent ? "#ff5555" : "var(--acc1, #FFD700)";
  const progressPct = msLeft !== undefined
    ? Math.max(0, Math.min(100, (msLeft / buildMs) * 100))
    : 100;

  return (
    <Shell tone={urgent ? "danger" : "live"}>
      <Header
        label={typeLabel}
        partnerName={partnerName}
        tag={urgent ? "HURRY" : "BUILDING"}
        tagTone={urgent ? "danger" : "live"}
      />

      <div style={{ ...artRow, alignItems: "stretch" }}>
        <div style={artFrame}>
          <ConnectionTypeArt type={typeId as ConnectionTypeKind} size={52} theme={theme} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 36,
              letterSpacing: 2,
              color: timerColor,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              textShadow: urgent
                ? "0 0 14px rgba(255,80,80,0.35)"
                : "0 0 12px rgba(255,215,0,0.25)",
            }}
          >
            {timerLabel}
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: urgent
                  ? "linear-gradient(90deg, #ff5555, #ff8a8a)"
                  : "linear-gradient(90deg, #FFD700, #FFA726)",
                transition: "width 300ms linear",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.55, margin: "12px 0 12px" }}>
        {typeHint}
      </div>

      {/* Pair-upload row: mirrors the ready row but for photos. */}
      <div style={pairRow}>
        <UploadPill label="You" uploaded={myPhotoUploaded} />
        <div style={pairDivider} aria-hidden="true" />
        <UploadPill label={partnerName} uploaded={partnerPhotoUploaded} truncate />
      </div>

      {/* Pass #29: post-deadline force-CTA. Same shape as PairBuildScreen. */}
      {deadlineExpired && !myPhotoUploaded && (
        <div
          style={{
            marginBottom: 12, padding: "10px 14px",
            background: "rgba(255,90,60,.12)", border: "1px solid rgba(255,90,60,.45)",
            borderRadius: 8, color: "#ff9e80",
            fontSize: 12, fontWeight: 800, letterSpacing: 1, lineHeight: 1.5,
          }}
        >
          TIME{"’"}S UP. Take a photo and upload it now to keep the game moving.
        </div>
      )}
      {deadlineExpired && myPhotoUploaded && !partnerPhotoUploaded && (
        <div style={{ marginBottom: 12, fontSize: 11, color: "var(--textd)", letterSpacing: 1 }}>
          Time{"’"}s up. Waiting for: <span style={{ color: "var(--acc1)", fontWeight: 800 }}>{partnerName}</span>
        </div>
      )}

      {myPhotoUploaded ? (
        <div style={statusBox}>
          {"\u2713"} Your half uploaded.{" "}
          {partnerPhotoUploaded
            ? "Bridge complete!"
            : `Waiting on ${partnerName}\u2019s photo.`}
        </div>
      ) : (
        <button
          className="lb lb-yellow"
          onClick={() => setCameraOpen(true)}
          style={primaryButton}
        >
          {"\u{1F4F7}"} TAKE PHOTO
        </button>
      )}
      <InAppCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={async (dataUrl) => {
          setCameraOpen(false);
          try { await Promise.resolve(onPhotoCaptured(dataUrl)); } catch { /* parent handles errors */ }
        }}
        title="Bridge Photo"
        hint={`Place your ${typeLabel} build in front of the camera and capture it.`}
      />
    </Shell>
  );
}

// ── pieces ──

function Shell({ children, tone }: { children: React.ReactNode; tone: "accent" | "live" | "danger" }) {
  const border =
    tone === "danger"
      ? "1px solid rgba(255,90,90,0.35)"
      : tone === "live"
        ? "1px solid rgba(255,215,0,0.32)"
        : "1px solid rgba(255,215,0,0.22)";
  const shadow =
    tone === "danger"
      ? "0 6px 22px rgba(120,0,0,0.38)"
      : "0 6px 22px rgba(0,0,0,0.5)";
  return (
    <div
      style={{
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(12,12,28,0.96), rgba(6,6,18,0.96))",
        border,
        padding: "16px 16px 14px",
        boxShadow: shadow,
        marginTop: 10,
        animation: "fadeIn 240ms ease-out",
      }}
    >
      {children}
    </div>
  );
}

function Header({
  label, partnerName, tag, tagTone,
}: { label: string; partnerName: string; tag: string; tagTone: "accent" | "live" | "danger" }) {
  const toneBg =
    tagTone === "live"
      ? "linear-gradient(90deg, #FFD700, #FFA726)"
      : tagTone === "danger"
        ? "linear-gradient(90deg, #ff5555, #ff8a8a)"
        : "rgba(255,215,0,0.16)";
  const toneColor = tagTone === "live" || tagTone === "danger" ? "#1a1300" : "var(--acc1, #FFD700)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 10,
            letterSpacing: 2.5,
            color: "var(--textdd)",
            textTransform: "uppercase",
          }}
        >
          Your Bridge
        </div>
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 18,
            color: "white",
            letterSpacing: 1,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
            marginTop: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          With <strong style={{ color: "rgba(255,255,255,0.85)" }}>{partnerName}</strong>
        </div>
      </div>
      <span
        style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 9,
          letterSpacing: 1.6,
          padding: "5px 10px",
          borderRadius: 999,
          background: toneBg,
          color: toneColor,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxShadow: tagTone === "live" || tagTone === "danger"
            ? "0 2px 8px rgba(0,0,0,0.35)"
            : "none",
        }}
      >
        {tag}
      </span>
    </div>
  );
}

function ReadyPill({ label, ready, truncate }: { label: string; ready: boolean; truncate?: boolean }) {
  return (
    <div
      style={{
        ...pillShell,
        background: ready ? "rgba(105,240,174,0.14)" : "rgba(255,255,255,0.04)",
        border: ready ? "1px solid rgba(105,240,174,0.32)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: 999,
          background: ready ? "#69F0AE" : "rgba(255,255,255,0.25)",
          flexShrink: 0,
          boxShadow: ready ? "0 0 6px rgba(105,240,174,0.6)" : "none",
        }}
      />
      <span style={{ ...pillLabel, overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ ...pillStatus, color: ready ? "#a5f3c5" : "var(--textdd)" }}>
        {ready ? "READY" : "…"}
      </span>
    </div>
  );
}

function UploadPill({ label, uploaded, truncate }: { label: string; uploaded: boolean; truncate?: boolean }) {
  return (
    <div
      style={{
        ...pillShell,
        background: uploaded ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)",
        border: uploaded ? "1px solid rgba(255,215,0,0.32)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: 999,
          background: uploaded ? "#FFD700" : "rgba(255,255,255,0.25)",
          flexShrink: 0,
          boxShadow: uploaded ? "0 0 6px rgba(255,215,0,0.6)" : "none",
        }}
      />
      <span style={{ ...pillLabel, overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ ...pillStatus, color: uploaded ? "#FFE082" : "var(--textdd)" }}>
        {uploaded ? "\u2713 PHOTO" : "…"}
      </span>
    </div>
  );
}

// ── styles ──

const artRow: React.CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  margin: "12px 0 10px",
};

const artFrame: React.CSSProperties = {
  flexShrink: 0,
  padding: 8,
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const pairRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  marginBottom: 12,
};

const pairDivider: React.CSSProperties = {
  width: 1,
  height: 20,
  background: "rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const pillShell: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 8,
};

const pillLabel: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 11.5,
  color: "rgba(255,255,255,0.88)",
  fontWeight: 600,
};

const pillStatus: React.CSSProperties = {
  fontFamily: "'Black Han Sans', sans-serif",
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  flexShrink: 0,
};

const bodyText: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(255,255,255,0.75)",
  lineHeight: 1.55,
  margin: "10px 0 0",
};

const statusBox: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.82)",
  background: "rgba(255,255,255,0.04)",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  lineHeight: 1.5,
};

const helperText: React.CSSProperties = {
  fontSize: 11,
  color: "var(--textdd)",
  lineHeight: 1.5,
  marginTop: 12,
  textAlign: "center",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  fontSize: 13,
  letterSpacing: 2,
};
