"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";

/*
  Debrief now comes BEFORE the constraint reveal.
  Questions are reflective — players guess who had what,
  reflect on dynamics, then the big reveal happens next.
*/

const MULTI_QUESTIONS = [
  {
    num: "QUESTION 1 OF 4",
    text: "During the map phase, whose district felt most essential to the city\u2019s success?",
    type: "player-pick" as const,
  },
  {
    num: "QUESTION 2 OF 4",
    text: "Who do you think had the most restrictive constraint?",
    type: "player-pick" as const,
  },
  {
    num: "QUESTION 3 OF 4",
    text: "Did you feel your constraint gave you more power or less power in the city?",
    type: "options" as const,
    options: ["Much more power", "Slightly more", "Neutral", "Slightly less", "Much less power"],
  },
];

export default function DebriefScreen() {
  const { sessionId, playerId, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const submitDebrief = useMutation(api.game.submitDebrief);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nonFac = (players || []).filter((p) => !p.isFacilitator);

  function pickOption(qIdx: number, value: string) {
    setSelections((prev) => ({ ...prev, [qIdx]: value }));
  }

  async function handleSubmit() {
    if (!sessionId || !playerId) return;

    // Submit all answers with playerId
    for (const [qIdx, answer] of Object.entries(selections)) {
      await submitDebrief({
        sessionId,
        playerId,
        question: `q${parseInt(qIdx) + 1}`,
        answer,
      });
    }

    if (freeText.trim()) {
      await submitDebrief({
        sessionId,
        playerId,
        question: "q4",
        answer: freeText.trim(),
      });
    }

    // Mark as submitted with a special "done" entry
    await submitDebrief({
      sessionId,
      playerId,
      question: "submitted",
      answer: "true",
    });

    setSubmitted(true);
    toast("Responses submitted \u2713");
  }

  return (
    <div className="screen active stud-bg-subtle" id="s-debrief">
      <BrandBar backTo="s-city">
        <PhaseBar current={4} />
      </BrandBar>
      <div className="deb-inner">
        <div className="deb-intro">
          <div className="deb-studs">
            <div className="deb-stud" />
            <div className="deb-stud" />
            <div className="deb-stud" />
          </div>
          <div className="deb-lbl">BEFORE THE REVEAL</div>
          <div className="deb-text">
            The city is built. Before we reveal the cards, reflect on what you observed.{" "}
            <strong>There are no wrong answers.</strong>
          </div>
        </div>

        {!submitted ? (
          <>
            <div className="q-blocks">
              {MULTI_QUESTIONS.map((q, qi) => (
                <div key={qi} className="q-block">
                  <div className="q-num">{q.num}</div>
                  <div className="q-text">{q.text}</div>

                  {q.type === "player-pick" && (
                    <div className="q-player-grid">
                      {nonFac.map((p) => (
                        <div
                          key={p._id}
                          className={`q-player-chip${selections[qi] === p.name ? " sel" : ""}`}
                          onClick={() => pickOption(qi, p.name)}
                        >
                          <div className="qpc-avatar" style={{
                            background: p.cardIndex != null ? CARDS[p.cardIndex].color + "33" : "rgba(255,255,255,.08)",
                          }}>
                            {p.name[0].toUpperCase()}
                          </div>
                          <div className="qpc-name">{p.name}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "options" && q.options && (
                    <div className="q-opts">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`q-opt${selections[qi] === opt ? " sel" : ""}`}
                          onClick={() => pickOption(qi, opt)}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="q-block">
                <div className="q-num">QUESTION 4 OF 4</div>
                <div className="q-text">
                  If you could change one thing about how the team built the city together,
                  what would it be?
                </div>
                <textarea
                  className="q-ta"
                  rows={3}
                  placeholder="Write freely, this is anonymous..."
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
              SUBMIT REFLECTIONS &rarr;
            </button>
          </>
        ) : (
          <div className="deb-submitted">
            <div className="deb-submitted-icon">
              <div className="deb-stud" />
            </div>
            <div className="deb-submitted-title">REFLECTIONS RECORDED</div>
            <div className="deb-submitted-text">
              Waiting for all architects to submit before the big reveal...
            </div>
            <button
              className="lb lb-red"
              onClick={() => goTo("s-reveal")}
              style={{ width: "100%", maxWidth: 400 }}
            >
              PROCEED TO REVEAL &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
