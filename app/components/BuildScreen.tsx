"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";

export default function BuildScreen() {
  const { myCard, goTo } = useGame();
  const [secs, setSecs] = useState(15 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goTo("s-upload");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [goTo]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs <= 120;

  return (
    <div className="screen active" id="s-build">
      <BrandBar>
        <PhaseBar current={2} />
      </BrandBar>
      <div className="build-inner">
        <div className="scen-box">
          <div className="scen-lbl">THE FLOODED CITY</div>
          <div className="scen-text">
            The old city is gone. Use your LEGO pieces to build your district. Your constraint card
            is your only rule. The city only survives if every district connects.
          </div>
        </div>

        {myCard && (
          <div className="card-reminder" style={{ borderColor: myCard.color + "66" }}>
            <div className="cr-icon">{myCard.icon}</div>
            <div className="cr-body">
              <div className="cr-title" style={{ color: myCard.color }}>{myCard.title}</div>
              <div className="cr-rule">{myCard.rule}</div>
            </div>
          </div>
        )}

        <div className={`timer-big${urgent ? " urgent" : ""}`}>
          {m}:{s < 10 ? "0" : ""}{s}
        </div>
        <div className="timer-sub">BUILD IN SILENCE &mdash; HANDS SPEAK FIRST</div>

        <div className="rules-grid">
          <div className="rule-chip"><div className="r-pip" style={{ background: "var(--acc1)" }} />Build silently. No talking until city map.</div>
          <div className="rule-chip"><div className="r-pip" style={{ background: "var(--acc3)" }} />Follow your constraint card exactly.</div>
          <div className="rule-chip"><div className="r-pip" style={{ background: "var(--acc4)" }} />There is no wrong build. The city needs all of you.</div>
          <div className="rule-chip"><div className="r-pip" style={{ background: "var(--acc2)" }} />Keep your constraint secret until the reveal.</div>
        </div>

        <button
          className="lb lb-ghost"
          onClick={() => goTo("s-upload")}
          style={{ fontSize: 13, padding: "10px 22px" }}
        >
          Finished early? Upload your district &rarr;
        </button>
      </div>
    </div>
  );
}
