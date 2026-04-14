"use client";

import { useState } from "react";
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
  const me = (players || []).find((p) => p._id === playerId);
  const myVote = me?.scenarioVote || null;
  const scenarioSet = session?.scenario && session.scenario !== "";

  // Local selection (before submitting)
  const [localPick, setLocalPick] = useState<string | null>(null);
  const hasSubmitted = !!myVote;

  // The active selection is either the submitted vote or the local pick
  const activePick = hasSubmitted ? myVote : localPick;

  // Vote counts (only submitted votes from Convex)
  const allPlayersInSession = (players || []);
  const voteCounts: Record<string, number> = {};
  allPlayersInSession.forEach((p) => { if (p.scenarioVote) voteCounts[p.scenarioVote] = (voteCounts[p.scenarioVote] || 0) + 1; });

  async function submitVote() {
    if (!playerId || !localPick) return;
    await voteScenario({ playerId, scenarioId: localPick });
  }

  async function changeVote() {
    if (!playerId) return;
    // Clear the vote in Convex
    await voteScenario({ playerId, scenarioId: "" });
    setLocalPick(null);
  }

  if (!scenarioSet) {
    const bgColor = activePick ? SCENARIOS.find((s) => s.id === activePick)?.color : null;
    return (
      <div className="screen active" id="s-wait">
        <BrandBar />
        <div
          className="scenario-picker-wrap"
          style={{
            background: bgColor
              ? `radial-gradient(ellipse at 50% 50%, ${bgColor}30 0%, ${bgColor}18 35%, ${bgColor}08 60%, transparent 85%)`
              : undefined,
            transition: "background .6s ease",
          }}
        >
          <div className="scenario-picker-header">
            <div className="scenario-picker-title">VOTE FOR YOUR WORLD</div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4 }}>
              {hasSubmitted ? "Vote submitted. You can change it until the facilitator proceeds." : "Tap a scenario, then submit your vote."}
            </div>
          </div>
          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const Illust = SCENARIO_ILLUSTRATIONS[s.id];
              const isActive = activePick === s.id;
              const votes = voteCounts[s.id] || 0;
              return (
                <div
                  key={s.id}
                  className={`scenario-card${isActive ? " selected" : ""}`}
                  style={{ "--sc-color": s.color } as React.CSSProperties}
                  onClick={() => {
                    if (hasSubmitted) return; // Must click CHANGE first
                    setLocalPick(s.id);
                  }}
                >
                  <div className="sc-illustration-wrap">
                    {Illust && <Illust />}
                    {isActive && hasSubmitted && <div className="sc-selected-badge">YOUR VOTE</div>}
                    {isActive && !hasSubmitted && <div className="sc-selected-badge" style={{ background: "rgba(255,215,0,.9)", color: "#0a0a12" }}>SELECTED</div>}
                    {votes > 0 && !isActive && (
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: s.color, color: "#0a0a12",
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 11, letterSpacing: 1,
                        padding: "3px 10px", borderRadius: 4,
                        fontWeight: 900,
                      }}>
                        {votes}
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

          {/* Submit / Change buttons */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {!hasSubmitted && localPick && (
              <button
                className="lb lb-yellow"
                style={{ padding: "10px 32px", fontSize: 13 }}
                onClick={submitVote}
              >
                SUBMIT VOTE
              </button>
            )}
            {hasSubmitted && (
              <button
                className="lb lb-ghost"
                style={{ padding: "8px 24px", fontSize: 12 }}
                onClick={changeVote}
              >
                CHANGE VOTE
              </button>
            )}
          </div>

          {/* Other players */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
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

          <div style={{ fontSize: 11, color: "var(--textd)", textAlign: "center", marginTop: 10 }}>
            Waiting for facilitator to proceed...
          </div>
        </div>
      </div>
    );
  }

  // Scenario confirmed
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
