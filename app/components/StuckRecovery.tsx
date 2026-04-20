"use client";

import { useEffect, useState } from "react";
import { useGame } from "../GameContext";

// Always-visible escape hatch. The BrandBar LEAVE button is the primary exit,
// but if a user ends up on a broken or loading screen where the brand bar isn't
// rendered — or if they're panicking and can't find it — this floating button
// is the guaranteed last resort. Collapsed by default; expands into a small
// recovery panel with a clear Leave action plus a "hard reset" that reloads
// the tab (for the Safari-cached-JS-bundle case).
export default function StuckRecovery() {
  const { sessionId, leaveSession } = useGame();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Only show when there's an active session to escape from. Before mount we
  // render nothing to avoid an SSR/hydration mismatch (sessionId flips from
  // null → restored value inside a client-only useEffect).
  if (!mounted || !sessionId) return null;

  const collapsedStyle: React.CSSProperties = {
    position: "fixed",
    right: 12,
    bottom: 12,
    zIndex: 9999,
    padding: "8px 12px",
    borderRadius: 20,
    background: "rgba(15,15,30,.85)",
    border: "1px solid rgba(255,255,255,.15)",
    color: "rgba(255,255,255,.6)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    boxShadow: "0 4px 12px rgba(0,0,0,.4)",
    fontFamily: "'Nunito', sans-serif",
  };

  if (!open) {
    return (
      <button
        style={collapsedStyle}
        onClick={() => setOpen(true)}
        aria-label="Open recovery panel"
      >
        ? stuck
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        width: 260,
        maxWidth: "calc(100vw - 24px)",
        background: "rgba(10,10,20,.95)",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 8px 28px rgba(0,0,0,.6)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        fontFamily: "'Nunito', sans-serif",
        color: "white",
        animation: "fadeIn .2s ease-out",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 11, letterSpacing: 2, color: "var(--acc1)",
        }}>
          STUCK?
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,.5)",
            fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1,
          }}
          aria-label="Close recovery panel"
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", lineHeight: 1.5, marginBottom: 10 }}>
        If you can't move forward, use one of these to reset this device. The game on the server isn't affected — you can rejoin with the same code.
      </div>

      <button
        onClick={() => leaveSession()}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "rgba(255,215,0,.12)",
          border: "1.5px solid rgba(255,215,0,.45)",
          borderRadius: 8,
          color: "var(--acc1)",
          fontSize: 12, fontWeight: 900, letterSpacing: 1,
          textTransform: "uppercase", cursor: "pointer",
          marginBottom: 8,
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        Leave session
      </button>

      <button
        onClick={() => leaveSession({ reload: true })}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "rgba(244,67,54,.1)",
          border: "1.5px solid rgba(244,67,54,.4)",
          borderRadius: 8,
          color: "#ff8a80",
          fontSize: 12, fontWeight: 900, letterSpacing: 1,
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "'Nunito', sans-serif",
        }}
        title="Wipes local state and fully reloads the page"
      >
        Hard reset
      </button>

      <div style={{
        fontSize: 9, color: "rgba(255,255,255,.35)", lineHeight: 1.5,
        marginTop: 10, textAlign: "center",
      }}>
        Tip: append <code style={{ background: "rgba(255,255,255,.08)", padding: "1px 4px", borderRadius: 3 }}>?reset=1</code> to the URL to wipe this device from any browser.
      </div>
    </div>
  );
}
