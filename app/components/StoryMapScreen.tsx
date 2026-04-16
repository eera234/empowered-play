"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS, STORY_TEXT, ABILITIES } from "../../lib/constants";
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
  const moveDistrict = useMutation(api.game.moveDistrict);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

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

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
      <BrandBar />

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
        <MapBg slots={slots} occupiedSlotIds={occupiedSlotIds} />

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

        {/* Connection lines between occupied adjacent zones */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
          {placed.map((a, i) =>
            placed.slice(i + 1).map((b) => {
              if (!a.slotId || !b.slotId) return null;
              const slotA = slots.find((s) => s.id === a.slotId);
              const slotB = slots.find((s) => s.id === b.slotId);
              if (!slotA || !slotB || !slotA.adjacent.includes(b.slotId)) return null;
              return (
                <line
                  key={`${a._id}-${b._id}`}
                  x1={slotA.x + "%"} y1={slotA.y + "%"}
                  x2={slotB.x + "%"} y2={slotB.y + "%"}
                  stroke="rgba(105,240,174,.35)" strokeWidth="2" strokeDasharray="8 4"
                />
              );
            })
          )}
        </svg>

        {/* Placed districts */}
        {placed.map((p) => {
          const isMe = p._id === playerId;
          const isDragging = dragPos?.id === p._id;
          const slotData = p.slotId ? slots.find((s) => s.id === p.slotId) : null;
          const pctX = isDragging ? dragPos.x : (slotData ? slotData.x : (p.x ?? 50));
          const pctY = isDragging ? dragPos.y : (slotData ? slotData.y : (p.y ?? 50));

          return (
            <div
              key={p._id}
              className={`dist-card${isMe ? " mine" : ""}${isDragging ? " dragging" : ""}`}
              style={{
                left: pctX + "%",
                top: pctY + "%",
                zIndex: isDragging ? 100 : 10,
                cursor: isMe && phase === "map_ch1" ? "grab" : "default",
              }}
              onMouseDown={(e) => startDrag(e, p._id)}
              onTouchStart={(e) => startDrag(e, p._id)}
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

      {/* ── Bottom bar — status + facilitator advance ── */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        background: "rgba(255,255,255,.02)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ fontSize: 12, color: "var(--textd)" }}>
          {placed.length}/{nonFac.length} placed
          {phase === "map_ch2" && " \u00B7 Chapter 2 coming soon"}
          {phase === "map_ch3" && " \u00B7 Chapter 3 coming soon"}
        </div>
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
            {allPlaced ? "All districts placed. Waiting for facilitator." : "Place your district on an open zone."}
          </div>
        )}
      </div>
    </div>
  );
}
