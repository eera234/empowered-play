"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS, SCENARIOS, getThemedCard } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";
import CardIcon from "./CardIcon";

export default function CardRevealScreen() {
  const { playerId, sessionId, sessionCode, set, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const markCardRead = useMutation(api.game.markCardRead);
  const [opened, setOpened] = useState(false);

  const me = (players || []).find((p) => p._id === playerId);
  const baseCard = me?.cardIndex != null ? CARDS[me.cardIndex] : null;
  const scenario = SCENARIOS.find((s) => s.id === session?.scenario) || SCENARIOS[0];
  const card = baseCard ? getThemedCard(baseCard, scenario) : null;
  const districtName = card ? scenario.districtNames[card.id] : null;
  const termDistrict = scenario.terminology.district;

  // Store themed card in game context when assigned
  // Depend on stable values (cardIndex + scenario ID), not the card object
  const cardIndex = me?.cardIndex;
  const scenarioId = session?.scenario;
  useEffect(() => {
    if (cardIndex != null && scenarioId) {
      const base = CARDS[cardIndex];
      const scen = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
      set({ myCard: getThemedCard(base, scen) });
    }
  }, [cardIndex, scenarioId, set]);

  function handleOpen() {
    if (!card || !playerId) return;
    setOpened(true);
    markCardRead({ playerId });
  }

  return (
    <div className="screen active" id="s-card">
      <BrandBar>
        <PhaseBar current={1} />
      </BrandBar>
      <div className="card-inner">
        <div className="brief-box">
          <div className="brief-lbl">MISSION BRIEFING {scenario.title.toUpperCase()}</div>
          <div className="brief-txt">
            {scenario.briefing}{" "}
            <strong>Do not share your constraint with anyone until the reveal phase.</strong>
          </div>
        </div>

        {!opened && (
          <div className="env-outer" onClick={handleOpen}>
            <div className="env-body">
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12, position: "relative", zIndex: 1 }}>
                <div className="lego-stud-3d" />
                <div className="lego-stud-3d" />
                <div className="lego-stud-3d" />
                <div className="lego-stud-3d" />
              </div>
              <div className="env-seal" style={card ? { color: card.color } : {}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", zIndex: 1 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
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
            style={{ borderColor: card.color, boxShadow: `0 6px 0 rgba(0,0,0,.4), 0 0 40px ${card.color}22` }}
          >
            <div className="crd-studs-row">
              <div className="lego-stud-3d" />
              <div className="lego-stud-3d" />
              <div className="lego-stud-3d" />
              <div className="lego-stud-3d" />
            </div>
            <div className="crd-accent" style={{ background: card.color }} />
            <div className="crd-body-inner">
              <div className="crd-lbl" style={{ color: card.color }}>
                YOUR CONSTRAINT
              </div>
              <div className="crd-icon-big" style={{ color: card.color }}><CardIcon icon={card.icon} size={48} /></div>
              <div className="crd-title" style={{ color: card.color }}>
                {districtName || card.title}
              </div>
              <div className="crd-rule">{card.shapeHint}</div>
              <div className="crd-rule" style={{ marginTop: 10, fontStyle: "italic", opacity: 0.7 }}>
                &ldquo;{card.mapClue}&rdquo;
              </div>
              <div className="crd-time">
                Build time: <strong>{card.buildTime} minutes</strong>
              </div>
              <div className="classified-stamp">CLASSIFIED</div>
            </div>
          </div>
        )}

        {!opened ? (
          <div style={{ fontSize: 13, color: "var(--textd)", textAlign: "center" }}>
            Tap the envelope above to reveal your card
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--acc4)", fontWeight: 800, marginBottom: 6 }}>
              &#10003; Card read
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)" }}>
              Waiting for the facilitator to start the build phase...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
