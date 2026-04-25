"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS, STORY_TEXT, ABILITIES, CRISIS_CARDS, POWER_CARDS, getThemedAbility, CH1_PLACEMENT_SECONDS, CH1_SLOT_RIDDLES, CONNECTION_TYPES } from "../../lib/constants";
import { playSound } from "../../lib/sound";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import ThemedMap from "./maps/ThemedMap";
import InAppCamera from "./InAppCamera";
import MapChatPanel from "./MapChatPanel";
import AbilityBadge from "./AbilityBadge";
import { getCrisisIllustration } from "./CrisisIllustrations";
import { getPowerIllustration } from "./PowerIllustrations";
import { Ch1BriefingOverlay } from "./Ch1BriefingOverlay";
import Ch2Pass13Overlays from "./Ch2Pass13Overlays";
import PatternOverlay from "./PatternOverlay";
// Pass #18: HRValidateRebuildPanel removed; rebuilds auto-validate on upload.
import { Ch2FacWaitScreen } from "./Ch2FacWaitScreen";
import { Ch3FacWaitScreen } from "./Ch3FacWaitScreen";
import Ch2NextStepBanner from "./Ch2NextStepBanner";
import DiplomatUnmuteOverlay from "./DiplomatUnmuteOverlay";
import Ch3IntroOverlay from "./Ch3IntroOverlay";
import ConnectionBuildCard from "./ConnectionBuildCard";
import ProtectionBanner from "./ProtectionBanner";
import ScoutWarningOverlay from "./ScoutWarningOverlay";

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
  const { sessionId, sessionCode, playerId, role, scenario, name } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const connections = useQuery(api.mapPhase.getConnections, sessionId ? { sessionId } : "skip");
  const connectionRequests = useQuery(api.mapPhase.getConnectionRequests, sessionId ? { sessionId } : "skip");
  const myPowerCards = useQuery(
    api.mapPhase.getPlayerPowerCards,
    sessionId && playerId ? { sessionId, playerId } : "skip"
  );
  const moveDistrict = useMutation(api.game.moveDistrict);
  const updateCh3Position = useMutation(api.mapPhase.updateCh3Position);
  const forceCompleteCh3 = useMutation(api.mapPhase.forceCompleteCh3);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);
  const removeConnection = useMutation(api.mapPhase.removeConnection);
  // Pass #21: dealCrisisV13 + dealCrisisCard no longer called from client.
  // The new flow is stagePendingCrisis (Scout-only preview) followed by
  // confirmCrisisAnnounce (Scout-OK or HR fallback). Server keeps the legacy
  // mutations for in-flight session safety.
  const stagePendingCrisis = useMutation(api.mapPhase.stagePendingCrisis);
  const confirmCrisisAnnounce = useMutation(api.mapPhase.confirmCrisisAnnounce);
  // Pass #18: BLACKOUT button removed; mutation left on server as dead code.
  // Pass #18: resolveCrisisDamage no longer called from the client; damage
  // lands automatically via the scheduled announceCrisis internal mutation.
  const rotateRolesForC2 = useMutation(api.mapPhase.rotateRolesForC2);
  const dealPowerCard = useMutation(api.mapPhase.dealPowerCard);
  const useSwapPower = useMutation(api.mapPhase.useSwapPower);
  const useShieldPower = useMutation(api.mapPhase.useShieldPower);
  const useMovePower = useMutation(api.mapPhase.useMovePower);
  const useRevealPower = useMutation(api.mapPhase.useRevealPower);
  const useDoubleLinkPower = useMutation(api.mapPhase.useDoubleLinkPower);
  // Pass #18: clearCrisis no longer called from client (auto-clear on rebuild).
  const repairConnection = useMutation(api.mapPhase.repairConnection);
  const clearAnchorProtected = useMutation(api.mapPhase.clearAnchorProtected);
  const requestConnection = useMutation(api.mapPhase.requestConnection);
  const acceptConnection = useMutation(api.mapPhase.acceptConnection);
  const declineConnection = useMutation(api.mapPhase.declineConnection);
  const uploadConnectionPhotoSide = useMutation(api.mapPhase.uploadConnectionPhotoSide);
  const markConnectionReady = useMutation(api.mapPhase.markConnectionReady);
  const repairDamagedDistrict = useMutation(api.mapPhase.repairDamagedDistrict);
  const useRelayPower = useMutation(api.mapPhase.useRelayPower);
  const useForesightPower = useMutation(api.mapPhase.useForesightPower);
  const markCh2Ready = useMutation(api.mapPhase.markCh2Ready);
  const autoDealCh2PowerCards = useMutation(api.mapPhase.autoDealCh2PowerCards);
  const seedCh1Targets = useMutation(api.game.seedCh1Targets);
  const setCh1PlacedMut = useMutation(api.game.setCh1Placed);
  const markCh1Ready = useMutation(api.game.markCh1Ready);
  const skipCh1ReadyGate = useMutation(api.game.skipCh1ReadyGate);
  const autoPlaceCh1Stragglers = useMutation(api.game.autoPlaceCh1Stragglers);

  const isLoading = session === undefined || players === undefined;

  const phase = session?.phase ?? "map_ch1";
  const scenarioId = scenario || session?.scenario || "rising_tides";
  const scenarioData = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const mapTheme = scenarioData.mapTheme;
  const slots = PLACEMENT_SLOTS[mapTheme] || PLACEMENT_SLOTS.water;
  const chapterText = STORY_TEXT[scenarioId]?.[phase];
  const chapterNum = phase === "map_ch1" ? 1 : phase === "map_ch2" ? 2 : 3;

  const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
  // Pass #17: present-filtered roster. Every gate that today reads
  // nonFac.length or nonFac.every(...) should run over presentNonFac so a
  // dropped player stops blocking the game within ~10s of the tab closing.
  // The original nonFac stays for display (ghost rows dim + tag "LEFT").
  const presentNonFac = nonFac.filter((p) => p.isPresent !== false);
  const me = nonFac.find((p) => p._id === playerId);
  const myAbility = me?.ability;
  const isMender = myAbility === "mender";
  const isFacilitator = role === "facilitator";

  // "Placed" = player has been dragged to an explicit x/y on the map. Free
  // movement: no slot snapping, overlaps allowed: so x/y is the only signal.
  // Only present players count: if a ghost never placed, the gate is clear.
  const placed = presentNonFac.filter((p) => p.x !== undefined && p.y !== undefined);
  const unplaced = presentNonFac.filter((p) => p.x === undefined || p.y === undefined);
  const allPlaced = presentNonFac.length > 0 && unplaced.length === 0;

  // Desktop breakpoint: used to widen the main container up to 1280px and
  // reserve room for the right-sidebar chat. Matches MapChatPanel's own
  // matchMedia check.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const isMapPhase = phase === "map_ch1" || phase === "map_ch2" || phase === "map_ch3";

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

  // Fire a toast + green pulse when the Anchor's linkage absorbs a crisis hit.
  // The server writes session.anchorProtected with the shielded connection's
  // endpoints. Client shows the toast, then clears it ~3s later so the pulse
  // doesn't persist.
  useEffect(() => {
    if (!session?.anchorProtected || !sessionId) return;
    const anchorPlayer = nonFac.find((p) => p._id === session.anchorProtected?.anchorPlayerId);
    const anchorName = anchorPlayer?.name ?? "The Anchor";
    toast(`${anchorName} shielded this connection.`);
    const t = setTimeout(() => {
      clearAnchorProtected({ sessionId }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [session?.anchorProtected, sessionId, clearAnchorProtected, nonFac]);

  // Fire a toast when a shielded player's shield is consumed by a crisis.
  // We watch the shielded set from one render to the next; anyone who was
  // shielded and now isn't (and hasn't had a new shield applied) absorbed
  // the crisis. Filtered to Ch2/3 so we don't toast for unrelated changes.
  const prevShieldedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const nowShielded = new Set(nonFac.filter((p) => p.shielded).map((p) => p._id as string));
    if (phase === "map_ch2" || phase === "map_ch3") {
      prevShieldedRef.current.forEach((id) => {
        if (!nowShielded.has(id)) {
          const p = nonFac.find((x) => (x._id as string) === id);
          if (p) {
            const isMe = p._id === playerId;
            toast(isMe
              ? "Shield absorbed the crisis. Your district is safe."
              : `Shield absorbed the crisis on ${p.districtName || p.name}.`);
          }
        }
      });
    }
    prevShieldedRef.current = nowShielded;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonFac.map((p) => `${p._id}:${p.shielded ? 1 : 0}`).join("|"), phase]);

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

  // ── Ch1 ready-up + placement countdown ──
  // Players see a blocking briefing overlay on Ch1 entry. Dismissing it marks
  // them ready on the server. When every non-fac player is ready, the session
  // anchors subPhaseDeadline to now+CH1_PLACEMENT_SECONDS. Once that hits
  // zero, drag is disabled and the facilitator's advance button enables.
  const ch1DeadlineSet = phase === "map_ch1" && !!session?.subPhaseDeadline;
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== "map_ch1" || !session?.subPhaseDeadline) return;
    const t = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase, session?.subPhaseDeadline]);
  const ch1MsLeft = ch1DeadlineSet ? Math.max(0, (session!.subPhaseDeadline ?? 0) - nowTick) : 0;
  const ch1Expired = phase === "map_ch1" && ch1DeadlineSet && ch1MsLeft <= 0;
  const ch1ReadyCount = presentNonFac.filter((p) => p.ch1Ready).length;
  const ch1AllReady = presentNonFac.length > 0 && ch1ReadyCount === presentNonFac.length;

  // Reconnect guard: if sessionStorage says this player already dismissed the
  // briefing but the server shows them as not ready, re-mark them so the gate
  // doesn't deadlock on a refresh. Mirrors the pair_build pattern.
  useEffect(() => {
    if (phase !== "map_ch1") return;
    if (!playerId || !me || me.isFacilitator) return;
    if (me.ch1Ready) return;
    if (typeof window === "undefined" || !sessionId) return;
    const seen = window.sessionStorage.getItem(`ch1-intro-seen:${sessionId}`) === "1";
    if (!seen) return;
    markCh1Ready({ playerId }).catch(() => {});
  }, [phase, playerId, me, sessionId, markCh1Ready]);

  const showCh1Briefing = phase === "map_ch1" && !isFacilitator && !!me && !me.ch1Ready;

  // ── Ch1 riddle-solved celebration ──
  // The moment `me.ch1Placed` flips from false to true, fire a toast, play a
  // success chime, and mark the player's district for a 2s green pulse so the
  // player can feel the win. Guarded by a ref so it fires once per solve.
  const ch1CelebrateFiredRef = useRef(false);
  const [ch1CelebrateAt, setCh1CelebrateAt] = useState<number | null>(null);
  useEffect(() => {
    if (phase !== "map_ch1") { ch1CelebrateFiredRef.current = false; setCh1CelebrateAt(null); return; }
    if (!me || me.isFacilitator) return;
    if (me.ch1Placed && !ch1CelebrateFiredRef.current) {
      ch1CelebrateFiredRef.current = true;
      setCh1CelebrateAt(Date.now());
      playSound("clue-sent");
      const slot = slots.find((s) => s.id === me.targetZone);
      toast(slot ? `Riddle solved. It was the ${slot.label}.` : "Riddle solved.");
      const t = setTimeout(() => setCh1CelebrateAt(null), 2200);
      return () => clearTimeout(t);
    }
    // If the player drags off the correct spot, reset so they can celebrate
    // again when they drop it back in range.
    if (!me.ch1Placed && ch1CelebrateFiredRef.current) {
      ch1CelebrateFiredRef.current = false;
      setCh1CelebrateAt(null);
    }
  }, [phase, me?.ch1Placed, me?.targetZone, me?.isFacilitator, slots]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pass #16: Ch2 + Ch3 onboarding are now driven by blocking ready-gate
  // overlays (Ch2IntroOverlay, Ch3IntroOverlay) synced with server flags.
  // The old sessionStorage-based MapOnboardingOverlay is retired.

  // ── Map connection-build countdown ──
  // When Ch2 or Ch3 starts, server sets subPhaseDeadline. Show a live
  // countdown so teams know how long they have to assemble LEGO bridges.
  const [buildMsLeft, setBuildMsLeft] = useState(0);
  useEffect(() => {
    if (phase !== "map_ch2" && phase !== "map_ch3") return;
    if (!session?.subPhaseDeadline) {
      setBuildMsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, (session.subPhaseDeadline ?? 0) - Date.now());
      setBuildMsLeft(left);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, session?.subPhaseDeadline]);

  // ── Drag state (percentages) ──
  const mapRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  // Pass #18: stable photo cache. Reactive Convex queries can briefly omit
  // photoDataUrl / photoA / photoB during a re-subscription, which makes
  // district and connection thumbnails flicker. We absorb every non-empty
  // src we see and serve the last-known-good value if the live value is
  // temporarily missing. Keyed by a stable id (player._id or connection._id).
  const photoCacheRef = useRef<Map<string, string>>(new Map());
  function stablePhoto(id: string | undefined, current: string | undefined): string | undefined {
    if (!id) return current;
    if (current) {
      photoCacheRef.current.set(id, current);
      return current;
    }
    return photoCacheRef.current.get(id);
  }

  // ── Ch2/Ch3: connection-building state ──
  // Free movement means connections are player-to-player, not slot-to-slot.
  // The string stored in connections.fromSlotId / toSlotId is the player _id.
  const [selectedForConnection, setSelectedForConnection] = useState<string | null>(null); // playerId
  const [facCrisisPickerOpen, setFacCrisisPickerOpen] = useState(false);
  const [facPowerPickerOpen, setFacPowerPickerOpen] = useState<string | null>(null); // playerId we're dealing to
  // Pass #19: powerModalOpen state and handleUsePower dropped. Powers fire
  // automatically from the server; the player no longer taps "use now". The
  // targeting machinery below is retained only for facilitator-side flows.
  const [powerTargeting, setPowerTargeting] = useState<
    | { mode: "swap"; powerCardId: Id<"power_cards">; firstPick: Id<"players"> | null }
    | { mode: "shield"; powerCardId: Id<"power_cards"> }
    | { mode: "move"; powerCardId: Id<"power_cards"> }
    | null
  >(null);

  const isCh2 = phase === "map_ch2";
  const isCh3 = phase === "map_ch3";
  const activeCrisis = session?.crisisCardId ? CRISIS_CARDS.find((c) => c.id === session.crisisCardId) : null;
  const myUnusedPowerCards = (myPowerCards ?? []).filter((c) => !c.used);
  const myAllPowerCards = myPowerCards ?? [];

  // ── Ch3: map-rebuilt state ──
  // `hiddenPatternRevealed` is repurposed as the "rebuilt" flag. The facilitator
  // sets it once Ch3 Rally discussion is done and the team has repaired what
  // they wanted; the map crossfades from damaged to rebuilt.
  const mapRebuilt = !!session?.hiddenPatternRevealed;

  // Scout ability (Ch2 only): sees upcoming crisis when facilitator stages it.
  // Pass #21: source is session.pendingCrisisCardId (HR-staged but not yet
  // announced to other players). Falls back to session.scoutPreview during
  // upgrade/legacy windows so an in-flight game keeps working.
  const isScout = myAbility === "scout";
  const scoutPreviewCardId = session?.pendingCrisisCardId ?? session?.scoutPreview;
  const scoutPreviewCard = scoutPreviewCardId
    ? CRISIS_CARDS.find((c) => c.id === scoutPreviewCardId)
    : null;
  // Pass #14: hit animation when damageResolved flips to true.
  const [crisisHitShake, setCrisisHitShake] = useState(false);
  const prevDamageResolvedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const curr = session?.damageResolved;
    if (prevDamageResolvedRef.current === false && curr === true) {
      setCrisisHitShake(true);
      const t = setTimeout(() => setCrisisHitShake(false), 900);
      prevDamageResolvedRef.current = curr;
      return () => clearTimeout(t);
    }
    prevDamageResolvedRef.current = curr;
  }, [session?.damageResolved]);
  const scoutPlayer = nonFac.find((p) => p.ability === "scout");

  // Chat mute countdown banner (Blackout crisis).
  const chatMuteMsLeft = session?.chatMutedUntil && session.chatMutedUntil > Date.now()
    ? session.chatMutedUntil - Date.now() : 0;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (chatMuteMsLeft <= 0) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [chatMuteMsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap a district in Ch3 to request a connection. Ch2 no longer allows
  // connection building: it's crisis + rebuild. In Ch3, the first tap must
  // be the player's OWN district; the second tap is the partner. A request
  // is sent and the partner sees an incoming-request banner.
  function handleDistrictTap(targetPlayerId: string) {
    if (!sessionId || !playerId || !targetPlayerId) return;
    // Pass #13: connection-building lives in Ch2 (and remains available in Ch3
    // only for rebuilding unfilled edges). Pass #25: Ch3 is shape-placement
    // only — no new connections — so taps in Ch3 are ignored entirely.
    if (!isCh2) return;
    // In Ch2, don't allow new connection requests while a crisis is active
    // or while the player's district is damaged and awaiting rebuild.
    if (isCh2 && session?.ch2State === "CH2_CRISIS_ACTIVE") {
      toast("Crisis active. Finish your role action first.");
      return;
    }

    // First tap must be your own district.
    if (!selectedForConnection) {
      if (targetPlayerId !== playerId) {
        toast("Tap your own district first, then the partner you want to build with.");
        return;
      }
      setSelectedForConnection(targetPlayerId);
      return;
    }
    // Same district tapped again: cancel selection
    if (selectedForConnection === targetPlayerId) {
      setSelectedForConnection(null);
      return;
    }
    // Already connected? Ch3 lets you see but not duplicate.
    const existing = (connections ?? []).find(
      (c) =>
        (c.fromSlotId === selectedForConnection && c.toSlotId === targetPlayerId) ||
        (c.fromSlotId === targetPlayerId && c.toSlotId === selectedForConnection)
    );
    if (existing) {
      toast("You already have a bridge with this player.");
      setSelectedForConnection(null);
      return;
    }
    // Send handshake request instead of directly placing.
    requestConnection({
      sessionId,
      fromPlayerId: selectedForConnection as Id<"players">,
      toPlayerId: targetPlayerId as Id<"players">,
    })
      .then((r) => {
        if (!r?.success) {
          toast(r?.error || "Could not send request");
        } else if (r.mutual) {
          toast("Mutual request! Bridge opened.");
          playSound("clue-sent");
        } else {
          toast("Request sent. Waiting for them to accept.");
        }
      })
      .catch(() => toast("Could not reach server"));
    setSelectedForConnection(null);
  }

  async function handleDealCrisis(cardId: string) {
    if (!sessionId) return;
    // Pass #21: stage to Scout-only preview first. Crisis goes live to all
    // players only after Scout taps OK (or HR fallback). Pre-Pass-21 dealt
    // straight to all players.
    try {
      const res = await stagePendingCrisis({ sessionId, crisisCardId: cardId });
      if (res && res.staged === false) {
        if (res.reason === "ROTATION_PENDING") {
          const names = (res.missing ?? []).join(", ");
          toast(`Waiting on ${names} to acknowledge their new role.`);
          return;
        }
        if (res.reason === "ALREADY_PENDING") {
          toast("A crisis is already previewing.");
          return;
        }
        if (res.reason === "CRISIS_ACTIVE") {
          toast("Clear the current crisis first.");
          return;
        }
      }
      setFacCrisisPickerOpen(false);
      playSound("crisis-reveal");
      toast("Previewing to Scout");
    } catch (e) {
      toast((e as Error).message);
    }
  }

  async function handleAnnounceNow() {
    if (!sessionId) return;
    try {
      const res = await confirmCrisisAnnounce({ sessionId });
      if (res && res.confirmed === false) {
        if (res.reason === "NO_PENDING") return;
      }
      playSound("crisis-reveal");
      toast("Announcing without Scout ack");
    } catch (e) {
      toast((e as Error).message);
    }
  }

  async function handleRotateRoles() {
    if (!sessionId) return;
    try {
      await rotateRolesForC2({ sessionId });
      toast("Roles rotated. Ready for Crisis 2.");
    } catch (e) {
      toast((e as Error).message);
    }
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

  async function handleTargetTapPlayer(targetId: Id<"players">) {
    if (!powerTargeting) return false;
    if (powerTargeting.mode === "shield") {
      const res = await useShieldPower({ powerCardId: powerTargeting.powerCardId, targetPlayerId: targetId });
      if (res.success) toast("Shield placed.");
      else toast(res.error || "Couldn't place shield.");
      setPowerTargeting(null);
      return true;
    }
    if (powerTargeting.mode === "swap") {
      if (!powerTargeting.firstPick) {
        setPowerTargeting({ ...powerTargeting, firstPick: targetId });
        toast("Tap the second district.");
        return true;
      }
      if (powerTargeting.firstPick === targetId) {
        toast("Pick a different second district.");
        return true;
      }
      const res = await useSwapPower({
        powerCardId: powerTargeting.powerCardId,
        playerAId: powerTargeting.firstPick,
        playerBId: targetId,
      });
      if (res.success) toast("Districts swapped.");
      else toast(res.error || "Couldn't swap.");
      setPowerTargeting(null);
      return true;
    }
    return false;
  }

  async function handleTargetTapMap(xPct: number, yPct: number) {
    if (!powerTargeting || powerTargeting.mode !== "move") return false;
    const res = await useMovePower({ powerCardId: powerTargeting.powerCardId, x: xPct, y: yPct });
    if (res.success) toast("District moved.");
    else toast(res.error || "Couldn't move.");
    setPowerTargeting(null);
    return true;
  }

  function cancelPowerTargeting() {
    setPowerTargeting(null);
    toast("Power card cancelled (not used).");
  }

  function startDrag(e: MouseEvent | TouchEvent, pId: Id<"players">) {
    // Pass #18: Ch1 AND Ch3 allow drag. In both phases, players can only drag
    // their OWN district. Ch2 locks positions (only connection-build in Ch2).
    if (phase !== "map_ch1" && phase !== "map_ch3") return;
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

    // Pass #13: in Ch3, mirror the drop into updateCh3Position so the server
    // can flip ch3InTargetSlot when the district lands near its pattern slot.
    if (phase === "map_ch3" && sessionId) {
      updateCh3Position({ sessionId, playerId: pId, x, y });
    }

    // Ch1 objective: if this player has a target zone, compute proximity and
    // flip the ch1Placed flag. 15% viewport distance is the tolerance: loose
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

  const advanceInFlightRef = useRef(false);
  async function handleAdvance() {
    if (!sessionId) return;
    if (advanceInFlightRef.current) return;
    // Hard gate on Ch1: can't advance until all districts are placed OR the
    // placement timer has expired. Server auto-places any stragglers on the
    // transition to Ch2, so the board is always fully populated afterward.
    if (phase === "map_ch1" && !allPlaced && !ch1Expired) return;
    advanceInFlightRef.current = true;
    try {
      // Pass the current phase so the mutation bails if somebody else already
      // advanced. This is the real fix for the "skipped to Ch3" bug.
      await advanceNewPhase({ sessionId, fromPhase: phase });
    } finally {
      // Release the guard on the next tick so a rapid double-tap in the same
      // event loop doesn't slip through, but the button is live again by the
      // time Convex has propagated the new phase back to us.
      setTimeout(() => { advanceInFlightRef.current = false; }, 500);
    }
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

  // Pass #18: collective-entry gates. Map opens for everyone (facilitator AND
  // players) the instant the last present non-fac player taps READY. Driven
  // by a sticky session flag that latches ONCE; once opened, a flickering
  // presence or late joiner cannot drag anyone back to a wait screen.
  if (phase === "map_ch2" && !session?.ch2MapOpened) {
    const readyCount = presentNonFac.filter((p) => p.ch2Ready).length;
    if (isFacilitator) {
      return <Ch2FacWaitScreen nonFac={presentNonFac} readyCount={readyCount} />;
    }
    // Non-fac players: if THIS player has readied, show a waiting-for-
    // teammates overlay. If they have not readied yet, the Ch2IntroOverlay
    // rendered elsewhere in the tree blocks them first.
    if (me?.ch2Ready) {
      return (
        <Ch2FacWaitScreen
          nonFac={presentNonFac}
          readyCount={readyCount}
          forPlayer
        />
      );
    }
  }

  if (phase === "map_ch3" && !session?.ch3MapOpened) {
    const readyCount = presentNonFac.filter((p) => p.ch3Ready).length;
    if (isFacilitator) {
      return (
        <Ch3FacWaitScreen
          nonFac={presentNonFac}
          readyCount={readyCount}
          patternName={session?.patternName ?? null}
        />
      );
    }
    if (me?.ch3Ready) {
      return (
        <Ch3FacWaitScreen
          nonFac={presentNonFac}
          readyCount={readyCount}
          patternName={session?.patternName ?? null}
          forPlayer
        />
      );
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--bg0)", color: "white",
      // Reserve room so the docked MapChatPanel doesn't overlap the map
      // content. Bottom dock on mobile, right sidebar on desktop.
      paddingRight: isDesktop && isMapPhase ? 340 : 0,
      paddingBottom: !isDesktop && isMapPhase ? 60 : 0,
      maxWidth: isDesktop ? 1280 + 340 : undefined,
      margin: isDesktop ? "0 auto" : undefined,
      width: isDesktop ? "100%" : undefined,
    }}>
      <BrandBar badge={isFacilitator ? "FACILITATOR" : undefined} />

      {/* Pass #16: public shield save banner. Auto-dismisses after ~6s. */}
      {(session?.lastProtectionEvents?.length ?? 0) > 0 && (
        <ProtectionBanner
          events={(session?.lastProtectionEvents ?? []).map((e) => ({
            savedPlayerId: e.savedPlayerId as unknown as string,
            protectorPlayerId: e.protectorPlayerId as unknown as string | undefined,
            protectorRole: e.protectorRole,
            at: e.at,
          }))}
          playersById={Object.fromEntries(
            (players ?? []).map((p) => [p._id as unknown as string, p.name]),
          )}
        />
      )}

      {sessionId && sessionCode && (
        <Ch2Pass13Overlays
          sessionId={sessionId}
          sessionCode={sessionCode}
          playerId={playerId ?? null}
          isFacilitator={isFacilitator}
        />
      )}

      {/* Pass #16: blocking Ch3 ready gate. Until the player dismisses this,
          HR's Ch3FacWaitScreen shows and their own map is hidden by its
          overlay. Replaces the older MapOnboardingOverlay Ch3 panel. */}
      {phase === "map_ch3" && !isFacilitator && playerId && me && me.ch3Ready !== true && (
        <Ch3IntroOverlay
          playerId={playerId as Id<"players">}
          scenarioId={scenarioId}
          patternName={session?.patternName ?? null}
          onDone={() => { /* no-op: server ch3Ready flag drives re-render */ }}
        />
      )}

      {showCh1Briefing && sessionId && playerId && (
        <Ch1BriefingOverlay
          sessionId={sessionId}
          playerId={playerId}
          districtTerm={scenarioData.terminology.district}
          zoneTerm={scenarioData.terminology.zone}
          mapTerm={scenarioData.terminology.map}
          riddle={me?.targetZone ? CH1_SLOT_RIDDLES[mapTheme]?.[me.targetZone] : undefined}
        />
      )}

      {/* ═══ Pass #18: Diplomat chat-unmute mini-game ═══
          Shown only to the player whose role is Diplomat while the server's
          Diplomat timer is running. Tapping a muted teammate unmutes them. */}
      {phase === "map_ch2" && !isFacilitator && myAbility === "diplomat"
        && sessionId && playerId
        && session?.diplomatUnmuteStartedAt
        && !session?.diplomatUnmuteDone && (
        <DiplomatUnmuteOverlay
          sessionId={sessionId}
          diplomatId={playerId}
          crisisIndex={session.crisisIndex ?? 1}
          startedAt={session.diplomatUnmuteStartedAt}
          players={(players ?? [])
            .filter((p) => !p.isFacilitator)
            .map((p) => ({ _id: p._id, name: p.name, ability: p.ability }))}
        />
      )}

      {/* ═══ Pass #30: Scout's private warning to the targeted player ═══
          Set by scoutChooseC1 when mode === "dm". Mounted only for the
          recipient. Other players see nothing. */}
      {phase === "map_ch2" && !isFacilitator && sessionId && playerId
        && session?.scoutWarning?.targetPlayerId === playerId && (
        <ScoutWarningOverlay
          sessionId={sessionId}
          playerId={playerId}
          text={session.scoutWarning.text}
        />
      )}

      {/* ═══ Pass #30: pre-crisis "waiting on" indicator ═══
          Shown during the pre-resolution window. Damage no longer auto-fires
          on a 10s timer; it lands only after every shielder/pre-resolution
          role-holder commits. This banner names who the team is waiting on. */}
      {phase === "map_ch2" && session?.crisisSubPhase === "pre" && sessionId && (
        <PreCrisisWaitingOn
          sessionId={sessionId}
          players={(players ?? []).filter(p => !p.isFacilitator)}
          session={session}
        />
      )}

      {/* ═══ Pass #18: persistent "what to do next" banner for Ch2 players ═══ */}
      {phase === "map_ch2" && !isFacilitator && me && session && (
        <Ch2NextStepBanner
          me={{
            _id: me._id as unknown as string,
            ability: me.ability,
            districtDamaged: me.districtDamaged,
            crisisContribution: me.crisisContribution,
          }}
          connections={(connections ?? []).map((c) => ({
            fromSlotId: c.fromSlotId,
            toSlotId: c.toSlotId,
            built: c.built,
          }))}
          session={{
            crisisCardId: session.crisisCardId,
            crisisSubPhase: session.crisisSubPhase,
            ch2ConnectionsComplete: session.ch2ConnectionsComplete,
          }}
        />
      )}

      {/* ═══ Ch2: Damage Repair Modal ═══
          When a crisis damages your district, the game blocks everything
          until you re-upload a new photo of the rebuilt district. */}
      {phase === "map_ch2" && me?.districtDamaged && !isFacilitator && (
        <DamageRepairOverlay
          crisisCardId={me.damageReason}
          scenarioTitle={scenarioData.title}
          onUploaded={async (dataUrl) => {
            if (!playerId) return;
            try {
              await repairDamagedDistrict({ playerId, photoDataUrl: dataUrl });
              toast("District restored.");
              playSound("clue-sent");
            } catch {
              toast("Upload failed. Try again.");
            }
          }}
        />
      )}

      {/* ═══ Ch2: Incoming Connection Requests ═══
          Pass #18: Ch3 removed from this list. In Ch3 there are no new
          connection requests - all connections are pre-drawn. */}
      {phase === "map_ch2" && !isFacilitator && (connectionRequests ?? [])
        .filter((r) => r.toPlayerId === playerId)
        .map((req) => {
          const fromPlayer = nonFac.find((p) => p._id === req.fromPlayerId);
          return (
            <IncomingRequestBanner
              key={req._id}
              fromName={fromPlayer?.name ?? "Teammate"}
              expiresAt={req.expiresAt}
              onAccept={async () => {
                if (!playerId) return;
                try {
                  const r = await acceptConnection({ requestId: req._id, acceptedBy: playerId });
                  if (!r?.success) toast(r?.error || "Could not accept");
                  else { toast("Connection opened. See your type and ready up."); playSound("clue-sent"); }
                } catch { toast("Could not reach server"); }
              }}
              onDecline={async () => {
                try { await declineConnection({ requestId: req._id }); toast("Declined"); }
                catch { toast("Could not decline"); }
              }}
            />
          );
        })
      }

      {/* ═══ Pass #16 (Ch2 only in Pass #18): Connection build cards ═══
          For every connection I'm on where the type has been revealed
          (typeRevealedAt set) and the bridge is not yet built, render a
          lifecycle card: ready gate → 90s build window → expiry. */}
      {phase === "map_ch2" && !isFacilitator && playerId && (connections ?? [])
        .filter((c) => {
          if (!c.typeRevealedAt) return false;
          if (c.built) return false;
          const mePid = playerId as unknown as string;
          return c.fromSlotId === mePid || c.toSlotId === mePid;
        })
        .map((conn) => {
          const mePid = playerId as unknown as string;
          const amSideA = conn.fromSlotId === mePid;
          const partnerId = amSideA ? conn.toSlotId : conn.fromSlotId;
          const partner = nonFac.find((p) => (p._id as string) === partnerId);
          const typeObj = (CONNECTION_TYPES[mapTheme] ?? CONNECTION_TYPES.water)
            .find((t) => t.id === conn.connectionType);
          const myPhotoUploaded = amSideA ? !!conn.photoA : !!conn.photoB;
          const partnerPhotoUploaded = amSideA ? !!conn.photoB : !!conn.photoA;
          return (
            <ConnectionBuildCard
              key={conn._id}
              partnerName={partner?.name ?? "Teammate"}
              typeId={conn.connectionType ?? "bridge"}
              typeLabel={typeObj?.label ?? "BRIDGE"}
              typeHint={typeObj?.hint ?? ""}
              theme={mapTheme as "water" | "space" | "ocean" | "forest"}
              amSideA={amSideA}
              aReady={!!conn.aReady}
              bReady={!!conn.bReady}
              buildStartedAt={conn.buildStartedAt}
              myPhotoUploaded={myPhotoUploaded}
              partnerPhotoUploaded={partnerPhotoUploaded}
              onReady={async () => {
                try {
                  const r = await markConnectionReady({
                    connectionId: conn._id,
                    playerId: playerId as Id<"players">,
                  });
                  if (!r?.success && "error" in (r ?? {})) {
                    toast((r as { error?: string }).error ?? "Could not ready up");
                  } else {
                    playSound("clue-sent");
                  }
                } catch { toast("Could not reach server"); }
              }}
              onPhotoCaptured={async (dataUrl) => {
                try {
                  const r = await uploadConnectionPhotoSide({
                    connectionId: conn._id,
                    playerId: playerId as Id<"players">,
                    photoDataUrl: dataUrl,
                  });
                  if (r?.success === false && "error" in r) {
                    toast(r.error ?? "Upload failed");
                  } else {
                    toast("Your half is in.");
                    playSound("photo");
                  }
                } catch { toast("Upload failed. Try again."); }
              }}
            />
          );
        })
      }

      {/* Pass #18: Ch3 no longer has bridge-photo uploads. The pattern
          rearrange uses drag-only; no LEGO building in Ch3. */}

      {/* Pass #28: removed the floating ScoutBroadcastCard. The inline Scout
          Intel preview panel below (with the "OK, SEEN. ANNOUNCE TO TEAM"
          button → confirmCrisisAnnounce) is the canonical Scout confirm UI;
          a second floating button posting a chat message duplicated the
          announce action and looked broken against the busy map background.
          Scouts now warn the team verbally per the inline panel's copy. */}

      {/* ── Narration header: full when open, thin pinned strip once collapsed ── */}
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

      {/* ── LEGO bridge build-time countdown (Ch2 only) ── */}
      {phase === "map_ch2" && buildMsLeft > 0 && (
        <div style={{
          padding: "8px 14px",
          background: "linear-gradient(180deg, rgba(255,215,0,.14), rgba(255,215,0,.04))",
          borderBottom: "1px solid rgba(255,215,0,.35)",
          display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
        }}>
          <div style={{ fontSize: 18 }}>{"\u{1F9F1}"}</div>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, color: "var(--acc1)", textTransform: "uppercase" }}>
            LEGO Bridge Build Time
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 16, color: "white", letterSpacing: 1,
            background: "rgba(0,0,0,.3)", padding: "2px 10px", borderRadius: 6,
            minWidth: 60, textAlign: "center",
          }}>
            {Math.floor(buildMsLeft / 60000)}:{String(Math.floor((buildMsLeft % 60000) / 1000)).padStart(2, "0")}
          </div>
        </div>
      )}
      {/* ── Pass #25: Ch3 placement timer ── */}
      {phase === "map_ch3" && buildMsLeft > 0 && (
        <div style={{
          padding: "8px 14px",
          background: "linear-gradient(180deg, rgba(79,195,247,.16), rgba(79,195,247,.04))",
          borderBottom: "1px solid rgba(79,195,247,.4)",
          display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
        }}>
          <div style={{ fontSize: 18 }}>{"\u{23F1}"}</div>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, color: "var(--acc2)", textTransform: "uppercase" }}>
            Chapter 3 Time
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 16, color: "white", letterSpacing: 1,
            background: "rgba(0,0,0,.3)", padding: "2px 10px", borderRadius: 6,
            minWidth: 60, textAlign: "center",
          }}>
            {Math.floor(buildMsLeft / 60000)}:{String(Math.floor((buildMsLeft % 60000) / 1000)).padStart(2, "0")}
          </div>
        </div>
      )}
      {(phase === "map_ch2" || phase === "map_ch3") && session?.subPhaseDeadline && buildMsLeft === 0 && (
        <div style={{
          padding: "6px 14px",
          background: "rgba(105,240,174,.08)",
          borderBottom: "1px solid rgba(105,240,174,.3)",
          fontSize: 11, fontWeight: 700, color: "var(--acc4)", textAlign: "center", letterSpacing: 1,
        }}>
          Build time complete. Tap two districts to place your bridge.
        </div>
      )}

      {/* ── Ch1 private riddle hint ── */}
      {phase === "map_ch1" && me?.targetZone && !isFacilitator && (() => {
        const slot = slots.find((s) => s.id === me.targetZone);
        if (!slot) return null;
        const placed = !!me.ch1Placed;
        const riddle = CH1_SLOT_RIDDLES[mapTheme]?.[me.targetZone];
        return (
          <div style={{
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
            background: placed ? "rgba(105,240,174,.08)" : "rgba(255,215,0,.08)",
            borderBottom: `1px solid ${placed ? "rgba(105,240,174,.3)" : "rgba(255,215,0,.3)"}`,
          }}>
            <span style={{ fontSize: 18 }}>{placed ? "\u2705" : "\u{1F9E9}"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: placed ? "var(--acc4)" : "var(--acc1)", textTransform: "uppercase",
              }}>
                {placed ? `Placed \u2713 \u00B7 ${slot.label}` : "Your Riddle"}
              </div>
              <div style={{ fontSize: 12, color: "white", fontStyle: placed ? "normal" : "italic", lineHeight: 1.5 }}>
                {placed
                  ? `Nice work. Your ${scenarioData.terminology.district} is in the ${slot.label}.`
                  : riddle
                    ? `\u201C${riddle}\u201D`
                    : `Figure out which ${scenarioData.terminology.zone} fits.`}
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

      {/* ── Ch1 waiting / countdown strip ── */}
      {phase === "map_ch1" && (() => {
        if (!ch1DeadlineSet) {
          // Waiting on ready-up.
          return (
            <div style={{
              padding: "10px 16px",
              background: "rgba(79,195,247,.08)",
              borderBottom: "1px solid rgba(79,195,247,.3)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 18 }}>{"\u23F3"}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--acc2)", textTransform: "uppercase",
                }}>
                  Waiting To Start
                </div>
                <div style={{ fontSize: 12, color: "white" }}>
                  {ch1ReadyCount}/{presentNonFac.length} ready. Timer starts when everyone taps ready.
                </div>
              </div>
              {isFacilitator && !ch1AllReady && (
                <button
                  className="lb lb-yellow"
                  style={{ fontSize: 10, padding: "7px 11px", whiteSpace: "nowrap" }}
                  onClick={async () => {
                    if (!sessionId) return;
                    await skipCh1ReadyGate({ sessionId });
                    toast(`Ch1 timer started (${CH1_PLACEMENT_SECONDS}s).`);
                  }}
                  title={`Force-start the ${CH1_PLACEMENT_SECONDS}s placement timer without waiting on stragglers`}
                >
                  SKIP READY GATE
                </button>
              )}
            </div>
          );
        }
        const secs = Math.ceil(ch1MsLeft / 1000);
        const mm = Math.floor(secs / 60).toString();
        const ss = (secs % 60).toString().padStart(2, "0");
        const low = ch1MsLeft > 0 && ch1MsLeft <= 10_000;
        return (
          <div style={{
            padding: "10px 16px",
            background: ch1Expired ? "rgba(244,67,54,.1)" : low ? "rgba(255,112,67,.1)" : "rgba(255,215,0,.08)",
            borderBottom: `1px solid ${ch1Expired ? "rgba(244,67,54,.35)" : low ? "rgba(255,112,67,.35)" : "rgba(255,215,0,.3)"}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>{ch1Expired ? "\u23F0" : "\u23F1"}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: ch1Expired ? "var(--acc3)" : "var(--acc1)", textTransform: "uppercase",
              }}>
                Chapter 1 {"\u00B7"} Place Your {scenarioData.terminology.district}
              </div>
              <div style={{ fontSize: 12, color: "white" }}>
                {ch1Expired
                  ? `Time\u2019s up. Any district that didn\u2019t reach its slot has been placed by the map.`
                  : `${mm}:${ss} remaining. You can reposition until the timer runs out.`}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Ability badge (scenario-themed) ── */}
      {myAbility && (() => {
        const baseAbility = ABILITIES.find((a) => a.id === myAbility);
        if (!baseAbility) return null;
        const ab = getThemedAbility(baseAbility, scenarioData);
        const canMend = isMender && phase === "map_ch3" && !!session?.lostConnection && !session?.menderUsed && !isFacilitator;
        return (
          <div style={{
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,.02)", borderBottom: "1px solid var(--border)",
          }}>
            <AbilityBadge ability={ab} size={48} />
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

      {/* Facilitator fallback: no Mender in the session but a connection was
          lost. Facilitator can repair on the team's behalf so Ch3's repair
          beat isn't stranded. Ch3 only. Hidden once the repair is used. */}
      {isFacilitator && phase === "map_ch3" && !!session?.lostConnection && !session?.menderUsed && !nonFac.some((p) => p.ability === "mender") && (
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
          background: "rgba(255,215,0,.08)", borderBottom: "1px solid rgba(255,215,0,.3)",
        }}>
          <div style={{ flex: 1, fontSize: 11, color: "var(--acc1)", fontWeight: 700, lineHeight: 1.35 }}>
            No Mender in the session. Restore the lost connection on the team&apos;s behalf.
          </div>
          <button
            className="lb lb-yellow"
            style={{ fontSize: 10, padding: "8px 12px", whiteSpace: "nowrap" }}
            onClick={handleRepairConnection}
          >
            FACILITATOR REPAIR
          </button>
        </div>
      )}

      {/* ── Power card targeting banner ── */}
      {powerTargeting && (
        <div style={{
          padding: "8px 14px",
          background: "rgba(179,136,255,.18)",
          borderTop: "1px solid rgba(179,136,255,.4)",
          borderBottom: "1px solid rgba(179,136,255,.4)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 18 }}>{"\u{1F3AF}"}</div>
          <div style={{ flex: 1, fontSize: 12, color: "white", fontWeight: 700, lineHeight: 1.4 }}>
            {powerTargeting.mode === "shield" && "Tap a district to shield it from the next crisis."}
            {powerTargeting.mode === "swap" && (powerTargeting.firstPick
              ? "Now tap the second district to swap with."
              : "Tap the first district to swap.")}
            {powerTargeting.mode === "move" && "Tap anywhere on the map to move your district there."}
          </div>
          <button
            className="lb lb-ghost"
            style={{ fontSize: 10, padding: "6px 12px" }}
            onClick={cancelPowerTargeting}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* ── Map area ── */}
      <div
        ref={mapRef}
        className="map-area"
        onClick={async (e) => {
          if (!powerTargeting || powerTargeting.mode !== "move") return;
          // Ignore clicks that bubbled from child elements (district tiles).
          if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList?.contains("map-area")) {
            // Still allow: clicks on ThemedMap background (SVG inside) should count.
            const map = mapRef.current;
            if (!map) return;
            // Fall through to coordinate calc if the click is actually inside map bounds.
          }
          const rect = mapRef.current?.getBoundingClientRect();
          if (!rect) return;
          const xPct = ((e.clientX - rect.left) / rect.width) * 100;
          const yPct = ((e.clientY - rect.top) / rect.height) * 100;
          await handleTargetTapMap(xPct, yPct);
        }}
        style={{
          flex: 1,
          minHeight: "min(60dvh, 560px)",
          position: "relative",
          cursor: powerTargeting?.mode === "move" ? "crosshair" : undefined,
          animation: crisisHitShake ? "crisisHit 0.9s ease-out" : undefined,
        }}
      >
        <ThemedMap
          theme={mapTheme}
          phase={phase as "map_ch1" | "map_ch2" | "map_ch3"}
          patternComplete={mapRebuilt}
          ch2Damaged={
            // Damaged once C1 has actually resolved, and stays damaged through
            // clear, rotation, C2 pre-resolution, C2 resolved, and end of Ch2.
            (session?.crisesDealt ?? 0) >= 2
            || ((session?.crisesDealt ?? 0) >= 1 && session?.damageResolved === true)
            || session?.ch2State === "CH2_CRISIS1_CLEARED"
            || session?.ch2State === "CH2_READY_FOR_CRISIS2"
            || session?.ch2State === "CH2_COMPLETE"
          }
        />
        {crisisHitShake && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, rgba(255,60,60,.25) 0%, rgba(255,60,60,0) 70%)",
            animation: "crisisFlash 0.9s ease-out",
            zIndex: 5,
          }} />
        )}
        <style>{`
          @keyframes crisisHit {
            0% { transform: translate(0,0); }
            10% { transform: translate(-6px, 2px); }
            20% { transform: translate(5px, -3px); }
            30% { transform: translate(-4px, 4px); }
            40% { transform: translate(4px, -2px); }
            55% { transform: translate(-3px, 2px); }
            70% { transform: translate(2px, -1px); }
            85% { transform: translate(-1px, 1px); }
            100% { transform: translate(0,0); }
          }
          @keyframes crisisFlash {
            0% { opacity: 0; }
            25% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>

        {/* Pass #13 Ch3: geometric pattern target shape drawn over the map.
            If Scout chose PROTECT in C2, the pattern name is withheld — only
            the dotted slots are shown so the team has to recognize the shape
            themselves. Facilitator always sees the name. */}
        {phase === "map_ch3" && (session?.ch3TargetSlots ?? []).length > 0 && (() => {
          const slots = session?.ch3TargetSlots ?? [];
          const inTargetMap: Record<string, boolean> = {};
          for (const p of (players ?? [])) {
            if (p._id) inTargetMap[p._id] = !!p.ch3InTargetSlot;
          }
          const allComplete = slots.length > 0 && slots.every(s => s.assignedTo && inTargetMap[s.assignedTo]);
          const scoutProtected = session?.scoutC2Choice === "protect";
          const nameForPlayer = (scoutProtected && !isFacilitator) ? undefined : session?.patternName;
          return (
            <PatternOverlay
              slots={slots.map(s => ({ slotId: s.slotId, x: s.x, y: s.y, assignedTo: s.assignedTo }))}
              playerInTargetMap={inTargetMap}
              patternName={nameForPlayer}
              allComplete={allComplete}
            />
          );
        })()}

        {/* Zone name overlay: soft orientation labels over the map art.
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
              color: "white",
              background: "rgba(10,10,18,.72)",
              padding: "3px 8px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,.1)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              textShadow: "0 1px 3px rgba(0,0,0,.9)",
              pointerEvents: "none",
              zIndex: 3,
              whiteSpace: "nowrap",
            }}
          >
            {slot.label}
          </div>
        ))}

        {/* Connection lines + LEGO bridge thumbnails. Bonus connections (set
            by the Double Link power card) render thicker and gold with a
            midpoint star so they're visually distinct from regular links. */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
          <defs>
            <linearGradient id="bonus-link" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFD740" />
              <stop offset="50%" stopColor="#FFF59D" />
              <stop offset="100%" stopColor="#FFD740" />
            </linearGradient>
          </defs>
          {/* Ch3 required pattern: dotted lines showing connections still
              to be built. Rendered before actual connections so they sit
              beneath real bridges. */}
          {phase === "map_ch3" && (session?.connectionPattern ?? []).map((pat) => {
            const a = nonFac.find((p) => (p._id as unknown as string) === (pat.aPlayerId as unknown as string));
            const b = nonFac.find((p) => (p._id as unknown as string) === (pat.bPlayerId as unknown as string));
            if (!a || !b) return null;
            // Skip if connection already exists (complete or in progress).
            const hasConn = (connections ?? []).some((c) =>
              (c.fromSlotId === (a._id as string) && c.toSlotId === (b._id as string)) ||
              (c.fromSlotId === (b._id as string) && c.toSlotId === (a._id as string))
            );
            if (hasConn) return null;
            const ax = a.x ?? 50, ay = a.y ?? 50;
            const bx = b.x ?? 50, by = b.y ?? 50;
            return (
              <line
                key={`pat-${pat.key}`}
                x1={ax + "%"} y1={ay + "%"}
                x2={bx + "%"} y2={by + "%"}
                stroke="rgba(79,195,247,.5)"
                strokeWidth={2}
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
            );
          })}

          {(phase === "map_ch2" || phase === "map_ch3") && (connections ?? []).map((conn) => {
            const a = nonFac.find((p) => p._id === conn.fromSlotId);
            const b = nonFac.find((p) => p._id === conn.toSlotId);
            if (!a || !b) return null;
            const ax = a.x ?? 50, ay = a.y ?? 50;
            const bx = b.x ?? 50, by = b.y ?? 50;
            const isBonus = !!conn.bonus;
            const isShielded = !!conn.shielded;
            // Pass #16: prefer the explicit `built` flag. Legacy rows without
            // built but with both photos also count as complete.
            const isComplete = !!conn.built || (!!conn.photoA && !!conn.photoB);
            const isExpired = !!conn.expiredAt && !isComplete;
            // In-progress rendering: dashed line while the bridge is awaiting
            // its build window (Ch2 or Ch3). Expired connections fade out.
            const isPending = !isComplete && !isExpired;
            // Pass #18: themed color for built links, per scenario.
            const themedLineColor =
              mapTheme === "space" ? "rgba(255,183,77,.95)"
              : mapTheme === "ocean" ? "rgba(38,166,154,.95)"
              : mapTheme === "forest" ? "rgba(102,187,106,.95)"
              : "rgba(79,195,247,.95)";
            const themedLineDash =
              mapTheme === "ocean" ? "10 4" : mapTheme === "forest" ? "8 3" : undefined;
            // Pass #25: in Ch3 connections are decorative (Ch2 is over, no
            // rebuilds, no crisis). Render uniformly so a stale `bonus` /
            // `shielded` / `pending` flag from Ch2 doesn't make one line look
            // different from its neighbors.
            if (phase === "map_ch3") {
              return (
                <line
                  key={conn._id}
                  x1={ax + "%"} y1={ay + "%"}
                  x2={bx + "%"} y2={by + "%"}
                  stroke={themedLineColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={themedLineDash}
                  opacity={0.9}
                />
              );
            }
            const isAnchorPulse =
              session?.anchorProtected &&
              session.anchorProtected.fromSlotId === conn.fromSlotId &&
              session.anchorProtected.toSlotId === conn.toSlotId;
            return (
              <g key={conn._id}>
                {isAnchorPulse && (
                  <line
                    x1={ax + "%"} y1={ay + "%"}
                    x2={bx + "%"} y2={by + "%"}
                    stroke="#69F0AE"
                    strokeWidth={10}
                    strokeLinecap="round"
                    opacity={0.5}
                    style={{ filter: "drop-shadow(0 0 8px #69F0AE)" }}
                  />
                )}
                <line
                  x1={ax + "%"} y1={ay + "%"}
                  x2={bx + "%"} y2={by + "%"}
                  stroke={
                    isBonus
                      ? "url(#bonus-link)"
                      : isExpired
                        ? "rgba(200,60,60,.45)"
                        : isPending
                          ? "rgba(255,167,38,.75)"
                          : themedLineColor
                  }
                  strokeWidth={isBonus ? 5 : isComplete ? 5 : 3}
                  strokeLinecap="round"
                  strokeDasharray={
                    isPending ? "4 4"
                    : isExpired ? "2 6"
                    : isComplete && !isBonus ? themedLineDash
                    : undefined
                  }
                  opacity={isExpired ? 0.55 : 1}
                  style={isComplete && !isBonus && !isExpired
                    ? { filter: mapTheme === "space" ? "drop-shadow(0 0 4px rgba(255,183,77,.6))" : undefined }
                    : undefined}
                />
                {isBonus && (
                  <text
                    x={((ax + bx) / 2) + "%"} y={((ay + by) / 2) + "%"}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#FFD740" fontSize="18" fontWeight="900"
                    style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,.8))" }}
                  >
                    {"\u2726"}
                  </text>
                )}
                {isShielded && !isBonus && (
                  <text
                    x={((ax + bx) / 2) + "%"} y={((ay + by) / 2) + "%"}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#4FC3F7" fontSize="16" fontWeight="900"
                    style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,.9))" }}
                  >
                    {"\u{1F6E1}"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bridge thumbnails at the midpoint of each connection. Kept outside
            the SVG so we can use real <img> tags for the JPEG preview.
            Pass #19: if both sides uploaded, render a side-by-side diptych
            so the two halves of the build both show (each player's work is
            equally visible). If only one side, render a single square thumb. */}
        {(phase === "map_ch2" || phase === "map_ch3") && (connections ?? []).map((conn) => {
          const rawA = conn.photoA ?? (conn.photoDataUrl && !conn.photoB ? conn.photoDataUrl : undefined);
          const rawB = conn.photoB;
          const photoA = stablePhoto(`conn-${conn._id as unknown as string}:A`, rawA);
          const photoB = stablePhoto(`conn-${conn._id as unknown as string}:B`, rawB);
          if (!photoA && !photoB) return null;
          const a = nonFac.find((p) => p._id === conn.fromSlotId);
          const b = nonFac.find((p) => p._id === conn.toSlotId);
          if (!a || !b) return null;
          const ax = a.x ?? 50, ay = a.y ?? 50;
          const bx = b.x ?? 50, by = b.y ?? 50;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const bothSides = !!(photoA && photoB);
          return (
            <div
              key={`bridge-${conn._id}`}
              style={{
                position: "absolute",
                left: mx + "%",
                top: my + "%",
                transform: "translate(-50%, -50%)",
                width: bothSides ? 62 : 36,
                height: bothSides ? 40 : 36,
                borderRadius: bothSides ? 6 : "50%",
                overflow: "hidden",
                border: "2px solid var(--acc1)",
                boxShadow: "0 2px 8px rgba(0,0,0,.5)",
                zIndex: 6,
                pointerEvents: "none",
                display: bothSides ? "flex" : "block",
                background: "#0e0e25",
              }}
            >
              {bothSides ? (
                <>
                  <img
                    src={photoA!}
                    alt={`Bridge half by ${a.name}`}
                    title={a.name}
                    style={{ width: "50%", height: "100%", objectFit: "cover", display: "block" }}
                    draggable={false}
                  />
                  <img
                    src={photoB!}
                    alt={`Bridge half by ${b.name}`}
                    title={b.name}
                    style={{ width: "50%", height: "100%", objectFit: "cover", display: "block", borderLeft: "1px solid rgba(255,215,0,.55)" }}
                    draggable={false}
                  />
                </>
              ) : (
                <img
                  src={(photoA ?? photoB)!}
                  alt="LEGO bridge"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  draggable={false}
                />
              )}
            </div>
          );
        })}

        {/* Placed districts: free positioning from player's stored x/y */}
        {placed.map((p) => {
          const isMe = p._id === playerId;
          const isDragging = dragPos?.id === p._id;
          const pctX = isDragging ? dragPos.x : (p.x ?? 50);
          const pctY = isDragging ? dragPos.y : (p.y ?? 50);
          const isSelectedForConn = (isCh2 || isCh3) && p._id === selectedForConnection;
          const connectionCount = (connections ?? []).filter(
            (c) => c.fromSlotId === p._id || c.toSlotId === p._id
          ).length;

          const isShielded = !!p.shielded;
          const isDamaged = !!p.districtDamaged;
          const isCelebrating = isMe && ch1CelebrateAt !== null;
          const isSolvedAndStill = isMe && phase === "map_ch1" && !!p.ch1Placed;
          return (
            <div
              key={p._id}
              className={`dist-card${isMe ? " mine" : ""}${isDragging ? " dragging" : ""}${isCelebrating ? " ch1-celebrate" : ""}`}
              style={{
                left: pctX + "%",
                top: pctY + "%",
                zIndex: isDragging ? 100 : isCelebrating ? 60 : 10,
                cursor: phase === "map_ch1"
                  ? (isMe && ch1DeadlineSet && !ch1Expired ? "grab" : "default")
                  : phase === "map_ch3"
                    ? (isMe ? (isDragging ? "grabbing" : "grab") : "default")
                    : isCh2 ? "pointer" : "default",
                outline: isDamaged
                  ? "3px dashed #FF5252"
                  : isSelectedForConn
                    ? "3px solid var(--acc2)"
                    : isShielded ? "2px solid #69F0AE"
                      : isSolvedAndStill ? "3px solid #69F0AE" : undefined,
                boxShadow: isDamaged
                  ? "0 0 22px rgba(255,82,82,.65)"
                  : isSelectedForConn
                    ? "0 0 20px rgba(79,195,247,.5)"
                    : isShielded ? "0 0 18px rgba(105,240,174,.55)"
                      : isSolvedAndStill ? "0 0 22px rgba(105,240,174,.6)" : undefined,
                opacity: isDamaged ? 0.55 : undefined,
                filter: isDamaged ? "grayscale(0.55)" : undefined,
              }}
              onMouseDown={(e) => {
                // Pass #18: Ch1 drag stays time-gated. Ch3 drag is always
                // allowed for the player's own district.
                if (phase === "map_ch1" && ch1DeadlineSet && !ch1Expired) startDrag(e, p._id);
                else if (phase === "map_ch3" && p._id === playerId) startDrag(e, p._id);
              }}
              onTouchStart={(e) => {
                if (phase === "map_ch1" && ch1DeadlineSet && !ch1Expired) startDrag(e, p._id);
                else if (phase === "map_ch3" && p._id === playerId) startDrag(e, p._id);
              }}
              onClick={async () => {
                // Power-card targeting intercepts normal connection tap flow.
                if (powerTargeting && (powerTargeting.mode === "shield" || powerTargeting.mode === "swap")) {
                  const handled = await handleTargetTapPlayer(p._id);
                  if (handled) return;
                }
                // Pass #18: Ch3 no longer uses tap-to-connect (all connections
                // are pre-drawn). Tap only triggers the connection flow in Ch2.
                if (isCh2) handleDistrictTap(p._id);
              }}
            >
              <div style={{ pointerEvents: "none" }}>
                {(() => {
                  const src = stablePhoto(p._id as unknown as string, p.photoDataUrl);
                  return src ? (
                    <img className="dc-photo" src={src} alt="" draggable={false} />
                  ) : (
                    <div className="dc-placeholder">{"\u{1F3D9}\uFE0F"}</div>
                  );
                })()}
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
              {isShielded && (
                <div style={{
                  position: "absolute", top: -8, left: -8,
                  background: "#69F0AE", color: "#0a0a12",
                  borderRadius: "50%", width: 24, height: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, border: "2px solid var(--bg0)",
                  pointerEvents: "none",
                  boxShadow: "0 0 10px rgba(105,240,174,.7)",
                }}
                title="Shielded: the next crisis against this district is absorbed"
                >
                  {"\u{1F6E1}\uFE0F"}
                </div>
              )}
              {isDamaged && (
                <div style={{
                  position: "absolute", top: -8, left: -8,
                  background: "#FF5252", color: "#fff",
                  borderRadius: "50%", width: 24, height: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 900,
                  border: "2px solid var(--bg0)",
                  pointerEvents: "none",
                  boxShadow: "0 0 12px rgba(255,82,82,.8)",
                  animation: "fadeIn .3s ease-out",
                }}
                title="District damaged. Owner is rebuilding."
                >
                  !
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
                  onMouseDown={(e) => { if (isMe && (phase !== "map_ch1" || (ch1DeadlineSet && !ch1Expired))) startDrag(e as unknown as MouseEvent, p._id); }}
                  onTouchStart={(e) => { if (isMe && (phase !== "map_ch1" || (ch1DeadlineSet && !ch1Expired))) startDrag(e as unknown as TouchEvent, p._id); }}
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
                  {stablePhoto(p._id as unknown as string, p.photoDataUrl) ? (
                    <img src={stablePhoto(p._id as unknown as string, p.photoDataUrl)!} alt="" style={{ width: "100%", height: 56, objectFit: "cover", pointerEvents: "none" }} draggable={false} />
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

      {/* ── Ch2: Crisis card reveal banner ──
          Pass #16: during the 15s pre-resolution window (session.damageResolved
          === false), the crisis card is private to HR + Scout. Everyone else
          sees a generic "Roles in motion" pill so the crisis name/art doesn't
          leak before pre-crisis role actions fire. Once damageResolved flips
          true, the full banner becomes public. */}
      {isCh2 && activeCrisis && (() => {
        const resolved = session?.damageResolved === true;
        const mayReveal = resolved || isFacilitator || isScout;
        if (!mayReveal) {
          return (
            <div style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
              background: "linear-gradient(180deg, rgba(255,215,0,.10), rgba(255,215,0,.02))",
              display: "flex", alignItems: "center", gap: 12,
              animation: "fadeIn .4s ease-out",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 999,
                background: "radial-gradient(circle, rgba(255,215,0,.35), rgba(255,215,0,.05))",
                border: "1px solid rgba(255,215,0,.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                boxShadow: "0 0 18px rgba(255,215,0,0.15)",
              }}>
                {"\u23F3"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2.5,
                  color: "var(--acc1, #FFD700)", textTransform: "uppercase",
                }}>
                  Roles in motion
                </div>
                <div style={{ fontSize: 12.5, color: "var(--textd)", marginTop: 3, lineHeight: 1.5 }}>
                  A crisis is forming. Specialists are making their calls. The card reveals in a moment.
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--border)",
            background: "linear-gradient(180deg, rgba(244,67,54,.18), rgba(244,67,54,.05))",
            display: "flex", alignItems: "center", gap: 12,
            animation: "fadeIn .6s ease-out",
          }}>
            <div style={{ flexShrink: 0 }}>
              {(() => { const Art = getCrisisIllustration(activeCrisis.id); return <Art size={56} />; })()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
                color: "var(--acc3)", textTransform: "uppercase",
              }}>
                {resolved ? "CRISIS" : (isFacilitator ? "CRISIS (FACILITATOR ONLY)" : "CRISIS (SCOUT INTEL)")}
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
              {session?.crisisTargetReason && (
                <div style={{ fontSize: 11, color: "var(--acc3)", marginTop: 4, fontWeight: 700, lineHeight: 1.4 }}>
                  {session.crisisTargetReason}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--acc4)", marginTop: 6, fontStyle: "italic" }}>
                Counter: {activeCrisis.counterplay}
              </div>
            </div>
            {/* Pass #18: manual CLEAR button removed. Crisis banner clears
                automatically once all rebuilds are in and roles have acted. */}
          </div>
        );
      })()}

      {/* ── Ch2: Scout private preview card. Only the Scout sees this. ──
          Pass #21: now gates on session.pendingCrisisCardId (HR-staged but
          not yet announced). Includes an "OK / SEEN" button: tapping confirms
          the announce, kicking the existing pre-crisis countdown for everyone. */}
      {isCh2 && isScout && scoutPreviewCard && !activeCrisis && (
        <div style={{
          padding: "16px 18px 14px",
          borderTop: "2px solid rgba(79,195,247,.55)",
          background: "linear-gradient(180deg, rgba(79,195,247,.22), rgba(79,195,247,.06))",
          display: "flex", flexDirection: "column", gap: 12,
          animation: "fadeIn .5s ease-out",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
        }}>
          {/* Scout-only intel header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 11, letterSpacing: 2.5,
            color: "var(--acc2)", textTransform: "uppercase",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999,
              background: "var(--acc2)",
              boxShadow: "0 0 8px var(--acc2)",
            }} />
            Scout Intel {"\u00B7"} Incoming Crisis
          </div>

          {/* Crisis card preview: art + title + description + counterplay */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "12px 14px",
            background: "rgba(0,0,0,.35)",
            border: "1px solid rgba(79,195,247,.3)",
            borderRadius: 10,
          }}>
            <div style={{ flexShrink: 0 }}>
              {(() => { const Art = getCrisisIllustration(scoutPreviewCard.id); return <Art size={64} />; })()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 18, letterSpacing: 1.2,
                color: "white", lineHeight: 1.2,
              }}>
                {scoutPreviewCard.title}
              </div>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,.85)",
                marginTop: 6, lineHeight: 1.5,
              }}>
                {scoutPreviewCard.description}
              </div>
              {scoutPreviewCard.counterplay && (
                <div style={{
                  fontSize: 11, color: "var(--acc4)",
                  marginTop: 8, fontStyle: "italic", lineHeight: 1.4,
                }}>
                  Counter: {scoutPreviewCard.counterplay}
                </div>
              )}
            </div>
          </div>

          {/* Secrecy hint */}
          <div style={{
            fontSize: 11.5, color: "rgba(255,255,255,.7)",
            lineHeight: 1.5, padding: "0 2px",
          }}>
            Only you can see this. Warn the team verbally without naming the card.
            When ready, announce it to start the crisis.
          </div>

          {/* Confirm button (lighter weight than before) */}
          <button
            className="lb lb-yellow"
            style={{
              alignSelf: "stretch",
              fontSize: 13,
              padding: "12px 16px",
              letterSpacing: 1.2,
              marginTop: 2,
            }}
            onClick={async () => {
              if (!sessionId) return;
              try {
                await confirmCrisisAnnounce({ sessionId });
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            ANNOUNCE TO TEAM {"\u2192"}
          </button>
        </div>
      )}
      {isCh2 && isScout && !scoutPreviewCard && !activeCrisis && (
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          background: "rgba(79,195,247,.05)",
          fontSize: 11, color: "var(--acc2)", fontStyle: "italic",
        }}>
          {"\u{1F52D}"} Scout standing by. The facilitator will route the next crisis to you first.
        </div>
      )}

      {/* ── Ch2: Chat mute countdown (Blackout). Visible to everyone. ── */}
      {isCh2 && chatMuteMsLeft > 0 && (
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          background: "rgba(244,67,54,.12)",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 12, color: "white",
        }}>
          <span style={{ fontSize: 18 }}>{"\u{1F507}"}</span>
          <span style={{ flex: 1 }}>
            Signal lost. Team chat returns in <strong>{Math.ceil(chatMuteMsLeft / 1000)}s</strong>.
            {myAbility === "diplomat" && " You can still send as Diplomat."}
          </span>
        </div>
      )}

      {/* Pass #19: the on-map power-card strip + its modal were removed. The
          player's role + power info is shown in the top header; duplicating
          it at the bottom confused the layout and the duplicate copy was
          drifting from the source of truth. */}

      {/* Pass #25: Ch3 connection-making banner removed. Ch3 is shape-
          placement only; the old "tap your district first" hint was a
          Ch2 leftover that no longer applies. */}

      {/* ── Ch2 players: waiting / damage status ── */}
      {isCh2 && !isFacilitator && (() => {
        if (me?.districtDamaged) return null; // covered by DamageRepairOverlay
        const activeCrisisNow = !!session?.crisisCardId;
        const crisis = activeCrisisNow ? CRISIS_CARDS.find((c) => c.id === session?.crisisCardId) : null;
        const damagedOthers = nonFac.filter((p) => p.districtDamaged && p._id !== playerId);
        return (
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border)",
            fontSize: 12, color: "var(--textd)", textAlign: "center",
            background: activeCrisisNow ? "rgba(255,112,67,.08)" : "rgba(255,255,255,.02)",
          }}>
            {!activeCrisisNow && "The facilitator is about to fire a crisis. Keep an eye on your district."}
            {activeCrisisNow && crisis && damagedOthers.length > 0 && (
              <>
                <strong style={{ color: "var(--acc3)" }}>{crisis.title}</strong> hit the map.{" "}
                {damagedOthers.map((p) => p.name).join(", ")} {damagedOthers.length === 1 ? "is" : "are"} rebuilding. Offer help if you can.
              </>
            )}
            {activeCrisisNow && crisis && damagedOthers.length === 0 && (
              <>
                <strong style={{ color: "var(--acc4)" }}>{crisis.title}</strong> landed, but no districts were damaged. Shields absorbed it.
              </>
            )}
          </div>
        );
      })()}

      {/* ── Ch3: Pattern banner. Explains the required pattern. ── */}
      {isCh3 && !mapRebuilt && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(79,195,247,.12), rgba(79,195,247,.03))",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 26 }}>{"\u{1F517}"}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              color: "var(--acc2)", textTransform: "uppercase",
            }}>
              Chapter 3 {"\u00B7"} Form the Pattern
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4, lineHeight: 1.5 }}>
              {session?.patternName
                ? `Dashed lines show the ${session.patternName} your team needs to form. Drag your district onto the matching dot. When everyone is in place, the pattern locks and you advance.`
                : "Drag your district to the dotted target spot. When every district is in place, the pattern locks and you advance."}
            </div>
          </div>
        </div>
      )}

      {/* Pass #18: facilitator rebuild-approval queue removed. Rebuilds
          auto-promote the moment both players' photos land. */}

      {/* ── Ch3 complete: celebration strip ── */}
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

      {/* ── Bottom bar: status + facilitator controls ── */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        background: "rgba(255,255,255,.02)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 12, color: "var(--textd)", minWidth: 0, flex: "1 1 auto", paddingRight: 60 }}>
          {phase === "map_ch1" && `${placed.length}/${presentNonFac.length} placed`}
          {isCh2 && (() => {
            const damagedCount = nonFac.filter((p) => p.districtDamaged).length;
            if (!session?.crisisCardId) return "Ch 2. Waiting for crisis.";
            if (damagedCount === 0) return "Crisis resolved. Advance when ready.";
            return `${damagedCount} district${damagedCount !== 1 ? "s" : ""} rebuilding...`;
          })()}
          {isCh3 && (() => {
            const pattern = session?.connectionPattern ?? [];
            const completeKeys = new Set(
              (connections ?? [])
                .filter((c) => c.photoA && c.photoB)
                .map((c) => (c.fromSlotId as string) < (c.toSlotId as string)
                  ? `${c.fromSlotId}_${c.toSlotId}`
                  : `${c.toSlotId}_${c.fromSlotId}`)
            );
            const doneCount = pattern.filter((p) => completeKeys.has(p.key)).length;
            return pattern.length > 0
              ? `${doneCount} of ${pattern.length} bridges complete`
              : `${(connections ?? []).length} bridges on the map`;
          })()}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {isFacilitator && isCh2 && (() => {
            // Pass #17: every Ch2 HR gate runs over presentNonFac. A player
            // who left in the middle of Ch2 is not waited on for ready,
            // rotation, build, or damage resolution.
            const anyDamaged = presentNonFac.some((p) => p.districtDamaged);
            const crisisActive = !!activeCrisis;
            const readyCount = presentNonFac.filter(p => p.ch2Ready).length;
            const allReady = presentNonFac.length > 0 && readyCount === presentNonFac.length;
            const cap = session?.crisisCap ?? 0;
            const dealt = session?.crisesDealt ?? 0;
            const capReached = cap > 0 && dealt >= cap;
            const canRotate = session?.ch2State === "CH2_CRISIS1_CLEARED";
            const anchor = presentNonFac.find(p => p.ability === "anchor");
            const anchorConnCount = anchor
              ? (connections ?? []).filter(c =>
                  c.fromSlotId === anchor._id || c.toSlotId === anchor._id
                ).length
              : 0;
            const anchorHasTwo = !anchor || anchorConnCount >= 2;
            // Pass #16: every non-fac player must be in at least one built=true
            // connection before HR can deal the first crisis. Pass #17: only
            // present players count — left players are excluded.
            const playersInBuilt = new Set<string>();
            for (const c of connections ?? []) {
              if (c.built) {
                playersInBuilt.add(c.fromSlotId as string);
                playersInBuilt.add(c.toSlotId as string);
              }
            }
            const playersMissingBuild = presentNonFac.filter(
              (p) => !playersInBuilt.has(p._id as string),
            );
            const everyoneHasBuilt = playersMissingBuild.length === 0;
            // Pass #16: for Crisis 2, every present non-fac player must also
            // have acknowledged the rotated role (ch2RotationReady=true).
            const isReadyForC2 = session?.ch2State === "CH2_READY_FOR_CRISIS2";
            const playersMissingRotationAck = isReadyForC2
              ? presentNonFac.filter((p) => p.ch2RotationReady !== true)
              : [];
            const everyoneRotationReady = playersMissingRotationAck.length === 0;
            const canDealCrisis = !crisisActive && !anyDamaged && allReady && !capReached
              && everyoneHasBuilt && anchorHasTwo
              && (dealt === 0 || isReadyForC2)
              && everyoneRotationReady;
            // Pass #18: canClearCrisis removed along with the CLEAR button.
            const canAdvance = !crisisActive && !anyDamaged && session?.ch2State !== "CH2_INTRO";
            // Gate ALL HR Ch2 actions behind the ready gate. Until every
            // non-fac player taps ready, the only thing HR sees is the ready
            // counter plus a waiting notice. No blackout, no scout preview,
            // no deal-crisis, no rotate. Once allReady flips true the full
            // control set appears.
            if (!allReady) {
              return (
                <>
                  <span style={{ fontSize: 10, color: "var(--textdd)", letterSpacing: 1 }}>
                    READY: {readyCount}/{presentNonFac.length}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--textdd)", fontStyle: "italic" }}>
                    Waiting for all players to ready up.
                  </span>
                </>
              );
            }
            return (
              <>
                {cap > 0 && (
                  <span style={{ fontSize: 10, color: "var(--textdd)", letterSpacing: 1 }}>
                    READY: {readyCount}/{presentNonFac.length} {"\u00B7"} CRISES: {dealt}/{cap}
                  </span>
                )}
                {canRotate && (
                  <button
                    className="lb lb-yellow"
                    style={{ fontSize: 10, padding: "7px 11px" }}
                    onClick={handleRotateRoles}
                    title="Rotate roles shift-by-1 before Crisis 2"
                  >
                    ROTATE ROLES
                  </button>
                )}
                {/* Pass #21: while a crisis is staged for Scout preview, swap
                    DEAL CRISIS into ANNOUNCE NOW (HR fallback if Scout cannot
                    ack). Same screen position. */}
                {session?.pendingCrisisCardId ? (
                  <button
                    className="lb lb-yellow"
                    style={{ fontSize: 12, padding: "9px 16px", letterSpacing: 1.2 }}
                    onClick={handleAnnounceNow}
                    title="Skip Scout ack and announce the crisis now"
                  >
                    ANNOUNCE NOW
                    <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.5, opacity: 0.85, marginTop: 2 }}>
                      Scout previewing
                    </div>
                  </button>
                ) : (
                  <button
                    className={canDealCrisis ? "lb lb-yellow ctaPulse" : "lb lb-ghost"}
                    style={{
                      fontSize: canDealCrisis ? 12 : 10,
                      padding: canDealCrisis ? "9px 16px" : "7px 11px",
                      opacity: canDealCrisis ? 1 : 0.4,
                      fontWeight: canDealCrisis ? 800 : undefined,
                      letterSpacing: canDealCrisis ? 1.5 : undefined,
                    }}
                    onClick={() => {
                      if (!canDealCrisis) {
                        if (!everyoneHasBuilt) {
                          const names = playersMissingBuild.map((p) => p.name).join(", ");
                          toast(`Waiting on ${names} to finish a bridge.`);
                        }
                        else if (!everyoneRotationReady) {
                          const names = playersMissingRotationAck.map((p) => p.name).join(", ");
                          toast(`Waiting on ${names} to acknowledge their new role.`);
                        }
                        else if (!anchorHasTwo) toast("Anchor must build 2 connections before a crisis.");
                        else if (capReached) toast("Crisis cap reached. Advance to Ch3.");
                        else if (canRotate) toast("Rotate roles before dealing Crisis 2.");
                        else toast(crisisActive ? "Clear the current crisis first." : "Players are still rebuilding.");
                        return;
                      }
                      setFacCrisisPickerOpen(true);
                    }}
                    title={canDealCrisis ? "All connections built. Deal a crisis." : "Gate conditions not met"}
                  >
                    {canDealCrisis ? "\u26A1 DEAL CRISIS" : "DEAL CRISIS"}
                  </button>
                )}
                {/* Pass #18: BLACKOUT button removed. Only dealt crises mute chat. */}
                {/* Pass #30: FORCE RESOLVE and CLEAR CRISIS buttons removed.
                    Damage lands once every shielder/pre-resolution role
                    commits (no more 10s auto-fire). Crisis auto-dismisses
                    when every present player has acted + rebuilt. No
                    facilitator taps needed. */}
                {!canAdvance && (
                  <span style={{ fontSize: 10, color: "var(--textdd)", fontStyle: "italic" }}>
                    {session?.ch2State === "CH2_INTRO"
                      ? "Deal a crisis to begin Ch2."
                      : anyDamaged
                        ? `Waiting: ${nonFac.filter((p) => p.districtDamaged).length} rebuilding`
                        : crisisActive
                          ? "Waiting: clear crisis"
                          : ""}
                  </span>
                )}
              </>
            );
          })()}
          {/* Pass #17: testing-only [DEV] skip for Chapter 1. Snaps every
              district into its correct slot, then advances to Ch2. This is
              NOT the same as the Ch1-timer auto-place (which fires on its
              own at the CH1_PLACEMENT_SECONDS deadline via a server scheduler). */}
          {isFacilitator && phase === "map_ch1" && (
            <button
              className="lb"
              style={{
                fontSize: 10, padding: "7px 11px",
                background: "rgba(244,67,54,.15)",
                border: "1px dashed rgba(244,67,54,.55)",
                color: "#FFB3AD",
                letterSpacing: 1,
              }}
              onClick={async () => {
                if (!sessionId) return;
                if (!window.confirm("Skip Chapter 1? Districts will auto-place into their correct slots and the game advances to Ch2. Testing only.")) return;
                await autoPlaceCh1Stragglers({ sessionId });
                await advanceNewPhase({ sessionId, fromPhase: "map_ch1" });
                toast("Chapter 1 skipped. Districts placed automatically.");
              }}
              title="Testing shortcut. Auto-places every district and advances to Chapter 2."
            >
              [DEV] SKIP CH 1
            </button>
          )}
          {/* Pass #16: MAP REBUILT button removed. hiddenPatternRevealed now
              auto-flips when every player lands in their slot. The advance
              button below is renamed to START VOTING for Ch3 and disabled
              until the pattern is complete. */}
          {/* Pass #31: HR escape hatch when Ch3 placement validation refuses
              to flip. Visible only in Ch3 to facilitators; disabled once the
              pattern is already revealed. */}
          {isFacilitator && isCh3 && (
            <button
              className="lb lb-yellow"
              style={{
                fontSize: 11,
                padding: "8px 12px",
                opacity: mapRebuilt ? 0.4 : 1,
                cursor: mapRebuilt ? "not-allowed" : "pointer",
                border: "1.5px solid rgba(255,215,64,.7)",
              }}
              disabled={mapRebuilt || !sessionId}
              onClick={async () => {
                if (!sessionId || mapRebuilt) return;
                await forceCompleteCh3({ sessionId });
                toast("Pattern force-completed. Map rebuilt.");
              }}
              title="Override the placement check and reveal the rebuilt map. Use if validation is stuck."
            >
              FORCE COMPLETE
            </button>
          )}
          {isFacilitator ? (() => {
            const ch1Blocked = phase === "map_ch1" && !allPlaced && !ch1Expired;
            const ch3Blocked = isCh3 && !mapRebuilt;
            const blocked = ch1Blocked || ch3Blocked;
            const advanceLabel = phase === "map_ch1"
              ? "ADVANCE TO CH 2 \u2192"
              : phase === "map_ch2"
                ? "ADVANCE TO CH 3 \u2192"
                : "START VOTING \u2192";
            const blockedTitle = ch1Blocked
              ? `Wait for all players to place their districts or the ${CH1_PLACEMENT_SECONDS}s timer to expire.`
              : ch3Blocked
                ? "Wait for every player to land their district in the glowing slot, or tap FORCE COMPLETE to override."
                : undefined;
            return (
              <button
                className="lb lb-green"
                style={{ fontSize: 11, padding: "8px 14px", opacity: blocked ? 0.45 : 1, cursor: blocked ? "not-allowed" : "pointer" }}
                onClick={handleAdvance}
                disabled={blocked}
                title={blockedTitle}
              >
                {advanceLabel}
              </button>
            );
          })() : (
            <div style={{ fontSize: 11, color: "var(--textd)" }}>
              {phase === "map_ch1" && (
                ch1Expired
                  ? "Time\u2019s up. Waiting for facilitator."
                  : allPlaced
                    ? "All placed. Waiting for facilitator."
                    : ch1DeadlineSet
                      ? "Place your district before the timer runs out."
                      : "Waiting for everyone to tap ready."
              )}
              {isCh2 && "Build connections. Waiting for facilitator."}
              {isCh3 && mapRebuilt && `${scenarioData.terminology.map} reborn. Waiting to vote.`}
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
                      <div style={{ flexShrink: 0 }}>
                        {(() => { const Art = getCrisisIllustration(c.id); return <Art size={36} />; })()}
                      </div>
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

      {/* Pass #21: Scout preview picker removed. The DEAL CRISIS picker now
          stages directly to a Scout-only preview; no separate modal needed. */}

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
                  {POWER_CARDS.map((c) => {
                    // Swap and Double Link need at least 3 non-fac players to
                    // do anything meaningful. Disable them in small sessions.
                    const minPlayers: Record<string, number> = { pw_swap: 3, pw_double: 3 };
                    const needed = minPlayers[c.id];
                    const tooSmall = needed !== undefined && presentNonFac.length < needed;
                    return (
                    <button
                      key={c.id}
                      onClick={() => !tooSmall && handleDealPower(target._id, c.id)}
                      disabled={tooSmall}
                      style={{
                        textAlign: "left", padding: "12px 14px",
                        background: tooSmall ? "rgba(255,255,255,.03)" : "rgba(147,51,234,.08)",
                        border: `1px solid ${tooSmall ? "var(--border)" : "rgba(147,51,234,.3)"}`,
                        borderRadius: "var(--brick-radius)",
                        color: tooSmall ? "var(--textdd)" : "white",
                        cursor: tooSmall ? "not-allowed" : "pointer",
                        opacity: tooSmall ? 0.55 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flexShrink: 0 }}>
                          {(() => { const Art = getPowerIllustration(c.id); return <Art size={34} />; })()}
                        </div>
                        <span style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 13, letterSpacing: 1 }}>
                          {c.title}
                        </span>
                        {tooSmall && (
                          <span style={{ fontSize: 9, color: "var(--acc3)", fontWeight: 900, letterSpacing: 1 }}>
                            NEEDS {needed}+ PLAYERS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 4 }}>
                        {c.description}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
              <button className="card-modal-close" onClick={() => setFacPowerPickerOpen(null)}>CLOSE</button>
            </div>
          </div>
        );
      })()}

      {/* Pass #19: the player-side power-card modal was removed along with
          the on-map power strip. Power info is shown in the top header only. */}

      {/* Session-wide chat visible during all map chapters. Collapsible so it
          never hides the map. Facilitator and players share the same thread. */}
      {(phase === "map_ch1" || phase === "map_ch2" || phase === "map_ch3") && (
        <MapChatPanel
          sessionId={sessionId ?? null}
          senderName={name || (isFacilitator ? "Facilitator" : "Player")}
          isFacilitator={isFacilitator}
          senderPlayerId={playerId ?? null}
          chatMutedUntil={session?.chatMutedUntil}
          myAbility={myAbility ?? null}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Pass #18: Pre-crisis countdown banner
//  Shown for the 10s window between DEAL CRISIS and the crisis landing.
// ─────────────────────────────────────────────────────────────
function PreCrisisWaitingOn({
  sessionId,
  players,
  session,
}: {
  sessionId: Id<"sessions">;
  players: Array<{ _id: Id<"players">; name: string; ability?: string }>;
  session: {
    crisisIndex?: number;
    scoutC1Choice?: string;
    scoutC2Choice?: string;
    anchorImmuneTarget?: Id<"players"> | string;
    engineerShieldTarget?: Id<"players"> | string;
  };
}) {
  const crisisIndex = session.crisisIndex ?? 1;
  const votes = useQuery(api.mapPhase.getCitizenVotes, { sessionId, crisisIndex });
  const connections = useQuery(api.mapPhase.getConnections, { sessionId });

  const waitingOn: string[] = [];

  const scout = players.find((p) => p.ability === "scout");
  if (scout) {
    const scoutReady = crisisIndex === 1 ? !!session.scoutC1Choice : !!session.scoutC2Choice;
    if (!scoutReady) waitingOn.push(`${scout.name} (Scout)`);
  }

  const anchor = players.find((p) => p.ability === "anchor");
  if (anchor) {
    const activeConns = (connections ?? []).filter(
      (c) => !c.destroyedByCrisisIndex || c.destroyedByCrisisIndex === 0,
    );
    const anchorHasConn = activeConns.some(
      (c) => c.fromSlotId === anchor._id || c.toSlotId === anchor._id,
    );
    if (anchorHasConn && !session.anchorImmuneTarget) {
      waitingOn.push(`${anchor.name} (Anchor)`);
    }
  }

  const engineer = players.find((p) => p.ability === "engineer");
  if (engineer && crisisIndex === 1 && !session.engineerShieldTarget) {
    waitingOn.push(`${engineer.name} (Engineer)`);
  }

  const citizens = players.filter((p) => p.ability === "citizen");
  if (citizens.length > 0 && (votes ?? []).length < citizens.length) {
    const voted = new Set((votes ?? []).map((v) => v.voterId as unknown as string));
    for (const c of citizens) {
      if (!voted.has(c._id as unknown as string)) {
        waitingOn.push(`${c.name} (Citizen)`);
      }
    }
  }

  if (waitingOn.length === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 8,
        zIndex: 40,
        margin: "8px 12px 0",
        padding: "10px 14px",
        borderRadius: 12,
        background: "linear-gradient(90deg, rgba(244,67,54,.22), rgba(244,67,54,.08))",
        border: "1px solid rgba(244,67,54,.5)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "white",
        boxShadow: "0 4px 14px rgba(244,67,54,.28)",
      }}
    >
      <span style={{ fontSize: 18 }}>{"\u26A0\uFE0F"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 12, letterSpacing: 1.5 }}>
          CRISIS PENDING
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)", marginTop: 2 }}>
          Waiting on: {waitingOn.join(", ")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Ch2 Damage Repair Overlay
// ─────────────────────────────────────────────────────────────
function DamageRepairOverlay({
  crisisCardId,
  scenarioTitle,
  onUploaded,
}: {
  crisisCardId: string | undefined;
  scenarioTitle: string;
  onUploaded: (dataUrl: string) => Promise<void>;
}) {
  const crisis = CRISIS_CARDS.find((c) => c.id === crisisCardId);
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleCaptured(dataUrl: string) {
    setCameraOpen(false);
    setBusy(true);
    try { await onUploaded(dataUrl); } finally { setBusy(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,6,6,.97)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, zIndex: 900, overflowY: "auto",
      animation: "fadeIn .3s ease-out",
    }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 12, letterSpacing: 3,
          color: "var(--acc3)", textAlign: "center", marginBottom: 8, textTransform: "uppercase",
        }}>
          {scenarioTitle} {"\u00B7"} Crisis
        </div>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 28, letterSpacing: 2,
          color: "#fff", textAlign: "center", marginBottom: 10, textTransform: "uppercase",
          textShadow: "0 2px 8px rgba(255,60,60,.5)",
        }}>
          {crisis?.title || "YOUR DISTRICT IS DAMAGED"}
        </div>
        <div style={{
          fontSize: 56, textAlign: "center", marginBottom: 14,
        }}>
          {crisis?.icon || "\u{1F525}"}
        </div>
        <div style={{
          background: "rgba(255,112,67,.1)", border: "2px solid var(--acc3)",
          borderRadius: "var(--brick-radius)", padding: "16px 18px", marginBottom: 18,
          color: "white", lineHeight: 1.55, textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 13, letterSpacing: 2,
            color: "var(--acc3)", marginBottom: 8,
          }}>
            REBUILD YOUR DISTRICT
          </div>
          <div style={{ fontSize: 13, color: "var(--textd)" }}>
            {crisis?.description || "Your district was damaged. Rebuild it physically with LEGO, then take a photo of the new build."}
          </div>
        </div>
        <button
          className="lb lb-yellow"
          onClick={() => setCameraOpen(true)}
          disabled={busy}
          style={{ width: "100%", padding: "16px 0", fontSize: 14, letterSpacing: 2 }}
        >
          {busy ? "UPLOADING..." : "\u{1F4F7} TAKE NEW PHOTO"}
        </button>
        <div style={{
          fontSize: 11, color: "var(--textdd)", textAlign: "center",
          marginTop: 12, lineHeight: 1.5,
        }}>
          You will stay blocked on this screen until a new photo is uploaded. Rebuilding is your part of recovering from the crisis.
        </div>
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,.45)", textAlign: "center",
          marginTop: 8, letterSpacing: 0.5,
        }}>
          Live camera only. Photos from your device files are not accepted.
        </div>
      </div>
      <InAppCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCaptured}
        title="Rebuild Photo"
        hint="Rebuild your district physically with LEGO, place it in front of the camera, then capture."
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Ch3 Incoming Request Banner
// ─────────────────────────────────────────────────────────────
function IncomingRequestBanner({
  fromName, expiresAt, onAccept, onDecline,
}: {
  fromName: string;
  expiresAt: number;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  // Pass #16: this banner is shown to the target BEFORE they accept. It must
  // NOT leak the connection type. The type is revealed to both players only
  // after accept, on the ConnectionBuildCard.
  const [secLeft, setSecLeft] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  useEffect(() => {
    const id = setInterval(() => {
      setSecLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (secLeft <= 0) return null;

  return (
    <div style={{
      position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)",
      width: "min(480px, 92vw)",
      background: "linear-gradient(180deg, rgba(14,14,37,0.98), rgba(8,8,22,0.98))",
      border: "1.5px solid rgba(79,195,247,0.55)",
      borderRadius: 14,
      padding: "14px 16px", zIndex: 850,
      boxShadow: "0 14px 34px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,195,247,0.08) inset",
      animation: "fadeIn .3s ease-out",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: "radial-gradient(circle, rgba(79,195,247,0.32), rgba(79,195,247,0.06))",
          border: "1px solid rgba(79,195,247,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>{"\u{1F91D}"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2.2,
            color: "var(--acc2, #4FC3F7)", textTransform: "uppercase",
          }}>
            Incoming Request {"\u00B7"} {secLeft}s
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 15, letterSpacing: 1,
            color: "white", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {fromName} wants to build with you.
          </div>
        </div>
      </div>
      <div style={{
        fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.55,
        background: "rgba(255,255,255,0.04)", padding: "10px 12px",
        borderRadius: 10, marginBottom: 12,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        Accept to reveal the connection type you&rsquo;ll build together.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="lb lb-green" onClick={onAccept} style={{ flex: 1, padding: "12px 0", fontSize: 12, letterSpacing: 1.5 }}>
          ACCEPT
        </button>
        <button className="lb lb-ghost" onClick={onDecline} style={{ flex: 1, padding: "12px 0", fontSize: 12, letterSpacing: 1.5 }}>
          DECLINE
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Ch3 Pending Connection Upload Banner
// ─────────────────────────────────────────────────────────────
function PendingConnectionBanner({
  partnerName, typeLabel, typeHint, typeIcon, bothPhotos, onUpload,
}: {
  partnerName: string;
  typeLabel: string;
  typeHint: string;
  typeIcon: string;
  bothPhotos: boolean;
  onUpload: (dataUrl: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleCaptured(dataUrl: string) {
    setCameraOpen(false);
    setBusy(true);
    try { await onUpload(dataUrl); } finally { setBusy(false); }
  }

  if (bothPhotos) return null;
  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)",
          padding: "8px 14px", cursor: "pointer",
          background: "var(--bg1)", border: "2px solid var(--acc1)",
          borderRadius: 999, zIndex: 840,
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 1.5,
          color: "var(--acc1)",
        }}
      >
        {typeIcon} BUILD PENDING {"\u00B7"} tap
      </div>
    );
  }
  return (
    <div style={{
      position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)",
      width: "min(460px, 92vw)",
      background: "var(--bg1)", border: "2px solid var(--acc1)",
      borderRadius: "var(--brick-radius)",
      padding: "14px 16px", zIndex: 840,
      boxShadow: "0 8px 22px rgba(0,0,0,.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{typeIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
            color: "var(--acc1)", textTransform: "uppercase",
          }}>
            Your Half Pending {"\u00B7"} {typeLabel}
          </div>
          <div style={{ fontSize: 12, color: "white", marginTop: 2 }}>
            With <strong>{partnerName}</strong>. Build your half in real LEGO, then take a photo.
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: "none", border: "none", color: "var(--textdd)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          hide
        </button>
      </div>
      {typeHint && (
        <div style={{
          fontSize: 11, color: "var(--textd)", fontStyle: "italic",
          padding: "6px 8px", background: "rgba(255,255,255,.04)",
          borderRadius: 6, marginBottom: 10,
        }}>
          {typeHint}
        </div>
      )}
      <button
        className="lb lb-yellow"
        disabled={busy}
        onClick={() => setCameraOpen(true)}
        style={{ width: "100%", padding: "10px 0", fontSize: 12, letterSpacing: 2 }}
      >
        {busy ? "UPLOADING..." : "\u{1F4F7} UPLOAD MY HALF"}
      </button>
      <div style={{
        fontSize: 10, color: "rgba(255,255,255,.5)", textAlign: "center",
        marginTop: 6, letterSpacing: 0.5,
      }}>
        Live camera only.
      </div>
      <InAppCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCaptured}
        title="Upload Your Half"
        hint={`Build your half of the ${typeLabel}, place it in front of the camera, then capture.`}
      />
    </div>
  );
}

