"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { CARDS } from "../../lib/constants";

export default function FacSetupScreen() {
  const { sessionCode, sessionId, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const assignCard = useMutation(api.game.assignCard);
  const advancePhase = useMutation(api.game.advancePhase);
  const [localAssignments, setLocalAssignments] = useState<Record<string, number>>({});

  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  const assignedCount = nonFac.filter((p) => p.cardSent).length;

  function handleSelectCard(playerId: Id<"players">, cardIndex: number) {
    setLocalAssignments((prev) => ({ ...prev, [playerId]: cardIndex }));
  }

  async function handleSendCard(playerId: Id<"players">) {
    const cardIndex = localAssignments[playerId];
    if (cardIndex == null) {
      toast("Select a card first");
      return;
    }
    await assignCard({ playerId, cardIndex });
    toast(`Card sent to player`);
  }

  async function handleAdvance() {
    if (!sessionId) return;
    await advancePhase({ sessionId });
  }

  return (
    <div className="screen active" id="s-fac-setup">
      <BrandBar badge="FACILITATOR" backTo="s-entry" />
      <div className="two-col">
        <div className="col-main">
          <div>
            <div className="slbl">Session code</div>
            <div className="code-box" style={{ marginBottom: 12 }}>
              <div className="code-big">{sessionCode}</div>
              <div className="code-hint">Share this with your team &mdash; they enter it on their phones</div>
            </div>
          </div>
          <div>
            <div className="slbl">Players in session ({nonFac.length})</div>
            <div className="fac-note" style={{ marginBottom: 10 }}>
              Assign a card to each player. For each player, pick the card that fits their dynamic.
              Read the HR note under each card name before deciding. Once assigned, the card goes
              only to that player &mdash; nobody else sees it.
            </div>
            <div className="p-list">
              {nonFac.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--textdd)", padding: "12px 0" }}>
                  Waiting for players to join&hellip;
                </div>
              )}
              {nonFac.map((p) => {
                const selected = p.cardSent ? p.cardIndex : localAssignments[p._id];
                const takenIndices = nonFac
                  .filter((pl) => pl.cardSent && pl._id !== p._id)
                  .map((pl) => pl.cardIndex);

                return (
                  <div key={p._id} className="p-row">
                    <div className="pr-name">{p.name}</div>
                    <select
                      className="pr-card-sel"
                      value={selected ?? ""}
                      disabled={p.cardSent}
                      onChange={(e) => handleSelectCard(p._id, parseInt(e.target.value))}
                    >
                      <option value="">&mdash; assign card &mdash;</option>
                      {CARDS.map((c, i) => (
                        <option
                          key={i}
                          value={i}
                          disabled={takenIndices.includes(i)}
                        >
                          {c.icon} {c.title}{takenIndices.includes(i) ? " (taken)" : ""}
                        </option>
                      ))}
                    </select>
                    {p.cardSent ? (
                      <span className="pr-sent">&check; sent</span>
                    ) : (
                      <button
                        className="pr-send"
                        disabled={localAssignments[p._id] == null}
                        onClick={() => handleSendCard(p._id)}
                      >
                        SEND
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="slbl">Cards not yet assigned</div>
            <div style={{ fontSize: 13, color: "var(--textd)" }}>
              {assignedCount} of {nonFac.length} players assigned
            </div>
          </div>
        </div>
        <div className="col-side">
          <div className="adv-box">
            <div className="adv-lbl">ADVANCE TO GAME</div>
            <div className="adv-desc">
              Assign a card to every player first. Then advance &mdash; each player&apos;s sealed
              envelope appears on their screen.
            </div>
            <button
              className="lb lb-yellow"
              style={{ fontSize: 12, padding: "10px 14px" }}
              onClick={handleAdvance}
            >
              START &mdash; SEND CARDS &rarr;
            </button>
          </div>
          <div>
            <div className="slbl">All 8 cards &mdash; tap to read</div>
            <div className="card-preview-list">
              {CARDS.map((c) => (
                <div key={c.id} className="cpv-row">
                  <div className="cpv-icon">{c.icon}</div>
                  <div>
                    <div className="cpv-title" style={{ color: c.color }}>{c.title}</div>
                    <div className="cpv-note">{c.hrNote}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
