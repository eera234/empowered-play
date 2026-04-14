"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { CARDS, SCENARIOS, getThemedCard } from "../../lib/constants";
import CardIcon from "./CardIcon";
import { SCENARIO_ILLUSTRATIONS } from "./EntryScreen";

type AssignMode =
  | { step: "idle" }
  | { step: "card_selected"; cardIndex: number }
  | { step: "player_selected"; playerId: Id<"players"> };

export default function FacSetupScreen() {
  const { sessionCode, sessionId, scenario, set, goTo } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const currentScenario = scenario || session?.scenario || "";
  const scenarioConfirmed = currentScenario !== "";
  const scenarioData = SCENARIOS.find((s) => s.id === currentScenario) || SCENARIOS[0];
  const themedCards = CARDS.map((c) => getThemedCard(c, scenarioData));
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const assignCard = useMutation(api.game.assignCard);
  const advancePhase = useMutation(api.game.advancePhase);
  const removePlayer = useMutation(api.game.removePlayer);
  const setScenarioMut = useMutation(api.game.setScenario);

  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>({ step: "idle" });
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, number>>({});

  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  const assignedCount = nonFac.filter((p) => p.cardSent).length;

  // Cards that are already sent or pending
  const takenCardIndices = new Set<number>();
  nonFac.forEach((p) => {
    if (p.cardSent && p.cardIndex != null) takenCardIndices.add(p.cardIndex);
  });
  Object.values(pendingAssignments).forEach((ci) => takenCardIndices.add(ci));

  function handleCardTap(cardIndex: number) {
    if (takenCardIndices.has(cardIndex)) return;
    if (assignMode.step === "player_selected") {
      setPendingAssignments((prev) => ({
        ...prev,
        [assignMode.playerId]: cardIndex,
      }));
      setAssignMode({ step: "idle" });
      toast(`Card ready. Hit SEND to confirm.`);
    } else if (assignMode.step === "card_selected" && assignMode.cardIndex === cardIndex) {
      // Toggle off if clicking the same card
      setAssignMode({ step: "idle" });
    } else {
      setAssignMode({ step: "card_selected", cardIndex });
    }
  }

  function handlePlayerTap(playerId: Id<"players">) {
    const player = nonFac.find((p) => p._id === playerId);
    if (player?.cardSent) return;

    if (assignMode.step === "card_selected") {
      // Card was selected first, now assign to this player
      setPendingAssignments((prev) => ({
        ...prev,
        [playerId]: assignMode.cardIndex,
      }));
      setAssignMode({ step: "idle" });
      toast(`Card ready — hit SEND to confirm`);
    } else {
      setAssignMode({ step: "player_selected", playerId });
    }
  }

  async function handleSendCard(playerId: Id<"players">) {
    const cardIndex = pendingAssignments[playerId];
    if (cardIndex == null) return;
    await assignCard({ playerId, cardIndex });
    setPendingAssignments((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
    toast(`Card sent!`);
  }

  function handleUnassign(playerId: string) {
    setPendingAssignments((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }

  async function handleAdvance() {
    if (!sessionId) return;
    if (assignedCount < nonFac.length) {
      toast("Assign and send cards to all players first");
      return;
    }
    await advancePhase({ sessionId });
  }

  const allSent = nonFac.length > 0 && nonFac.every((p) => p.cardSent);

  // Voting logic
  const voteScenarioMut = useMutation(api.game.voteScenario);
  const allPlayers = (players || []);
  const facPlayer = allPlayers.find((p) => p.isFacilitator);
  const facVote = facPlayer?.scenarioVote || null;

  // Count votes
  const voteCounts: Record<string, number> = {};
  allPlayers.forEach((p) => { if (p.scenarioVote) voteCounts[p.scenarioVote] = (voteCounts[p.scenarioVote] || 0) + 1; });
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(0, ...Object.values(voteCounts));
  const topScenarios = Object.entries(voteCounts).filter(([, count]) => count === maxVotes).map(([id]) => id);

  // Facilitator closes voting → resolve winner and show result
  async function closeVotingAndProceed() {
    if (totalVotes === 0 || !sessionId) return;
    const winner = topScenarios.length === 1
      ? topScenarios[0]
      : topScenarios[Math.floor(Math.random() * topScenarios.length)];
    await setScenarioMut({ sessionId, scenario: winner });
    set({ scenario: winner });
  }

  return (
    <div className="screen active" id="s-fac-setup">
      <BrandBar badge="FACILITATOR" backTo="s-entry" />

      {/* Card detail modal */}
      {expandedCard !== null && (
        <div className="card-modal-overlay" onClick={() => setExpandedCard(null)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-modal-studs">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="lego-stud-3d" style={{ width: 16, height: 16 }} />
              ))}
            </div>
            <div
              className="card-modal-accent"
              style={{ background: themedCards[expandedCard].color }}
            />
            <div className="card-modal-body">
              <div className="card-modal-icon"><CardIcon icon={themedCards[expandedCard].icon} size={52} /></div>
              <div
                className="card-modal-title"
                style={{ color: themedCards[expandedCard].color }}
              >
                {themedCards[expandedCard].title}
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">SHAPE CONSTRAINT</div>
                <div className="card-modal-rule">{themedCards[expandedCard].shapeHint}</div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">MAP PLACEMENT</div>
                <div className="card-modal-rule">{themedCards[expandedCard].mapRule}</div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl" style={{ color: "var(--acc2)" }}>
                  BUILD TIME: {themedCards[expandedCard].buildTime} MINUTES
                </div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl card-modal-hr-lbl">
                  HR INSIGHT
                </div>
                <div className="card-modal-hr">{themedCards[expandedCard].hrNote}</div>
              </div>
              <div className="card-modal-hint">
                {takenCardIndices.has(expandedCard)
                  ? "This card is already assigned"
                  : "Close this and tap a card, then tap a player to assign"}
              </div>
            </div>
            <button
              className="card-modal-close"
              onClick={() => setExpandedCard(null)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Voting phase — shown before scenario is confirmed */}
      {!scenarioConfirmed && (
        <div
          className="scenario-picker-wrap"
          style={{
            background: facVote
              ? `radial-gradient(ellipse at 50% 50%, ${SCENARIOS.find((s) => s.id === facVote)?.color || "transparent"}30 0%, ${SCENARIOS.find((s) => s.id === facVote)?.color || "transparent"}18 35%, ${SCENARIOS.find((s) => s.id === facVote)?.color || "transparent"}08 60%, transparent 85%)`
              : undefined,
            transition: "background .6s ease",
          }}
        >
          <div className="fac-session-box" style={{ marginBottom: 20 }}>
            <div className="fac-session-studs">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="lego-stud-3d" style={{ width: 18, height: 18 }} />
              ))}
            </div>
            <div className="fac-session-label">SESSION CODE</div>
            <div className="fac-session-code">{sessionCode}</div>
            <div className="fac-session-hint">Share this code with your team</div>
          </div>

          <div className="scenario-picker-header">
            <div className="scenario-picker-title">VOTE FOR A WORLD</div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4 }}>
              {totalVotes > 0 ? `${totalVotes} vote${totalVotes !== 1 ? "s" : ""} cast` : "Tap a scenario to cast your vote"}
            </div>
          </div>

          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const Illust = SCENARIO_ILLUSTRATIONS[s.id];
              const votes = voteCounts[s.id] || 0;
              const isMyVote = facVote === s.id;
              return (
                <div
                  key={s.id}
                  className={`scenario-card${isMyVote ? " selected" : ""}`}
                  style={{
                    "--sc-color": s.color,
                    opacity: scenarioConfirmed && currentScenario !== s.id ? 0.35 : 1,
                    pointerEvents: scenarioConfirmed ? "none" : undefined,
                  } as React.CSSProperties}
                  onClick={async () => {
                    if (!facPlayer || scenarioConfirmed) return;
                    await voteScenarioMut({ playerId: facPlayer._id, scenarioId: s.id });
                  }}
                >
                  <div className="sc-illustration-wrap">
                    {Illust && <Illust />}
                    {isMyVote && <div className="sc-selected-badge">YOUR VOTE</div>}
                    {votes > 0 && (
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

          {/* Player vote status */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {allPlayers.map((p) => (
              <div key={p._id} style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 16,
                background: p.scenarioVote ? "rgba(105,240,174,.08)" : "rgba(255,255,255,.04)",
                border: p.scenarioVote ? "1px solid rgba(105,240,174,.2)" : "1px solid var(--border)",
                color: p.scenarioVote ? "var(--acc4)" : "var(--textd)",
              }}>
                {p.isFacilitator ? "You" : p.name} {p.scenarioVote ? "✓" : ""}
              </div>
            ))}
          </div>

          {/* Status + buttons */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {(() => {
              const everyoneVoted = allPlayers.length > 1 && allPlayers.every((p) => p.scenarioVote);
              return (
              <>
                <div style={{ fontSize: 12, color: "var(--textd)", marginBottom: 12 }}>
                  {totalVotes === 0 ? "Waiting for votes..." : `${totalVotes}/${allPlayers.length} voted`}
                </div>
                <button
                  className={`lb ${everyoneVoted ? "lb-yellow" : "lb-ghost"}`}
                  disabled={!everyoneVoted}
                  style={{ padding: "12px 36px", fontSize: 13 }}
                  onClick={closeVotingAndProceed}
                >
                  CLOSE VOTING AND PROCEED
                </button>
                <div style={{ fontSize: 10, color: "var(--textd)", marginTop: 6 }}>
                  {everyoneVoted ? "Everyone has voted. Close voting to decide the scenario and move to card assignment." : "Waiting for everyone to vote."}
                </div>
              </>
            );})()}
          </div>
        </div>
      )}

      {/* Card assignment — shown after scenario is confirmed */}
      {scenarioConfirmed && <div className="fac-layout">
        {/* Left: Session info + Players */}
        <div className="fac-left">
          <div className="fac-session-box">
            <div className="fac-session-studs">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="lego-stud-3d" style={{ width: 18, height: 18 }} />
              ))}
            </div>
            <div className="fac-session-label">SESSION CODE</div>
            <div className="fac-session-code">{sessionCode}</div>
            <div className="fac-session-hint">
              Share this code with your team
            </div>
          </div>

          <div className="fac-players-section">
            <div className="fac-section-header">
              <div className="slbl">
                PLAYERS ({nonFac.length}/8)
              </div>
              {assignMode.step === "card_selected" && (
                <div className="fac-assign-hint">
                  Now tap a player to assign the card
                </div>
              )}
            </div>

            {nonFac.length === 0 && (
              <div className="fac-empty-players">
                <div className="fac-empty-icon">
                  <div className="fac-empty-stud" />
                  <div className="fac-empty-stud" />
                </div>
                <div>Waiting for players to join...</div>
              </div>
            )}

            <div className="fac-player-list">
              {nonFac.map((p) => {
                const pendingCard = pendingAssignments[p._id];
                const assignedCard =
                  p.cardSent && p.cardIndex != null ? themedCards[p.cardIndex] : null;
                const pendingCardData =
                  pendingCard != null ? themedCards[pendingCard] : null;
                const isTargeted =
                  assignMode.step === "player_selected" &&
                  assignMode.playerId === p._id;

                return (
                  <div
                    key={p._id}
                    className={`fac-player-row${isTargeted ? " targeted" : ""}${p.cardSent ? " sent" : ""}`}
                    onClick={() => handlePlayerTap(p._id)}
                  >
                    <div className="fac-player-avatar">{p.name[0].toUpperCase()}</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="fac-player-name">{p.name}</div>
                        {assignedCard && (
                          <div className="fac-player-card-tag" style={{ borderColor: assignedCard.color + "44", color: assignedCard.color }}>
                            <CardIcon icon={assignedCard.icon} size={12} /> {assignedCard.title}
                          </div>
                        )}
                        {pendingCardData && !p.cardSent && (
                          <div className="fac-player-card-tag pending" style={{ borderColor: pendingCardData.color + "44", color: pendingCardData.color }}>
                            <CardIcon icon={pendingCardData.icon} size={12} /> {pendingCardData.title}
                          </div>
                        )}
                        {p.cardSent && <div className="fac-sent-badge" style={{ marginLeft: "auto" }}>SENT</div>}
                      </div>
                      {!p.cardSent && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {!assignedCard && !pendingCardData && (
                            <div className="fac-player-no-card">Tap a card, then this player</div>
                          )}
                          {pendingCardData && (
                            <>
                              <button
                                className="lb lb-green"
                                style={{ fontSize: 9, padding: "4px 12px", letterSpacing: 1 }}
                                onClick={(e) => { e.stopPropagation(); handleSendCard(p._id); }}
                              >
                                SEND
                              </button>
                              <button className="fac-undo-btn" onClick={(e) => { e.stopPropagation(); handleUnassign(p._id); }}>UNDO</button>
                            </>
                          )}
                          <button
                            className="fac-undo-btn"
                            style={{ marginLeft: "auto", opacity: 0.35, fontSize: 9 }}
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Remove ${p.name}?`)) { removePlayer({ playerId: p._id }); toast(`${p.name} removed`); } }}
                          >
                            REMOVE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advance box */}
          <div className="fac-advance-box">
            <div className="fac-advance-progress">
              <div className="fac-advance-bar">
                <div
                  className="fac-advance-fill"
                  style={{
                    width: nonFac.length
                      ? `${(assignedCount / nonFac.length) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="fac-advance-count">
                {assignedCount}/{nonFac.length} cards sent
              </div>
            </div>
            <button
              className={`lb ${allSent ? "lb-yellow" : "lb-ghost"} fac-advance-btn`}
              disabled={!allSent}
              onClick={handleAdvance}
            >
              {allSent
                ? "START THE GAME \u2192"
                : "SEND ALL CARDS TO START"}
            </button>
          </div>
        </div>

        {/* Right: Card grid */}
        <div className="fac-right">
          <div className="fac-cards-header">
            <div className="slbl">CONSTRAINT CARDS</div>
            <div className="fac-cards-sub">
              Tap to read details. Tap a card then a player to assign it.
            </div>
          </div>
          <div className="fac-card-grid">
            {themedCards.map((c, i) => {
              const taken = takenCardIndices.has(i);
              const tooFewPlayers = c.minPlayers > nonFac.length;
              const unavailable = taken || tooFewPlayers;
              const isSelected =
                assignMode.step === "card_selected" &&
                assignMode.cardIndex === i;

              return (
                <div
                  key={c.id}
                  className={`fac-card${unavailable ? " taken" : ""}${isSelected ? " selected" : ""}`}
                  style={{
                    "--card-color": c.color,
                  } as React.CSSProperties}
                  onClick={() => !unavailable && handleCardTap(i)}
                >
                  <div
                    className="fac-card-top"
                    style={{ background: c.color }}
                  >
                    <div className="fac-card-studs-row">
                      <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                      <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                      <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                    </div>
                    <div className="fac-card-icon"><CardIcon icon={c.icon} size={56} /></div>
                    {taken && <div className="fac-card-taken-overlay">ASSIGNED</div>}
                    {!taken && tooFewPlayers && <div className="fac-card-taken-overlay">NEEDS {c.minPlayers}+ PLAYERS</div>}
                    {isSelected && (
                      <div className="fac-card-selected-ring" />
                    )}
                  </div>
                  <div className="fac-card-bottom">
                    <div className="fac-card-title">{c.title}</div>
                    <div className="fac-card-hr-preview">{c.hrNote}</div>
                    <div className="fac-card-meta">
                      <span>{c.buildTime} min</span>
                      <span style={{ opacity: 0.4 }}>&middot;</span>
                      <span>{c.shape.replace("-", " ")}</span>
                    </div>
                    <button
                      className="fac-card-expand"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(i);
                      }}
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
    </div>
  );
}
