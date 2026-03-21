"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";

export default function CardRevealScreen() {
  const { playerId, sessionId, set, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const [opened, setOpened] = useState(false);

  const me = (players || []).find((p) => p._id === playerId);
  const card = me?.cardIndex != null ? CARDS[me.cardIndex] : null;

  // Store card in game context when assigned
  useEffect(() => {
    if (card) set({ myCard: card });
  }, [card, set]);

  function handleOpen() {
    if (!card) return;
    setOpened(true);
  }

  return (
    <div className="screen active" id="s-card">
      <BrandBar>
        <PhaseBar current={1} />
      </BrandBar>
      <div className="card-inner">
        <div className="brief-box">
          <div className="brief-lbl">MISSION BRIEFING &mdash; THE FLOODED CITY</div>
          <div className="brief-txt">
            Rising waters destroyed the old city. Your team are the architects sent to rebuild it.
            Each of you has a <strong>sealed constraint card</strong> &mdash; a hidden rule that
            shapes how you build. <strong>Do not share it with anyone until the reveal phase.</strong>
          </div>
        </div>

        {!opened && (
          <div className="env-outer" onClick={handleOpen}>
            <div className="env-body">
              <div className="env-seal" style={card ? { color: card.color } : {}}>
                S
              </div>
              <div className="env-lbl">YOUR CONSTRAINT CARD</div>
              <div className="env-hint">
                {card ? "tap to unseal" : "Waiting for facilitator\u2026"}
              </div>
            </div>
          </div>
        )}

        {opened && card && (
          <div
            className="crd-open"
            style={{ display: "block", borderColor: card.color, boxShadow: `0 0 30px ${card.color}22` }}
          >
            <div className="crd-lbl" style={{ color: card.color }}>
              YOUR CONSTRAINT &mdash; READ ONLY
            </div>
            <div className="crd-icon-big">{card.icon}</div>
            <div className="crd-title" style={{ color: card.color }}>
              {card.title}
            </div>
            <div className="crd-rule">{card.rule}</div>
            <div className="crd-secret">🔒 Read only. Do not share until the reveal.</div>
          </div>
        )}

        <button
          className="lb lb-red"
          disabled={!opened}
          onClick={() => goTo("s-build")}
        >
          I&apos;VE READ MY CARD &rarr;
        </button>
      </div>
    </div>
  );
}
