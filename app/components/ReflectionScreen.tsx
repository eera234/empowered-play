"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { REFLECTION_PROMPTS, SCENARIOS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { toast } from "sonner";

// Dedicated reflection phase sitting between vote and complete. Each player
// answers three open-ended prompts that get persisted to debrief_answers so
// the facilitator can surface them in the debrief discussion.
export default function ReflectionScreen() {
  const { sessionId, sessionCode, playerId, role, scenario } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const answers = useQuery(api.game.getDebriefAnswers, sessionId ? { sessionId } : "skip");
  const submitDebrief = useMutation(api.game.submitDebrief);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

  const isFacilitator = role === "facilitator";
  const scenarioId = scenario || session?.scenario || "rising_tides";
  const scenarioData = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
  const me = nonFac.find((p) => p._id === playerId);

  // Tag reflection answers so they don't collide with the old-flow debrief
  // answers table in the facilitator dashboard.
  const promptKey = (q: string) => `[reflection] ${q}`;

  // Which prompts have I already submitted? Used to disable the textarea + submit.
  const myAnswered = useMemo(() => {
    const set = new Set<string>();
    if (!me || !answers) return set;
    for (const a of answers) {
      if (a.playerId === me._id && a.question.startsWith("[reflection] ")) {
        set.add(a.question.replace("[reflection] ", ""));
      }
    }
    return set;
  }, [answers, me]);

  // Draft state per prompt (local only until submit).
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  async function handleSubmit(idx: number, prompt: string) {
    if (!sessionId || !me) return;
    const text = (drafts[idx] ?? "").trim();
    if (!text) {
      toast("Write something first");
      return;
    }
    try {
      setSubmitting(idx);
      await submitDebrief({
        sessionId,
        playerId: me._id,
        question: promptKey(prompt),
        answer: text,
      });
      toast("Answer saved");
    } catch {
      toast("Couldn't save");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAdvance() {
    if (!sessionId) return;
    await advanceNewPhase({ sessionId });
  }

  // Counts per prompt across all non-facilitator players. Facilitators need to
  // know when the group has landed so they can pace the discussion.
  function answerCount(prompt: string) {
    if (!answers) return 0;
    const tag = promptKey(prompt);
    const who = new Set<string>();
    for (const a of answers) {
      if (a.question === tag && a.playerId) who.add(String(a.playerId));
    }
    return who.size;
  }

  const isLoading = session === undefined || players === undefined || answers === undefined;

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
        <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--textd)" }}>
          Loading reflection{"\u2026"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
      <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />

      {/* Header */}
      <div style={{
        textAlign: "center", padding: "16px 14px",
        background: "linear-gradient(180deg, rgba(147,51,234,.10), transparent)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
          letterSpacing: 2.5, color: "var(--textd)", textTransform: "uppercase",
        }}>
          {scenarioData.title} {"\u00B7"} Debrief
        </div>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 26, letterSpacing: 2,
          color: "#B388FF", marginTop: 4,
        }}>
          REFLECTION
        </div>
        <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 6, maxWidth: 520, margin: "6px auto 0" }}>
          Before you celebrate, take a minute. What did you notice about yourself and your team?
        </div>
      </div>

      {/* Prompts */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
        {REFLECTION_PROMPTS.map((prompt, idx) => {
          const submitted = myAnswered.has(prompt);
          const count = answerCount(prompt);
          const draft = drafts[idx] ?? "";

          return (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,.03)",
                border: `1px solid ${submitted ? "rgba(105,240,174,.35)" : "var(--border)"}`,
                borderRadius: "var(--brick-radius)",
                padding: 14, marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: "50%",
                  background: submitted ? "var(--acc4)" : "rgba(147,51,234,.2)",
                  color: submitted ? "#0a0a12" : "#B388FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 13,
                }}>
                  {submitted ? "\u2713" : idx + 1}
                </div>
                <div style={{
                  flex: 1, fontSize: 13, lineHeight: 1.5, color: "white", fontWeight: 700,
                }}>
                  {prompt}
                </div>
              </div>

              {isFacilitator ? (
                <div style={{
                  fontSize: 11, color: "var(--textd)", fontStyle: "italic",
                  padding: "8px 0 0", borderTop: "1px dashed var(--border)",
                }}>
                  {count}/{nonFac.length} players have answered. Read aloud together when the group is ready.
                </div>
              ) : submitted ? (
                <div style={{
                  fontSize: 12, color: "var(--acc4)", fontStyle: "italic",
                  padding: "8px 10px",
                  background: "rgba(105,240,174,.06)",
                  borderRadius: 6,
                }}>
                  Saved. {count} of {nonFac.length} teammates have landed here too.
                </div>
              ) : (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [idx]: e.target.value }))}
                    placeholder="Take your time. Write like you're writing for yourself."
                    rows={3}
                    style={{
                      width: "100%", resize: "vertical", minHeight: 72,
                      background: "var(--bg1)", color: "white",
                      border: "1px solid var(--border)", borderRadius: 8,
                      padding: "10px 12px", fontSize: 13, lineHeight: 1.5,
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  />
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 8, gap: 8,
                  }}>
                    <div style={{ fontSize: 11, color: "var(--textd)" }}>
                      {count} of {nonFac.length} teammates answered
                    </div>
                    <button
                      className="lb lb-yellow"
                      style={{ fontSize: 11, padding: "7px 14px" }}
                      disabled={submitting === idx || !draft.trim()}
                      onClick={() => handleSubmit(idx, prompt)}
                    >
                      {submitting === idx ? "SAVING\u2026" : "SAVE ANSWER"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        background: "rgba(255,255,255,.02)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 12, color: "var(--textd)" }}>
          {me
            ? `${myAnswered.size}/${REFLECTION_PROMPTS.length} of your reflections saved`
            : "Spectating"}
        </div>
        {isFacilitator ? (
          <button
            className="lb lb-green"
            style={{ fontSize: 11, padding: "8px 14px" }}
            onClick={handleAdvance}
          >
            CELEBRATE {"\u2192"}
          </button>
        ) : (
          <div style={{ fontSize: 11, color: "var(--textd)" }}>
            Waiting for facilitator to close the debrief
          </div>
        )}
      </div>
    </div>
  );
}
