"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

const PHASE_META: Record<string, { lbl: string; adv: string; btn: string }> = {
  card_reveal: { lbl: "Card Reveal", adv: "Wait until all players have read their card.", btn: "\u2192 Start Build Phase" },
  building: { lbl: "Building", adv: "Wait until all players finish their build.", btn: "\u2192 Open Upload" },
  uploading: { lbl: "Uploading", adv: "Wait until all players upload their district.", btn: "\u2192 Open City Map" },
  city_map: { lbl: "City Map", adv: "Let the team negotiate and place their districts. Proceed when everyone is happy with the layout.", btn: "\u2192 Start Constraint Reveal" },
  constraint_reveal: { lbl: "Constraint Reveal", adv: "Each architect reveals their card. Proceed when all cards are shown.", btn: "\u2192 Start Debrief" },
  debrief: { lbl: "Debrief", adv: "Allow time for all 3 questions. Proceed when done.", btn: "\u2192 End Session" },
  complete: { lbl: "Complete", adv: "Session complete.", btn: "\u2713 Done" },
};

export default function FacLiveScreen() {
  const { sessionCode, sessionId, goTo } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const advancePhase = useMutation(api.game.advancePhase);

  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  const uploaded = nonFac.filter((p) => p.uploaded).length;
  const phase = session?.phase || "card_reveal";
  const meta = PHASE_META[phase] || PHASE_META.card_reveal;

  return (
    <div className="screen active" id="s-fac-live">
      <BrandBar badge="FACILITATOR LIVE" />
      <div className="two-col">
        <div className="col-main">
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-lbl">PLAYERS</div>
              <div className="stat-val">{nonFac.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-lbl">UPLOADED</div>
              <div className="stat-val">{uploaded}</div>
            </div>
          </div>
          <div>
            <div className="slbl">Player status</div>
            <div className="p-list">
              {nonFac.map((p) => (
                <div key={p._id} className="p-row">
                  <div className="pr-name">{p.name}</div>
                  <span style={{ fontSize: 11, color: "var(--textd)" }}>
                    {p.cardSent ? "\u2713 card" : "\u2022 waiting"}{" "}
                    {p.uploaded ? "\u2713 uploaded" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="slbl">
              Current phase: <span style={{ color: "var(--acc1)" }}>{meta.lbl}</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--textd)",
                lineHeight: 1.8,
                background: "var(--bg2)",
                borderRadius: 10,
                padding: "12px 14px",
                border: "1px solid var(--borderl)",
              }}
            >
              Watch who finishes quickly, who hesitates. In the city map phase, note who dominates
              conversation and who waits to be invited. Debrief: ask questions &mdash; don&apos;t
              tell. Let the group surface what happened.
            </div>
          </div>
        </div>
        <div className="col-side">
          <div className="adv-box">
            <div className="adv-lbl">ADVANCE PHASE</div>
            <div className="adv-desc">{meta.adv}</div>
            <button
              className="lb lb-yellow"
              style={{ fontSize: 12, padding: "10px 14px" }}
              onClick={() => sessionId && advancePhase({ sessionId })}
            >
              {meta.btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
