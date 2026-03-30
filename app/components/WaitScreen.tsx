"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SCENARIOS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { SCENARIO_ILLUSTRATIONS } from "./EntryScreen";

export default function WaitScreen() {
  const { name, sessionId, sessionCode, playerId } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const voteScenario = useMutation(api.game.voteScenario);

  const otherPlayers = (players || []).filter((p) => !p.isFacilitator && p.name !== name);
  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  const me = (players || []).find((p) => p._id === playerId);
  const myVote = me?.scenarioVote || null;
  const scenarioSet = session?.scenario && session.scenario !== "";

  // Vote counts
  const voteCounts: Record<string, number> = {};
  nonFac.forEach((p) => { if (p.scenarioVote) voteCounts[p.scenarioVote] = (voteCounts[p.scenarioVote] || 0) + 1; });

  async function handleVote(scenarioId: string) {
    if (!playerId) return;
    await voteScenario({ playerId, scenarioId });
  }

  // Scenario not set yet — show voting
  if (!scenarioSet) {
    return (
      <div className="screen active" id="s-wait">
        <BrandBar />
        <div
          className="scenario-picker-wrap"
          style={{
            background: myVote
              ? `radial-gradient(ellipse at 50% 50%, ${SCENARIOS.find((s) => s.id === myVote)?.color || "transparent"}30 0%, ${SCENARIOS.find((s) => s.id === myVote)?.color || "transparent"}18 35%, ${SCENARIOS.find((s) => s.id === myVote)?.color || "transparent"}08 60%, transparent 85%)`
              : undefined,
            transition: "background .6s ease",
          }}
        >
          <div className="scenario-picker-header">
            <div className="scenario-picker-title">VOTE FOR YOUR WORLD</div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4 }}>
              Tap the scenario you want to play
            </div>
          </div>
          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const Illust = SCENARIO_ILLUSTRATIONS[s.id];
              const isMyVote = myVote === s.id;
              const votes = voteCounts[s.id] || 0;
              return (
                <div
                  key={s.id}
                  className={`scenario-card${isMyVote ? " selected" : ""}`}
                  style={{ "--sc-color": s.color } as React.CSSProperties}
                  onClick={() => handleVote(s.id)}
                >
                  <div className="sc-illustration-wrap">
                    {Illust && <Illust />}
                    {isMyVote && <div className="sc-selected-badge">YOUR VOTE</div>}
                    {votes > 0 && !isMyVote && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: s.color, color: "#fff",
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 10, letterSpacing: 1.5,
                        padding: "4px 10px", borderRadius: 4,
                      }}>
                        {votes} VOTE{votes !== 1 ? "S" : ""}
                      </div>
                    )}
                  </div>
                  <div className="sc-info">
                    <div className="sc-title" style={{ color: s.color }}>{s.title.toUpperCase()}</div>
                    <div className="sc-tagline">{s.tagline}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {myVote && (
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--textd)" }}>
              Vote cast. Waiting for everyone to vote...
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 8 }}>
              {otherPlayers.map((p) => (
                <div key={p._id} style={{
                  padding: "4px 10px", fontSize: 11, borderRadius: 16,
                  background: p.scenarioVote ? "rgba(105,240,174,.08)" : "rgba(255,255,255,.04)",
                  border: p.scenarioVote ? "1px solid rgba(105,240,174,.2)" : "1px solid var(--border)",
                  color: p.scenarioVote ? "var(--acc4)" : "var(--textd)",
                }}>
                  {p.name} {p.scenarioVote ? "✓" : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Scenario confirmed — waiting for cards
  const chosenScenario = SCENARIOS.find((s) => s.id === session?.scenario);
  return (
    <div className="screen active" id="s-wait">
      <BrandBar />
      <div className="wait-wrap">
        <div className="wait-code-box">
          <div className="wc-lbl">YOU ARE IN</div>
          <div className="wc-name">{name}</div>
          <div className="wc-sub">
            Playing{" "}
            <strong style={{ color: chosenScenario?.color }}>
              {chosenScenario?.title}
            </strong>
          </div>
        </div>
        <div className="wait-players">
          {otherPlayers.map((p) => (
            <div key={p._id} className="wp-chip">
              <div className="dot" />
              {p.name}
            </div>
          ))}
        </div>
        <div className="wait-status">Waiting for facilitator to assign cards...</div>
      </div>
    </div>
  );
}
