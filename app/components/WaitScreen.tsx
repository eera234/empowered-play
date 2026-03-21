"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

export default function WaitScreen() {
  const { name, sessionId } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const otherPlayers = (players || []).filter((p) => !p.isFacilitator && p.name !== name);

  return (
    <div className="screen active" id="s-wait">
      <BrandBar />
      <div className="wait-wrap">
        <div className="wait-code-box">
          <div className="wc-lbl">YOU ARE IN</div>
          <div className="wc-name" id="wait-player-name">{name}</div>
          <div className="wc-sub">Waiting for the facilitator to start the game</div>
        </div>
        <div className="wait-players">
          {otherPlayers.map((p) => (
            <div key={p._id} className="wp-chip">
              <div className="dot" />
              {p.name}
            </div>
          ))}
        </div>
        <div className="wait-status">Waiting for facilitator to send cards&hellip;</div>
      </div>
    </div>
  );
}
