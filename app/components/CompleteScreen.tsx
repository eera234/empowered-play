"use client";

import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

export default function CompleteScreen() {
  const { goTo } = useGame();

  return (
    <div className="screen active" id="s-complete">
      <BrandBar>
        <div
          style={{
            marginLeft: 6,
            background: "rgba(255,215,0,.2)",
            border: "1px solid rgba(255,215,0,.4)",
            color: "var(--acc1)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1,
            padding: "3px 9px",
            borderRadius: 4,
            zIndex: 1,
            position: "relative",
          }}
        >
          COMPLETE
        </div>
      </BrandBar>
      <div className="comp-inner">
        <div className="comp-badge">🏆</div>
        <div className="comp-title">THE CITY STANDS</div>
        <div className="comp-sub">
          Every district connected. Every constraint met. Your team just built something no single
          person could have built alone.
        </div>
        <div className="comp-note">
          <div className="comp-note-lbl">FACILITATOR &mdash; BEFORE YOU CLOSE</div>
          <div className="comp-note-text">
            Screenshot the city map. The layout &mdash; who placed where, who was central, who ended
            up at the edges &mdash; often maps closely to your team&apos;s real communication
            patterns. It&apos;s data worth keeping.
            <br /><br />
            <strong>The real question for your next session:</strong> what would it look like if The
            Last Builder placed first?
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="lb lb-yellow" onClick={() => goTo("s-entry")}>
            &larr; Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
