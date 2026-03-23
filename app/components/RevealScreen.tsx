"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";
import CardIcon from "./CardIcon";

export default function RevealScreen() {
  const { sessionId, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const nonFac = (players || []).filter((p) => !p.isFacilitator);

  return (
    <div className="screen active" id="s-reveal">
      <BrandBar backTo="s-debrief">
        <PhaseBar current={5} />
      </BrandBar>
      <div className="rev-inner">
        <div style={{ textAlign: "center", maxWidth: 520, width: "100%" }}>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 8 }}>
            THE CITY STANDS
          </div>
          <div style={{ fontSize: 14, color: "var(--textd)", lineHeight: 1.7 }}>
            Now each architect reveals their constraint for the first time. Tap each person to
            hear the hidden rule that shaped their district.
          </div>
        </div>
        <div className="rev-cards">
          {nonFac.map((p, i) => {
            const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
            const isOpen = openIdx === i;
            return (
              <div
                key={p._id}
                className={`rev-row${isOpen ? " open" : ""}`}
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <div
                  className="rev-av"
                  style={card ? { background: card.color + "33", color: card.color } : {}}
                >
                  {p.name[0]}
                </div>
                <div className="rev-r">
                  <div className="rev-name">{p.name}</div>
                  <div className="rev-district">District: {p.districtName || "\u2014"}</div>
                  {!isOpen && (
                    <div className="rev-sealed">🔒 sealed &mdash; tap to reveal</div>
                  )}
                  {isOpen && card && (
                    <div className="rev-content open">
                      <div className="rev-ctitle"><span style={{ color: card.color }}><CardIcon icon={card.icon} size={16} /></span> {card.title}</div>
                      <div className="rev-ctext">{card.shapeHint}</div>
                      <div className="rev-ctext" style={{ marginTop: 6 }}>
                        <em>&ldquo;{card.mapClue}&rdquo;</em>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className="lb lb-red" onClick={() => goTo("s-complete")} style={{ width: "100%", maxWidth: 580 }}>
          COMPLETE SESSION &rarr;
        </button>
      </div>
    </div>
  );
}
