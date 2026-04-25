"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CLUE_CARDS, PAIR_BUILD_ROUNDS, SCENARIOS, DISTRICT_BANNED_WORDS } from "../../lib/constants";
import { getClueIllustration } from "./ClueIllustrations";
import { playSound } from "../../lib/sound";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { compressDataUrl } from "./cameraFallback";
import { getDistrictIllustration } from "./DistrictIllustrations";

// ── Timer Display ──
function Timer({ deadline }: { deadline: number | undefined }) {
  const [remaining, setRemaining] = useState(0);
  // Track which second we last cued a sound for so each tick fires at most once.
  const lastCuedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline) { setRemaining(0); lastCuedRef.current = null; return; }
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      // Fire a warning pulse at the 10s mark, one per second for the final 5s,
      // and a low gong at zero. The ref guard prevents re-firing on rerenders.
      if (lastCuedRef.current !== next) {
        lastCuedRef.current = next;
        if (next === 10 || (next > 0 && next <= 5)) playSound("timer-warning");
        if (next === 0) playSound("timer-expired");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) {
    return (
      <span style={{
        fontFamily: "'Black Han Sans', sans-serif", fontSize: 16, letterSpacing: 2,
        color: "var(--acc1)",
      }}>
        WAITING
      </span>
    );
  }
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 30;

  return (
    <span style={{
      fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2,
      color: urgent ? "var(--acc3)" : "white",
      transition: "color .2s",
    }}>
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

// Category colors
const CAT_COLORS: Record<string, string> = { shape: "#4FC3F7", feel: "#FF7043", story: "#B388FF" };

// Shared premium visuals for clue cards — used across the picker grid,
// the selected-confirmation row, and the builder's received-clue panel.

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function StudRow({ color, count = 4 }: { color: string; count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "6px 10px 0",
        justifyContent: "center",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${hexToRgba("#ffffff", 0.55)}, ${color} 55%, ${hexToRgba("#000000", 0.35)} 100%)`,
            boxShadow: `inset 0 -1.5px 2px rgba(0,0,0,.35), inset 0 1px 1.5px rgba(255,255,255,.3), 0 1px 2px rgba(0,0,0,.4)`,
            border: `1px solid ${hexToRgba("#000000", 0.35)}`,
          }}
        />
      ))}
    </div>
  );
}

// Circular illustration frame with a radial glow behind the art. Gives the
// illustration a "badge" feel rather than floating in dead space.
function ArtDisc({
  id,
  color,
  size,
  muted,
}: {
  id: string;
  color: string;
  size: number;
  muted?: boolean;
}) {
  const Art = getClueIllustration(id);
  const disc = Math.round(size * 1.25);
  return (
    <div
      style={{
        width: disc,
        height: disc,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 45%, ${hexToRgba(color, 0.28)} 0%, ${hexToRgba(color, 0.08)} 55%, rgba(0,0,0,0) 80%)`,
        border: `1.5px solid ${hexToRgba(color, 0.35)}`,
        boxShadow: `inset 0 0 18px ${hexToRgba(color, 0.18)}, 0 4px 14px rgba(0,0,0,.45)`,
        flexShrink: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          border: `1px dashed ${hexToRgba(color, 0.2)}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          filter: muted
            ? "grayscale(1) opacity(.45)"
            : `drop-shadow(0 3px 8px rgba(0,0,0,.55)) drop-shadow(0 0 6px ${hexToRgba(color, 0.35)})`,
        }}
      >
        <Art size={size} />
      </div>
    </div>
  );
}

// Small category badge. Pill-shape with a leading dot, all-caps display type.
function CategoryBadge({ category, color }: { category: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px 3px 7px",
        borderRadius: 999,
        background: hexToRgba(color, 0.15),
        border: `1px solid ${hexToRgba(color, 0.55)}`,
        color,
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 9,
        letterSpacing: 2,
        textTransform: "uppercase",
        boxShadow: `0 0 10px ${hexToRgba(color, 0.25)}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {category}
    </div>
  );
}

