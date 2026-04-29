"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { SCENARIOS, ABILITIES, getThemedAbility, ROLE_COUNTS_BY_PLAYER_COUNT, MIN_PLAYERS, MAX_PLAYERS } from "../../lib/constants";
import { SCENARIO_ILLUSTRATIONS } from "./EntryScreen";
import AbilityBadge from "./AbilityBadge";
import RoleDetailModal from "./RoleDetailModal";

export default function FacSetupScreen() {
  const { sessionCode, sessionId, scenario, set } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const currentScenario = scenario || session?.scenario || "";
  const scenarioConfirmed = currentScenario !== "";
  const scenarioData = SCENARIOS.find((s) => s.id === currentScenario) || SCENARIOS[0];
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const removePlayer = useMutation(api.game.removePlayer);
  const setScenarioMut = useMutation(api.game.setScenario);
  const assignRole = useMutation(api.game.assignRole);
  const generatePairings = useMutation(api.game.generatePairings);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

  const [abilityAssignments, setAbilityAssignments] = useState<Record<string, string>>({});
  const [districtAssignments, setDistrictAssignments] = useState<Record<string, string>>({});
  const [pairingsGenerated, setPairingsGenerated] = useState(false);
  const [rolesSent, setRolesSent] = useState(false);
  const [detailAbilityId, setDetailAbilityId] = useState<string | null>(null);

  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  // Pass #17: presence-filtered roster. Every gate ("all voted", "all seen",
  // role-count constraint, advance readiness) runs over this list so left
  // players never block. The full `nonFac` is still used for rendering rows
  // (ghost rows are dimmed and tagged "left the game") and for `removePlayer`
  // controls, since the fac may want to hard-remove someone.
  const presentNonFac = nonFac.filter((p) => p.isPresent !== false);

  // Voting logic
  const voteScenarioMut = useMutation(api.game.voteScenario);
  const allPlayers = (players || []);
  const facPlayer = allPlayers.find((p) => p.isFacilitator);
  const facVote = facPlayer?.scenarioVote || null;
  const presentAllPlayers = allPlayers.filter((p) => p.isPresent !== false);

  // Count votes — only count players who are present. A player who voted and
  // then closed the tab has their vote dropped on the next query tick.
  const voteCounts: Record<string, number> = {};
  presentAllPlayers.forEach((p) => { if (p.scenarioVote) voteCounts[p.scenarioVote] = (voteCounts[p.scenarioVote] || 0) + 1; });
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

  // Shuffle the scenario's district names once per session so the first
  // player to join doesn't always get index-0 (e.g., The Lighthouse). The
  // shuffled order is frozen the first time the scenario is confirmed so
  // that players who are already assigned keep their district when others
  // join later. Fisher-Yates.
  const shuffledDistrictsRef = useRef<string[] | null>(null);
  const shuffledDistricts = useMemo(() => {
    if (!scenarioConfirmed) return [] as string[];
    if (shuffledDistrictsRef.current && shuffledDistrictsRef.current.length > 0) {
      return shuffledDistrictsRef.current;
    }
    const base = Object.values(scenarioData.districtNames);
    const shuffled = [...base];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffledDistrictsRef.current = shuffled;
    return shuffled;
  }, [scenarioConfirmed, scenarioData]);

  // Auto-assign district names to players when they join, drawing from the
  // shuffled pool. Existing assignments are preserved.
  useEffect(() => {
    if (!scenarioConfirmed) return;
    if (shuffledDistricts.length === 0) return;
    const taken = new Set(Object.values(districtAssignments));
    const available = shuffledDistricts.filter((n) => !taken.has(n));
    const updated: Record<string, string> = { ...districtAssignments };
    let cursor = 0;
    nonFac.forEach((p) => {
      if (!updated[p._id] && cursor < available.length) {
        updated[p._id] = available[cursor++];
      }
    });
    setDistrictAssignments(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonFac.length, scenarioConfirmed, shuffledDistricts]);

  // New flow: send all role assignments to Convex
  async function handleSendRoles() {
    if (!sessionId) return;
    for (const p of nonFac) {
      const ability = abilityAssignments[p._id] || undefined;
      const districtName = districtAssignments[p._id] || shuffledDistricts[nonFac.indexOf(p)] || p.name;
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
    // Advance to pair_build. fromPhase="waiting" makes this idempotent so a
    // repeat click can't skip past pair_build into guess.
    await advanceNewPhase({ sessionId, fromPhase: "waiting" });
    toast("Game started! Players are entering Pair Build phase.");
  }

  // Count abilities assigned
  const abilitiesAssigned = Object.values(abilityAssignments).filter((a) => a && a !== "").length;

  return (
    <div className="screen active" id="s-fac-setup">
      <BrandBar badge="FACILITATOR" backTo="s-entry" />

      {/* Voting phase: shown before scenario is confirmed */}
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

      {/* NEW FLOW: Role assignment + pairing */}
      {scenarioConfirmed && (
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
                  const district = districtAssignments[p._id] || shuffledDistricts[idx] || "";
                  const baseAbility = ABILITIES.find((ab) => ab.id === ability);
                  const abilityData = baseAbility ? getThemedAbility(baseAbility, scenarioData) : undefined;
                  const abilityColors: Record<string, string> = {
                    mender: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740", citizen: "#EC407A",
                  };

                  // Pass #17: dim the row + tag "left the game" when the
                  // player has dropped out. Still allow REMOVE so the fac
                  // can hard-clear a ghost; don't allow role assignment.
                  const isGhost = p.isPresent === false;
                  return (
                    <div
                      key={p._id}
                      className="fac-player-row"
                      style={{
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 10,
                        cursor: "default",
                        padding: "12px 14px",
                        opacity: isGhost ? 0.45 : 1,
                        filter: isGhost ? "grayscale(0.6)" : undefined,
                      }}
                    >
                      {/* Player name row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="fac-player-avatar">{p.name[0].toUpperCase()}</div>
                        <div className="fac-player-name" style={{ flex: 1 }}>
                          {p.name}
                          {isGhost && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 9,
                              letterSpacing: 1,
                              color: "#FF8A80",
                              background: "rgba(244,67,54,0.12)",
                              border: "1px solid rgba(244,67,54,0.35)",
                              borderRadius: 4,
                              padding: "2px 6px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                            }}>
                              LEFT
                            </span>
                          )}
                        </div>
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
                        <div style={{ display: "flex", gap: 8, paddingLeft: 40, alignItems: "center", flexWrap: "wrap" }}>
                          <div
                            style={{
                              flex: "1 1 160px",
                              minWidth: 160,
                              padding: "8px 12px",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--text)",
                              background: "rgba(255,255,255,.04)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--brick-radius)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={district}
                          >
                            {district || scenarioData.terminology.district}
                          </div>
                          <select
                            value={ability}
                            disabled={isGhost}
                            onChange={(e) => setAbilityAssignments((prev) => ({ ...prev, [p._id]: e.target.value }))}
                            style={{
                              backgroundColor: ability ? `${abilityColors[ability] || "#B388FF"}15` : "rgba(255,255,255,.04)",
                              border: `2px solid ${ability ? (abilityColors[ability] || "#B388FF") + "44" : "var(--border)"}`,
                              borderRadius: "var(--brick-radius)",
                              padding: "8px 36px 8px 12px",
                              fontSize: 13,
                              color: ability ? "var(--text)" : "var(--textd)",
                              outline: "none",
                              flex: "1 1 160px",
                              minWidth: 160,
                              cursor: isGhost ? "not-allowed" : "pointer",
                              // Pass #17: replace the inconsistent native arrow with a custom
                              // inline SVG chevron, padded 12px from the right edge and
                              // vertically centered. Matches the rest of the app's visual rhythm.
                              appearance: "none",
                              WebkitAppearance: "none",
                              MozAppearance: "none",
                              backgroundImage:
                                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23ffffff' stroke-opacity='0.7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 6 L8 10 L12 6'/></svg>\")",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 12px center",
                              backgroundSize: "14px 14px",
                            }}
                          >
                            <option value="">{"\u2014 pick a role \u2014"}</option>
                            {ABILITIES.map((ab) => {
                              const themed = getThemedAbility(ab, scenarioData);
                              // Citizen can be held by 1-2 players (6 or 7 players).
                              // Non-citizen roles are unique: taken = blocked.
                              const alreadyUsed = ab.id !== "citizen" && Object.entries(abilityAssignments).some(
                                ([pid, aid]) => aid === ab.id && pid !== p._id
                              );
                              return (
                                <option key={ab.id} value={ab.id} disabled={alreadyUsed}>
                                  {themed.icon} {themed.label}{alreadyUsed ? " (taken)" : ""}
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
                            {abilityData ? `${abilityData.icon} ${abilityData.label}` : "Unassigned"}
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
              {!rolesSent && (() => {
                // Pass #17: gate on presentNonFac so dropped players don't
                // skew the player count or the required-role math.
                const required = ROLE_COUNTS_BY_PLAYER_COUNT[presentNonFac.length];
                const requiredCounts: Record<string, number> = {};
                if (required) for (const r of required) requiredCounts[r] = (requiredCounts[r] ?? 0) + 1;
                const pendingAbility: Record<string, number> = {};
                for (const p of presentNonFac) {
                  const a = (abilityAssignments[p._id] ?? p.ability ?? "").toString();
                  if (a) pendingAbility[a] = (pendingAbility[a] ?? 0) + 1;
                }
                const diffs: string[] = [];
                const allRoles = new Set([...Object.keys(requiredCounts), ...Object.keys(pendingAbility)]);
                for (const r of allRoles) {
                  const req = requiredCounts[r] ?? 0;
                  const act = pendingAbility[r] ?? 0;
                  if (req !== act) diffs.push(`${r}: ${act}/${req}`);
                }
                const countOK = presentNonFac.length >= MIN_PLAYERS && presentNonFac.length <= MAX_PLAYERS;
                const rolesOK = countOK && diffs.length === 0;
                return (
                  <>
                    <div className="fac-advance-progress">
                      <div className="fac-advance-bar">
                        <div className="fac-advance-fill" style={{
                          width: presentNonFac.length ? `${Math.min(100, ((countOK ? 50 : 0) + (rolesOK ? 50 : 0)))}%` : "0%"
                        }} />
                      </div>
                      <div className="fac-advance-count">
                        {presentNonFac.length} player{presentNonFac.length !== 1 ? "s" : ""} {"\u00B7"} needs {MIN_PLAYERS}-{MAX_PLAYERS}
                      </div>
                    </div>
                    {countOK && required && (() => {
                      // Pass #17: per-count role constraint banner. Chip per
                      // required seat; chip turns green when the assigned count
                      // matches what the role expects, red otherwise. Works for
                      // every N in ROLE_COUNTS_BY_PLAYER_COUNT, not only 3.
                      const labelFor = (roleId: string) => {
                        const base = ABILITIES.find(a => a.id === roleId);
                        if (!base) return roleId;
                        return getThemedAbility(base, scenarioData).label;
                      };
                      // Build flat chip list in the order the constraint defines.
                      // For roles that repeat (e.g. 7 players → citizen twice),
                      // each seat is its own chip, colored independently based
                      // on whether enough of that role have been assigned so far.
                      const seenByRole: Record<string, number> = {};
                      return (
                        <div style={{
                          background: rolesOK ? "rgba(76,175,80,.10)" : "rgba(244,67,54,.08)",
                          border: `1px solid ${rolesOK ? "rgba(76,175,80,.45)" : "rgba(244,67,54,.45)"}`,
                          borderRadius: 8, padding: "10px 12px", marginBottom: 10,
                        }}>
                          <div style={{
                            fontWeight: 900, letterSpacing: 1.5,
                            fontSize: 10, marginBottom: 8,
                            color: rolesOK ? "#81C784" : "#FF8A80",
                            textTransform: "uppercase",
                          }}>
                            With {presentNonFac.length} players, these roles must be assigned
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {required.map((r, i) => {
                              const got = pendingAbility[r] ?? 0;
                              seenByRole[r] = (seenByRole[r] ?? 0) + 1;
                              const met = got >= seenByRole[r];
                              return (
                                <span
                                  key={`${r}-${i}`}
                                  style={{
                                    fontSize: 11, fontWeight: 800,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    letterSpacing: 0.5,
                                    background: met ? "rgba(76,175,80,.22)" : "rgba(244,67,54,.18)",
                                    color: met ? "#C8F7D2" : "#FFB3AD",
                                    border: `1px solid ${met ? "rgba(76,175,80,.6)" : "rgba(244,67,54,.55)"}`,
                                  }}
                                >
                                  {met ? "\u2713 " : ""}{labelFor(r)}
                                </span>
                              );
                            })}
                          </div>
                          {!rolesOK && diffs.length > 0 && (
                            <div style={{
                              marginTop: 8,
                              fontSize: 11,
                              color: "rgba(255,255,255,.75)",
                              lineHeight: 1.45,
                            }}>
                              {diffs.map((d, i) => {
                                const [roleId, rest] = d.split(":");
                                const [act, req] = rest.split("/").map((s) => parseInt(s.trim(), 10));
                                const label = labelFor(roleId.trim());
                                if (act > req) return <div key={i}>{`Too many ${label}: ${act} assigned, need ${req}`}</div>;
                                if (act < req) return <div key={i}>{`Need ${req - act} more ${label}`}</div>;
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <button
                      className={`lb ${rolesOK ? "lb-green" : "lb-ghost"} fac-advance-btn`}
                      disabled={!rolesOK}
                      onClick={() => {
                        if (!rolesOK) {
                          if (!countOK) {
                            toast(`Need between ${MIN_PLAYERS} and ${MAX_PLAYERS} present players. Currently ${presentNonFac.length}.`);
                          } else if (diffs.length > 0) {
                            const labelFor = (roleId: string) => {
                              const base = ABILITIES.find(a => a.id === roleId);
                              if (!base) return roleId;
                              return getThemedAbility(base, scenarioData).label;
                            };
                            const msg = diffs.map((d) => {
                              const [roleId, rest] = d.split(":");
                              const [act, req] = rest.split("/").map((s) => parseInt(s.trim(), 10));
                              const label = labelFor(roleId.trim());
                              if (act > req) return `too many ${label}`;
                              if (act < req) return `missing ${label}`;
                              return "";
                            }).filter(Boolean).join(", ");
                            toast(`Fix role mix: ${msg}.`);
                          }
                          return;
                        }
                        handleSendRoles();
                      }}
                      title={rolesOK ? undefined : "Assign the exact role mix above before sending."}
                    >
                      ASSIGN ROLES TO ALL PLAYERS
                    </button>
                    {!countOK && (
                      <div style={{ fontSize: 10, color: "var(--textdd)", marginTop: 6, textAlign: "center" }}>
                        Need {MIN_PLAYERS}-{MAX_PLAYERS} players
                      </div>
                    )}
                  </>
                );
              })()}
              {rolesSent && !pairingsGenerated && (() => {
                const seenCount = presentNonFac.filter((p) => p.roleSeenAt).length;
                const allSeen = presentNonFac.length > 0 && seenCount === presentNonFac.length;
                return (
                  <>
                    <button
                      className={`lb ${allSeen ? "lb-yellow" : "lb-ghost"} fac-advance-btn`}
                      disabled={!allSeen}
                      onClick={handleGenerateAndStart}
                    >
                      {allSeen ? "START PAIR BUILD \u2192" : `WAITING FOR ROLES (${seenCount}/${presentNonFac.length})`}
                    </button>
                    {!allSeen && (
                      <div style={{ fontSize: 10, color: "var(--textdd)", marginTop: 6, textAlign: "center" }}>
                        Enabled once everyone taps to acknowledge their role card.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right: Ability + Citizen reference cards */}
          <div className="fac-right">
            <div className="fac-cards-header">
              <div className="slbl">ROLES REFERENCE</div>
              <div className="fac-cards-sub">
                One role per player. Use the personality hint to match each role to the right teammate.
              </div>
            </div>
            <div className="fac-card-grid">
              {/* Ability cards */}
              {ABILITIES.map((baseA) => {
                const a = getThemedAbility(baseA, scenarioData);
                const assignedTo = Object.entries(abilityAssignments).find(([, aid]) => aid === a.id);
                const assignedPlayer = assignedTo ? nonFac.find((p) => p._id === assignedTo[0]) : null;
                const abilityColors: Record<string, string> = {
                  mender: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740", citizen: "#EC407A",
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
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <AbilityBadge ability={a} size={72} />
                      </div>
                      {assignedPlayer && (
                        <div className="fac-card-taken-overlay">{assignedPlayer.name.toUpperCase()}</div>
                      )}
                    </div>
                    <div className="fac-card-bottom">
                      <div className="fac-card-title">{a.label}</div>
                      <div className="fac-card-hr-preview">{a.assignmentHint}</div>
                      <button
                        type="button"
                        className="fac-card-expand"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailAbilityId(baseA.id);
                        }}
                      >
                        View details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {detailAbilityId && (() => {
        const baseA = ABILITIES.find((x) => x.id === detailAbilityId);
        if (!baseA) return null;
        const colors: Record<string, string> = {
          mender: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043",
          anchor: "#66BB6A", diplomat: "#FFD740", citizen: "#EC407A",
        };
        return (
          <RoleDetailModal
            ability={baseA}
            scenario={scenarioData}
            color={colors[baseA.id] || "#B388FF"}
            onClose={() => setDetailAbilityId(null)}
          />
        );
      })()}

    </div>
  );
}
