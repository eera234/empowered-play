"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { CARDS, SCENARIOS, ABILITIES, getThemedCard } from "../../lib/constants";
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
  // New game mutations
  const assignRole = useMutation(api.game.assignRole);
  const generatePairings = useMutation(api.game.generatePairings);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>({ step: "idle" });
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, number>>({});

  // Game mode toggle: "classic" (old card flow) or "new" (pair build flow)
  const [gameMode, setGameMode] = useState<"classic" | "new">("new");

  // New flow: local state for ability + district assignments before sending
  const [abilityAssignments, setAbilityAssignments] = useState<Record<string, string>>({});
  const [districtAssignments, setDistrictAssignments] = useState<Record<string, string>>({});
  const [pairingsGenerated, setPairingsGenerated] = useState(false);
  const [rolesSent, setRolesSent] = useState(false);
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

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

  // Auto-assign district names to players when they join (new flow)
  useEffect(() => {
    if (!scenarioConfirmed || gameMode !== "new") return;
    const names = scenarioData.districtNames;
    const updated: Record<string, string> = { ...districtAssignments };
    nonFac.forEach((p, i) => {
      if (!updated[p._id] && names[i]) {
        updated[p._id] = names[i];
      }
    });
    setDistrictAssignments(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonFac.length, scenarioConfirmed, gameMode]);

  // New flow: send all role assignments to Convex
  async function handleSendRoles() {
    if (!sessionId) return;
    for (const p of nonFac) {
      const ability = abilityAssignments[p._id] || undefined;
      const districtName = districtAssignments[p._id] || scenarioData.districtNames[nonFac.indexOf(p)] || p.name;
      await assignRole({ playerId: p._id, ability, districtName });
    }
    setRolesSent(true);
    toast("Roles assigned to all players");
  }

  // New flow: generate pairings + start game
  async function handleGenerateAndStart() {
    if (!sessionId) return;
    if (!rolesSent) {
      toast("Send roles first");
      return;
    }
    const result = await generatePairings({ sessionId });
    if (result && !result.success) {
      toast(result.error || "Failed to generate pairings");
      return;
    }
    setPairingsGenerated(true);
    // Advance to pair_build
    await advanceNewPhase({ sessionId });
    toast("Game started! Players are entering Pair Build phase.");
  }

  // Count abilities assigned
  const abilitiesAssigned = Object.values(abilityAssignments).filter((a) => a && a !== "").length;

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

      {/* Ability detail modal (animated) */}
      {expandedAbility !== null && (() => {
        const a = ABILITIES.find((ab) => ab.id === expandedAbility);
        if (!a) return null;
        const assignedTo = Object.entries(abilityAssignments).find(([, aid]) => aid === a.id);
        const assignedPlayer = assignedTo ? nonFac.find((p) => p._id === assignedTo[0]) : null;
        const abilityColors: Record<string, string> = {
          pathfinder: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740",
        };
        const color = abilityColors[a.id] || "#B388FF";
        return (
          <div className="card-modal-overlay" onClick={() => setExpandedAbility(null)}>
            <div className="card-modal" onClick={(e) => e.stopPropagation()}>
              <div className="card-modal-studs">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="lego-stud-3d" style={{ width: 16, height: 16 }} />
                ))}
              </div>
              <div className="card-modal-accent" style={{ background: color }} />
              <div className="card-modal-body">
                <div className="card-modal-icon" style={{ fontSize: 52 }}>{a.icon}</div>
                <div className="card-modal-title" style={{ color }}>{a.label}</div>
                <div className="card-modal-section">
                  <div className="card-modal-section-lbl">WHAT THE PLAYER SEES</div>
                  <div className="card-modal-rule">{a.description}</div>
                </div>
                <div className="card-modal-section">
                  <div className="card-modal-section-lbl" style={{ color: "var(--acc2)" }}>GAME MECHANIC</div>
                  <div className="card-modal-rule">{a.mechanic}</div>
                </div>
                <div className="card-modal-section">
                  <div className="card-modal-section-lbl card-modal-hr-lbl">HR INSIGHT</div>
                  <div className="card-modal-hr">{a.hrNote}</div>
                </div>
                {assignedPlayer && (
                  <div className="card-modal-hint" style={{ color: "var(--acc4)" }}>
                    Assigned to {assignedPlayer.name}
                  </div>
                )}
              </div>
              <button className="card-modal-close" onClick={() => setExpandedAbility(null)}>CLOSE</button>
            </div>
          </div>
        );
      })()}

      {/* NEW FLOW: Role assignment + pairing */}
      {scenarioConfirmed && gameMode === "new" && (
        <div className="fac-layout">
          <div className="fac-left">
            <div className="fac-session-box">
              <div className="fac-session-studs">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="lego-stud-3d" style={{ width: 18, height: 18 }} />
                ))}
              </div>
              <div className="fac-session-label">SESSION CODE</div>
              <div className="fac-session-code">{sessionCode}</div>
              <div className="fac-session-hint">Share this code with your team</div>
            </div>

            <div className="fac-players-section">
              <div className="fac-section-header">
                <div className="slbl">PLAYERS ({nonFac.length}/8)</div>
                <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 4 }}>
                  Assign a {scenarioData.terminology.district} name and optional ability to each player
                </div>
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
                {nonFac.map((p, idx) => {
                  const ability = abilityAssignments[p._id] || "";
                  const district = districtAssignments[p._id] || scenarioData.districtNames[idx] || "";
                  const abilityData = ABILITIES.find((ab) => ab.id === ability);
                  const abilityColors: Record<string, string> = {
                    pathfinder: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740",
                  };

                  return (
                    <div key={p._id} className="fac-player-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10, cursor: "default", padding: "12px 14px" }}>
                      {/* Player name row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="fac-player-avatar">{p.name[0].toUpperCase()}</div>
                        <div className="fac-player-name" style={{ flex: 1 }}>{p.name}</div>
                        {rolesSent && (
                          <div className="fac-sent-badge">SENT</div>
                        )}
                        {!rolesSent && (
                          <button
                            className="fac-undo-btn"
                            style={{ opacity: 0.35, fontSize: 9 }}
                            onClick={() => { if (confirm(`Remove ${p.name}?`)) { removePlayer({ playerId: p._id }); toast(`${p.name} removed`); } }}
                          >
                            REMOVE
                          </button>
                        )}
                      </div>

                      {/* Assignment controls */}
                      {!rolesSent && (
                        <div style={{ display: "flex", gap: 8, paddingLeft: 40, alignItems: "center" }}>
                          <input
                            className="linput"
                            type="text"
                            value={district}
                            onChange={(e) => setDistrictAssignments((prev) => ({ ...prev, [p._id]: e.target.value }))}
                            placeholder={scenarioData.terminology.district + " name"}
                            style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                          />
                          <select
                            value={ability}
                            onChange={(e) => setAbilityAssignments((prev) => ({ ...prev, [p._id]: e.target.value }))}
                            style={{
                              background: ability ? `${abilityColors[ability] || "#B388FF"}15` : "rgba(255,255,255,.04)",
                              border: `2px solid ${ability ? (abilityColors[ability] || "#B388FF") + "44" : "var(--border)"}`,
                              borderRadius: "var(--brick-radius)",
                              padding: "8px 12px",
                              fontSize: 13,
                              color: ability ? "var(--text)" : "var(--textd)",
                              outline: "none",
                              minWidth: 140,
                              cursor: "pointer",
                            }}
                          >
                            <option value="">Citizen</option>
                            {ABILITIES.map((ab) => {
                              const alreadyUsed = Object.entries(abilityAssignments).some(
                                ([pid, aid]) => aid === ab.id && pid !== p._id
                              );
                              return (
                                <option key={ab.id} value={ab.id} disabled={alreadyUsed}>
                                  {ab.icon} {ab.label}{alreadyUsed ? " (taken)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Summary after sent */}
                      {rolesSent && (
                        <div style={{ paddingLeft: 40, display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{
                            padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                            background: `${scenarioData.color}15`, border: `1px solid ${scenarioData.color}33`,
                            color: scenarioData.color,
                          }}>
                            {district}
                          </div>
                          <div style={{
                            padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                            background: abilityData ? `${abilityColors[ability] || "#B388FF"}15` : "rgba(255,255,255,.04)",
                            border: abilityData ? `1px solid ${abilityColors[ability] || "#B388FF"}33` : "1px solid var(--border)",
                            color: abilityData ? (abilityColors[ability] || "#B388FF") : "var(--textd)",
                          }}>
                            {abilityData ? `${abilityData.icon} ${abilityData.label}` : "Citizen"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pairing preview (shown after roles sent) */}
            {rolesSent && !pairingsGenerated && nonFac.length >= 2 && (
              <div style={{
                background: "rgba(255,255,255,.03)", border: "1px solid var(--border)",
                borderRadius: "var(--brick-radius)", padding: "14px 16px", margin: "0 0 12px",
              }}>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", marginBottom: 10,
                }}>
                  PAIRING PREVIEW (auto-generated circle)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {nonFac.map((p, i) => {
                    const next = nonFac[(i + 1) % nonFac.length];
                    return (
                      <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 800,
                          background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.2)",
                          color: "var(--acc1)",
                        }}>
                          {p.name}
                        </span>
                        <span style={{ color: "var(--textd)", fontSize: 11 }}>{"\u2192"}</span>
                        <span style={{
                          padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 800,
                          background: "rgba(79,195,247,.08)", border: "1px solid rgba(79,195,247,.2)",
                          color: "var(--acc2)",
                        }}>
                          {next.name}
                        </span>
                        {i < nonFac.length - 1 && (
                          <span style={{ color: "var(--textdd)", margin: "0 4px" }}>{"\u00B7"}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: "var(--textdd)", marginTop: 8 }}>
                  Each player gives clues to the next. Pairs are randomized when you start.
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="fac-advance-box">
              {!rolesSent && (
                <>
                  <div className="fac-advance-progress">
                    <div className="fac-advance-bar">
                      <div className="fac-advance-fill" style={{
                        width: nonFac.length ? `${Math.min(100, ((nonFac.length >= 2 ? 50 : 0) + (abilitiesAssigned > 0 ? 50 : 0)))}%` : "0%"
                      }} />
                    </div>
                    <div className="fac-advance-count">
                      {nonFac.length} player{nonFac.length !== 1 ? "s" : ""} {"\u00B7"} {abilitiesAssigned} of {Math.min(nonFac.length, ABILITIES.length)} abilities assigned {"\u00B7"} {nonFac.length - abilitiesAssigned} citizen{nonFac.length - abilitiesAssigned !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    className={`lb ${nonFac.length >= 2 ? "lb-green" : "lb-ghost"} fac-advance-btn`}
                    disabled={nonFac.length < 2}
                    onClick={handleSendRoles}
                  >
                    ASSIGN ROLES TO ALL PLAYERS
                  </button>
                  {nonFac.length < 2 && (
                    <div style={{ fontSize: 10, color: "var(--textdd)", marginTop: 6, textAlign: "center" }}>
                      Need at least 2 players to start
                    </div>
                  )}
                </>
              )}
              {rolesSent && !pairingsGenerated && (
                <button
                  className="lb lb-yellow fac-advance-btn"
                  onClick={handleGenerateAndStart}
                >
                  START PAIR BUILD {"\u2192"}
                </button>
              )}
            </div>
          </div>

          {/* Right: Ability + Citizen reference cards */}
          <div className="fac-right">
            <div className="fac-cards-header">
              <div className="slbl">ROLES REFERENCE</div>
              <div className="fac-cards-sub">
                Assign abilities strategically. Unassigned players become Citizens. Tap VIEW DETAILS for full info.
              </div>
            </div>
            <div className="fac-card-grid">
              {/* Citizen card */}
              <div
                className="fac-card"
                style={{ "--card-color": "var(--textd)", cursor: "default" } as React.CSSProperties}
              >
                <div className="fac-card-top" style={{ background: "rgba(255,255,255,.08)", minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="fac-card-studs-row">
                    <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                    <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                    <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                  </div>
                  <span style={{ fontSize: 42, position: "relative", zIndex: 1 }}>{"\u{1F9D1}"}</span>
                  {(nonFac.length - abilitiesAssigned) > 0 && (
                    <div className="fac-card-taken-overlay" style={{ background: "rgba(0,0,0,.55)", fontSize: 10 }}>
                      {nonFac.length - abilitiesAssigned} PLAYER{nonFac.length - abilitiesAssigned !== 1 ? "S" : ""}
                    </div>
                  )}
                </div>
                <div className="fac-card-bottom">
                  <div className="fac-card-title">Citizen</div>
                  <div className="fac-card-hr-preview">No special ability. Participates in all phases normally. The team needs citizens to function.</div>
                  <div className="fac-card-meta">
                    <span>Default role</span>
                  </div>
                </div>
              </div>

              {/* Ability cards */}
              {ABILITIES.map((a) => {
                const assignedTo = Object.entries(abilityAssignments).find(([, aid]) => aid === a.id);
                const assignedPlayer = assignedTo ? nonFac.find((p) => p._id === assignedTo[0]) : null;
                const abilityColors: Record<string, string> = {
                  pathfinder: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740",
                };
                const color = abilityColors[a.id] || "#B388FF";

                return (
                  <div
                    key={a.id}
                    className={`fac-card${assignedPlayer ? " taken" : ""}`}
                    style={{ "--card-color": color } as React.CSSProperties}
                  >
                    <div className="fac-card-top" style={{ background: color, minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="fac-card-studs-row">
                        <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                        <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                        <div className="lego-stud-3d" style={{ width: 12, height: 12 }} />
                      </div>
                      <span style={{ fontSize: 42, position: "relative", zIndex: 1 }}>{a.icon}</span>
                      {assignedPlayer && (
                        <div className="fac-card-taken-overlay">{assignedPlayer.name.toUpperCase()}</div>
                      )}
                    </div>
                    <div className="fac-card-bottom">
                      <div className="fac-card-title">{a.label}</div>
                      <div className="fac-card-hr-preview">{a.hrNote}</div>
                      <div className="fac-card-meta">
                        <span>Special ability</span>
                      </div>
                      <button
                        className="fac-card-expand"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedAbility(a.id);
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
        </div>
      )}

      {/* CLASSIC FLOW: Card assignment — shown after scenario is confirmed */}
      {scenarioConfirmed && gameMode === "classic" && <div className="fac-layout">
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
