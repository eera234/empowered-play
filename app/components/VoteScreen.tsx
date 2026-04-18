"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { VOTE_CATEGORIES, SCENARIOS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { toast } from "sonner";

export default function VoteScreen() {
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

  function winnerFor(categoryId: string): string | null {
    const counts = countsFor(categoryId);
    let bestId: string | null = null;
    let bestN = 0;
    counts.forEach((n, id) => { if (n > bestN) { bestN = n; bestId = id; } });
    return bestN > 0 ? bestId : null;
  }

  async function handleVote(categoryId: string, targetId: Id<"players">) {
    if (!sessionId || !me) return;
    if (targetId === me._id) {
      toast("You can't vote for yourself");
      return;
    }
    await submitVote({ sessionId, playerId: me._id, category: categoryId, targetPlayerId: targetId });
  }

  // All votes in: every non-fac player has voted in every category
  const allVotesIn = nonFac.length > 0 && VOTE_CATEGORIES.every((cat) => {
    const voters = new Set((votes ?? []).filter((v) => v.category === cat.id).map((v) => v.playerId));
    return nonFac.every((p) => voters.has(p._id));
  });

  async function handleAdvance() {
    if (!sessionId) return;
    await advanceNewPhase({ sessionId });
  }

  const allDoneForMe = VOTE_CATEGORIES.every((c) => myVoteByCategory.has(c.id));
  const isLoading = session === undefined || players === undefined || votes === undefined;

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

      {/* Categories */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
        {VOTE_CATEGORIES.map((cat) => {
          const myPick = myVoteByCategory.get(cat.id);
          const counts = countsFor(cat.id);
          const totalVotes = Array.from(counts.values()).reduce((a, b) => a + b, 0);
          const winnerId = winnerFor(cat.id);

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
                <div style={{ fontSize: 26 }}>{cat.icon}</div>
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
                  const isWinner = winnerId === p._id && totalVotes > 0;

                  return (
                    <button
                      key={p._id}
                      disabled={!!isMe || !me}
                      onClick={() => handleVote(cat.id, p._id)}
                      style={{
                        textAlign: "left", padding: "10px 12px",
                        background: isMyPick ? "rgba(255,215,0,.12)" : "rgba(255,255,255,.04)",
                        border: `1.5px solid ${isMyPick ? "var(--acc1)" : isWinner ? "rgba(105,240,174,.45)" : "var(--border)"}`,
                        borderRadius: 10,
                        color: "white",
                        cursor: isMe || !me ? "default" : "pointer",
                        opacity: isMe ? 0.45 : 1,
                        position: "relative", overflow: "hidden",
                      }}
                    >
                      {/* Count bar fill */}
                      {n > 0 && (
                        <div style={{
                          position: "absolute", inset: 0,
                          background: `linear-gradient(90deg, ${isWinner ? "rgba(105,240,174,.12)" : "rgba(79,195,247,.10)"} ${pct}%, transparent ${pct}%)`,
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
                        {isWinner && (
                          <span style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: 1,
                            color: "var(--acc4)", marginRight: 6,
                          }}>
                            LEADING
                          </span>
                        )}
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
            {allVotesIn ? "All votes in \u2014 waiting for facilitator" : "Waiting for everyone to vote"}
          </div>
        )}
      </div>
    </div>
  );
}
