"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

export default function JoinScreen() {
  const { goTo, set } = useGame();
  const joinSession = useMutation(api.game.joinSession);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canJoin = name.trim().length > 0 && code.trim().length >= 4;

  async function handleJoin() {
    setError("");
    setLoading(true);
    try {
      const res = await joinSession({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        isFacilitator: false,
      });
      if (!res.success) {
        setError(res.error || "Unknown error");
        return;
      }
      set({
        role: "player",
        name: name.trim(),
        sessionCode: code.trim().toUpperCase(),
        sessionId: res.sessionId,
        playerId: res.playerId,
      });
      goTo("s-wait");
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen active" id="s-join">
      <BrandBar backTo="s-entry" />
      <div className="join-wrap">
        <div className="join-card">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 4 }}>
              JOIN A SESSION
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)" }}>
              Enter your name and the code from your facilitator
            </div>
          </div>
          <div>
            <label className="field-lbl">Your name</label>
            <input
              className="linput"
              type="text"
              placeholder="e.g. Alex"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-lbl">Session code</label>
            <input
              className="linput code-s"
              type="text"
              placeholder="ENTER CODE"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          {error && <div className="err-msg show">{error}</div>}
          <button
            className="lb lb-red"
            disabled={!canJoin || loading}
            onClick={handleJoin}
            style={{ width: "100%" }}
          >
            {loading ? "Joining\u2026" : "ENTER THE MISSION \u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}
