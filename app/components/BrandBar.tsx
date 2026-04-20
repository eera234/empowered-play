"use client";

import { ReactNode } from "react";
import { useGame } from "../GameContext";

interface BrandBarProps {
  badge?: string;
  backTo?: string;
  children?: ReactNode;
}

export default function BrandBar({ badge, backTo, children }: BrandBarProps) {
  const { sessionId, goTo, leaveSession } = useGame();

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
