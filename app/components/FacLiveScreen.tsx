"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS, SCENARIOS } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import WaterMap from "./maps/WaterMap";
import SpaceMap from "./maps/SpaceMap";
import VoiceRecorder from "./VoiceRecorder";
import CardIcon from "./CardIcon";

const PHASE_META: Record<string, { lbl: string; adv: string; btn: string | null }> = {
  card_reveal: { lbl: "Card Reveal", adv: "All players must open and read their card before you can start the build phase.", btn: "Start Build Phase" },
  building: { lbl: "Building", adv: "Players are building in isolation. When their timer runs out they will upload and move to the city map.", btn: null },
  uploading: { lbl: "Uploading", adv: "Players are uploading their builds and placing them on the city map.", btn: null },
  city_map: { lbl: "City Map", adv: "Players are collaborating on the map. Start the debrief when you're ready.", btn: "Start Debrief" },
  debrief: { lbl: "Debrief", adv: "Reflective questions before the big reveal. Let everyone answer.", btn: "Reveal Constraints" },
  constraint_reveal: { lbl: "Constraint Reveal", adv: "Each architect's constraint is being revealed.", btn: "End Session" },
  complete: { lbl: "Complete", adv: "Session complete.", btn: null },
};

export default function FacLiveScreen() {
  const { sessionCode, sessionId, scenario } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const messages = useQuery(api.game.getMessages, sessionId ? { sessionId } : "skip");
  const advancePhase = useMutation(api.game.advancePhase);
  const sendMessage = useMutation(api.game.sendMessage);
  const [tab, setTab] = useState<"dashboard" | "map">("dashboard");
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  const nonFac = (players || []).filter((p) => !p.isFacilitator);
  const uploaded = nonFac.filter((p) => p.uploaded).length;
  const cardsRead = nonFac.filter((p) => p.cardRead).length;
  const phase = session?.phase || "card_reveal";
  const meta = PHASE_META[phase] || PHASE_META.card_reveal;
  const scenarioData = SCENARIOS.find((s) => s.id === (scenario || session?.scenario)) || SCENARIOS[0];

  const allCardsRead = nonFac.length > 0 && nonFac.every((p) => p.cardRead);
  const canAdvance = phase !== "card_reveal" || allCardsRead;
  const showMapTab = ["building", "uploading", "city_map", "debrief", "constraint_reveal"].includes(phase);

  // Auto-scroll chat
  useEffect(() => {
    if (messages && messages.length > prevMsgCount.current && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    prevMsgCount.current = messages?.length || 0;
  }, [messages?.length]);

  function handleAdvance() {
    if (!sessionId) return;
    if (phase === "card_reveal" && !allCardsRead) {
      toast("Not all players have read their card yet");
      return;
    }
    advancePhase({ sessionId });
  }

  async function handleSendChat() {
    if (!sessionId) return;
    const txt = chatInput.trim();
    if (!txt) return;
    setChatInput("");
    await sendMessage({ sessionId, sender: "Facilitator", text: txt, isFacilitator: true });
  }

  async function handleVoiceNote(audioDataUrl: string) {
    if (!sessionId) return;
    await sendMessage({ sessionId, sender: "Facilitator", text: "\u{1F3A4} Voice note", isFacilitator: true, audioDataUrl });
  }

  return (
    <div className="screen active" id="s-fac-live">
      <BrandBar badge="FACILITATOR LIVE" />

      {/* Tab bar — shows map tab once building starts */}
      {showMapTab && (
        <div style={{ display: "flex", gap: 0, background: "var(--bg1)", borderBottom: "1px solid var(--borderl)", flexShrink: 0 }}>
          <button
            onClick={() => setTab("dashboard")}
            style={{
              flex: 1, padding: "10px 0", background: tab === "dashboard" ? "var(--bg2)" : "transparent",
              border: "none", borderBottom: tab === "dashboard" ? "2px solid var(--acc1)" : "2px solid transparent",
              color: tab === "dashboard" ? "var(--acc1)" : "var(--textd)",
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, cursor: "pointer",
            }}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => setTab("map")}
            style={{
              flex: 1, padding: "10px 0", background: tab === "map" ? "var(--bg2)" : "transparent",
              border: "none", borderBottom: tab === "map" ? "2px solid var(--acc2)" : "2px solid transparent",
              color: tab === "map" ? "var(--acc2)" : "var(--textd)",
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, cursor: "pointer",
            }}
          >
            MAP VIEW
          </button>
        </div>
      )}

      {/* Dashboard tab */}
      {tab === "dashboard" && (
        <div className="two-col">
          <div className="col-main">
            <div className="stat-grid">
              <div className="stat-box">
                <div className="stat-lbl">PLAYERS</div>
                <div className="stat-val">{nonFac.length}</div>
              </div>
              <div className="stat-box">
                <div className="stat-lbl">{phase === "card_reveal" ? "CARDS READ" : "UPLOADED"}</div>
                <div className="stat-val">{phase === "card_reveal" ? cardsRead : uploaded}</div>
              </div>
            </div>
            <div>
              <div className="slbl">Player status</div>
              <div className="p-list">
                {nonFac.map((p) => {
                  const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
                  return (
                    <div key={p._id} className="p-row">
                      <div className="pr-name">{p.name}</div>
                      <span style={{ fontSize: 11, color: "var(--textd)", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        {card && <span style={{ color: card.color, display: "inline-flex", alignItems: "center", gap: 3 }}><CardIcon icon={card.icon} size={12} /> {card.title}</span>}
                        {p.cardSent && (p.cardRead
                          ? <span style={{ color: "var(--acc4)" }}>{"\u2713"} read</span>
                          : <span style={{ color: "var(--acc1)" }}>unopened</span>
                        )}
                        {p.uploaded && <span style={{ color: "var(--acc4)" }}>{"\u2713"} uploaded</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="slbl">
                Current phase: <span style={{ color: "var(--acc1)" }}>{meta.lbl}</span>
              </div>
            </div>
          </div>
          <div className="col-side">
            <div className="adv-box">
              <div className="adv-lbl">{meta.btn ? "ADVANCE PHASE" : "CURRENT PHASE"}</div>
              <div className="adv-desc">{meta.adv}</div>
              {phase === "card_reveal" && !allCardsRead && (
                <div style={{ fontSize: 11, color: "var(--acc3)", fontWeight: 800 }}>
                  {cardsRead}/{nonFac.length} cards read
                </div>
              )}
              {meta.btn && (
                <button
                  className={`lb ${canAdvance ? "lb-yellow" : "lb-ghost"}`}
                  style={{ fontSize: 12, padding: "10px 14px" }}
                  disabled={!canAdvance}
                  onClick={handleAdvance}
                >
                  {meta.btn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map tab — read-only map view + chat */}
      {tab === "map" && (
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Map area */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "var(--bg0)" }}>
            {scenarioData.mapTheme === "water" && <WaterMap slots={[]} occupiedSlotIds={new Set()} />}
            {scenarioData.mapTheme === "space" && <SpaceMap slots={[]} occupiedSlotIds={new Set()} />}
            {scenarioData.mapTheme !== "water" && scenarioData.mapTheme !== "space" && (
              <div className="map-img-wrap"><div style={{ background: "var(--bg0)", width: "100%", height: "100%" }} /></div>
            )}
            {/* District cards on map (read-only, not draggable) */}
            {nonFac.filter((p) => p.uploaded).map((p) => {
              const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
              const distName = card ? scenarioData.districtNames[card.id] : p.districtName;
              // Position using slot percentage data saved in x/y when slotId exists
              const hasSlot = p.slotId && p.x != null && p.y != null;
              return (
                <div
                  key={p._id}
                  className="dist-card"
                  style={{
                    left: hasSlot ? p.x + "%" : (p.x ?? 50) + "px",
                    top: hasSlot ? p.y + "%" : (p.y ?? 50) + "px",
                    transform: hasSlot ? "translate(-50%, -50%)" : undefined,
                    borderColor: card ? card.color + "66" : undefined,
                    cursor: "default",
                  }}
                >
                  {p.photoDataUrl ? (
                    <img className="dc-photo" src={p.photoDataUrl} alt="" />
                  ) : (
                    <div className="dc-placeholder">{card ? <CardIcon icon={card.icon} size={24} /> : "\u{1F3D9}\uFE0F"}</div>
                  )}
                  <div className="dc-name">{distName || p.districtName || p.name}</div>
                  <div className="dc-tag">{p.name}</div>
                </div>
              );
            })}
            {/* Phase indicator only — advance is on the dashboard tab */}
            <div style={{ position: "absolute", top: 10, left: 12, zIndex: 20, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", borderRadius: 6, padding: "6px 12px", fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "var(--acc1)" }}>
              {meta.lbl.toUpperCase()}
            </div>
          </div>

          {/* Chat sidebar */}
          <div style={{ width: 280, background: "var(--bg1)", borderLeft: "1px solid var(--borderl)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--borderl)" }}>
              <div className="slbl" style={{ marginBottom: 0 }}>TEAM CHAT</div>
            </div>
            <div ref={chatRef} className="chat-msgs" style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {(messages || []).map((msg) => (
                <div key={msg._id} className="cm">
                  <div className="cm-name">{msg.sender}{msg.isFacilitator ? " \u{1F3AF}" : ""}</div>
                  <div className={`cm-bubble ${msg.isFacilitator ? "fac" : ""}`}>
                    {msg.audioDataUrl ? (
                      <audio src={msg.audioDataUrl} controls preload="none" className="cm-audio" />
                    ) : msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderTop: "1px solid var(--borderl)" }}>
              <input
                className="chat-input"
                type="text"
                placeholder="Message the team..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              />
              <VoiceRecorder onRecorded={handleVoiceNote} />
              <button className="chat-send" onClick={handleSendChat}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="#0a0a12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
