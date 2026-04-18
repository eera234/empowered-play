"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS, STORY_TEXT, ABILITIES, CRISIS_CARDS, POWER_CARDS, HIDDEN_PATTERNS } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import WaterMap from "./maps/WaterMap";
import SpaceMap from "./maps/SpaceMap";
import OceanMap from "./maps/OceanMap";

// ── Placement slots per theme (reused from CityMapScreen) ──
interface PlacementSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  adjacent: string[];
  zoneType: "center" | "edge" | "gateway" | "interior" | "any";
}

const PLACEMENT_SLOTS: Record<string, PlacementSlot[]> = {
  water: [
    { id: "west-commercial",   x: 15, y: 30, label: "West Market",     adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential", x: 33, y: 14, label: "North Quarter",   adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",            x: 45, y: 33, label: "Town Square",     adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",     x: 62, y: 18, label: "East Side",       adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",              x: 83, y: 12, label: "Green Park",      adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",      x: 28, y: 55, label: "Bridge District", adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",      x: 10, y: 68, label: "Build Zone",      adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",        x: 48, y: 72, label: "South Works",     adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",            x: 75, y: 62, label: "Harbor",          adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  space: [
    { id: "west-commercial",   x: 8,  y: 20, label: "Port Module",    adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential", x: 30, y: 8,  label: "Crew Quarters",  adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",            x: 50, y: 38, label: "Command Hub",    adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",     x: 65, y: 15, label: "Science Wing",   adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",              x: 85, y: 8,  label: "Bio Dome",       adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",      x: 28, y: 55, label: "Docking Bridge", adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",      x: 10, y: 68, label: "Assembly Bay",   adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",        x: 48, y: 70, label: "Engine Room",    adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",            x: 78, y: 65, label: "Airlock",        adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  ocean: [
    { id: "west-commercial",   x: 8,  y: 18, label: "Kelp Farm",      adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential", x: 28, y: 10, label: "Shallow Pods",   adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",            x: 48, y: 30, label: "Thermal Core",   adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",     x: 65, y: 12, label: "Coral Ridge",    adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",              x: 88, y: 15, label: "Bio Garden",     adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",      x: 28, y: 52, label: "Current Channel",adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",      x: 10, y: 68, label: "Pressure Lab",   adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",        x: 42, y: 72, label: "Deep Works",     adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",            x: 75, y: 65, label: "Submarine Bay",  adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  forest: [
    { id: "west-commercial",   x: 8,  y: 25, label: "Mushroom Market",adjacent: ["center", "north-residential"], zoneType: "edge" },
    { id: "north-residential", x: 30, y: 10, label: "Canopy Homes",   adjacent: ["west-commercial", "center", "park"], zoneType: "interior" },
    { id: "center",            x: 45, y: 30, label: "Great Trunk",    adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",     x: 62, y: 18, label: "Sun Glade",      adjacent: ["center", "park", "harbor"], zoneType: "interior" },
    { id: "park",              x: 82, y: 8,  label: "Sacred Grove",   adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",      x: 35, y: 55, label: "Vine Bridge",    adjacent: ["center", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",      x: 10, y: 65, label: "Root Workshop",  adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",        x: 45, y: 72, label: "Undergrowth",    adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",            x: 75, y: 65, label: "River Mouth",    adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
};

export default function StoryMapScreen() {
  const { sessionId, sessionCode, playerId, role, scenario } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const connections = useQuery(api.mapPhase.getConnections, sessionId ? { sessionId } : "skip");
  const myPowerCards = useQuery(
    api.mapPhase.getPlayerPowerCards,
    sessionId && playerId ? { sessionId, playerId } : "skip"
  );
  const moveDistrict = useMutation(api.game.moveDistrict);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);
  const placeConnection = useMutation(api.mapPhase.placeConnection);
  const removeConnection = useMutation(api.mapPhase.removeConnection);
  const dealCrisisCard = useMutation(api.mapPhase.dealCrisisCard);
  const dealPowerCard = useMutation(api.mapPhase.dealPowerCard);
  const usePowerCardMut = useMutation(api.mapPhase.usePowerCard);
  const revealPattern = useMutation(api.mapPhase.revealPattern);

  const isLoading = session === undefined || players === undefined;

  const phase = session?.phase ?? "map_ch1";
  const scenarioId = scenario || session?.scenario || "rising_tides";
  const scenarioData = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const mapTheme = scenarioData.mapTheme;
  const slots = PLACEMENT_SLOTS[mapTheme] || PLACEMENT_SLOTS.water;
  const chapterText = STORY_TEXT[scenarioId]?.[phase];
  const chapterNum = phase === "map_ch1" ? 1 : phase === "map_ch2" ? 2 : 3;

  const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
  const me = nonFac.find((p) => p._id === playerId);
  const myAbility = me?.ability;
  const isPathfinder = myAbility === "pathfinder";
  const isFacilitator = role === "facilitator";

  const placed = nonFac.filter((p) => p.slotId);
  const unplaced = nonFac.filter((p) => !p.slotId);
  const occupiedSlotIds = new Set(placed.map((p) => p.slotId!).filter(Boolean));
  const allPlaced = nonFac.length > 0 && unplaced.length === 0;

  // ── Narration dismissal ──
  const [narrationVisible, setNarrationVisible] = useState(true);
  useEffect(() => {
    setNarrationVisible(true);
  }, [phase]);

  // ── Drag state (percentages) ──
  const mapRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  // ── Ch2: connection-building state ──
  const [selectedForConnection, setSelectedForConnection] = useState<string | null>(null); // slotId
  const [facCrisisPickerOpen, setFacCrisisPickerOpen] = useState(false);
  const [facPowerPickerOpen, setFacPowerPickerOpen] = useState<string | null>(null); // playerId we're dealing to
  const [powerModalOpen, setPowerModalOpen] = useState<string | null>(null); // power_cards._id being used
  const [crisisBannerDismissed, setCrisisBannerDismissed] = useState(false);

  const isCh2 = phase === "map_ch2";
  const isCh3 = phase === "map_ch3";
  const activeCrisis = session?.crisisCardId ? CRISIS_CARDS.find((c) => c.id === session.crisisCardId) : null;
  const myUnusedPowerCards = (myPowerCards ?? []).filter((c) => !c.used);

  // ── Ch3: resolve hidden pattern deterministically per scenario ──
  // Map index (0-8) → slot ID using the ordering in PLACEMENT_SLOTS for this theme.
  function patternForScenario(): typeof HIDDEN_PATTERNS[number] {
    const hash = (scenarioId || "rising_tides").split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const idx = Math.abs(hash) % HIDDEN_PATTERNS.length;
    return HIDDEN_PATTERNS[idx];
  }
  const pattern = patternForScenario();
  const patternRevealed = !!session?.hiddenPatternRevealed;

  // Required pair set as sorted "a|b" strings so we can match regardless of direction
  const requiredPairs = pattern.connections.map(([a, b]) => {
    const slotA = slots[a]?.id;
    const slotB = slots[b]?.id;
    if (!slotA || !slotB) return null;
    return slotA < slotB ? `${slotA}|${slotB}` : `${slotB}|${slotA}`;
  }).filter(Boolean) as string[];
  const requiredSet = new Set(requiredPairs);
  const builtSet = new Set(
    (connections ?? []).map((c) => {
      const a = c.fromSlotId, b = c.toSlotId;
      return a < b ? `${a}|${b}` : `${b}|${a}`;
    })
  );
  const matched = requiredPairs.filter((k) => builtSet.has(k));
  const extras = Array.from(builtSet).filter((k) => !requiredSet.has(k));
  const patternComplete = isCh3 && requiredSet.size > 0 && matched.length === requiredSet.size && extras.length === 0;

  // Scout ability: during ch1 they see a preview of the ch2 crisis; during ch2 they see a ch3 pattern hint
  const isScout = myAbility === "scout";

  // Tap a placed district to start or complete a connection.
  // Works in Ch2 and Ch3. In Ch3, if the two tapped slots already have a connection, remove it.
  function handleDistrictTap(slotId: string) {
    if (!(isCh2 || isCh3) || !sessionId || !playerId || !slotId) return;
    // First tap
    if (!selectedForConnection) {
      setSelectedForConnection(slotId);
      return;
    }
    // Same tile tapped again — cancel
    if (selectedForConnection === slotId) {
      setSelectedForConnection(null);
      return;
    }
    const from = slots.find((s) => s.id === selectedForConnection);
    if (!from) { setSelectedForConnection(null); return; }
    if (!from.adjacent.includes(slotId)) {
      toast("Those zones aren't adjacent");
      return;
    }
    const existing = (connections ?? []).find(
      (c) =>
        (c.fromSlotId === selectedForConnection && c.toSlotId === slotId) ||
        (c.fromSlotId === slotId && c.toSlotId === selectedForConnection)
    );
    // Ch3: tap an existing connection to remove it
    if (existing && isCh3) {
      removeConnection({ connectionId: existing._id })
        .then(() => { setSelectedForConnection(null); toast("Connection removed"); })
        .catch(() => toast("Couldn't remove connection"));
      return;
    }
    if (existing) {
      toast("Already connected");
      setSelectedForConnection(null);
      return;
    }
    placeConnection({ sessionId, fromSlotId: selectedForConnection, toSlotId: slotId, builtBy: playerId })
      .then(() => { setSelectedForConnection(null); toast("Connection built"); })
      .catch(() => toast("Couldn't place connection"));
  }

  async function handleDealCrisis(cardId: string) {
    if (!sessionId) return;
    await dealCrisisCard({ sessionId, crisisCardId: cardId });
    setFacCrisisPickerOpen(false);
    setCrisisBannerDismissed(false);
    toast("Crisis dealt");
  }

  async function handleDealPower(targetPlayerId: string, cardId: string) {
    if (!sessionId) return;
    await dealPowerCard({ sessionId, playerId: targetPlayerId as Id<"players">, cardId });
    setFacPowerPickerOpen(null);
    toast("Power card dealt");
  }

  async function handleUsePower(powerCardId: string) {
    await usePowerCardMut({ powerCardId: powerCardId as Id<"power_cards"> });
    setPowerModalOpen(null);
    toast("Power used!");
  }

  function startDrag(e: MouseEvent | TouchEvent, pId: Id<"players">) {
    // In Ch1 only: players can only drag their own district
    // Ch2+: placements are locked
    if (phase !== "map_ch1") return;
    if (pId !== playerId) return;
    e.preventDefault();
    e.stopPropagation();
    const mapEl = mapRef.current;
    if (!mapEl) return;
    const mapRect = mapEl.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : e;
    const mousePctX = ((touch.clientX - mapRect.left) / mapRect.width) * 100;
    const mousePctY = ((touch.clientY - mapRect.top) / mapRect.height) * 100;
    const player = nonFac.find((p) => p._id === pId);
    const slot = player?.slotId ? slots.find((s) => s.id === player.slotId) : null;
    const cardPctX = slot ? slot.x : (player?.x ?? 50);
    const cardPctY = slot ? slot.y : (player?.y ?? 50);
    const offX = mousePctX - cardPctX;
    const offY = mousePctY - cardPctY;

    setDragPos({ id: pId, x: cardPctX, y: cardPctY });

    let rafId = 0;
    let lastPx = cardPctX;
    let lastPy = cardPctY;

    function move(ev: globalThis.MouseEvent | globalThis.TouchEvent) {
      if ("touches" in ev) ev.preventDefault();
      const t = "touches" in ev ? ev.touches[0] : ev;
      const mr = mapEl!.getBoundingClientRect();
      lastPx = Math.max(2, Math.min(95, ((t.clientX - mr.left) / mr.width) * 100 - offX));
      lastPy = Math.max(2, Math.min(92, ((t.clientY - mr.top) / mr.height) * 100 - offY));
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          setDragPos({ id: pId, x: lastPx, y: lastPy });
          rafId = 0;
        });
      }
    }

    function up() {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
      handleDrop(pId, lastPx, lastPy);
      setDragPos(null);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", up);
  }

  function handleDrop(pId: Id<"players">, dropX: number, dropY: number) {
    const currentOccupied = new Set(
      nonFac.filter((p) => p.slotId && p._id !== pId).map((p) => p.slotId!)
    );
    const availableSlots = slots.filter((s) => !currentOccupied.has(s.id));
    if (availableSlots.length === 0) {
      toast("No open zones left");
      return;
    }
    const sorted = availableSlots
      .map((slot) => ({ slot, dist: Math.sqrt((dropX - slot.x) ** 2 + (dropY - slot.y) ** 2) }))
      .sort((a, b) => a.dist - b.dist);
    const best = sorted[0].slot;
    moveDistrict({ playerId: pId, x: best.x, y: best.y, slotId: best.id });
  }

  async function handleAdvance() {
    if (!sessionId) return;
    if (phase === "map_ch1" && !allPlaced) {
      toast(`Still ${unplaced.length} unplaced — advance anyway?`);
    }
    await advanceNewPhase({ sessionId });
  }

  // ── Map backdrop ──
  const MapBg = mapTheme === "water" ? WaterMap : mapTheme === "space" ? SpaceMap : mapTheme === "ocean" ? OceanMap : WaterMap;

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
        <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--textd)" }}>
          Loading map{"\u2026"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
      <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />

      {/* ── Narration header (dismissible) ── */}
      {narrationVisible && chapterText && (
        <div style={{
          background: "linear-gradient(180deg, rgba(255,215,0,.06), transparent)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 16px 16px",
          position: "relative",
          animation: "fadeIn .6s ease-out",
        }}>
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
              letterSpacing: 2.5, color: "var(--textd)", textTransform: "uppercase",
            }}>
              {scenarioData.title} {"\u00B7"} Chapter {chapterNum} of 3
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2,
              color: "var(--acc1)", marginTop: 4,
            }}>
              {chapterText.title}
            </div>
          </div>
          <div style={{
            maxWidth: 680, margin: "0 auto",
            fontSize: 13, color: "var(--textd)", fontStyle: "italic", lineHeight: 1.7, textAlign: "center",
          }}>
            &ldquo;{chapterText.narration}&rdquo;
          </div>
          <button
            onClick={() => setNarrationVisible(false)}
            style={{
              position: "absolute", top: 8, right: 12,
              background: "none", border: "none", color: "var(--textdd)",
              cursor: "pointer", fontSize: 11, letterSpacing: 1.5,
              fontFamily: "'Black Han Sans', sans-serif",
            }}
          >
            DISMISS {"\u00D7"}
          </button>
        </div>
      )}

      {/* ── Ability badge + pathfinder hint ── */}
      {myAbility && (() => {
        const ab = ABILITIES.find((a) => a.id === myAbility);
        if (!ab) return null;
        return (
          <div style={{
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,.02)", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 18 }}>{ab.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: "var(--acc2)", textTransform: "uppercase",
              }}>
                Your Role: {ab.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--textd)" }}>
                {isPathfinder ? "You can see zone labels. Help your team place districts." : ab.description}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Map area ── */}
      <div ref={mapRef} className="map-area" style={{ flex: 1, minHeight: 320, position: "relative" }}>
        <MapBg slots={slots} occupiedSlotIds={occupiedSlotIds} rebuilt={patternComplete} />

        {/* Placement slots */}
        {slots.map((slot) => {
          const occupied = occupiedSlotIds.has(slot.id);
          return (
            <div
              key={slot.id}
              className="slot-indicator"
              style={{
                left: slot.x + "%",
                top: slot.y + "%",
                opacity: occupied ? 0 : 1,
                transition: "opacity .3s",
              }}
            >
              {isPathfinder && <div className="slot-label">{slot.label}</div>}
            </div>
          );
        })}

        {/* Connection lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
          {/* Ch1: faint hint lines between occupied adjacent zones */}
          {phase === "map_ch1" && placed.map((a, i) =>
            placed.slice(i + 1).map((b) => {
              if (!a.slotId || !b.slotId) return null;
              const slotA = slots.find((s) => s.id === a.slotId);
              const slotB = slots.find((s) => s.id === b.slotId);
              if (!slotA || !slotB || !slotA.adjacent.includes(b.slotId)) return null;
              return (
                <line
                  key={`hint-${a._id}-${b._id}`}
                  x1={slotA.x + "%"} y1={slotA.y + "%"}
                  x2={slotB.x + "%"} y2={slotB.y + "%"}
                  stroke="rgba(105,240,174,.15)" strokeWidth="1" strokeDasharray="4 4"
                />
              );
            })
          )}

          {/* Ch2/Ch3: real connections saved to Convex */}
          {(phase === "map_ch2" || phase === "map_ch3") && (connections ?? []).map((conn) => {
            const sA = slots.find((s) => s.id === conn.fromSlotId);
            const sB = slots.find((s) => s.id === conn.toSlotId);
            if (!sA || !sB) return null;
            const a = conn.fromSlotId, b = conn.toSlotId;
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            const inPattern = isCh3 && patternRevealed && requiredSet.has(key);
            const isExtra = isCh3 && patternRevealed && !requiredSet.has(key);
            const stroke = inPattern ? "rgba(105,240,174,.85)" : isExtra ? "rgba(244,67,54,.7)" : "rgba(255,215,0,.65)";
            return (
              <line
                key={conn._id}
                x1={sA.x + "%"} y1={sA.y + "%"}
                x2={sB.x + "%"} y2={sB.y + "%"}
                stroke={stroke} strokeWidth={inPattern ? 4 : 3}
              />
            );
          })}

          {/* Ch3: reveal missing pattern lines as faint guides */}
          {isCh3 && patternRevealed && requiredPairs.map((key) => {
            if (builtSet.has(key)) return null;
            const [a, b] = key.split("|");
            const sA = slots.find((s) => s.id === a);
            const sB = slots.find((s) => s.id === b);
            if (!sA || !sB) return null;
            return (
              <line
                key={`miss-${key}`}
                x1={sA.x + "%"} y1={sA.y + "%"}
                x2={sB.x + "%"} y2={sB.y + "%"}
                stroke="rgba(255,215,0,.35)" strokeWidth="2" strokeDasharray="6 6"
              />
            );
          })}

          {/* Ch2: pending-connection preview from selected slot to mouse/candidate */}
          {isCh2 && selectedForConnection && (() => {
            const from = slots.find((s) => s.id === selectedForConnection);
            if (!from) return null;
            return from.adjacent.map((adjId) => {
              const to = slots.find((s) => s.id === adjId);
              if (!to) return null;
              if (!occupiedSlotIds.has(adjId)) return null;
              const already = (connections ?? []).some(
                (c) =>
                  (c.fromSlotId === from.id && c.toSlotId === adjId) ||
                  (c.fromSlotId === adjId && c.toSlotId === from.id)
              );
              if (already) return null;
              return (
                <line
                  key={`pending-${from.id}-${adjId}`}
                  x1={from.x + "%"} y1={from.y + "%"}
                  x2={to.x + "%"} y2={to.y + "%"}
                  stroke="rgba(79,195,247,.7)" strokeWidth="2" strokeDasharray="6 4"
                />
              );
            });
          })()}
        </svg>

        {/* Placed districts */}
        {placed.map((p) => {
          const isMe = p._id === playerId;
          const isDragging = dragPos?.id === p._id;
          const slotData = p.slotId ? slots.find((s) => s.id === p.slotId) : null;
          const pctX = isDragging ? dragPos.x : (slotData ? slotData.x : (p.x ?? 50));
          const pctY = isDragging ? dragPos.y : (slotData ? slotData.y : (p.y ?? 50));
          const isSelectedForConn = (isCh2 || isCh3) && p.slotId === selectedForConnection;
          const connectionCount = (connections ?? []).filter((c) => c.fromSlotId === p.slotId || c.toSlotId === p.slotId).length;

          return (
            <div
              key={p._id}
              className={`dist-card${isMe ? " mine" : ""}${isDragging ? " dragging" : ""}`}
              style={{
                left: pctX + "%",
                top: pctY + "%",
                zIndex: isDragging ? 100 : 10,
                cursor: phase === "map_ch1" ? (isMe ? "grab" : "default") : (isCh2 || isCh3 ? "pointer" : "default"),
                outline: isSelectedForConn ? "3px solid var(--acc2)" : undefined,
                boxShadow: isSelectedForConn ? "0 0 20px rgba(79,195,247,.5)" : undefined,
              }}
              onMouseDown={(e) => { if (phase === "map_ch1") startDrag(e, p._id); }}
              onTouchStart={(e) => { if (phase === "map_ch1") startDrag(e, p._id); }}
              onClick={() => { if ((isCh2 || isCh3) && p.slotId) handleDistrictTap(p.slotId); }}
            >
              <div style={{ pointerEvents: "none" }}>
                {p.photoDataUrl ? (
                  <img className="dc-photo" src={p.photoDataUrl} alt="" draggable={false} />
                ) : (
                  <div className="dc-placeholder">{"\u{1F3D9}\uFE0F"}</div>
                )}
                <div className="dc-name">{p.districtName || p.name}</div>
                <div className="dc-tag" style={isMe ? { color: "var(--acc1)" } : {}}>
                  {isMe ? "YOU" : p.name}
                </div>
              </div>
              {/* Connection-count badge (Ch2+) */}
              {(isCh2 || phase === "map_ch3") && connectionCount > 0 && (
                <div style={{
                  position: "absolute", top: -8, right: -8,
                  background: "var(--acc1)", color: "#0a0a12",
                  borderRadius: "50%", width: 22, height: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, fontFamily: "'Black Han Sans', sans-serif",
                  border: "2px solid var(--bg0)", pointerEvents: "none",
                }}>
                  {connectionCount}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Staging area for unplaced districts ── */}
      {phase === "map_ch1" && unplaced.length > 0 && (
        <div style={{
          borderTop: "1px solid var(--border)",
          background: "rgba(255,255,255,.02)",
          padding: "12px 14px",
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
            letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase",
            marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Unplaced {scenarioData.terminology.district}s ({unplaced.length})</span>
            {me && !me.slotId && (
              <span style={{ color: "var(--acc1)" }}>
                Drag yours onto the {scenarioData.terminology.map}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {unplaced.map((p) => {
              const isMe = p._id === playerId;
              const isDragging = dragPos?.id === p._id;
              return (
                <div
                  key={p._id}
                  onMouseDown={(e) => isMe && startDrag(e as unknown as MouseEvent, p._id)}
                  onTouchStart={(e) => isMe && startDrag(e as unknown as TouchEvent, p._id)}
                  style={{
                    flexShrink: 0,
                    width: 110,
                    background: "var(--bg2)",
                    border: `2px solid ${isMe ? "var(--acc1)" : "var(--border)"}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    cursor: isMe ? "grab" : "default",
                    opacity: isDragging ? 0.3 : 1,
                    boxShadow: isMe ? "0 0 10px rgba(255,215,0,.15)" : "var(--brick-shadow)",
                    transition: "opacity .15s",
                  }}
                >
                  {p.photoDataUrl ? (
                    <img src={p.photoDataUrl} alt="" style={{ width: "100%", height: 56, objectFit: "cover", pointerEvents: "none" }} draggable={false} />
                  ) : (
                    <div style={{ width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "var(--bg1)" }}>
                      {"\u{1F3D9}\uFE0F"}
                    </div>
                  )}
                  <div style={{ padding: "4px 6px", pointerEvents: "none" }}>
                    <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 9, letterSpacing: .5, lineHeight: 1.2 }}>
                      {p.districtName || p.name}
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: isMe ? "var(--acc1)" : "var(--textd)", marginTop: 2 }}>
                      {isMe ? "YOU" : p.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ch2: Crisis card reveal banner ── */}
      {isCh2 && activeCrisis && !crisisBannerDismissed && (
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(244,67,54,.18), rgba(244,67,54,.05))",
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeIn .6s ease-out",
        }}>
          <div style={{ fontSize: 34 }}>{activeCrisis.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              color: "var(--acc3)", textTransform: "uppercase",
            }}>
              CRISIS
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, letterSpacing: 1.5,
              color: "white", marginTop: 2,
            }}>
              {activeCrisis.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4, lineHeight: 1.5 }}>
              {activeCrisis.description}
            </div>
            <div style={{ fontSize: 11, color: "var(--acc4)", marginTop: 6, fontStyle: "italic" }}>
              Counter: {activeCrisis.counterplay}
            </div>
          </div>
          <button
            onClick={() => setCrisisBannerDismissed(true)}
            style={{
              background: "none", border: "none", color: "var(--textd)", cursor: "pointer",
              fontSize: 11, letterSpacing: 1.5, fontFamily: "'Black Han Sans', sans-serif",
              alignSelf: "flex-start",
            }}
          >
            DISMISS {"\u00D7"}
          </button>
        </div>
      )}

      {/* ── Ch2: Scout preview (sees upcoming crisis) ── */}
      {isCh2 && isScout && !activeCrisis && (
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          background: "rgba(79,195,247,.05)",
          fontSize: 11, color: "var(--acc2)", fontStyle: "italic",
        }}>
          {"\u{1F52D}"} Scout intel: your ability lets you see crisis cards before the team. Ask the facilitator to preview.
        </div>
      )}

      {/* ── Ch2: Power-card banner for holders ── */}
      {isCh2 && myUnusedPowerCards.length > 0 && (
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          background: "rgba(147,51,234,.08)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ fontSize: 22 }}>{"\u{1F4AB}"}</div>
          <div style={{ flex: 1, fontSize: 12, color: "white", fontWeight: 800 }}>
            You have {myUnusedPowerCards.length} power card{myUnusedPowerCards.length > 1 ? "s" : ""}.
          </div>
          <button
            className="lb lb-yellow"
            style={{ fontSize: 10, padding: "6px 12px" }}
            onClick={() => setPowerModalOpen(myUnusedPowerCards[0]._id)}
          >
            VIEW
          </button>
        </div>
      )}

      {/* ── Instruction hint — only when there's something to do ── */}
      {isCh2 && !isFacilitator && (
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 11, color: "var(--textd)", textAlign: "center",
          background: "rgba(255,255,255,.02)",
        }}>
          {selectedForConnection
            ? `Tap an adjacent district to build a connection, or tap the same one again to cancel.`
            : `Tap two adjacent districts to build a connection.`}
        </div>
      )}

      {/* ── Ch3: Pattern reveal banner + progress ── */}
      {isCh3 && patternRevealed && (
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--border)",
          background: patternComplete
            ? "linear-gradient(180deg, rgba(105,240,174,.18), rgba(105,240,174,.04))"
            : "linear-gradient(180deg, rgba(255,215,0,.12), rgba(255,215,0,.03))",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 30 }}>{patternComplete ? "\u2728" : "\u{1F50D}"}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              color: patternComplete ? "var(--acc4)" : "var(--acc1)", textTransform: "uppercase",
            }}>
              HIDDEN PATTERN
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, letterSpacing: 1.5,
              color: "white", marginTop: 2,
            }}>
              {pattern.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4, lineHeight: 1.5 }}>
              {pattern.description}
            </div>
            <div style={{ fontSize: 11, color: patternComplete ? "var(--acc4)" : "var(--acc1)", marginTop: 6, fontWeight: 900, letterSpacing: 1 }}>
              {patternComplete
                ? `\u2713 PATTERN COMPLETE \u2014 The ${scenarioData.terminology.map} is rebuilt`
                : `${matched.length} / ${requiredSet.size} matching connections${extras.length > 0 ? ` \u00B7 ${extras.length} extra to remove` : ""}`}
            </div>
          </div>
        </div>
      )}

      {/* ── Ch3: Not yet revealed — tell players to wait ── */}
      {isCh3 && !patternRevealed && !isFacilitator && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "rgba(255,215,0,.06)",
          textAlign: "center",
          fontSize: 12, color: "var(--textd)",
        }}>
          {"\u{1F510}"} A hidden pattern is coming. Waiting for the facilitator to reveal it.
        </div>
      )}

      {isCh3 && !isFacilitator && patternRevealed && !patternComplete && (
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 11, color: "var(--textd)", textAlign: "center",
          background: "rgba(255,255,255,.02)",
        }}>
          {selectedForConnection
            ? "Tap an adjacent district to add a connection, or tap an existing one to remove it."
            : "Rearrange connections to match the pattern. Extras in red, missing as dashed gold."}
        </div>
      )}

      {/* ── Bottom bar — status + facilitator controls ── */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        background: "rgba(255,255,255,.02)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 12, color: "var(--textd)" }}>
          {phase === "map_ch1" && `${placed.length}/${nonFac.length} placed`}
          {isCh2 && `${(connections ?? []).length} connection${(connections ?? []).length !== 1 ? "s" : ""} built`}
          {isCh3 && patternRevealed && `${matched.length}/${requiredSet.size} matched${extras.length ? ` \u00B7 ${extras.length} extra` : ""}`}
          {isCh3 && !patternRevealed && `${(connections ?? []).length} connections \u00B7 pattern sealed`}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {isFacilitator && isCh2 && (
            <>
              <button
                className="lb lb-ghost"
                style={{ fontSize: 10, padding: "7px 11px" }}
                onClick={() => setFacCrisisPickerOpen(true)}
              >
                {activeCrisis ? "SWAP CRISIS" : "DEAL CRISIS"}
              </button>
              <button
                className="lb lb-ghost"
                style={{ fontSize: 10, padding: "7px 11px" }}
                onClick={() => {
                  if (nonFac.length === 0) { toast("No players to deal to"); return; }
                  setFacPowerPickerOpen(nonFac[0]._id);
                }}
              >
                DEAL POWER
              </button>
            </>
          )}
          {isFacilitator && isCh3 && !patternRevealed && (
            <button
              className="lb lb-yellow"
              style={{ fontSize: 10, padding: "7px 11px" }}
              onClick={async () => {
                if (!sessionId) return;
                await revealPattern({ sessionId });
                toast(`Pattern revealed: ${pattern.label}`);
              }}
            >
              REVEAL PATTERN
            </button>
          )}
          {isFacilitator ? (
            <button
              className="lb lb-green"
              style={{ fontSize: 11, padding: "8px 14px" }}
              onClick={handleAdvance}
            >
              {phase === "map_ch1" ? "ADVANCE TO CH 2 \u2192" : phase === "map_ch2" ? "ADVANCE TO CH 3 \u2192" : "ADVANCE TO VOTE \u2192"}
            </button>
          ) : (
            <div style={{ fontSize: 11, color: "var(--textd)" }}>
              {phase === "map_ch1" && (allPlaced ? "All placed. Waiting for facilitator." : "Place your district.")}
              {isCh2 && "Build connections. Waiting for facilitator."}
              {isCh3 && patternComplete && `${scenarioData.terminology.map} reborn \u2014 waiting to vote`}
            </div>
          )}
        </div>
      </div>

      {/* ── Facilitator: crisis picker modal ── */}
      {facCrisisPickerOpen && (
        <div className="card-modal-overlay" onClick={() => setFacCrisisPickerOpen(false)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="card-modal-body">
              <div className="card-modal-title">Deal a Crisis Card</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {CRISIS_CARDS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleDealCrisis(c.id)}
                    style={{
                      textAlign: "left", padding: "12px 14px",
                      background: "rgba(244,67,54,.06)",
                      border: "1px solid rgba(244,67,54,.25)",
                      borderRadius: "var(--brick-radius)",
                      color: "white", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{c.icon}</span>
                      <span style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 14, letterSpacing: 1 }}>
                        {c.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 4 }}>
                      {c.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button className="card-modal-close" onClick={() => setFacCrisisPickerOpen(false)}>CLOSE</button>
          </div>
        </div>
      )}

      {/* ── Facilitator: power card dealer ── */}
      {facPowerPickerOpen && (() => {
        const target = nonFac.find((p) => p._id === facPowerPickerOpen);
        if (!target) return null;
        return (
          <div className="card-modal-overlay" onClick={() => setFacPowerPickerOpen(null)}>
            <div className="card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="card-modal-body">
                <div className="card-modal-title">Deal a Power Card</div>
                <div style={{ fontSize: 11, color: "var(--textd)", marginBottom: 12 }}>Pick a player, then a card:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {nonFac.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setFacPowerPickerOpen(p._id)}
                      style={{
                        padding: "6px 10px", borderRadius: 16,
                        background: p._id === facPowerPickerOpen ? "var(--acc1)" : "rgba(255,255,255,.05)",
                        border: "1px solid var(--border)",
                        color: p._id === facPowerPickerOpen ? "#0a0a12" : "white",
                        fontSize: 11, fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {POWER_CARDS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleDealPower(target._id, c.id)}
                      style={{
                        textAlign: "left", padding: "12px 14px",
                        background: "rgba(147,51,234,.08)",
                        border: "1px solid rgba(147,51,234,.3)",
                        borderRadius: "var(--brick-radius)",
                        color: "white", cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{c.icon}</span>
                        <span style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 13, letterSpacing: 1 }}>
                          {c.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 4 }}>
                        {c.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button className="card-modal-close" onClick={() => setFacPowerPickerOpen(null)}>CLOSE</button>
            </div>
          </div>
        );
      })()}

      {/* ── Player: power-card-use modal ── */}
      {powerModalOpen && (() => {
        const mine = myUnusedPowerCards.find((c) => c._id === powerModalOpen);
        if (!mine) return null;
        const cardData = POWER_CARDS.find((p) => p.id === mine.cardId);
        if (!cardData) return null;
        return (
          <div className="card-modal-overlay" onClick={() => setPowerModalOpen(null)}>
            <div className="card-modal" onClick={(e) => e.stopPropagation()}>
              <div className="card-modal-studs">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="lego-stud-3d" style={{ width: 16, height: 16 }} />
                ))}
              </div>
              <div className="card-modal-accent" style={{ background: "rgba(147,51,234,.7)" }} />
              <div className="card-modal-body">
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 40 }}>{cardData.icon}</div>
                </div>
                <div className="card-modal-title" style={{ color: "#B388FF" }}>
                  {cardData.title}
                </div>
                <div className="card-modal-section">
                  <div className="card-modal-section-lbl">HOW IT WORKS</div>
                  <div className="card-modal-rule">{cardData.description}</div>
                </div>
                <div className="card-modal-section">
                  <div className="card-modal-section-lbl card-modal-hr-lbl">MECHANIC</div>
                  <div className="card-modal-hr">{cardData.effect}</div>
                </div>
              </div>
              <div style={{ display: "flex" }}>
                <button className="card-modal-close" style={{ flex: 1 }} onClick={() => setPowerModalOpen(null)}>LATER</button>
                <button
                  className="card-modal-close"
                  style={{ flex: 1, color: "#B388FF", borderLeft: "1px solid var(--borderl)" }}
                  onClick={() => handleUsePower(mine._id)}
                >
                  USE NOW
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
