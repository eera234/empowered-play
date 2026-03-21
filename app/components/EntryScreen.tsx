"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGame } from "../GameContext";

export default function EntryScreen() {
  const { goTo, set } = useGame();
  const createSession = useMutation(api.game.createSession);
  const joinAsFac = useMutation(api.game.joinSession);
  const cards = useQuery(api.game.getCards, {});

  async function handleFacilitator() {
    const res = await createSession({ scenario: "The Flooded City" });
    const joinRes = await joinAsFac({
      code: res.code,
      name: "Facilitator",
      isFacilitator: true,
    });
    set({
      role: "facilitator",
      sessionCode: res.code,
      sessionId: res.sessionId,
      playerId: joinRes.playerId,
    });
    goTo("s-fac-setup");
  }

  return (
    <div className="screen active" id="s-entry">
      <div className="entry-inner">
        <div className="game-logo">CITYSCAPE EDITION</div>
        <div className="game-title">(Em)Powered Play</div>
        <div className="game-sub">A structural team dynamics game</div>
        <div className="mode-row">
          <div className="mode-card" onClick={handleFacilitator}>
            <div className="mc-icon" style={{ background: "rgba(255,215,0,.15)" }}>
              🎯
            </div>
            <div className="mc-lbl">FACILITATOR</div>
            <div className="mc-sub">
              Create a session, assign constraint cards, and guide the experience
            </div>
          </div>
          <div className="mode-card" onClick={() => goTo("s-join")}>
            <div className="mc-icon" style={{ background: "rgba(79,195,247,.15)" }}>
              🏗️
            </div>
            <div className="mc-lbl">PLAYER</div>
            <div className="mc-sub">
              Join with a code, receive your secret constraint, and build your district
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
