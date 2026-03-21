"use client";

import { useState, useRef, useEffect, useCallback, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useGame } from "../GameContext";

interface DragState {
  el: HTMLElement | null;
  off: { x: number; y: number };
  playerId: Id<"players"> | null;
}

export default function CityMapScreen() {
  const { playerId, sessionId, name, role, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const messages = useQuery(api.game.getMessages, sessionId ? { sessionId } : "skip");
  const moveDistrict = useMutation(api.game.moveDistrict);
  const sendMessage = useMutation(api.game.sendMessage);
  const prevMsgCountRef = useRef(0);
  const chatMsgsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({ el: null, off: { x: 0, y: 0 }, playerId: null });
  const [chatInput, setChatInput] = useState("");

  const nonFac = (players || []).filter((p) => !p.isFacilitator && p.uploaded);

  // Scroll chat on new messages
  useEffect(() => {
    if (messages && messages.length > prevMsgCountRef.current && chatMsgsRef.current) {
      chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
    }
    prevMsgCountRef.current = messages?.length || 0;
  }, [messages?.length]);

  // Connection meter
  const connectionPct = useCallback(() => {
    if (nonFac.length < 2) return 0;
    let connected = 0;
    for (let i = 0; i < nonFac.length; i++) {
      for (let j = i + 1; j < nonFac.length; j++) {
        const a = nonFac[i], b = nonFac[j];
        if (a.x != null && b.x != null) {
          const dx = Math.abs((a.x || 0) - (b.x || 0));
          const dy = Math.abs((a.y || 0) - (b.y || 0));
          if (dx < 150 && dy < 150) connected++;
        }
      }
    }
    const total = (nonFac.length * (nonFac.length - 1)) / 2;
    return Math.min(100, Math.round((connected / total) * 100));
  }, [nonFac]);

  // Drag handlers
  function startDrag(e: MouseEvent | TouchEvent, pId: Id<"players">) {
    if (pId !== playerId) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : e;
    dragRef.current = { el, off: { x: touch.clientX - r.left, y: touch.clientY - r.top }, playerId: pId };
    el.classList.add("dragging");
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
  }

  function onDragMove(e: globalThis.MouseEvent | globalThis.TouchEvent) {
    const d = dragRef.current;
    if (!d.el || !mapRef.current) return;
    if ("touches" in e) e.preventDefault();
    const touch = "touches" in e ? e.touches[0] : e;
    const ar = mapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(ar.width - 120, touch.clientX - ar.left - d.off.x));
    const y = Math.max(0, Math.min(ar.height - 120, touch.clientY - ar.top - d.off.y));
    d.el.style.left = x + "px";
    d.el.style.top = y + "px";
  }

  function onDragEnd() {
    const d = dragRef.current;
    if (!d.el || !d.playerId) return;
    d.el.classList.remove("dragging");
    const x = parseFloat(d.el.style.left);
    const y = parseFloat(d.el.style.top);
    moveDistrict({ playerId: d.playerId, x, y });
    dragRef.current = { el: null, off: { x: 0, y: 0 }, playerId: null };
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
  }

  async function handleSendChat() {
    if (!sessionId) return;
    const txt = chatInput.trim();
    if (!txt) return;
    setChatInput("");
    await sendMessage({
      sessionId,
      sender: role === "facilitator" ? "Facilitator" : name,
      text: txt,
      isFacilitator: role === "facilitator",
    });
  }

  const pct = connectionPct();

  return (
    <div className="screen active" id="s-city">
      <div className="city-left">
        <div className="map-toolbar">
          <div className="map-title">THE FLOODED CITY</div>
          <div className="conn-meter">
            <div className="conn-lbl">connectivity</div>
            <div className="conn-bar">
              <div className="conn-fill" style={{ width: pct + "%" }} />
            </div>
            <div className="conn-pct">{pct}%</div>
          </div>
          <button className="back-btn" style={{ marginLeft: 10 }} onClick={() => goTo("s-upload")}>
            &larr; back
          </button>
        </div>
        <div className="map-hint">
          <strong>Drag your district freely.</strong> Discuss placement with your team in the chat before committing &rarr;
        </div>
        <div className="map-area" ref={mapRef}>
          <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06061a" /><stop offset="60%" stopColor="#0a0830" /><stop offset="100%" stopColor="#0a0620" /></linearGradient></defs>
            <rect width="800" height="600" fill="url(#sky-g)" />
            <path d="M0 440 Q100 430 200 438 Q300 446 400 436 Q500 426 600 434 Q700 442 800 432 L800 600 L0 600 Z" fill="rgba(0,80,160,0.18)" />
            <path d="M0 452 Q200 444 400 450 Q600 456 800 446" stroke="rgba(79,195,247,0.15)" strokeWidth="1.5" fill="none" />
            <rect x="0" y="395" width="800" height="18" fill="rgba(255,255,255,0.04)" />
            <rect x="370" y="0" width="18" height="600" fill="rgba(255,255,255,0.04)" />
            {[30, 90, 150, 450, 510].map((cx) => (
              <rect key={cx} x={cx} y="402" width="30" height="4" rx="2" fill="rgba(255,215,0,0.15)" />
            ))}
            <circle cx="50" cy="30" r="1.5" fill="white" opacity=".5" />
            <circle cx="200" cy="18" r="1" fill="#FFD700" opacity=".6" />
            <circle cx="380" cy="25" r="2" fill="white" opacity=".4" />
            <circle cx="550" cy="12" r="1.5" fill="white" opacity=".7" />
            <circle cx="720" cy="22" r="2" fill="#4FC3F7" opacity=".5" />
            <text x="120" y="200" fontFamily="sans-serif" fontSize="11" fill="rgba(255,255,255,0.06)" letterSpacing="3">NORTH DISTRICT</text>
            <text x="500" y="200" fontFamily="sans-serif" fontSize="11" fill="rgba(255,255,255,0.06)" letterSpacing="3">EAST DISTRICT</text>
            <text x="120" y="370" fontFamily="sans-serif" fontSize="11" fill="rgba(255,255,255,0.06)" letterSpacing="3">WEST DISTRICT</text>
            <text x="500" y="370" fontFamily="sans-serif" fontSize="11" fill="rgba(255,255,255,0.06)" letterSpacing="3">SOUTH DISTRICT</text>
            <text x="330" y="290" fontFamily="sans-serif" fontSize="11" fill="rgba(255,255,255,0.06)" letterSpacing="3">CENTRE</text>
          </svg>

          {nonFac.map((p) => {
            const isMe = p._id === playerId;
            return (
              <div
                key={p._id}
                className={`dist-card${isMe ? " mine" : ""}`}
                style={{
                  left: (p.x ?? Math.random() * 300 + 100) + "px",
                  top: (p.y ?? Math.random() * 200 + 100) + "px",
                }}
                onMouseDown={(e) => startDrag(e, p._id)}
                onTouchStart={(e) => startDrag(e, p._id)}
              >
                {p.photoDataUrl ? (
                  <img className="dc-photo" src={p.photoDataUrl} alt="" />
                ) : (
                  <div className="dc-placeholder">🏙️</div>
                )}
                <div className="dc-name">{p.districtName}</div>
                <div className="dc-tag" style={isMe ? { color: "var(--acc1)" } : {}}>
                  {isMe ? "MINE" : "ANON"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "10px 16px", background: "var(--bg1)", borderTop: "1px solid var(--borderl)", flexShrink: 0 }}>
          <button className="lb lb-yellow" onClick={() => goTo("s-reveal")} style={{ width: "100%" }}>
            CITY BUILT &mdash; REVEAL THE ARCHITECTS &rarr;
          </button>
        </div>
      </div>
      <div className="city-right">
        <div className="chat-panel">
          <div className="chat-hdr">
            <div className="chat-hdr-lbl">TEAM CHAT</div>
            <div className="chat-hdr-sub">Discuss placement before moving</div>
          </div>
          <div className="chat-msgs" ref={chatMsgsRef}>
            {(messages || []).map((msg) => {
              const isMe = msg.sender === name;
              const bubbleClass = msg.isFacilitator ? "fac" : isMe ? "mine" : "";
              return (
                <div key={msg._id} className="cm">
                  <div className="cm-name">{msg.sender}{msg.isFacilitator ? " 🎯" : ""}</div>
                  <div className={`cm-bubble ${bubbleClass}`}>{msg.text}</div>
                </div>
              );
            })}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              placeholder="Say something&#8230;"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            />
            <button className="chat-send" onClick={handleSendChat}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="#0a0a12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="rules-panel">
          <div className="rp-lbl">PLACEMENT</div>
          <div className="rule-item"><div className="ri-dot" style={{ background: "var(--acc4)" }} />Drag freely &mdash; no fixed grid</div>
          <div className="rule-item"><div className="ri-dot" style={{ background: "var(--acc1)" }} />Discuss before placing</div>
          <div className="rule-item"><div className="ri-dot" style={{ background: "var(--acc2)" }} />Touching districts are connected</div>
        </div>
      </div>
    </div>
  );
}
