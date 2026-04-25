"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
  sessionId: Id<"sessions"> | null;
  senderName: string;
  isFacilitator: boolean;
  senderPlayerId?: Id<"players"> | null;
  chatMutedUntil?: number;
  myAbility?: string | null;
};

// Session-wide chat visible across map_ch1, map_ch2, map_ch3. Docked to the
// bottom of the screen on mobile (expand/collapse via header tap) and to the
// right side on desktop (>= 1024px). Reuses the `messages` table and the
// `sendMessage` mutation.
export default function MapChatPanel({
  sessionId, senderName, isFacilitator, senderPlayerId, chatMutedUntil, myAbility,
}: Props) {
  const messages = useQuery(api.game.getMessages, sessionId ? { sessionId } : "skip");
  const sendMessage = useMutation(api.game.sendMessage);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [, setTick] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const msgs = messages ?? [];
  const unread = open ? 0 : Math.max(0, msgs.length - lastSeenCount);

  // Desktop breakpoint: sidebar instead of bottom dock. Matches the
  // min-width: 1024px breakpoint used elsewhere in Pass #12.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // On desktop the sidebar is always expanded (no collapse).
  const effectiveOpen = isDesktop ? true : open;

  const mutedMsLeft = chatMutedUntil && chatMutedUntil > Date.now() ? chatMutedUntil - Date.now() : 0;
  const exempt = isFacilitator || myAbility === "diplomat";
  const inputBlocked = mutedMsLeft > 0 && !exempt;

  useEffect(() => {
    if (mutedMsLeft <= 0) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [mutedMsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (effectiveOpen) {
      setLastSeenCount(msgs.length);
      requestAnimationFrame(() => {
        if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
      });
    }
  }, [effectiveOpen, msgs.length]);

  useEffect(() => {
    if (effectiveOpen && scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [msgs.length, effectiveOpen]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await sendMessage({
        sessionId, sender: senderName, text, isFacilitator,
        ...(senderPlayerId ? { senderPlayerId } : {}),
      });
    } catch (err) {
      setInput(text);
      const msg = (err as { message?: string } | null)?.message || "";
      if (msg.includes("Signal lost")) toast(msg);
      else if (msg.includes("Empty")) toast("Type something first.");
      else toast("Message failed. Check your connection.");
    }
  }

  if (!sessionId) return null;

  // Mobile, collapsed: thin pill bar across the bottom of the screen.
  if (!isDesktop && !open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          background: "rgba(10,10,18,.94)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: "2px solid var(--border)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
          zIndex: 40,
        }}
      >
        <div style={{ fontSize: 16 }}>{"\u{1F4AC}"}</div>
        <div style={{
          flex: 1,
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 11, letterSpacing: 2, color: "var(--acc1)",
        }}>
          TEAM CHAT
        </div>
        <div style={{ fontSize: 9, color: "var(--textdd)", fontWeight: 800, letterSpacing: 1 }}>
          {msgs.length} MSG
        </div>
        {unread > 0 && (
          <div style={{
            background: "var(--acc3)", color: "#0a0a12",
            borderRadius: 12, padding: "1px 8px",
            fontSize: 10, fontWeight: 900, letterSpacing: 1,
          }}>
            {unread}
          </div>
        )}
        <div style={{ fontSize: 14, color: "var(--textd)" }}>{"\u25B2"}</div>
      </div>
    );
  }

  // Expanded on mobile: slides up from the bottom. Desktop: always docked
  // to the right side.
  const panelStyle: React.CSSProperties = isDesktop
    ? {
        position: "fixed", right: 0, top: 0, bottom: 0, width: 340,
        background: "rgba(10,10,18,.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderLeft: "2px solid var(--border)",
        display: "flex", flexDirection: "column",
        zIndex: 40,
        boxShadow: "-8px 0 24px rgba(0,0,0,.35)",
      }
    : {
        position: "fixed", left: 0, right: 0, bottom: 0,
        background: "rgba(10,10,18,.96)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "2px solid var(--border)",
        display: "flex", flexDirection: "column",
        maxHeight: "55dvh",
        zIndex: 40,
        boxShadow: "0 -12px 40px rgba(0,0,0,.55)",
      };

  return (
    <div style={panelStyle}>
      {/* Header. On mobile tapping collapses; on desktop there is no collapse. */}
      <div
        onClick={!isDesktop ? () => setOpen(false) : undefined}
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 10,
          cursor: !isDesktop ? "pointer" : "default",
          background: "rgba(255,255,255,.02)",
        }}
      >
        <div style={{ fontSize: 16 }}>{"\u{1F4AC}"}</div>
        <div style={{
          flex: 1,
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 11, letterSpacing: 2, color: "var(--acc1)",
        }}>
          TEAM CHAT
        </div>
        <div style={{ fontSize: 9, color: "var(--textdd)", fontWeight: 800, letterSpacing: 1 }}>
          {msgs.length} MSG
        </div>
        {!isDesktop && (
          <div style={{ fontSize: 14, color: "var(--textd)" }}>{"\u25BC"}</div>
        )}
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        style={{
          flex: 1, minHeight: 120, overflowY: "auto",
          padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: 6,
        }}
      >
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--textdd)", fontSize: 12, padding: "24px 0" }}>
            No messages yet. Be the first to say something.
          </div>
        )}
        {msgs.map((m) => {
          const mine = m.sender === senderName;
          return (
            <div key={m._id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "82%", borderRadius: 10, padding: "7px 11px",
                background: mine
                  ? "rgba(255,215,0,.14)"
                  : m.isFacilitator
                    ? "rgba(105,240,174,.12)"
                    : "rgba(255,255,255,.07)",
                border: `1px solid ${mine ? "rgba(255,215,0,.3)" : m.isFacilitator ? "rgba(105,240,174,.3)" : "var(--border)"}`,
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: 1, marginBottom: 2,
                  color: mine ? "var(--acc1)" : m.isFacilitator ? "var(--acc4)" : "var(--textd)",
                  textTransform: "uppercase",
                }}>
                  {mine ? "You" : m.sender}{m.isFacilitator ? " (facilitator)" : ""}
                </div>
                <div style={{ fontSize: 13, color: "white", wordBreak: "break-word" }}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex", gap: 8,
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <input
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputBlocked
            ? `Signal lost \u00B7 ${Math.ceil(mutedMsLeft / 1000)}s`
            : "Message the team..."}
          style={{ flex: 1, opacity: inputBlocked ? 0.55 : 1 }}
          autoComplete="off"
          maxLength={500}
          disabled={inputBlocked}
        />
        <button
          type="submit"
          className="lb lb-yellow"
          style={{ fontSize: 10, padding: "8px 14px" }}
          disabled={!input.trim() || inputBlocked}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
