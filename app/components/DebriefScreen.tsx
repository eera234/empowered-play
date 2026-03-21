"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

const QUESTIONS = [
  {
    num: "QUESTION 1 OF 3",
    text: "Whose constraint surprised you most \u2014 and would you have treated them differently if you'd known it?",
    options: ["Yes, completely", "Somewhat", "Not really", "I already sensed it"],
  },
  {
    num: "QUESTION 2 OF 3",
    text: "Without knowing anyone's constraint, did the layout still reflect your team's real dynamics?",
    options: ["Very much so", "A little", "Not at all", "Hard to say"],
  },
];

export default function DebriefScreen() {
  const { sessionId, goTo } = useGame();
  const submitDebrief = useMutation(api.game.submitDebrief);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [freeText, setFreeText] = useState("");

  function pickOption(qIdx: number, optIdx: number) {
    setSelections((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  async function handleSubmit() {
    // Submit free text answer
    if (freeText.trim()) {
      if (!sessionId) return;
      await submitDebrief({
        sessionId,
        question: "q3",
        answer: freeText.trim(),
      });
    }
    toast("Responses submitted \u2713");
    goTo("s-complete");
  }

  return (
    <div className="screen active" id="s-debrief">
      <BrandBar backTo="s-reveal">
        <div
          style={{
            marginLeft: 6,
            background: "rgba(255,82,82,.18)",
            border: "1px solid rgba(255,82,82,.35)",
            color: "var(--acc3)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 1,
            padding: "3px 9px",
            borderRadius: 4,
            zIndex: 1,
            position: "relative",
          }}
        >
          DEBRIEF
        </div>
      </BrandBar>
      <div className="deb-inner">
        <div className="deb-intro">
          <div className="deb-lbl">WHAT JUST HAPPENED</div>
          <div className="deb-text">
            Every constraint card was designed so that{" "}
            <strong>no single person could complete the city alone</strong>. Seniority, confidence,
            title &mdash; none of it mattered structurally. The Bridge Keeper needed the Centre Node.
            The Last Builder needed everyone.
            <br /><br />
            The question now: <strong>what would it take to build your real team this way?</strong>
          </div>
        </div>
        <div className="q-blocks">
          {QUESTIONS.map((q, qi) => (
            <div key={qi} className="q-block">
              <div className="q-num">{q.num}</div>
              <div className="q-text">{q.text}</div>
              <div className="q-opts">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`q-opt${selections[qi] === oi ? " sel" : ""}`}
                    onClick={() => pickOption(qi, oi)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="q-block">
            <div className="q-num">QUESTION 3 OF 3</div>
            <div className="q-text">
              Your constraint is a metaphor. What hidden thing do you bring to your real team that
              others might not see yet?
            </div>
            <textarea
              className="q-ta"
              rows={3}
              placeholder="Write freely \u2014 anonymous\u2026"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
          </div>
        </div>
        <button
          className="lb lb-yellow"
          onClick={handleSubmit}
          style={{ width: "100%", maxWidth: 560 }}
        >
          SUBMIT &rarr;
        </button>
      </div>
    </div>
  );
}
