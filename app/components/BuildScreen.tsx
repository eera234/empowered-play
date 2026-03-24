"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";
import CardIcon from "./CardIcon";

export default function BuildScreen() {
  const { myCard, goTo } = useGame();
  const buildMinutes = myCard?.buildTime ?? 15;
  const [secs, setSecs] = useState(buildMinutes * 60);
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
  const totalSecs = buildMinutes * 60;
  const circumference = 2 * Math.PI * 80;
  const progress = secs / totalSecs;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="screen active" id="s-build">
      <BrandBar>
        <PhaseBar current={2} />
      </BrandBar>
      <div className="build-inner">
        {myCard && (
          <div className="card-reminder" style={{ borderColor: myCard.color + "66" }}>
            <div className="cr-icon" style={{ color: myCard.color }}><CardIcon icon={myCard.icon} size={24} /></div>
            <div className="cr-body">
              <div className="cr-title" style={{ color: myCard.color }}>{myCard.title}</div>
              <div className="cr-rule">{myCard.shapeHint}</div>
            </div>
          </div>
        )}

        <div className="timer-frame">
          <div className="timer-studs">
            <div className="lego-stud-3d" />
            <div className="lego-stud-3d" />
            <div className="lego-stud-3d" />
            <div className="lego-stud-3d" />
            <div className="lego-stud-3d" />
          </div>
          <div className="timer-progress-ring">
            <svg viewBox="0 0 180 180">
              <circle className="ring-bg" cx="90" cy="90" r="80" />
              <circle
                className={`ring-fg${urgent ? " urgent" : ""}`}
                cx="90" cy="90" r="80"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className={`timer-value${urgent ? " urgent" : ""}`}>
              {m}:{s < 10 ? "0" : ""}{s}
            </div>
          </div>
          <div className="timer-sub" style={{ marginTop: 12 }}>BUILD ALONE. FOLLOW YOUR SHAPE.</div>
        </div>

        <div className="rules-grid">
          <div className="rule-chip"><span className="rule-step-num">01</span>You are building alone. No one can see your progress.</div>
          <div className="rule-chip"><span className="rule-step-num">02</span>Follow your shape constraint exactly.</div>
          <div className="rule-chip"><span className="rule-step-num">03</span>There is no wrong build. The city needs all of you.</div>
          <div className="rule-chip"><span className="rule-step-num">04</span>Keep your constraint secret until the reveal.</div>
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
