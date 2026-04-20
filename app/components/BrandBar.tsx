"use client";

import { ReactNode, useEffect, useState } from "react";
import { useGame } from "../GameContext";
import { isMuted, setMuted, subscribe, unlockAudio } from "../../lib/sound";

interface BrandBarProps {
  badge?: string;
  backTo?: string;
  children?: ReactNode;
}

export default function BrandBar({ badge, backTo, children }: BrandBarProps) {
  const { sessionId, goTo, leaveSession } = useGame();
  const [muted, setLocalMuted] = useState(false);

  // Sync with the sound module — mute state lives there so it can also be read
  // from non-React code (playSound bails early when muted). Starts as false on
  // first render to avoid SSR hydration mismatch; real value reads after mount.
  useEffect(() => {
    setLocalMuted(isMuted());
    return subscribe(() => setLocalMuted(isMuted()));
  }, []);

  function handleMuteToggle() {
    unlockAudio(); // toggling is a user gesture; safe place to unlock on iOS
    setMuted(!isMuted());
  }

  // Clicking the logo should never silently navigate away from an active session —
  // that creates ghost state where refresh puts you right back. If a session is
  // active, trigger the leave flow; otherwise just go home.
  function handleBrandClick() {
    if (sessionId) {
      leaveSession();
    } else {
      goTo("s-entry");
    }
  }

  return (
    <div className="brand-bar">
      <div className="b-studs">
        <div className="lego-stud-3d" />
        <div className="lego-stud-3d" />
        <div className="lego-stud-3d" />
      </div>
      <div className="b-name" onClick={handleBrandClick}>
        (Em)Powered Play
      </div>
      {badge && <div className="fac-badge">{badge}</div>}
      {children}
      <div className="b-right">
        {backTo && (
          <button className="back-btn" onClick={() => goTo(backTo)}>
            back
          </button>
        )}
        <button
          className="back-btn"
          onClick={handleMuteToggle}
          style={{
            background: "rgba(0,0,0,.35)",
            fontWeight: 900,
            letterSpacing: ".5px",
            padding: "4px 8px",
            minWidth: 32,
          }}
          title={muted ? "Sound off \u2014 tap to enable" : "Sound on \u2014 tap to mute"}
          aria-label={muted ? "Unmute sound" : "Mute sound"}
        >
          {muted ? "\u{1F507}" : "\u{1F50A}"}
        </button>
        {sessionId && (
          <button
            className="back-btn"
            onClick={() => leaveSession()}
            style={{
              background: "rgba(0,0,0,.45)",
              fontWeight: 900,
              letterSpacing: ".5px",
            }}
            title="Leave this session (you can rejoin with the same code)"
          >
            LEAVE
          </button>
        )}
      </div>
    </div>
  );
}
