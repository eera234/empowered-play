"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { CARDS } from "../../lib/constants";
import CardIcon from "./CardIcon";

type AssignMode =
  | { step: "idle" }
  | { step: "card_selected"; cardIndex: number }
  | { step: "player_selected"; playerId: Id<"players"> };

export default function FacSetupScreen() {
  const { sessionCode, sessionId, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const assignCard = useMutation(api.game.assignCard);
  const advancePhase = useMutation(api.game.advancePhase);

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
              style={{ background: CARDS[expandedCard].color }}
            />
            <div className="card-modal-body">
              <div className="card-modal-icon"><CardIcon icon={CARDS[expandedCard].icon} size={52} /></div>
              <div
                className="card-modal-title"
                style={{ color: CARDS[expandedCard].color }}
              >
                {CARDS[expandedCard].title}
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">SHAPE CONSTRAINT</div>
                <div className="card-modal-rule">{CARDS[expandedCard].shapeHint}</div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">MAP PLACEMENT</div>
                <div className="card-modal-rule">{CARDS[expandedCard].mapRule}</div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl" style={{ color: "var(--acc2)" }}>
                  BUILD TIME: {CARDS[expandedCard].buildTime} MINUTES
                </div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl card-modal-hr-lbl">
                  HR INSIGHT
                </div>
                <div className="card-modal-hr">{CARDS[expandedCard].hrNote}</div>
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

      <div className="fac-layout">
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
                  p.cardSent && p.cardIndex != null ? CARDS[p.cardIndex] : null;
                const pendingCardData =
                  pendingCard != null ? CARDS[pendingCard] : null;
                const isTargeted =
                  assignMode.step === "player_selected" &&
                  assignMode.playerId === p._id;

                return (
                  <div
                    key={p._id}
                    className={`fac-player-row${isTargeted ? " targeted" : ""}${p.cardSent ? " sent" : ""}`}
                    onClick={() => handlePlayerTap(p._id)}
                  >
                    <div className="fac-player-avatar">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div className="fac-player-info">
                      <div className="fac-player-name">{p.name}</div>
                      {assignedCard && (
                        <div
                          className="fac-player-card-tag"
                          style={{
                            borderColor: assignedCard.color + "66",
                            color: assignedCard.color,
                          }}
                        >
                          <CardIcon icon={assignedCard.icon} size={14} /> {assignedCard.title} — SENT
                        </div>
                      )}
                      {pendingCardData && !p.cardSent && (
                        <div
                          className="fac-player-card-tag pending"
                          style={{
                            borderColor: pendingCardData.color + "66",
                            color: pendingCardData.color,
                          }}
                        >
                          <CardIcon icon={pendingCardData.icon} size={14} /> {pendingCardData.title}
                        </div>
                      )}
                      {!assignedCard && !pendingCardData && (
                        <div className="fac-player-no-card">
                          Tap a card, then this player
                        </div>
                      )}
                    </div>
                    <div className="fac-player-actions">
                      {p.cardSent ? (
                        <div className="fac-sent-badge">SENT</div>
                      ) : pendingCardData ? (
                        <div className="fac-player-btns">
                          <button
                            className="lb lb-green fac-send-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendCard(p._id);
                            }}
                          >
                            SEND
                          </button>
                          <button
                            className="fac-undo-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassign(p._id);
                            }}
                          >
                            UNDO
                          </button>
                        </div>
                      ) : null}
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
            {CARDS.map((c, i) => {
              const taken = takenCardIndices.has(i);
              const isSelected =
                assignMode.step === "card_selected" &&
                assignMode.cardIndex === i;

              return (
                <div
                  key={c.id}
                  className={`fac-card${taken ? " taken" : ""}${isSelected ? " selected" : ""}`}
                  style={{
                    "--card-color": c.color,
                  } as React.CSSProperties}
                  onClick={() => !taken && handleCardTap(i)}
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
                    <div className="fac-card-icon"><CardIcon icon={c.icon} size={42} /></div>
                    {taken && <div className="fac-card-taken-overlay">ASSIGNED</div>}
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
