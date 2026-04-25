"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { VOTE_CATEGORIES, SCENARIOS } from "../../lib/constants";
import { playSound } from "../../lib/sound";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { toast } from "sonner";
import { getVoteCategoryIllustration } from "./VoteCategoryIllustrations";

export default function VoteScreen() {
  const [pairsOpen, setPairsOpen] = useState(true);
  const { sessionId, sessionCode, playerId, role, scenario } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const votes = useQuery(api.voting.getVotes, sessionId ? { sessionId } : "skip");
  const submitVote = useMutation(api.voting.submitVote);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

  const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
  const me = nonFac.find((p) => p._id === playerId);
  const isFacilitator = role === "facilitator";
  const scenarioId = scenario || session?.scenario || "rising_tides";
  const scenarioData = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  // My votes by category
  const myVotes = (votes ?? []).filter((v) => me && v.playerId === me._id);
  const myVoteByCategory = new Map(myVotes.map((v) => [v.category, v.targetPlayerId]));

  // Votes per target per category
  function countsFor(categoryId: string): Map<string, number> {
    const counts = new Map<string, number>();
    (votes ?? []).filter((v) => v.category === categoryId).forEach((v) => {
      counts.set(v.targetPlayerId, (counts.get(v.targetPlayerId) ?? 0) + 1);
    });
    return counts;
  }

  async function handleVote(categoryId: string, targetId: Id<"players">) {
    if (!sessionId || !me) return;
    if (targetId === me._id) {
      toast("You can't vote for yourself");
      return;
    }
    await submitVote({ sessionId, playerId: me._id, category: categoryId, targetPlayerId: targetId });
    playSound("vote-cast");
  }

  // Pass #17: only require present players to vote in every category. A
  // ghost who left during voting must not block advance to debrief.
  const presentNonFac = nonFac.filter((p) => p.isPresent !== false);
  const allVotesIn = presentNonFac.length > 0 && VOTE_CATEGORIES.every((cat) => {
    const voters = new Set((votes ?? []).filter((v) => v.category === cat.id).map((v) => v.playerId));
    return presentNonFac.every((p) => voters.has(p._id));
  });

  async function handleAdvance() {
    if (!sessionId) return;
    await advanceNewPhase({ sessionId, fromPhase: "vote" });
  }

  const allDoneForMe = VOTE_CATEGORIES.every((c) => myVoteByCategory.has(c.id));
  const isLoading = session === undefined || players === undefined || votes === undefined;

  // Pair reveal: architect → builder. `architectFor` is the id of the player
  // who built from this player's clues, so each architect–builder pair shows
  // once with the builder's district name attached.
  const pairs = nonFac
    .filter((p) => p.architectFor)
    .map((architect) => {
      const builder = nonFac.find((b) => b._id === architect.architectFor);
      if (!builder) return null;
      return { architect, builder };
    })
    .filter((x): x is { architect: typeof nonFac[number]; builder: typeof nonFac[number] } => x !== null);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
        <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--textd)" }}>
          Loading vote{"\u2026"}
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
        background: "linear-gradient(180deg, rgba(255,215,0,.08), transparent)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
          letterSpacing: 2.5, color: "var(--textd)", textTransform: "uppercase",
        }}>
          {scenarioData.title} {"\u00B7"} Final Round
        </div>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 26, letterSpacing: 2,
          color: "var(--acc1)", marginTop: 4,
        }}>
          VOTE + CELEBRATE
        </div>
        <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 6 }}>
          Your team rebuilt the {scenarioData.terminology.map}. Now honor the people who made it happen.
        </div>
      </div>

      {/* Pair reveal: who designed for whom */}
      {pairs.length > 0 && (
        <div style={{
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(147,51,234,.06), transparent)",
        }}>
          <button
            onClick={() => setPairsOpen((v) => !v)}
            style={{
              width: "100%", textAlign: "left", padding: "10px 14px",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 11, letterSpacing: 2, color: "#B388FF",
              textTransform: "uppercase",
            }}
            aria-expanded={pairsOpen}
          >
            <span style={{ fontSize: 16 }}>{"\u{1F3AD}"}</span>
            The Pairings Revealed
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--textd)" }}>
              {pairsOpen ? "\u2212" : "+"}
            </span>
          </button>
          {pairsOpen && (
            <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {pairs.map(({ architect, builder }) => {
                const iAmArchitect = me?._id === architect._id;
                const iAmBuilder = me?._id === builder._id;
                const highlight = iAmArchitect || iAmBuilder;
                return (
                  <div
                    key={architect._id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px",
                      background: highlight ? "rgba(147,51,234,.12)" : "rgba(255,255,255,.03)",
                      border: `1px solid ${highlight ? "rgba(147,51,234,.4)" : "var(--border)"}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <span style={{
                      fontWeight: 900, color: iAmArchitect ? "var(--acc1)" : "white",
                    }}>
                      {architect.name}{iAmArchitect && " (you)"}
                    </span>
                    <span style={{ color: "var(--textd)", fontSize: 11 }}>designed clues for</span>
                    <span style={{
                      fontWeight: 900, color: iAmBuilder ? "var(--acc1)" : "white",
                    }}>
                      {builder.name}{iAmBuilder && " (you)"}
                    </span>
                    {builder.districtName && (
                      <span style={{
                        marginLeft: "auto",
                        fontSize: 10, fontStyle: "italic",
                        color: "var(--textd)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        maxWidth: "45%",
                      }}>
                        {"\u2192"} {builder.districtName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
        {VOTE_CATEGORIES.map((cat) => {
          const myPick = myVoteByCategory.get(cat.id);
          const counts = countsFor(cat.id);
          const totalVotes = Array.from(counts.values()).reduce((a, b) => a + b, 0);

          return (
            <div
              key={cat.id}
              style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid var(--border)",
                borderRadius: "var(--brick-radius)",
                padding: 14, marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ flexShrink: 0 }}>
                  {(() => { const Art = getVoteCategoryIllustration(cat.id); return <Art size={40} />; })()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Black Han Sans', sans-serif", fontSize: 14, letterSpacing: 1.5,
                    color: "var(--acc1)",
                  }}>
                    {cat.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--textd)" }}>
                    {cat.question}
                  </div>
                </div>
              </div>

              {/* Candidate chips / results bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {nonFac.map((p) => {
                  const isMe = me && p._id === me._id;
                  const isMyPick = myPick === p._id;
                  const n = counts.get(p._id) ?? 0;
                  const pct = totalVotes > 0 ? Math.round((n / totalVotes) * 100) : 0;

                  return (
                    <button
                      key={p._id}
                      disabled={!!isMe || !me}
                      onClick={() => handleVote(cat.id, p._id)}
                      style={{
                        textAlign: "left", padding: "10px 12px",
                        background: isMyPick ? "rgba(255,215,0,.12)" : "rgba(255,255,255,.04)",
                        border: `1.5px solid ${isMyPick ? "var(--acc1)" : "var(--border)"}`,
                        borderRadius: 10,
                        color: "white",
                        cursor: isMe || !me ? "default" : "pointer",
                        opacity: isMe ? 0.45 : 1,
                        position: "relative", overflow: "hidden",
                      }}
                    >
                      {/* Neutral gold fill: same for everyone. We deliberately
                          don't highlight the leader; voting isn't competitive. */}
                      {n > 0 && (
                        <div style={{
                          position: "absolute", inset: 0,
                          background: `linear-gradient(90deg, rgba(255,215,0,.10) ${pct}%, transparent ${pct}%)`,
                          pointerEvents: "none",
                        }} />
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "var(--bg2)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontWeight: 900, fontSize: 12,
                        }}>
                          {p.name[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>
                            {p.name}{isMe && " (you)"}
                          </div>
                          {p.districtName && (
                            <div style={{ fontSize: 10, color: "var(--textd)" }}>
                              {p.districtName}
                            </div>
                          )}
                        </div>
                        {isMyPick && (
                          <span style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: 1,
                            color: "var(--acc1)",
                          }}>
                            YOUR VOTE
                          </span>
                        )}
                        {n > 0 && (
                          <div style={{
                            minWidth: 26, textAlign: "right",
                            fontSize: 12, fontWeight: 900, color: "var(--textd)",
                          }}>
                            {n}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
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
            ? `${myVotes.length}/${VOTE_CATEGORIES.length} of your votes in${allDoneForMe ? " \u2713" : ""}`
            : "Spectating"}
        </div>
        {isFacilitator ? (
          <button
            className="lb lb-green"
            style={{ fontSize: 11, padding: "8px 14px" }}
            onClick={handleAdvance}
          >
            {allVotesIn ? "FINISH \u2192" : "END VOTING \u2192"}
          </button>
        ) : (
          <div style={{ fontSize: 11, color: "var(--textd)" }}>
            {allVotesIn ? "All votes in. Waiting for facilitator." : "Waiting for everyone to vote"}
          </div>
        )}
      </div>
    </div>
  );
}
