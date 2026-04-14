"use client";

import { ReactNode } from "react";
import { useGame } from "../GameContext";

interface BrandBarProps {
  badge?: string;
  backTo?: string;
  children?: ReactNode;
}

export default function BrandBar({ badge, backTo, children }: BrandBarProps) {
  const { sessionId, set, goTo } = useGame();

  function leaveSession() {
    if (!confirm("Leave this session? You can rejoin with the same code and name.")) return;
    set({ role: null, name: "", sessionCode: "", sessionId: null, playerId: null, scenario: "", screen: "s-entry" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("empowered-play-session");
    }
  }

  return (
    <div className="brand-bar">
      <div className="b-studs">
        <div className="lego-stud-3d" />
        <div className="lego-stud-3d" />
        <div className="lego-stud-3d" />
      </div>
      <div className="b-name" onClick={() => goTo("s-entry")}>
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
          <button className="back-btn" onClick={leaveSession} style={{ opacity: 0.6 }}>
            leave
          </button>
        )}
      </div>
    </div>
  );
}
