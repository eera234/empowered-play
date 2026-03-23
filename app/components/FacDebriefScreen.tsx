"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import CardIcon from "./CardIcon";

const FAC_QUESTIONS = [
  {
    num: "1 OF 4",
    prompt: "Who built fastest? Who hesitated?",
    options: ["Everyone was similar", "Clear fast finishers", "Some struggled", "Big variation in pace"],
  },
  {
    num: "2 OF 4",
    prompt: "Who led placement? Who waited?",
    options: ["Shared equally", "One person led", "A few took charge", "Most waited to be told"],
  },
  {
    num: "3 OF 4",
    prompt: "Did the cards shift usual team dynamics?",
    options: ["Yes, noticeably", "Somewhat", "Not really", "Hard to tell"],
  },
  {
    num: "4 OF 4",
    prompt: "What surprised you?",
    options: ["Someone stepped up unexpectedly", "Usual leaders held back", "Team collaborated well", "Communication was harder than expected"],
  },
];

export default function FacDebriefScreen() {
  const { sessionId, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const debriefAnswers = useQuery(api.game.getDebriefAnswers, sessionId ? { sessionId } : "skip");
  const advancePhase = useMutation(api.game.advancePhase);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const nonFac = (players || []).filter((p) => !p.isFacilitator);

  // Check which players have submitted (have a "submitted" entry)
  const submittedPlayerIds = new Set(
    (debriefAnswers || [])
      .filter((a) => a.question === "submitted" && a.playerId)
      .map((a) => a.playerId!)
  );
  const allPlayersSubmitted = nonFac.length > 0 && nonFac.every((p) => submittedPlayerIds.has(p._id));

  function handleAdvance() {
    if (!sessionId) return;
    advancePhase({ sessionId });
    goTo("s-fac-live");
  }

  return (
    <div className="screen active stud-bg-subtle" id="s-fac-debrief">
      <BrandBar badge="FACILITATOR">
        <div style={{
          marginLeft: 6, background: "rgba(105,240,174,.15)", border: "1px solid rgba(105,240,174,.3)",
          color: "var(--acc4)", fontSize: 10, fontWeight: 900, letterSpacing: 1,
          padding: "3px 9px", borderRadius: 4, zIndex: 1, position: "relative",
        }}>
          DEBRIEF
        </div>
      </BrandBar>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, letterSpacing: 2, color: "var(--acc4)", marginBottom: 8 }}>
              YOUR OBSERVATIONS
            </div>
            <div style={{ fontSize: 13, color: "var(--textd)", lineHeight: 1.7 }}>
              Players are answering their own reflection questions right now. Use this time to capture what you observed during the session. These notes are for your eyes only.
            </div>
          </div>

          {/* Player summary — who had what card */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div className="slbl" style={{ marginBottom: 8 }}>CARD ASSIGNMENTS</div>
            {nonFac.map((p) => {
              const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
              return (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12 }}>
                  <span style={{ fontWeight: 800, color: "var(--text)", minWidth: 70 }}>{p.name}</span>
                  {card && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: card.color }}>
                      <CardIcon icon={card.icon} size={14} /> {card.title}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Observation prompts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAC_QUESTIONS.map((q, i) => (
              <div key={i} className="q-block">
                <div className="q-num">{q.num}</div>
                <div className="q-text">{q.prompt}</div>
                <div className="q-opts">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`q-opt${selections[i] === opt ? " sel" : ""}`}
                      onClick={() => setSelections((prev) => ({ ...prev, [i]: opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <textarea
                  className="q-ta"
                  rows={2}
                  placeholder="Additional notes (optional)..."
                  value={notes[i] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                  style={{ marginTop: 8 }}
                />
              </div>
            ))}
          </div>

          {/* Player submission status */}
          <div style={{ marginTop: 20, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
            <div className="slbl" style={{ marginBottom: 8 }}>PLAYER REFLECTIONS</div>
            {nonFac.map((p) => (
              <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ fontWeight: 800, color: "var(--text)", minWidth: 70 }}>{p.name}</span>
                {submittedPlayerIds.has(p._id) ? (
                  <span style={{ color: "var(--acc4)", fontSize: 11, fontWeight: 800 }}>{"\u2713"} submitted</span>
                ) : (
                  <span style={{ color: "var(--textd)", fontSize: 11 }}>answering...</span>
                )}
              </div>
            ))}
          </div>

          {!allPlayersSubmitted && (
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--acc1)", textAlign: "center", fontWeight: 800 }}>
              {submittedPlayerIds.size}/{nonFac.length} players have submitted
            </div>
          )}

          <button
            className={`lb ${allPlayersSubmitted ? "lb-yellow" : "lb-ghost"}`}
            disabled={!allPlayersSubmitted}
            onClick={handleAdvance}
            style={{ width: "100%", marginTop: 14 }}
          >
            REVEAL CONSTRAINTS
          </button>
        </div>
      </div>
    </div>
  );
}
