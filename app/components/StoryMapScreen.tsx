"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS, STORY_TEXT, ABILITIES, CRISIS_CARDS, POWER_CARDS, getThemedAbility } from "../../lib/constants";
import { playSound } from "../../lib/sound";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import ThemedMap from "./maps/ThemedMap";
import { pickPhotoFile } from "./cameraFallback";

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
  const uploadConnectionPhoto = useMutation(api.mapPhase.uploadConnectionPhoto);
  const dealCrisisCard = useMutation(api.mapPhase.dealCrisisCard);
  const dealPowerCard = useMutation(api.mapPhase.dealPowerCard);
  const usePowerCardMut = useMutation(api.mapPhase.usePowerCard);
  const revealPattern = useMutation(api.mapPhase.revealPattern);
  const clearCrisis = useMutation(api.mapPhase.clearCrisis);
  const repairConnection = useMutation(api.mapPhase.repairConnection);
  const seedCh1Targets = useMutation(api.game.seedCh1Targets);
  const setCh1PlacedMut = useMutation(api.game.setCh1Placed);

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
  const isMender = myAbility === "mender";
  const isFacilitator = role === "facilitator";

  // "Placed" = player has been dragged to an explicit x/y on the map. Free
  // movement — no slot snapping, overlaps allowed — so x/y is the only signal.
  const placed = nonFac.filter((p) => p.x !== undefined && p.y !== undefined);
  const unplaced = nonFac.filter((p) => p.x === undefined || p.y === undefined);
  const allPlaced = nonFac.length > 0 && unplaced.length === 0;

  // ── Narration dismissal ──
  // Show the full narration on phase change, then auto-collapse after 10s so
  // the map gets more room. Players can read the gist in that window; a thin
  // "Chapter X · Title" strip stays pinned once it's collapsed.
  const [narrationVisible, setNarrationVisible] = useState(true);
  useEffect(() => {
    setNarrationVisible(true);
    const t = setTimeout(() => setNarrationVisible(false), 10000);
    return () => clearTimeout(t);
  }, [phase]);

  // Seed Ch1 target zones exactly once per session. The facilitator fires
  // this; other clients observe the targetZone field appearing on players.
  // The mutation itself is idempotent (skips players who already have one).
  useEffect(() => {
    if (phase !== "map_ch1") return;
    if (!isFacilitator || !sessionId) return;
    const anyMissing = nonFac.some((p) => !p.targetZone);
    if (!anyMissing) return;
    seedCh1Targets({ sessionId, zoneIds: slots.map((s) => s.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isFacilitator, sessionId, nonFac.length]);

  // ── Drag state (percentages) ──
  const mapRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  // ── Ch2/Ch3: connection-building state ──
  // Free movement means connections are player-to-player, not slot-to-slot.
  // The string stored in connections.fromSlotId / toSlotId is the player _id.
  const [selectedForConnection, setSelectedForConnection] = useState<string | null>(null); // playerId
  // When both ends are picked, we store the pair and open the camera modal.
  const [pendingConnectionPair, setPendingConnectionPair] = useState<{ fromId: string; toId: string } | null>(null);
  const [connectionPhoto, setConnectionPhoto] = useState<string | null>(null);
  const [connectionCameraActive, setConnectionCameraActive] = useState(false);
  const connectionVideoRef = useRef<HTMLVideoElement>(null);
  const connectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectionStreamRef = useRef<MediaStream | null>(null);
  const [connectionUploading, setConnectionUploading] = useState(false);
  const detectBlocks = useAction(api.detectLego.detectBuildingBlocks);
  const [facCrisisPickerOpen, setFacCrisisPickerOpen] = useState(false);
  const [facPowerPickerOpen, setFacPowerPickerOpen] = useState<string | null>(null); // playerId we're dealing to
  const [powerModalOpen, setPowerModalOpen] = useState<string | null>(null); // power_cards._id being used

  const isCh2 = phase === "map_ch2";
  const isCh3 = phase === "map_ch3";
  const activeCrisis = session?.crisisCardId ? CRISIS_CARDS.find((c) => c.id === session.crisisCardId) : null;
  const myUnusedPowerCards = (myPowerCards ?? []).filter((c) => !c.used);

  // ── Ch3: map-rebuilt state ──
  // `hiddenPatternRevealed` is repurposed as the "rebuilt" flag. The facilitator
  // sets it once Ch3 Rally discussion is done and the team has repaired what
  // they wanted; the map crossfades from damaged to rebuilt.
  const mapRebuilt = !!session?.hiddenPatternRevealed;

  // Scout ability (Ch2 only): flavour text hint. Crisis preview not implemented.
  const isScout = myAbility === "scout";

  // Tap a district in Ch2/Ch3 to pick it as one end of a connection. When both
  // ends are picked we open the camera modal so the player can photograph the
  // physical LEGO bridge they've built between their two builds.
  function handleDistrictTap(targetPlayerId: string) {
    if (!(isCh2 || isCh3) || !sessionId || !playerId || !targetPlayerId) return;
    // First tap
    if (!selectedForConnection) {
      setSelectedForConnection(targetPlayerId);
      return;
    }
    // Same district tapped again — cancel selection
    if (selectedForConnection === targetPlayerId) {
      setSelectedForConnection(null);
      return;
    }
    // Already connected? Ch3 lets you remove; Ch2 just complains.
    const existing = (connections ?? []).find(
      (c) =>
        (c.fromSlotId === selectedForConnection && c.toSlotId === targetPlayerId) ||
        (c.fromSlotId === targetPlayerId && c.toSlotId === selectedForConnection)
    );
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
    // Open the camera modal so the player photographs their LEGO bridge.
    setPendingConnectionPair({ fromId: selectedForConnection, toId: targetPlayerId });
    setSelectedForConnection(null);
    setConnectionPhoto(null);
    startConnectionCamera();
  }

  // Camera flow for connection photos (mirrors PairBuildScreen capture).
  async function startConnectionCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      connectionStreamRef.current = s;
      if (connectionVideoRef.current) connectionVideoRef.current.srcObject = s;
      setConnectionCameraActive(true);
    } catch (err) {
      const name = (err as { name?: string } | null)?.name;
      setConnectionCameraActive(false);
      if (name === "NotAllowedError" || name === "SecurityError") {
        toast("Camera blocked — using photo upload instead.");
        await handleConnectionUploadFallback();
      } else {
        toast("Camera unavailable — tap UPLOAD PHOTO to continue.");
      }
    }
  }
  function stopConnectionCamera() {
    connectionStreamRef.current?.getTracks().forEach((t) => t.stop());
    connectionStreamRef.current = null;
    setConnectionCameraActive(false);
  }
  async function processConnectionDataUrl(dataUrl: string) {
    playSound("photo");
    setConnectionPhoto(dataUrl);
    if (!process.env.NEXT_PUBLIC_SKIP_DETECTION) {
      try {
        const result = await detectBlocks({ imageBase64: dataUrl.split(",")[1] });
        if (result.isLego) { playSound("lego-detected"); toast("LEGO bridge detected"); }
        else toast("No building blocks detected. Retake with the bridge in frame.");
      } catch {
        toast("Could not verify. Upload allowed.");
      }
    }
  }
  async function captureConnectionPhoto() {
    const v = connectionVideoRef.current, c = connectionCanvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    stopConnectionCamera();
    await processConnectionDataUrl(dataUrl);
  }
  async function handleConnectionUploadFallback() {
    const dataUrl = await pickPhotoFile();
    if (!dataUrl) return;
    await processConnectionDataUrl(dataUrl);
  }
  async function submitConnection() {
    if (!sessionId || !playerId || !pendingConnectionPair || !connectionPhoto) return;
    setConnectionUploading(true);
    try {
      const result = await placeConnection({
        sessionId,
        fromSlotId: pendingConnectionPair.fromId,
        toSlotId: pendingConnectionPair.toId,
        builtBy: playerId,
      });
      if (!result?.success) {
        toast(result?.error || "Couldn't place connection");
        return;
      }
      // Attach the bridge photo to the new connection immediately.
      await uploadConnectionPhoto({ connectionId: result.connectionId, photoDataUrl: connectionPhoto });
      toast("Connection built");
      setPendingConnectionPair(null);
      setConnectionPhoto(null);
    } catch {
      toast("Couldn't place connection");
    } finally {
      setConnectionUploading(false);
    }
  }
  function cancelConnection() {
    stopConnectionCamera();
    setPendingConnectionPair(null);
    setConnectionPhoto(null);
  }

  async function handleDealCrisis(cardId: string) {
    if (!sessionId) return;
    await dealCrisisCard({ sessionId, crisisCardId: cardId });
    setFacCrisisPickerOpen(false);
    playSound("crisis-reveal");
    toast("Crisis dealt");
  }

  async function handleClearCrisis() {
    if (!sessionId) return;
    await clearCrisis({ sessionId });
    toast("Crisis cleared");
  }

  async function handleRepairConnection() {
    if (!sessionId || !playerId) return;
    const res = await repairConnection({ sessionId, playerId });
    if (!res.success) {
      toast(res.error || "Repair failed");
      return;
    }
    playSound("lego-detected");
    toast("Connection restored");
  }

  async function handleDealPower(targetPlayerId: string, cardId: string) {
    if (!sessionId) return;
    const result = await dealPowerCard({ sessionId, playerId: targetPlayerId as Id<"players">, cardId });
    if (result?.success === false) {
      toast(result.error || "Couldn't deal power card");
      return;
    }
    setFacPowerPickerOpen(null);
    playSound("power-dealt");
    toast("Power card dealt");
  }

  async function handleUsePower(powerCardId: string) {
    await usePowerCardMut({ powerCardId: powerCardId as Id<"power_cards"> });
    setPowerModalOpen(null);
    toast("Power used!");
  }

  function startDrag(e: MouseEvent | TouchEvent, pId: Id<"players">) {
    // Ch1 only: players can only drag their own district. Ch2+: positions lock.
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
    // Free movement: no slot snap. Use the player's stored x/y or a starting
    // default if they've never been placed.
    const cardPctX = player?.x ?? 50;
    const cardPctY = player?.y ?? 50;
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
    // Free movement: persist exactly where the player released, with clamping
    // so the card can never land off the map. No slot snap, no slot id.
    const x = Math.max(2, Math.min(95, dropX));
    const y = Math.max(2, Math.min(92, dropY));
    moveDistrict({ playerId: pId, x, y });

    // Ch1 objective: if this player has a target zone, compute proximity and
    // flip the ch1Placed flag. 15% viewport distance is the tolerance — loose
    // enough for fat-fingered drops, tight enough that wild placement fails.
    const player = nonFac.find((p) => p._id === pId);
    if (phase === "map_ch1" && player?.targetZone) {
      const slot = slots.find((s) => s.id === player.targetZone);
      if (slot) {
        const dx = x - slot.x;
        const dy = y - slot.y;
        const within = Math.sqrt(dx * dx + dy * dy) <= 15;
        if (!!player.ch1Placed !== within) setCh1PlacedMut({ playerId: pId, placed: within });
      }
    }
  }

  async function handleAdvance() {
    if (!sessionId) return;
    if (phase === "map_ch1" && !allPlaced) {
      const proceed = typeof window !== "undefined"
        ? window.confirm(`${unplaced.length} ${scenarioData.terminology.district}${unplaced.length !== 1 ? "s" : ""} still unplaced. Advance to Chapter 2 anyway?`)
        : true;
      if (!proceed) return;
    }
    await advanceNewPhase({ sessionId });
  }

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

      {/* ── Narration header — full when open, thin pinned strip once collapsed ── */}
      {chapterText && (narrationVisible ? (
        <div style={{
          background: "linear-gradient(180deg, rgba(255,215,0,.06), transparent)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 16px 12px",
          position: "relative",
          animation: "fadeIn .6s ease-out",
        }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
              letterSpacing: 2.5, color: "var(--textd)", textTransform: "uppercase",
            }}>
              {scenarioData.title} {"\u00B7"} Chapter {chapterNum} of 3
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, letterSpacing: 1.5,
              color: "var(--acc1)", marginTop: 2,
            }}>
              {chapterText.title}
            </div>
          </div>
          <div style={{
            maxWidth: 680, margin: "0 auto",
            fontSize: 12, color: "var(--textd)", fontStyle: "italic", lineHeight: 1.55, textAlign: "center",
          }}>
            &ldquo;{chapterText.narration}&rdquo;
          </div>
          <button
            onClick={() => setNarrationVisible(false)}
            style={{
              position: "absolute", top: 6, right: 10,
              background: "none", border: "none", color: "var(--textdd)",
              cursor: "pointer", fontSize: 10, letterSpacing: 1.5,
              fontFamily: "'Black Han Sans', sans-serif",
            }}
          >
            DISMISS {"\u00D7"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setNarrationVisible(true)}
          style={{
            background: "rgba(255,215,0,.04)", borderTop: "none", borderLeft: "none", borderRight: "none",
            borderBottom: "1px solid var(--border)", width: "100%",
            padding: "6px 16px", cursor: "pointer",
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 11,
            letterSpacing: 2, color: "var(--acc1)", textTransform: "uppercase",
          }}
          title="Tap to re-read the chapter narration"
        >
          Ch {chapterNum} {"\u00B7"} {chapterText.title}
        </button>
      ))}

      {/* ── Ch1 private target hint ── */}
      {phase === "map_ch1" && me?.targetZone && !isFacilitator && (() => {
        const slot = slots.find((s) => s.id === me.targetZone);
        if (!slot) return null;
        const placed = !!me.ch1Placed;
        return (
          <div style={{
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
            background: placed ? "rgba(105,240,174,.08)" : "rgba(255,215,0,.08)",
            borderBottom: `1px solid ${placed ? "rgba(105,240,174,.3)" : "rgba(255,215,0,.3)"}`,
          }}>
            <span style={{ fontSize: 18 }}>{placed ? "\u2705" : "\u{1F3AF}"}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: placed ? "var(--acc4)" : "var(--acc1)", textTransform: "uppercase",
              }}>
                {placed ? "Placed \u2713" : "Your Target"}
              </div>
              <div style={{ fontSize: 12, color: "white" }}>
                {placed
                  ? `Nice work \u2014 your ${scenarioData.terminology.district} is in the right ${scenarioData.terminology.zone}.`
                  : `Drop your ${scenarioData.terminology.district} near "${slot.label}".`}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Ch1 facilitator roster: who is placed, who isn't ── */}
      {phase === "map_ch1" && isFacilitator && (
        <div style={{
          padding: "10px 16px", background: "rgba(255,255,255,.02)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
            letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 6,
          }}>
            Placement Progress
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {nonFac.map((p) => {
              const slot = slots.find((s) => s.id === p.targetZone);
              const placed = !!p.ch1Placed;
              return (
                <div key={p._id} style={{
                  padding: "4px 10px", borderRadius: 16, fontSize: 11,
                  background: placed ? "rgba(105,240,174,.12)" : "rgba(255,255,255,.04)",
                  border: `1px solid ${placed ? "rgba(105,240,174,.35)" : "var(--border)"}`,
                  color: placed ? "var(--acc4)" : "var(--textd)",
                }}>
                  {p.name} {slot ? `\u2192 ${slot.label}` : ""} {placed ? "\u2713" : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ability badge (scenario-themed) ── */}
      {myAbility && (() => {
        const baseAbility = ABILITIES.find((a) => a.id === myAbility);
        if (!baseAbility) return null;
        const ab = getThemedAbility(baseAbility, scenarioData);
        const canMend = isMender && phase === "map_ch3" && !!session?.lostConnection && !session?.menderUsed && !isFacilitator;
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
                {ab.description}
              </div>
            </div>
            {canMend && (
              <button
                className="lb lb-green"
                style={{ fontSize: 10, padding: "8px 12px", whiteSpace: "nowrap" }}
                onClick={handleRepairConnection}
              >
                REPAIR LOST LINK
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Map area ── */}
      <div
        ref={mapRef}
        className="map-area"
        style={{
          flex: 1,
          // Scale to ~60% of viewport height on phones and up to ~560px on
          // desktop so the map actually dominates the screen instead of being
          // crushed by the chrome above/below.
          minHeight: "min(60vh, 560px)",
          position: "relative",
        }}
      >
        <ThemedMap theme={mapTheme} phase={phase as "map_ch1" | "map_ch2" | "map_ch3"} patternComplete={mapRebuilt} />

        {/* Zone name overlay — soft orientation labels over the map art.
            Free movement means these aren't placement targets, just nice
            shared vocabulary for the team to talk about where to drop. */}
        {phase === "map_ch1" && slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              position: "absolute",
              left: slot.x + "%",
              top: slot.y + "%",
              transform: "translate(-50%, -50%)",
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "rgba(255,255,255,.6)",
              textShadow: "0 1px 3px rgba(0,0,0,.9)",
              pointerEvents: "none",
              zIndex: 3,
              whiteSpace: "nowrap",
            }}
          >
            {slot.label}
          </div>
        ))}

        {/* Connection lines + LEGO bridge thumbnails */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
          {(phase === "map_ch2" || phase === "map_ch3") && (connections ?? []).map((conn) => {
            const a = nonFac.find((p) => p._id === conn.fromSlotId);
            const b = nonFac.find((p) => p._id === conn.toSlotId);
            if (!a || !b) return null;
            const ax = a.x ?? 50, ay = a.y ?? 50;
            const bx = b.x ?? 50, by = b.y ?? 50;
            return (
              <line
                key={conn._id}
                x1={ax + "%"} y1={ay + "%"}
                x2={bx + "%"} y2={by + "%"}
                stroke="rgba(255,215,0,.65)" strokeWidth={3}
              />
            );
          })}
        </svg>

        {/* Bridge thumbnails at the midpoint of each connection. Kept outside
            the SVG so we can use real <img> tags for the JPEG preview. */}
        {(phase === "map_ch2" || phase === "map_ch3") && (connections ?? []).map((conn) => {
          if (!conn.photoDataUrl) return null;
          const a = nonFac.find((p) => p._id === conn.fromSlotId);
          const b = nonFac.find((p) => p._id === conn.toSlotId);
          if (!a || !b) return null;
          const ax = a.x ?? 50, ay = a.y ?? 50;
          const bx = b.x ?? 50, by = b.y ?? 50;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          return (
            <div
              key={`bridge-${conn._id}`}
              style={{
                position: "absolute",
                left: mx + "%",
                top: my + "%",
                transform: "translate(-50%, -50%)",
                width: 36, height: 36,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--acc1)",
                boxShadow: "0 2px 8px rgba(0,0,0,.5)",
                zIndex: 6,
                pointerEvents: "none",
              }}
            >
              <img src={conn.photoDataUrl} alt="LEGO bridge" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            </div>
          );
        })}

        {/* Placed districts — free positioning from player's stored x/y */}
        {placed.map((p) => {
          const isMe = p._id === playerId;
          const isDragging = dragPos?.id === p._id;
          const pctX = isDragging ? dragPos.x : (p.x ?? 50);
          const pctY = isDragging ? dragPos.y : (p.y ?? 50);
          const isSelectedForConn = (isCh2 || isCh3) && p._id === selectedForConnection;
          const connectionCount = (connections ?? []).filter(
            (c) => c.fromSlotId === p._id || c.toSlotId === p._id
          ).length;

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
              onClick={() => { if (isCh2 || isCh3) handleDistrictTap(p._id); }}
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
            {me && me.x === undefined && (
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

      {/* ── Ch2: Crisis card reveal banner. Visible until facilitator clears it. ── */}
      {isCh2 && activeCrisis && (
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
          {isFacilitator && (
            <button
              onClick={handleClearCrisis}
              style={{
                background: "rgba(0,0,0,.35)", border: "1px solid var(--border)",
                color: "var(--textd)", cursor: "pointer",
                fontSize: 10, letterSpacing: 1.5, fontFamily: "'Black Han Sans', sans-serif",
                padding: "6px 10px", borderRadius: 6,
                alignSelf: "flex-start",
              }}
              title="Clear the crisis banner for the whole session"
            >
              CLEAR
            </button>
          )}
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

      {/* ── Instruction hint for Ch2/Ch3 connection flow ── */}
      {(isCh2 || isCh3) && !isFacilitator && !mapRebuilt && (
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 11, color: "var(--textd)", textAlign: "center",
          background: "rgba(255,255,255,.02)",
        }}>
          {selectedForConnection
            ? `Tap a second district to bridge them. Tap the same one again to cancel.`
            : `Build a LEGO bridge between two districts. Tap one, then the other — the camera opens so you can photograph your bridge.`}
        </div>
      )}

      {/* ── Ch3: Rally banner. Simple framing — no hidden pattern mechanic. ── */}
      {isCh3 && !mapRebuilt && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(255,215,0,.12), rgba(255,215,0,.03))",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 26 }}>{"\u{1F6E0}\uFE0F"}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              color: "var(--acc1)", textTransform: "uppercase",
            }}>
              Chapter 3 {"\u00B7"} Rally
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4, lineHeight: 1.5 }}>
              Rebuild the connections your team lost. Talk it out, decide together what the {scenarioData.terminology.map} needs. The facilitator marks it rebuilt when the group is ready.
            </div>
          </div>
        </div>
      )}

      {/* ── Ch3 complete — celebration strip ── */}
      {isCh3 && mapRebuilt && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(105,240,174,.18), rgba(105,240,174,.04))",
          textAlign: "center",
          fontSize: 13, color: "var(--acc4)", fontWeight: 900, letterSpacing: 1,
          fontFamily: "'Black Han Sans', sans-serif",
        }}>
          {"\u2728"} The {scenarioData.terminology.map} stands reborn {"\u2728"}
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
          {isCh3 && `${(connections ?? []).length} connection${(connections ?? []).length !== 1 ? "s" : ""} on the map`}
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
          {isFacilitator && isCh3 && !mapRebuilt && (
            <button
              className="lb lb-yellow"
              style={{ fontSize: 10, padding: "7px 11px" }}
              onClick={async () => {
                if (!sessionId) return;
                await revealPattern({ sessionId });
                playSound("map-rebuilt");
                toast(`The ${scenarioData.terminology.map} is rebuilt`);
              }}
              title="Crossfade the map to its rebuilt state"
            >
              MAP REBUILT {"\u2192"}
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
              {isCh3 && mapRebuilt && `${scenarioData.terminology.map} reborn \u2014 waiting to vote`}
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

      {/* ── Connection camera modal ── */}
      {pendingConnectionPair && (() => {
        const a = nonFac.find((p) => p._id === pendingConnectionPair.fromId);
        const b = nonFac.find((p) => p._id === pendingConnectionPair.toId);
        return (
          <div className="card-modal-overlay" onClick={cancelConnection}>
            <div className="card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="card-modal-body" style={{ padding: 16 }}>
                <div className="card-modal-title">Photograph the LEGO Bridge</div>
                <div style={{ fontSize: 12, color: "var(--textd)", margin: "6px 0 12px", textAlign: "center" }}>
                  {a?.districtName || a?.name || "District A"} {"\u2194"} {b?.districtName || b?.name || "District B"}
                </div>
                {connectionCameraActive && (
                  <div className="cam-area" style={{ marginBottom: 10 }}>
                    <video ref={connectionVideoRef} className="cam-video" autoPlay playsInline muted />
                  </div>
                )}
                {connectionPhoto && (
                  <div className="prev-area" style={{ marginBottom: 10 }}>
                    <img src={connectionPhoto} alt="LEGO bridge preview" className="prev-img" />
                  </div>
                )}
                <canvas ref={connectionCanvasRef} style={{ display: "none" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {connectionCameraActive && !connectionPhoto && (
                    <button className="lb lb-yellow" style={{ flex: 1 }} onClick={captureConnectionPhoto}>
                      CAPTURE
                    </button>
                  )}
                  {connectionPhoto && (
                    <>
                      <button
                        className="lb lb-ghost"
                        style={{ flex: 1 }}
                        onClick={() => { setConnectionPhoto(null); startConnectionCamera(); }}
                      >
                        RETAKE
                      </button>
                      <button
                        className="lb lb-green"
                        style={{ flex: 1 }}
                        disabled={connectionUploading}
                        onClick={submitConnection}
                      >
                        {connectionUploading ? "SAVING\u2026" : "USE THIS"}
                      </button>
                    </>
                  )}
                  {!connectionCameraActive && !connectionPhoto && (
                    <>
                      <button className="lb lb-yellow" style={{ flex: 1 }} onClick={startConnectionCamera}>
                        OPEN CAMERA
                      </button>
                      <button
                        className="lb lb-ghost"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={handleConnectionUploadFallback}
                      >
                        UPLOAD PHOTO
                      </button>
                    </>
                  )}
                </div>
              </div>
              <button className="card-modal-close" onClick={cancelConnection}>CANCEL</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