// ══════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════
export default function PairBuildScreen() {
  const { sessionId, sessionCode, playerId, role } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const sentClues = useQuery(api.pairBuild.getSentClues, sessionId ? { sessionId } : "skip");
  const buildPhotos = useQuery(api.pairBuild.getBuildPhotos, sessionId ? { sessionId } : "skip");

  const me = players?.find((p) => p._id === playerId);
  const architectFor = me?.architectFor ? players?.find((p) => p._id === me.architectFor) : null;
  const builderFor = me?.builderFor ? players?.find((p) => p._id === me.builderFor) : null;

  // Pair chat keys
  const pairKeyAsArchitect = me && architectFor ? `${me._id}_${architectFor._id}` : "";
  const pairKeyAsBuilder = me && builderFor ? `${builderFor._id}_${me._id}` : "";
  const archMsgs = useQuery(api.pairBuild.getPairMessages, sessionId && pairKeyAsArchitect ? { sessionId, pairKey: pairKeyAsArchitect } : "skip");
  const buildMsgs = useQuery(api.pairBuild.getPairMessages, sessionId && pairKeyAsBuilder ? { sessionId, pairKey: pairKeyAsBuilder } : "skip");

  // Mutations
  const selectClue = useMutation(api.pairBuild.selectClue);
  const sendPairMessage = useMutation(api.pairBuild.sendPairMessage);
  const uploadBuildPhoto = useMutation(api.pairBuild.uploadBuildPhoto);
  const advanceSubPhase = useMutation(api.pairBuild.advanceSubPhase);
  const markPairBuildReady = useMutation(api.game.markPairBuildReady);
  const skipPairBuildReadyGate = useMutation(api.game.skipPairBuildReadyGate);
  const detectBlocks = useAction(api.detectLego.detectBuildingBlocks);

  // UI state
  const [selectedClue, setSelectedClue] = useState<string | null>(null);
  const [expandedClue, setExpandedClue] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  // Every player is BOTH an architect (giving clues to one partner) AND a
  // builder (receiving clues from another). Each pair has its own chat row
  // in pair_messages (keyed by `${architectId}_${builderId}`). The tabs let
  // the player switch between the two conversations they're in.
  const [chatTab, setChatTab] = useState<"toBuilder" | "toArchitect">("toBuilder");
  // Blocking onboarding overlay. Requires an explicit TAP so the player has
  // actually read the loop. Persisted per-session in sessionStorage so we
  // don't re-show it on every rerender, but it DOES reappear if the player
  // starts a new session (intentional: new game, new briefing).
  const introKey = sessionId ? `intro-seen:${sessionId}` : "";
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === "undefined" || !introKey) return true;
    return window.sessionStorage.getItem(introKey) !== "1";
  });
  function dismissIntro() {
    setShowIntro(false);
    if (typeof window !== "undefined" && introKey) window.sessionStorage.setItem(introKey, "1");
    if (playerId) {
      markPairBuildReady({ playerId }).catch(() => { /* stale state, intro already dismissed locally */ });
    }
  }

  // If the intro was already dismissed (sessionStorage) but the server still
  // shows this player as not ready (e.g., after a reconnect), re-mark them so
  // the gate doesn't deadlock on them.
  useEffect(() => {
    if (showIntro) return;
    if (!playerId || !me || me.isFacilitator) return;
    if (me.pairBuildReady) return;
    if (session?.phase !== "pair_build") return;
    markPairBuildReady({ playerId }).catch(() => {});
  }, [showIntro, playerId, me, session?.phase, markPairBuildReady]);

  // After 5s of the server still not acknowledging my ready flag, expose a
  // retry control so the player isn't silently stuck on a phantom wait state.
  const [showReadyRetry, setShowReadyRetry] = useState(false);
  useEffect(() => {
    setShowReadyRetry(false);
    if (showIntro) return;
    if (!playerId || !me || me.isFacilitator) return;
    if (me.pairBuildReady) return;
    if (session?.phase !== "pair_build") return;
    const t = setTimeout(() => setShowReadyRetry(true), 5000);
    return () => clearTimeout(t);
  }, [showIntro, me?.pairBuildReady, session?.phase, playerId, me]);

  async function retryReady() {
    if (!playerId) return;
    try {
      await markPairBuildReady({ playerId });
      toast("Ready confirmed.");
    } catch {
      toast("Still couldn't confirm. Check your connection.");
    }
  }

  // Desktop breakpoint (>=1024px): wider max-width + 3-col clue grid.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [legoVerified, setLegoVerified] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatMsgsRef = useRef<HTMLDivElement>(null);

  const scenario = session?.scenario || "";
  const scenarioData = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];
  const currentRound = session?.buildSubPhase ?? 1;
  const currentStage: "clue" | "build" = (session?.buildStage as "clue" | "build" | undefined) ?? "clue";
  const roundConfig = PAIR_BUILD_ROUNDS[currentRound - 1];
  const isClueStage = currentStage === "clue";
  const isBuildStage = currentStage === "build";

  // Clues I've sent as architect
  const mySentClues = (sentClues ?? []).filter((c) => me && c.architectId === me._id);
  const sentClueIds = new Set(mySentClues.map((c) => c.clueCardId));
  const sentThisRound = mySentClues.some((c) => c.round === currentRound);

  // Clues sent TO me as builder
  const cluesForMe = (sentClues ?? []).filter((c) => me && c.builderId === me._id);

  // Photos
  const myPhotos = (buildPhotos ?? []).filter((p) => me && p.playerId === me._id);
  const hasPhotoThisRound = myPhotos.some((p) => p.round === currentRound);
  const builderPhotos = architectFor ? (buildPhotos ?? []).filter((p) => p.playerId === architectFor._id) : [];

  // Deterministic 6-card selection per pair
  const pairSeed = me?._id ?? "";
  const availableClues = CLUE_CARDS.slice().sort((a, b) => hashStr(pairSeed + a.id) - hashStr(pairSeed + b.id)).slice(0, 6);

  // Auto-scroll chat
  useEffect(() => {
    if (chatMsgsRef.current) chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
  }, [archMsgs?.length, buildMsgs?.length]);

  // ── Deadline expiry: UI signal only (Pass #26) ──
  // The round no longer auto-advances on timer zero. Instead we flip
  // `deadlineExpired` true so the screen can render a force-submit CTA, and
  // we still rescue any captured-but-unsent photo (a fairly common case
  // where a builder shoots the photo at 0:01 and never taps upload). Actual
  // advancement happens server-side when the last sendClue / uploadBuildPhoto
  // for the round lands.
  const expiredHandledForKeyRef = useRef<string | null>(null);
  const [deadlineExpired, setDeadlineExpired] = useState(false);
  useEffect(() => {
    const deadline = session?.subPhaseDeadline;
    if (!sessionId || !deadline || session?.phase !== "pair_build") {
      setDeadlineExpired(false);
      return;
    }
    const roundAtStart = currentRound;
    const stageAtStart = currentStage;
    const key = `${roundAtStart}:${stageAtStart}`;

    const onExpire = () => {
      setDeadlineExpired(true);
      if (expiredHandledForKeyRef.current === key) return;
      expiredHandledForKeyRef.current = key;
      // Photo rescue: auto-upload a captured-but-unsent photo so a near-miss
      // builder doesn't lose it. They can still retake/upload again normally.
      if (stageAtStart === "build" && photo && playerId && !hasPhotoThisRound) {
        uploadBuildPhoto({ sessionId, playerId, round: roundAtStart, photoDataUrl: photo }).catch(() => {});
        setPhoto(null);
        setLegoVerified(false);
      }
    };

    const msLeft = deadline - Date.now();
    if (msLeft <= 0) { onExpire(); return; }
    setDeadlineExpired(false);
    const t = setTimeout(onExpire, msLeft);
    return () => clearTimeout(t);
  }, [session?.subPhaseDeadline, session?.phase, currentRound, currentStage, sessionId, photo, playerId, hasPhotoThisRound, uploadBuildPhoto]);

  // Stage flipping drives the screen split (clue vs build), so no tab state.

  // ── Camera ──
  // Two-phase mount: save the stream in a ref, flip cameraActive to true, then
  // a useEffect below binds the stream to the <video> once it's rendered. This
  // avoids the bug where srcObject gets assigned to a ref that hasn't mounted
  // because the <video> is conditionally rendered on cameraActive.
  async function startCam() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Your browser does not support in-app camera capture. Use a recent Chrome or Safari.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = s;
      setCameraActive(true);
    } catch (err) {
      const name = (err as { name?: string } | null)?.name || "";
      const denied = name === "NotAllowedError" || name === "SecurityError";
      setCameraError(
        denied
          ? "Camera access was blocked. Tap the lock icon in your browser's address bar, allow camera for this site, then retry."
          : "Could not start the camera. Make sure no other app is using it, then retry.",
      );
    }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }
  // Bind the active stream to the <video> once React has mounted it.
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);
  async function processCapturedDataUrl(dataUrl: string) {
    playSound("photo");
    setPhoto(dataUrl); setLegoVerified(false);
    if (process.env.NEXT_PUBLIC_SKIP_DETECTION) { setLegoVerified(true); return; }
    setDetecting(true);
    try {
      const result = await detectBlocks({ imageBase64: dataUrl.split(",")[1] });
      if (result.isLego) { setLegoVerified(true); playSound("lego-detected"); toast("Build detected"); }
      else toast("No building blocks detected. Retake with your build in frame.");
    } catch { setLegoVerified(true); toast("Could not verify. Upload allowed."); }
    setDetecting(false);
  }
  async function capturePhoto() {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const raw = c.toDataURL("image/jpeg", 0.85);
    const dataUrl = await compressDataUrl(raw);
    stopCam();
    await processCapturedDataUrl(dataUrl);
  }
  async function submitPhoto() {
    if (!sessionId || !playerId || !photo) return;
    await uploadBuildPhoto({ sessionId, playerId, round: currentRound, photoDataUrl: photo });
    toast(`Round ${currentRound} photo uploaded`);
    setPhoto(null); setLegoVerified(false);
  }

  // ── Architect: send clue ──
  async function handleSendClue() {
    if (!sessionId || !me || !architectFor || !selectedClue) return;
    const result = await selectClue({ sessionId, architectId: me._id, builderId: architectFor._id, clueCardId: selectedClue, round: currentRound });
    if (result?.success === false) toast(result.error || "Could not send clue");
    else { playSound("clue-sent"); toast("Clue sent!"); setSelectedClue(null); }
  }

  // ── Chat ──
  async function handleSendChat(pairKey: string) {
    if (!sessionId || !me || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      await sendPairMessage({ sessionId, pairKey, senderId: me._id, text });
    } catch (err) {
      // Restore the draft so the player can retry without re-typing.
      setChatInput(text);
      const msg = (err as { message?: string } | null)?.message || "";
      toast(msg.includes("Empty") ? "Type something first." : "Message failed. Check your connection and retry.");
    }
  }

  // Each player has two live conversations: one with their builder (where
  // they're the architect giving clues) and one with their architect (where
  // they're the builder receiving clues). pair_messages is keyed by
  // `${architectId}_${builderId}` so both sides of a given pair read the
  // same row. The UI exposes both via tabs.
  const hasBuilderPartner = !!architectFor; // I'm architect for architectFor
  const hasArchitectPartner = !!builderFor; // I'm builder for builderFor
  // Default tab falls back to the only one that exists if the player somehow
  // lacks a partner on one side.
  const effectiveChatTab: "toBuilder" | "toArchitect" =
    chatTab === "toBuilder" && !hasBuilderPartner ? "toArchitect"
      : chatTab === "toArchitect" && !hasArchitectPartner ? "toBuilder"
        : chatTab;
  const activePairKey = effectiveChatTab === "toBuilder" ? pairKeyAsArchitect : pairKeyAsBuilder;
  const activeMessages = effectiveChatTab === "toBuilder" ? archMsgs : buildMsgs;
  const myLabel = effectiveChatTab === "toBuilder" ? "You (Architect)" : "You (Builder)";
  const theirLabel = effectiveChatTab === "toBuilder" ? "Builder" : "Architect";
  const partnerName = effectiveChatTab === "toBuilder" ? architectFor?.name : builderFor?.name;
  // Unread ping counts per tab. A message is "unread" if it's in the inactive
  // tab, was sent by the partner (not me), and its creation time is newer
  // than the last time we viewed that tab.
  const [lastViewedAt, setLastViewedAt] = useState<{ toBuilder: number; toArchitect: number }>(() => ({
    toBuilder: Date.now(), toArchitect: Date.now(),
  }));
  useEffect(() => {
    setLastViewedAt((prev) => ({ ...prev, [effectiveChatTab]: Date.now() }));
  }, [effectiveChatTab]);
  const unreadToBuilder = (archMsgs ?? []).filter(
    (m) => me && m.senderId !== me._id && m._creationTime > lastViewedAt.toBuilder
  ).length;
  const unreadToArchitect = (buildMsgs ?? []).filter(
    (m) => me && m.senderId !== me._id && m._creationTime > lastViewedAt.toArchitect
  ).length;

  // Banned words (Taboo-style): derived from the district name of the builder
  // this architect is guiding. The architect must lead their builder to build
  // e.g. "The Lighthouse" without saying "light", "house", "beacon", etc.
  // Only shown on the architect tab — the builder never sees these (it would
  // reveal their district name). Word-boundary, case-insensitive matches.
  const targetDistrictName = architectFor?.districtName ?? null;
  const bannedWords = (targetDistrictName && DISTRICT_BANNED_WORDS[targetDistrictName])
    ? DISTRICT_BANNED_WORDS[targetDistrictName].map((w) => w.toLowerCase())
    : [];
  const typedBanned = (() => {
    if (!bannedWords.length || !chatInput.trim()) return [] as string[];
    const lower = chatInput.toLowerCase();
    return bannedWords.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  })();

  // Expanded clue data
  const expandedClueData = expandedClue ? CLUE_CARDS.find((c) => c.id === expandedClue) : null;

  // ── Facilitator dashboard view (replaces player UI) ──
  if (role === "facilitator") {
    const nonFacPlayers = (players ?? []).filter((p) => !p.isFacilitator);
    // Pass #17: ready counts + architect/builder lists exclude ghosts so the
    // fac dashboard numerator and denominator shrink together when someone
    // drops out of the session mid-pair-build.
    const presentNonFacPlayers = nonFacPlayers.filter((p) => p.isPresent !== false);
    const architectsWithPairs = presentNonFacPlayers.filter((p) => p.architectFor);
    const clueSentThisRound = (sentClues ?? []).filter((c) => c.round === currentRound);
    const clueSentByArchitect = new Set(clueSentThisRound.map((c) => c.architectId));
    const photosThisRound = (buildPhotos ?? []).filter((p) => p.round === currentRound);
    const photoByPlayer = new Set(photosThisRound.map((p) => p.playerId));
    const readyCount = presentNonFacPlayers.filter((p) => p.pairBuildReady).length;
    const awaitingReady = session?.subPhaseDeadline === undefined && session?.phase === "pair_build";

    async function handleSkipStage() {
      if (!sessionId) return;
      const res = await advanceSubPhase({ sessionId, fromRound: currentRound, fromStage: currentStage });
      if (res.advanced) {
        toast(isClueStage ? "Advanced to build stage" : `Advanced to round ${currentRound + 1}`);
        return;
      }
      const reason = "reason" in res ? res.reason : undefined;
      const missing = ("missing" in res ? res.missing : undefined) ?? [];
      if (reason === "CLUES_PENDING") {
        toast(`Waiting on ${missing.length} to send clues: ${missing.join(", ")}`);
      } else if (reason === "PHOTOS_PENDING") {
        toast(`Waiting on ${missing.length} to upload: ${missing.join(", ")}`);
      } else {
        toast("Cannot advance right now.");
      }
    }

    async function handleForceAdvance() {
      if (!sessionId) return;
      if (!window.confirm("Force-advance before players finish? Pending work will be abandoned.")) return;
      await advanceSubPhase({ sessionId, fromRound: currentRound, fromStage: currentStage, force: true });
      toast(isClueStage ? "Force-advanced to build stage" : `Force-advanced to round ${currentRound + 1}`);
    }

    async function handleSkipReadyGate() {
      if (!sessionId) return;
      await skipPairBuildReadyGate({ sessionId });
      toast("Timer started. Clue stage running.");
    }

    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white", maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined, width: isDesktop ? "100%" : undefined }}>
        <BrandBar badge="FACILITATOR" />

        {/* Header */}
        <div style={{
          textAlign: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)",
          background: isClueStage ? "rgba(255,215,0,.05)" : "rgba(79,195,247,.05)",
        }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
            letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 4,
          }}>
            Facilitator Dashboard {"\u00B7"} {roundConfig?.label} {"\u00B7"} Round {currentRound} of 3
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 14,
            letterSpacing: 2, color: isClueStage ? "var(--acc1)" : "var(--acc2)",
            textTransform: "uppercase", marginBottom: 6,
          }}>
            {isClueStage ? "\u{1F3A8} CLUE STAGE" : "\u{1F9F1} BUILD STAGE"}
          </div>
          <Timer deadline={session?.subPhaseDeadline} />
          {awaitingReady && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "var(--acc1)", fontWeight: 800, letterSpacing: 1.5 }}>
                {readyCount} of {presentNonFacPlayers.length} players ready
              </div>
              <button
                className="lb lb-yellow"
                style={{ fontSize: 10, padding: "6px 12px" }}
                onClick={handleSkipReadyGate}
              >
                SKIP WAIT, START TIMER {"\u2192"}
              </button>
            </div>
          )}
        </div>

        {/* Pair grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
            letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
          }}>
            Pair progress ({architectsWithPairs.length} pairs)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {architectsWithPairs.map((arch) => {
              const builder = nonFacPlayers.find((p) => p._id === arch.architectFor);
              if (!builder) return null;
              const clueDone = clueSentByArchitect.has(arch._id);
              const buildDone = photoByPlayer.has(builder._id);
              return (
                <div
                  key={arch._id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--brick-radius)",
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--textd)", marginBottom: 4 }}>
                    <span style={{ color: "var(--acc1)", fontWeight: 800 }}>{arch.name}</span>
                    {" \u2192 "}
                    <span style={{ color: "var(--acc2)", fontWeight: 800 }}>{builder.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--textdd)", marginBottom: 8 }}>
                    architecting {builder.districtName || "(unnamed)"}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 4,
                      background: clueDone ? "rgba(105,240,174,.18)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${clueDone ? "rgba(105,240,174,.35)" : "var(--border)"}`,
                      color: clueDone ? "var(--acc4)" : "var(--textdd)",
                    }}>
                      {clueDone ? "\u2713 CLUE" : "\u25CB CLUE"}
                    </span>
                    <span style={{
                      padding: "3px 8px", borderRadius: 4,
                      background: buildDone ? "rgba(79,195,247,.18)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${buildDone ? "rgba(79,195,247,.35)" : "var(--border)"}`,
                      color: buildDone ? "var(--acc2)" : "var(--textdd)",
                    }}>
                      {buildDone ? "\u2713 PHOTO" : "\u25CB PHOTO"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer controls */}
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          background: "rgba(255,255,255,.02)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: "var(--textd)" }}>
            {isClueStage
              ? `${clueSentByArchitect.size}/${architectsWithPairs.length} clues sent`
              : `${photoByPlayer.size}/${architectsWithPairs.length} photos uploaded`}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="lb lb-yellow"
              style={{ fontSize: 11, padding: "8px 14px" }}
              onClick={handleSkipStage}
              title="Advance only if all players are done (or the timer has expired)"
            >
              {isClueStage
                ? "ADVANCE \u2192 BUILD"
                : currentRound < 3 ? `ADVANCE \u2192 ROUND ${currentRound + 1}` : "ADVANCE \u2192 GUESS"}
            </button>
            <button
              className="lb"
              style={{
                fontSize: 11, padding: "8px 14px",
                background: "rgba(244,67,54,0.18)",
                border: "1.5px dashed rgba(244,67,54,0.65)",
                color: "#FFB3AD",
                letterSpacing: 1.5,
              }}
              onClick={handleForceAdvance}
              title="Skip the readiness gate and advance now. Pending clues and photos are abandoned. Confirmation required."
            >
              FORCE ADVANCE {"\u2192"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Player with no pairing (shouldn't happen in normal flow, but guards against stale state)
  if (me && !architectFor && !builderFor) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white", maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined, width: isDesktop ? "100%" : undefined }}>
        <BrandBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 10 }}>
          <div style={{ fontSize: 36 }}>{"\u{1F517}"}</div>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 16, letterSpacing: 1.5, color: "var(--acc1)" }}>
            Waiting for pair assignment
          </div>
          <div style={{ fontSize: 12, color: "var(--textd)", maxWidth: 320 }}>
            Your facilitator needs to generate pairings. Sit tight &mdash; you&apos;ll enter the pair build as soon as that&apos;s done.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white", maxWidth: isDesktop ? 1280 : undefined, margin: isDesktop ? "0 auto" : undefined, width: isDesktop ? "100%" : undefined }}>
      <BrandBar />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Blocking pair-build explainer (requires explicit tap) ── */}
      {showIntro && role === "player" && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(6,6,26,.97)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, zIndex: 500, overflowY: "auto",
            animation: "fadeIn .3s ease-out",
          }}
        >
          <div style={{ maxWidth: 440, width: "100%" }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2,
              color: "var(--acc1)", marginBottom: 6, textAlign: "center",
            }}>
              HOW PAIR BUILD WORKS
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginBottom: 18, textAlign: "center", lineHeight: 1.5 }}>
              You&apos;ll play{" "}
              <strong style={{ color: "var(--acc1)" }}>both roles</strong>
              {" "}at the same time. You give clues to one player while another player gives clues to you.
            </div>

            {/* Step diagram */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={{
                background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.3)",
                borderRadius: "var(--brick-radius)", padding: "12px 14px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 14,
                  background: "var(--acc1)", color: "#0a0a12",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 13,
                }}>1</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--acc1)", fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>
                    {"\u{1F3A8}"} YOU PICK A CLUE CARD
                  </div>
                  <div style={{ fontSize: 12, color: "white", lineHeight: 1.5 }}>
                    You have 30 to 45 seconds to pick one of six clue cards and send it to your builder. The clue hints at the shape you want them to build.
                  </div>
                </div>
              </div>

              <div style={{
                background: "rgba(79,195,247,.08)", border: "1px solid rgba(79,195,247,.3)",
                borderRadius: "var(--brick-radius)", padding: "12px 14px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 14,
                  background: "var(--acc2)", color: "#0a0a12",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 13,
                }}>2</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--acc2)", fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>
                    {"\u{1F9F1}"} YOU BUILD (from someone else&apos;s clue)
                  </div>
                  <div style={{ fontSize: 12, color: "white", lineHeight: 1.5 }}>
                    At the same time, your own architect sends you a clue. You have 2 to 3 minutes to build it with LEGO and snap a photo.
                  </div>
                </div>
              </div>

              <div style={{
                background: "rgba(105,240,174,.08)", border: "1px solid rgba(105,240,174,.25)",
                borderRadius: "var(--brick-radius)", padding: "12px 14px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 14,
                  background: "var(--acc4)", color: "#0a0a12",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 13,
                }}>3</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--acc4)", fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>
                    {"\u{1F501}"} REPEAT 3 TIMES
                  </div>
                  <div style={{ fontSize: 12, color: "white", lineHeight: 1.5 }}>
                    Three clue rounds total. Each round, your clue adds more detail. Their build gets closer to what you wanted.
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid var(--border)",
              borderRadius: "var(--brick-radius)", padding: "10px 14px", marginBottom: 16,
              fontSize: 11, color: "var(--textd)", lineHeight: 1.6,
            }}>
              {"\u{1F4AC}"}{" "}
              <strong style={{ color: "white" }}>Chat stays open the whole time.</strong>
              {" "}You can talk to your pair any round. Some words give the answer away. You&apos;ll see which words to avoid.
            </div>

            <button
              className="lb lb-yellow"
              onClick={dismissIntro}
              style={{ width: "100%", padding: "14px 0", fontSize: 14, letterSpacing: 2 }}
            >
              I&apos;M READY {"\u2192"}
            </button>
          </div>
        </div>
      )}

      {/* ── Clue detail modal (animated like card modal) ── */}
      {expandedClueData && (
        <div className="card-modal-overlay" onClick={() => setExpandedClue(null)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-modal-studs">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="lego-stud-3d" style={{ width: 16, height: 16 }} />
              ))}
            </div>
            <div className="card-modal-accent" style={{ background: CAT_COLORS[expandedClueData.category] }} />
            <div className="card-modal-body">
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{
                  display: "inline-block", padding: "4px 16px", borderRadius: 20,
                  background: `${CAT_COLORS[expandedClueData.category]}20`,
                  border: `1px solid ${CAT_COLORS[expandedClueData.category]}44`,
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
                  color: CAT_COLORS[expandedClueData.category], textTransform: "uppercase",
                }}>
                  {expandedClueData.category} CLUE
                </div>
              </div>
              <div style={{
                display: "flex", justifyContent: "center", marginBottom: 10,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,.4))",
              }}>
                {(() => {
                  const Art = getClueIllustration(expandedClueData.id);
                  return <Art size={120} />;
                })()}
              </div>
              <div className="card-modal-title" style={{ color: CAT_COLORS[expandedClueData.category] }}>
                {expandedClueData.label}
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">WHAT YOUR BUILDER WILL SEE</div>
                <div className="card-modal-rule" style={{ fontSize: 16, lineHeight: 2, fontStyle: "italic" }}>
                  &ldquo;{expandedClueData.clueText}&rdquo;
                </div>
              </div>
              {sentClueIds.has(expandedClueData.id) && (
                <div className="card-modal-hint" style={{ color: "var(--acc4)" }}>This clue has already been sent</div>
              )}
            </div>
            <div style={{ display: "flex" }}>
              <button className="card-modal-close" style={{ flex: 1 }} onClick={() => setExpandedClue(null)}>CLOSE</button>
              {!sentClueIds.has(expandedClueData.id) && !sentThisRound && (
                <button
                  className="card-modal-close"
                  style={{ flex: 1, color: "var(--acc4)", borderLeft: "1px solid var(--borderl)" }}
                  onClick={() => { setSelectedClue(expandedClueData.id); setExpandedClue(null); }}
                >
                  SELECT THIS CLUE
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Round + Stage + Timer header ── */}
      <div style={{
        textAlign: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)",
        background: isClueStage ? "rgba(255,215,0,.05)" : "rgba(79,195,247,.05)",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
          letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 4,
        }}>
          {roundConfig?.label ?? "Pair Build"} {"\u00B7"} Round {currentRound} of 3
        </div>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 14,
          letterSpacing: 2, color: isClueStage ? "var(--acc1)" : "var(--acc2)",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          {isClueStage ? "\u{1F3A8} CLUE STAGE. Architects pick a clue." : "\u{1F9F1} BUILD STAGE. Builders build!"}
        </div>
        <Timer deadline={session?.subPhaseDeadline} />
        {/* Pass #26: deadline-expired state. Show a force-CTA to anyone who
            still owes a submission this round, and a waiting list to
            everyone else. The round only advances when the last submission
            lands (server-side gate in pairBuild.ts). */}
        {deadlineExpired && !me?.isFacilitator && session?.phase === "pair_build" && (() => {
          const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
          if (isClueStage) {
            const sentIds = new Set((sentClues ?? []).filter((c) => c.round === currentRound).map((c) => c.architectId));
            const pendingNames = nonFac.filter((p) => p.architectFor && !sentIds.has(p._id)).map((p) => p.name);
            const iOwe = !!me?.architectFor && !sentIds.has(me._id);
            if (iOwe) {
              return (
                <div style={{
                  marginTop: 10, padding: "10px 14px",
                  background: "rgba(255,90,60,.12)", border: "1px solid rgba(255,90,60,.45)",
                  borderRadius: 8, color: "#ff9e80", fontSize: 12, fontWeight: 800, letterSpacing: 1, lineHeight: 1.5,
                }}>
                  TIME{"\u2019"}S UP. Pick a clue now to keep the game moving.
                </div>
              );
            }
            if (pendingNames.length > 0) {
              return (
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--textd)", letterSpacing: 1 }}>
                  Time{"\u2019"}s up. Waiting for: <span style={{ color: "var(--acc1)", fontWeight: 800 }}>{pendingNames.join(", ")}</span>
                </div>
              );
            }
            return null;
          }
          // build stage
          const photoIds = new Set((buildPhotos ?? []).filter((p) => p.round === currentRound).map((p) => p.playerId));
          const pendingNames = nonFac.filter((p) => p.builderFor && !photoIds.has(p._id)).map((p) => p.name);
          const iOwe = !!me?.builderFor && !photoIds.has(me._id);
          if (iOwe) {
            return (
              <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(255,90,60,.12)", border: "1px solid rgba(255,90,60,.45)",
                borderRadius: 8, color: "#ff9e80", fontSize: 12, fontWeight: 800, letterSpacing: 1, lineHeight: 1.5,
              }}>
                TIME{"\u2019"}S UP. {photo ? "Upload your photo now to keep the game moving." : "Take a photo and upload it now to keep the game moving."}
              </div>
            );
          }
          if (pendingNames.length > 0) {
            return (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--textd)", letterSpacing: 1 }}>
                Time{"\u2019"}s up. Waiting for: <span style={{ color: "var(--acc2)", fontWeight: 800 }}>{pendingNames.join(", ")}</span>
              </div>
            );
          }
          return null;
        })()}
        {session?.subPhaseDeadline === undefined && session?.phase === "pair_build" && players && (() => {
          // Pass #17: present-only ready counter. Ghosts don't show in the
          // denominator so the bar doesn't sit forever at N-1/N.
          const nonFac = players.filter((p) => !p.isFacilitator);
          const presentNonFac = nonFac.filter((p) => p.isPresent !== false);
          const ready = presentNonFac.filter((p) => p.pairBuildReady).length;
          const iAmReady = !!me?.pairBuildReady;
          return (
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--textd)", letterSpacing: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div>{ready} of {presentNonFac.length} players ready. Timer starts when everyone taps continue.</div>
              {!iAmReady && !showIntro && !me?.isFacilitator && (
                <div style={{ fontSize: 10, color: "var(--textdd)", fontStyle: "italic" }}>
                  Confirming your ready state with the server{"\u2026"}
                </div>
              )}
              {showReadyRetry && !iAmReady && !me?.isFacilitator && (
                <button
                  className="lb lb-ghost"
                  style={{ fontSize: 10, padding: "5px 12px" }}
                  onClick={retryReady}
                >
                  RETRY READY
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Content: clue stage shows clue picker + chat; build stage shows build UI only ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Gate: if the clue stage timer hasn't started, at least one player
            is still reading the onboarding. Everyone else waits so early
            readers can't skim clues ahead of the round. */}
        {isClueStage && session?.subPhaseDeadline === undefined && !me?.isFacilitator && (() => {
          const nonFacAll = (players ?? []).filter((p) => !p.isFacilitator);
          const readyNames = nonFacAll.filter((p) => p.pairBuildReady).map((p) => p.name);
          const waitingOn = nonFacAll.filter((p) => !p.pairBuildReady).map((p) => p.name);
          return (
            <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
              <div style={{ fontSize: 48 }}>{"\u23F3"}</div>
              <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, letterSpacing: 1.5, color: "var(--acc1)" }}>
                WAITING FOR THE TEAM
              </div>
              <div style={{ fontSize: 13, color: "var(--textd)", maxWidth: 380, lineHeight: 1.55 }}>
                Clues stay hidden until everyone has read the briefing. This keeps the round fair. Hang tight.
              </div>
              {waitingOn.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--textdd)", maxWidth: 380, lineHeight: 1.5 }}>
                  Still reading: <span style={{ color: "var(--textd)", fontWeight: 700 }}>{waitingOn.join(", ")}</span>
                </div>
              )}
              {readyNames.length > 0 && (
                <div style={{ fontSize: 10, color: "var(--textdd)", letterSpacing: 1 }}>
                  {readyNames.length} of {nonFacAll.length} ready.
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ CLUE SCREEN (replaces old architect tab content) ═══ */}
        {isClueStage && (session?.subPhaseDeadline !== undefined || me?.isFacilitator) && (
          <div style={{ padding: 16 }}>
            {/* Who they're building for, with illustrated district visual */}
            {architectFor && (() => {
              const DistrictArt = getDistrictIllustration(scenario, architectFor.districtName ?? null);
              return (
                <div style={{
                  background: `${scenarioData.color}10`, border: `1px solid ${scenarioData.color}30`,
                  borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 16,
                  display: "flex", gap: 14, alignItems: "center",
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <DistrictArt size={84} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 9, letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase" }}>
                      You are the architect for
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: scenarioData.color, marginTop: 4 }}>
                      {architectFor.districtName || "Unnamed " + scenarioData.terminology.district}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 2 }}>
                      {architectFor.name} is building this. Send clues to guide them.
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Incoming clue ping: during the clue stage, surface any clue your
                architect has already sent you so you know it arrived. The full
                clue card is rendered in the build stage; this is just a ping. */}
            {isClueStage && cluesForMe.filter((c) => c.round === currentRound).length > 0 && (
              <div style={{
                background: "rgba(79,195,247,.1)", border: "1px solid rgba(79,195,247,.35)",
                borderRadius: "var(--brick-radius)", padding: "10px 14px", marginBottom: 14,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{"\u{1F4E8}"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
                    color: "var(--acc2)", textTransform: "uppercase",
                  }}>
                    Clue received from {builderFor?.name ?? "your architect"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 2 }}>
                    It opens in the build stage. Send your own clue first.
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {sentThisRound && isClueStage && (
              <div style={{
                background: "rgba(105,240,174,.08)", border: "1px solid rgba(105,240,174,.2)",
                borderRadius: "var(--brick-radius)", padding: "14px", marginBottom: 16,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{"\u2713"}</div>
                <div style={{ fontSize: 13, color: "var(--acc4)", fontWeight: 800, marginBottom: 4 }}>
                  Clue sent!
                </div>
                <div style={{ fontSize: 11, color: "var(--textd)" }}>
                  Waiting for other architects to send their clues. Build stage starts when everyone&apos;s ready or the timer runs out.
                </div>
              </div>
            )}
            {isBuildStage && (
              <div style={{
                background: "rgba(79,195,247,.08)", border: "1px solid rgba(79,195,247,.2)",
                borderRadius: "var(--brick-radius)", padding: "14px", marginBottom: 16,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{"\u{1F9F1}"}</div>
                <div style={{ fontSize: 13, color: "var(--acc2)", fontWeight: 800, marginBottom: 4 }}>
                  Builders are building.
                </div>
                <div style={{ fontSize: 11, color: "var(--textd)" }}>
                  Your builder&apos;s photo will appear below when it arrives.
                </div>
              </div>
            )}

            {/* Selected clue confirmation */}
            {selectedClue && !sentThisRound && isClueStage && (() => {
              const card = CLUE_CARDS.find((c) => c.id === selectedClue);
              if (!card) return null;
              const color = CAT_COLORS[card.category];
              return (
                <div
                  style={{
                    background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, rgba(10,10,16,.98))`,
                    border: `2px solid ${color}`,
                    borderRadius: 14,
                    padding: 0,
                    marginBottom: 16,
                    overflow: "hidden",
                    boxShadow: `0 10px 28px ${hexToRgba(color, 0.35)}, 0 1px 0 rgba(255,255,255,.08) inset`,
                  }}
                >
                  <div
                    style={{
                      background: `linear-gradient(180deg, ${color}, ${hexToRgba(color, 0.78)})`,
                      padding: "4px 0 8px",
                      position: "relative",
                      borderBottom: `1px solid ${hexToRgba(color, 0.6)}`,
                    }}
                  >
                    <StudRow color={color} count={5} />
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 12,
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 9,
                        letterSpacing: 2,
                        color: "#0a0a12",
                        textTransform: "uppercase",
                      }}
                    >
                      Ready to send
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                      <ArtDisc id={card.id} color={color} size={58} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 6 }}>
                          <CategoryBadge category={card.category} color={color} />
                        </div>
                        <div
                          style={{
                            fontFamily: "'Black Han Sans', sans-serif",
                            fontSize: 18,
                            letterSpacing: 1.6,
                            textTransform: "uppercase",
                            color: "white",
                            marginBottom: 6,
                            textShadow: "0 2px 6px rgba(0,0,0,.5)",
                          }}
                        >
                          {card.label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--textd)",
                            fontStyle: "italic",
                            lineHeight: 1.55,
                          }}
                        >
                          <span style={{ color, fontWeight: 900, fontStyle: "normal", marginRight: 2 }}>{"\u201C"}</span>
                          {card.clueText}
                          <span style={{ color, fontWeight: 900, fontStyle: "normal", marginLeft: 2 }}>{"\u201D"}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="lb lb-green" style={{ flex: 1, fontSize: 12, padding: "10px 0" }} onClick={handleSendClue}>
                        SEND TO {architectFor?.name?.toUpperCase() || "BUILDER"}
                      </button>
                      <button className="lb lb-ghost" style={{ fontSize: 12, padding: "10px 14px" }} onClick={() => setSelectedClue(null)}>
                        CHANGE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Clue card grid: only during clue stage, only if not yet sent */}
            {!sentThisRound && isClueStage && (
              <div>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
                }}>
                  Choose a clue card to send (Round {currentRound})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
                  {availableClues.map((card) => {
                    const isSent = sentClueIds.has(card.id);
                    const isSelected = selectedClue === card.id;
                    const color = CAT_COLORS[card.category];

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (isSent) return;
                          setSelectedClue(isSelected ? null : card.id);
                        }}
                        style={{
                          background: isSent
                            ? "linear-gradient(180deg, rgba(20,20,28,.9), rgba(12,12,18,.95))"
                            : `linear-gradient(180deg, ${hexToRgba(color, 0.08)} 0%, rgba(14,14,22,.96) 40%, rgba(10,10,16,.98) 100%)`,
                          border: `2px solid ${isSent ? "var(--border)" : isSelected ? color : hexToRgba(color, 0.35)}`,
                          borderRadius: 14,
                          padding: 0,
                          cursor: isSent ? "default" : "pointer",
                          opacity: isSent ? 0.38 : 1,
                          transition: "transform .18s cubic-bezier(.2,.8,.3,1), box-shadow .2s, border-color .2s",
                          overflow: "hidden",
                          position: "relative",
                          transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                          boxShadow: isSelected
                            ? `0 10px 28px ${hexToRgba(color, 0.45)}, 0 0 0 1px ${hexToRgba(color, 0.7)} inset, 0 1px 0 rgba(255,255,255,.08) inset`
                            : `0 6px 16px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.05) inset`,
                        }}
                      >
                        {/* Top brick bar: solid category color with studs */}
                        <div
                          style={{
                            background: isSent
                              ? "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))"
                              : `linear-gradient(180deg, ${color}, ${hexToRgba(color, 0.78)})`,
                            borderBottom: `1px solid ${isSent ? "var(--border)" : hexToRgba(color, 0.6)}`,
                            padding: "4px 0 8px",
                            position: "relative",
                          }}
                        >
                          <StudRow color={isSent ? "#2a2a36" : color} count={4} />
                          {/* SENT / SELECTED corner flag */}
                          {isSent && (
                            <span
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 8,
                                fontFamily: "'Black Han Sans', sans-serif",
                                fontSize: 8,
                                letterSpacing: 1.5,
                                color: "var(--acc4)",
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(0,0,0,.4)",
                                border: "1px solid rgba(255,255,255,.1)",
                              }}
                            >
                              SENT
                            </span>
                          )}
                          {isSelected && !isSent && (
                            <span
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 8,
                                fontFamily: "'Black Han Sans', sans-serif",
                                fontSize: 8,
                                letterSpacing: 1.5,
                                color: "#0a0a12",
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,.85)",
                              }}
                            >
                              {"\u2713"} PICKED
                            </span>
                          )}
                        </div>

                        {/* Card body */}
                        <div style={{ padding: "14px 12px 12px", position: "relative" }}>
                          {/* Subtle stud-grid texture behind content */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundImage:
                                "radial-gradient(circle, rgba(255,255,255,.04) 1.4px, transparent 1.4px)",
                              backgroundSize: "14px 14px",
                              pointerEvents: "none",
                              opacity: isSent ? 0.2 : 0.5,
                            }}
                          />

                          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 10 }}>
                            <CategoryBadge category={card.category} color={isSent ? "#6a6a78" : color} />
                          </div>

                          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 10 }}>
                            <ArtDisc id={card.id} color={color} size={62} muted={isSent} />
                          </div>

                          <div
                            style={{
                              position: "relative",
                              fontFamily: "'Black Han Sans', sans-serif",
                              fontSize: 17,
                              letterSpacing: 1.8,
                              textTransform: "uppercase",
                              color: isSent ? "var(--textd)" : "white",
                              textAlign: "center",
                              marginBottom: 8,
                              textShadow: isSent ? "none" : `0 2px 8px rgba(0,0,0,.6)`,
                            }}
                          >
                            {card.label}
                          </div>

                          <div
                            style={{
                              position: "relative",
                              fontSize: 11.5,
                              color: isSent ? "var(--textdd)" : "var(--textd)",
                              lineHeight: 1.55,
                              textAlign: "center",
                              fontStyle: "italic",
                              padding: "8px 10px",
                              background: isSent ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.32)",
                              border: `1px solid ${isSent ? "var(--border)" : hexToRgba(color, 0.18)}`,
                              borderRadius: 8,
                            }}
                          >
                            <span style={{ color: isSent ? "var(--textdd)" : color, fontWeight: 900, fontStyle: "normal", marginRight: 2 }}>{"\u201C"}</span>
                            {card.clueText}
                            <span style={{ color: isSent ? "var(--textdd)" : color, fontWeight: 900, fontStyle: "normal", marginLeft: 2 }}>{"\u201D"}</span>
                          </div>
                        </div>

                        {/* View details button */}
                        {!isSent && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedClue(card.id); }}
                            style={{
                              width: "100%",
                              padding: "9px 0",
                              border: "none",
                              borderTop: `1px solid ${hexToRgba(color, 0.25)}`,
                              background: `linear-gradient(180deg, rgba(0,0,0,.2), ${hexToRgba(color, 0.08)})`,
                              color: color,
                              fontFamily: "'Black Han Sans', sans-serif",
                              fontSize: 9,
                              letterSpacing: 2.5,
                              cursor: "pointer",
                              transition: "all .15s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                            onMouseOver={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                `linear-gradient(180deg, ${hexToRgba(color, 0.15)}, ${hexToRgba(color, 0.22)})`;
                            }}
                            onMouseOut={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                `linear-gradient(180deg, rgba(0,0,0,.2), ${hexToRgba(color, 0.08)})`;
                            }}
                          >
                            VIEW DETAILS <span style={{ fontSize: 11 }}>{"\u203A"}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Builder's progress photos */}
            {builderPhotos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 8,
                }}>
                  {architectFor?.name}&apos;s Progress
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                  {builderPhotos.sort((a, b) => a.round - b.round).map((p) => (
                    <div key={p._id} style={{
                      flexShrink: 0, borderRadius: "var(--brick-radius)",
                      overflow: "hidden", border: "2px solid var(--border)",
                    }}>
                      <img src={p.photoDataUrl} alt={`Round ${p.round}`} style={{ width: 120, height: 90, objectFit: "cover" }} />
                      <div style={{
                        textAlign: "center", padding: "4px 0", fontSize: 9,
                        fontWeight: 800, letterSpacing: 1, color: "var(--textd)",
                        background: "rgba(0,0,0,.3)",
                      }}>
                        ROUND {p.round}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BUILD SCREEN (build stage only, no chat) ═══ */}
        {isBuildStage && (
          <div style={{ padding: 16 }}>
            {/* Builder header: deliberately does NOT reveal the district name or
                art. The whole point of the build is that you don't know what
                you're building until the guess phase. You work from clues only. */}
            {me && builderFor && (
              <div style={{
                background: `${scenarioData.color}10`, border: `1px solid ${scenarioData.color}30`,
                borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 16,
                display: "flex", gap: 14, alignItems: "center",
              }}>
                <div style={{
                  flexShrink: 0, width: 64, height: 64, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${scenarioData.color}22`, border: `2px dashed ${scenarioData.color}66`,
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 34, color: scenarioData.color,
                }}>?</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 9, letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase" }}>
                    You are the builder
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: scenarioData.color, marginTop: 4 }}>
                    {builderFor.name} is sending you clues
                  </div>
                  <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 2 }}>
                    Read the clues below. Build with LEGO, then photograph. You will not know what it is until the reveal.
                  </div>
                </div>
              </div>
            )}

            {/* Received clues */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
              }}>
                Clues from your Architect
              </div>

              {cluesForMe.length === 0 ? (
                <div style={{
                  background: "rgba(255,255,255,.03)", border: "2px dashed var(--border)",
                  borderRadius: "var(--brick-radius)", padding: "28px 16px",
                  textAlign: "center", color: "var(--textd)", fontSize: 13,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u{1F4E8}"}</div>
                  Waiting for your architect to send a clue...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cluesForMe.sort((a, b) => a.round - b.round).map((clue) => {
                    const card = CLUE_CARDS.find((c) => c.id === clue.clueCardId);
                    if (!card) return null;
                    const color = CAT_COLORS[card.category];
                    const isCurrentRound = clue.round === currentRound;
                    return (
                      <div
                        key={clue._id}
                        style={{
                          background: isCurrentRound
                            ? `linear-gradient(180deg, ${hexToRgba(color, 0.14)}, rgba(10,10,16,.98))`
                            : `linear-gradient(180deg, ${hexToRgba(color, 0.05)}, rgba(12,12,20,.96))`,
                          border: `2px solid ${isCurrentRound ? color : hexToRgba(color, 0.35)}`,
                          borderRadius: 14,
                          overflow: "hidden",
                          transition: "all .3s",
                          boxShadow: isCurrentRound
                            ? `0 10px 28px ${hexToRgba(color, 0.4)}, 0 1px 0 rgba(255,255,255,.06) inset`
                            : `0 4px 12px rgba(0,0,0,.4)`,
                        }}
                      >
                        <div
                          style={{
                            background: `linear-gradient(180deg, ${color}, ${hexToRgba(color, 0.78)})`,
                            padding: "4px 0 8px",
                            position: "relative",
                            borderBottom: `1px solid ${hexToRgba(color, 0.6)}`,
                          }}
                        >
                          <StudRow color={color} count={4} />
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 12,
                              fontFamily: "'Black Han Sans', sans-serif",
                              fontSize: 9,
                              letterSpacing: 1.8,
                              color: "#0a0a12",
                              textTransform: "uppercase",
                            }}
                          >
                            Round {clue.round} {"\u00B7"} {card.category}
                          </span>
                          {isCurrentRound && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 10,
                                fontFamily: "'Black Han Sans', sans-serif",
                                fontSize: 9,
                                letterSpacing: 1.5,
                                color: "#0a0a12",
                                padding: "1px 7px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,.8)",
                              }}
                            >
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div style={{ padding: "14px 14px", display: "flex", gap: 14, alignItems: "center" }}>
                          <ArtDisc id={card.id} color={color} size={56} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: "'Black Han Sans', sans-serif",
                                fontSize: 17,
                                letterSpacing: 1.6,
                                textTransform: "uppercase",
                                color: "white",
                                marginBottom: 6,
                                textShadow: "0 2px 6px rgba(0,0,0,.5)",
                              }}
                            >
                              {card.label}
                            </div>
                            <div
                              style={{
                                fontSize: 13.5,
                                color: "var(--textd)",
                                fontStyle: "italic",
                                lineHeight: 1.6,
                              }}
                            >
                              <span style={{ color, fontWeight: 900, fontStyle: "normal", marginRight: 2 }}>{"\u201C"}</span>
                              {card.clueText}
                              <span style={{ color, fontWeight: 900, fontStyle: "normal", marginLeft: 2 }}>{"\u201D"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Camera / Photo: only active during build stage */}
            {isBuildStage && <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
              }}>
                {hasPhotoThisRound ? `Round ${currentRound} Photo Uploaded` : `Capture Round ${currentRound} Photo`}
              </div>

              {!cameraActive && !photo && !hasPhotoThisRound && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    className="lb lb-red"
                    style={{ width: "100%", fontSize: 13, padding: "14px 0" }}
                    onClick={startCam}
                  >
                    {"\u{1F4F7}"} {cameraError ? "RETRY CAMERA" : "TAKE PHOTO"}
                  </button>
                  {cameraError ? (
                    <div style={{
                      fontSize: 11, color: "#ff9e80",
                      background: "rgba(255,90,60,.08)",
                      border: "1px solid rgba(255,90,60,.25)",
                      borderRadius: 8, padding: "8px 10px", lineHeight: 1.45,
                    }}>
                      {cameraError}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: "var(--textdd)", textAlign: "center" }}>
                      Live camera only. Photos from your device files or photo library are not accepted.
                    </div>
                  )}
                </div>
              )}

              {cameraActive && (
                <div className="cam-area vis">
                  <div className="cam-viewport">
                    <video className="cam-video" ref={videoRef} autoPlay playsInline muted />
                  </div>
                  <div className="cam-ctrl">
                    <button className="lb lb-red" style={{ fontSize: 13, padding: "9px 18px" }} onClick={capturePhoto}>CAPTURE</button>
                    <button className="lb lb-ghost" style={{ fontSize: 12, padding: "9px 14px" }} onClick={stopCam}>Cancel</button>
                  </div>
                </div>
              )}

              {photo && (
                <div className="prev-area vis">
                  <div className="prev-wrap">
                    <img className="prev-img" src={photo} alt="Build" />
                    <div className="prev-badge">
                      {detecting ? "CHECKING..." : legoVerified ? "BUILD DETECTED" : "CAPTURED"}
                    </div>
                  </div>
                  {detecting && (
                    <div style={{ fontSize: 12, color: "var(--acc2)", fontWeight: 800, textAlign: "center" }}>
                      Verifying your build...
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="retake" onClick={() => { setPhoto(null); setLegoVerified(false); }}>
                      {"\u21BA"} retake
                    </button>
                    {legoVerified && (
                      <button className="lb lb-green" style={{ fontSize: 12, padding: "10px 20px" }} onClick={submitPhoto}>
                        UPLOAD ROUND {currentRound}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {hasPhotoThisRound && !photo && (
                <div style={{
                  background: "rgba(105,240,174,.06)", border: "1px solid rgba(105,240,174,.2)",
                  borderRadius: "var(--brick-radius)", padding: "12px 14px",
                  textAlign: "center", fontSize: 13, color: "var(--acc4)", fontWeight: 800,
                }}>
                  {"\u2713"} Photo uploaded for round {currentRound}
                </div>
              )}
            </div>}

            {/* My progress photos */}
            {myPhotos.length > 0 && (
              <div>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 8,
                }}>
                  Your Progress
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                  {myPhotos.sort((a, b) => a.round - b.round).map((p) => (
                    <div key={p._id} style={{
                      flexShrink: 0, borderRadius: "var(--brick-radius)",
                      overflow: "hidden", border: "2px solid var(--border)",
                    }}>
                      <img src={p.photoDataUrl} alt={`Round ${p.round}`} style={{ width: 100, height: 75, objectFit: "cover" }} />
                      <div style={{
                        textAlign: "center", padding: "3px 0", fontSize: 9,
                        fontWeight: 800, letterSpacing: 1, color: "var(--textd)",
                        background: "rgba(0,0,0,.3)",
                      }}>
                        R{p.round}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PAIR CHAT (clue stage only; build stage is heads-down building) ═══ */}
      {isClueStage && activePairKey && (
        <div style={{
          borderTop: "2px solid var(--border)",
          background: "var(--bg1)",
          display: "flex", flexDirection: "column",
          maxHeight: 300, flexShrink: 0,
        }}>
          {/* Tabbed chat header: each player has two partners (their builder
              and their architect), so two separate conversations. */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,.03)",
          }}>
            {hasBuilderPartner && (
              <TabButton
                active={effectiveChatTab === "toBuilder"}
                onClick={() => setChatTab("toBuilder")}
                label={`To Builder${architectFor?.name ? ": " + architectFor.name : ""}`}
                count={(archMsgs ?? []).length}
                unread={unreadToBuilder}
                accent="var(--acc1)"
              />
            )}
            {hasArchitectPartner && (
              <TabButton
                active={effectiveChatTab === "toArchitect"}
                onClick={() => setChatTab("toArchitect")}
                label={`To Architect${builderFor?.name ? ": " + builderFor.name : ""}`}
                count={(buildMsgs ?? []).length}
                unread={unreadToArchitect}
                accent="var(--acc2)"
              />
            )}
          </div>

          {/* Partner sub-label + anonymity hint */}
          <div style={{
            padding: "6px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,.02)",
          }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 9, letterSpacing: 2,
              color: effectiveChatTab === "toBuilder" ? "var(--acc1)" : "var(--acc2)",
              textTransform: "uppercase",
            }}>
              {"\u{1F4AC}"} {effectiveChatTab === "toBuilder"
                ? `You are sending clues to ${partnerName ?? "your builder"}`
                : `${partnerName ?? "your architect"} is sending clues to you`}
            </div>
            <div style={{ fontSize: 9, color: "var(--textdd)", fontWeight: 800, letterSpacing: 1 }}>
              ANONYMOUS
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatMsgsRef}
            className="chat-msgs"
            style={{ flex: 1, maxHeight: 160, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}
          >
            {(activeMessages ?? []).length === 0 && (
              <div style={{ textAlign: "center", color: "var(--textdd)", fontSize: 12, padding: "20px 0" }}>
                No messages yet. Say hi. Your partner is anonymous.
              </div>
            )}
            {(activeMessages ?? [])
              .slice()
              .sort((a, b) => a._creationTime - b._creationTime)
              .map((msg) => {
                const isMe = !!(me && msg.senderId === me._id);
                return (
                  <div key={msg._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "78%", borderRadius: 10, padding: "7px 11px",
                      background: isMe ? "rgba(255,215,0,.14)" : "rgba(255,255,255,.07)",
                      border: `1px solid ${isMe ? "rgba(255,215,0,.3)" : "var(--border)"}`,
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: isMe ? "var(--acc1)" : "var(--textd)", marginBottom: 2, textTransform: "uppercase" }}>
                        {isMe ? myLabel : theirLabel}
                      </div>
                      <div style={{ fontSize: 13, color: "white", wordBreak: "break-word" }}>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Taboo words: sits directly above the chat box on the "to builder"
              tab so the architect cannot miss it while typing. Words come from
              the district name of the builder they are guiding — saying any of
              these in chat would give away the district. Never rendered on the
              "to architect" tab (the builder must not see this list). */}
          {effectiveChatTab === "toBuilder" && bannedWords.length > 0 && (
            <div style={{
              padding: "10px 12px",
              background: typedBanned.length > 0 ? "rgba(255,112,67,.18)" : "rgba(255,112,67,.1)",
              borderTop: "2px solid var(--acc3)",
              transition: "background .2s",
            }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 10, fontWeight: 900, letterSpacing: 2,
                color: "var(--acc3)", marginBottom: 6,
                textTransform: "uppercase",
              }}>
                {typedBanned.length > 0
                  ? `\u26A0 DON'T SEND. YOU USED: ${typedBanned.join(", ").toUpperCase()}`
                  : `\u{1F6AB} TABOO (would reveal the district)`}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {bannedWords.map((w) => {
                  const hit = typedBanned.includes(w);
                  return (
                    <span key={w} style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 4,
                      background: hit ? "rgba(255,112,67,.32)" : "rgba(255,112,67,.14)",
                      border: `1px solid ${hit ? "var(--acc3)" : "rgba(255,112,67,.4)"}`,
                      color: hit ? "#fff" : "var(--acc3)",
                      fontWeight: hit ? 900 : 800,
                      textDecoration: hit ? "line-through" : "none",
                    }}>
                      {w}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input row */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendChat(activePairKey); }}
            style={{ display: "flex", gap: 8, padding: "8px 12px 12px", borderTop: "1px solid var(--border)" }}
          >
            <input
              className="chat-input"
              type="text"
              placeholder={effectiveChatTab === "toBuilder" ? `Message ${architectFor?.name ?? "your builder"}\u2026` : `Message ${builderFor?.name ?? "your architect"}\u2026`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1 }}
              autoComplete="off"
            />
            <button
              type="submit"
              className="lb lb-yellow"
              style={{ fontSize: 10, padding: "8px 14px" }}
              disabled={!chatInput.trim()}
            >
              SEND
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function TabButton({
  active, onClick, label, count, unread, accent,
}: {
  active: boolean; onClick: () => void; label: string; count: number; unread: number; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "10px 10px",
        background: active ? `${accent}15` : "transparent",
        borderTop: "none", borderLeft: "none", borderRight: "none",
        borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
        color: active ? accent : "var(--textd)",
        fontFamily: "'Black Han Sans', sans-serif",
        fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
        cursor: "pointer", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background .15s, color .15s",
        minWidth: 0,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        fontSize: 9, color: active ? accent : "var(--textdd)",
        background: active ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.04)",
        padding: "1px 6px", borderRadius: 8, fontWeight: 800,
      }}>
        {count}
      </span>
      {unread > 0 && !active && (
        <span style={{
          position: "absolute", top: 4, right: 4,
          minWidth: 16, height: 16, padding: "0 5px",
          background: "var(--acc3)", color: "#0a0a12",
          borderRadius: 8, fontSize: 9, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {unread}
        </span>
      )}
    </button>
  );
}
