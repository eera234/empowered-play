"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Pass #17: silent auto-presence. Mounted once in GameProvider whenever a
// playerId exists. Writes a lastSeenAt heartbeat to Convex every 3 seconds
// while the tab is visible, stops while hidden, and fires a one-shot
// markLeaving on pagehide / beforeunload so the server sees tab-close
// immediately (instead of waiting out the 8s stale window).
//
// This is invisible to the user. No buttons, no indicators. The player just
// plays; if their tab closes, the game detects it within ~1 second (pagehide)
// or 8 seconds (stale threshold) and they drop out of every gate. Rejoining
// the same session with the same playerId restores them instantly because
// nothing is deleted.

const HEARTBEAT_INTERVAL_MS = 3_000;

export function usePresence(playerId: Id<"players"> | null) {
  const updateLastSeen = useMutation(api.game.updateLastSeen);
  const markLeaving = useMutation(api.game.markLeaving);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playerId) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    function sendBeat() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      updateLastSeen({ playerId: playerId! }).catch(() => {});
    }

    function startInterval() {
      if (intervalRef.current != null) return;
      intervalRef.current = window.setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);
    }
    function stopInterval() {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        sendBeat();
        startInterval();
      } else {
        stopInterval();
      }
    }

    function onPageHide() {
      stopInterval();
      // Best-effort: fire a leaving ping so the server doesn't wait out the
      // stale window. If the browser cuts this short, the 8s stale threshold
      // is the fallback.
      markLeaving({ playerId: playerId! }).catch(() => {});
    }

    // Initial beat + start
    sendBeat();
    startInterval();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      cancelled = true;
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [playerId, updateLastSeen, markLeaving]);
}
