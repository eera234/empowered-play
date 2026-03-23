"use client";

import { ReactNode } from "react";
import { useGame } from "../GameContext";

interface BrandBarProps {
  badge?: string;
  backTo?: string;
  children?: ReactNode;
}

export default function BrandBar({ badge, backTo, children }: BrandBarProps) {
  const { goTo } = useGame();

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
      {backTo && (
        <div className="b-right">
          <button className="back-btn" onClick={() => goTo(backTo)}>
            &larr; back
          </button>
        </div>
      )}
    </div>
  );
}
