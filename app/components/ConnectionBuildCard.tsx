"use client";

import React, { useEffect, useState } from "react";
import ConnectionTypeArt, { ConnectionTypeKind } from "./ConnectionTypeArt";
import InAppCamera from "./InAppCamera";

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
  expired: boolean;
  // callbacks
  onReady: () => Promise<void> | void;
  onPhotoCaptured: (dataUrl: string) => Promise<void> | void;
  onExpire: () => Promise<void> | void;
}

// Full-lifecycle card shown for each non-built connection a player is on.
// Phases:
//   (1) Type reveal + ready gate — both sides tap "I'm ready to build".
//   (2) 90s build window — camera button, countdown, waiting state.
//   (3) Expiry — re-request instructions.
// Parent filters out built rows; this card never renders for built=true.
export default function ConnectionBuildCard(p: ConnectionBuildCardProps) {
  const {
    partnerName, typeId, typeLabel, typeHint, theme,
    amSideA, aReady, bReady, buildStartedAt,
    myPhotoUploaded, partnerPhotoUploaded, expired,
    onReady, onPhotoCaptured, onExpire,
  } = p;

  const myReady = amSideA ? aReady : bReady;
  const theirReady = amSideA ? bReady : aReady;
  const [cameraOpen, setCameraOpen] = useState(false);

  // 90s countdown after buildStartedAt is stamped. Ticks every 250ms.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!buildStartedAt || expired) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [buildStartedAt, expired]);

  const deadline = buildStartedAt ? buildStartedAt + 90_000 : undefined;
  const msLeft = deadline ? Math.max(0, deadline - now) : undefined;
  const secondsLeft = msLeft !== undefined ? Math.ceil(msLeft / 1000) : undefined;

  // Fire the expire mutation exactly once when we cross zero with no uploads.
  const firedExpireRef = React.useRef(false);
  useEffect(() => {
    if (
      !firedExpireRef.current
      && msLeft === 0
      && !myPhotoUploaded
      && !partnerPhotoUploaded
      && !expired
    ) {
      firedExpireRef.current = true;
      Promise.resolve(onExpire()).catch(() => {});
    }
  }, [msLeft, myPhotoUploaded, partnerPhotoUploaded, expired, onExpire]);

  // ─── Expired view ───
  if (expired) {
    return (
      <Shell tone="danger">
        <Header label={typeLabel} partnerName={partnerName} tag="EXPIRED" tagTone="danger" />
        <p style={bodyText}>
          Time&rsquo;s up on this bridge. Tap your district, then your partner&rsquo;s, to request a new attempt.
        </p>
      </Shell>
    );
  }

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
          When both partners tap ready, a 90-second timer starts and the camera unlocks on both sides.
        </div>
      </Shell>
    );
  }

  // ─── Phase 2: build window ───
  const timerLabel = secondsLeft !== undefined
    ? `0:${String(secondsLeft).padStart(2, "0")}`
    : "0:90";
  const urgent = (secondsLeft ?? 90) <= 15;
  const timerColor = urgent ? "#ff5555" : "var(--acc1, #FFD700)";
  const progressPct = msLeft !== undefined
    ? Math.max(0, Math.min(100, (msLeft / 90_000) * 100))
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
