"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CLUE_CARDS, PAIR_BUILD_ROUNDS, SCENARIOS } from "../../lib/constants";
import { playSound } from "../../lib/sound";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { pickPhotoFile } from "./cameraFallback";

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

  if (!deadline) return null;
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
  const detectBlocks = useAction(api.detectLego.detectBuildingBlocks);

  // UI state
  const [tab, setTab] = useState<"architect" | "builder">("builder");
  const [selectedClue, setSelectedClue] = useState<string | null>(null);
  const [expandedClue, setExpandedClue] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  // One-shot onboarding overlay. Auto-dismisses after 5 seconds so players
  // who understand the roles don't get blocked, but explicit SKIP is also
  // available for anyone who wants to dive in. Component state only — this
  // shows on every mount (including rejoin) which is intentional; it's a
  // short read and remote players may have joined after the previous round.
  const [showIntro, setShowIntro] = useState(true);
  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(t);
  }, [showIntro]);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
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

  // ── Auto-advance when timer expires ──
  // Guard ref prevents multiple calls from the same client for the same (round, stage).
  // Server-side fromRound+fromStage guard prevents races across clients.
  const advancedForKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const deadline = session?.subPhaseDeadline;
    if (!sessionId || !deadline || session?.phase !== "pair_build") return;
    const roundAtStart = currentRound;
    const stageAtStart = currentStage;
    const key = `${roundAtStart}:${stageAtStart}`;
    if (advancedForKeyRef.current === key) return;

    const doAdvance = () => {
      advancedForKeyRef.current = key;
      // During build stage: auto-submit any captured-but-unsent photo so the builder's work isn't lost
      if (stageAtStart === "build" && photo && playerId && !hasPhotoThisRound) {
        uploadBuildPhoto({ sessionId, playerId, round: roundAtStart, photoDataUrl: photo }).catch(() => {});
        setPhoto(null);
        setLegoVerified(false);
      }
      advanceSubPhase({ sessionId, fromRound: roundAtStart, fromStage: stageAtStart }).catch(() => {});
      if (stageAtStart === "clue") {
        toast(`Time's up — everyone start building!`);
      } else {
        toast(roundAtStart < 3 ? `Time's up — next round's clues coming` : "Time's up — moving to The Guess");
      }
    };

    const msLeft = deadline - Date.now();
    if (msLeft <= 0) { doAdvance(); return; }
    const t = setTimeout(doAdvance, msLeft);
    return () => clearTimeout(t);
  }, [session?.subPhaseDeadline, session?.phase, currentRound, currentStage, sessionId, advanceSubPhase, photo, playerId, hasPhotoThisRound, uploadBuildPhoto]);

  // ── Auto-switch tab based on stage ──
  // clue stage → architect tab; build stage → builder tab
  const lastStageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || session.phase !== "pair_build") return;
    const stageKey = `${currentRound}:${currentStage}`;
    if (lastStageRef.current === stageKey) return;
    lastStageRef.current = stageKey;
    setTab(isClueStage ? "architect" : "builder");
  }, [currentRound, currentStage, session, isClueStage]);

  // ── Camera ──
  async function startCam() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraActive(true);
    } catch (err) {
      // iOS Safari + many mobile browsers reject getUserMedia in non-HTTPS or
      // in-app browser contexts. Fall back to the native file picker (which
      // on iOS surfaces "Take Photo" anyway) so the player is never stuck.
      const name = (err as { name?: string } | null)?.name;
      if (name === "NotFoundError" || name === "OverconstrainedError") {
        toast("No camera found. Tap UPLOAD PHOTO instead.");
      } else if (name === "NotAllowedError" || name === "SecurityError") {
        toast("Camera blocked — using photo upload instead.");
        await handleUploadFallback();
        return;
      } else {
        toast("Camera unavailable — use UPLOAD PHOTO instead.");
      }
      setCameraActive(false);
    }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }
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
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    stopCam();
    await processCapturedDataUrl(dataUrl);
  }
  async function handleUploadFallback() {
    const dataUrl = await pickPhotoFile();
    if (!dataUrl) return;
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

  const activePairKey = tab === "architect" ? pairKeyAsArchitect : pairKeyAsBuilder;
  const activeMessages = tab === "architect" ? archMsgs : buildMsgs;
  const myLabel = tab === "architect" ? "You (Architect)" : "You (Builder)";
  const theirLabel = tab === "architect" ? "Builder" : "Architect";

  // Expanded clue data
  const expandedClueData = expandedClue ? CLUE_CARDS.find((c) => c.id === expandedClue) : null;

  // ── Facilitator dashboard view (replaces player UI) ──
  if (role === "facilitator") {
    const nonFacPlayers = (players ?? []).filter((p) => !p.isFacilitator);
    const architectsWithPairs = nonFacPlayers.filter((p) => p.architectFor);
    const clueSentThisRound = (sentClues ?? []).filter((c) => c.round === currentRound);
    const clueSentByArchitect = new Set(clueSentThisRound.map((c) => c.architectId));
    const photosThisRound = (buildPhotos ?? []).filter((p) => p.round === currentRound);
    const photoByPlayer = new Set(photosThisRound.map((p) => p.playerId));

    async function handleSkipStage() {
      if (!sessionId) return;
      await advanceSubPhase({ sessionId, fromRound: currentRound, fromStage: currentStage });
      toast(isClueStage ? "Skipped to build stage" : `Skipped to round ${currentRound + 1}`);
    }

    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
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
          <button
            className="lb lb-yellow"
            style={{ fontSize: 11, padding: "8px 14px" }}
            onClick={handleSkipStage}
          >
            {isClueStage
              ? "SKIP TO BUILD \u2192"
              : currentRound < 3 ? `SKIP TO ROUND ${currentRound + 1} \u2192` : "FINISH \u2192 GUESS"}
          </button>
        </div>
      </div>
    );
  }

  // Player with no pairing (shouldn't happen in normal flow, but guards against stale state)
  if (me && !architectFor && !builderFor) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
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
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
      <BrandBar />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Architect/Builder onboarding overlay (auto-dismisses after 5s) ── */}
      {showIntro && role === "player" && (
        <div
          onClick={() => setShowIntro(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(6,6,26,.94)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, zIndex: 500, cursor: "pointer",
            animation: "fadeIn .3s ease-out",
          }}
        >
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, letterSpacing: 2,
              color: "var(--acc1)", marginBottom: 20,
            }}>
              PAIR BUILD
            </div>
            <div style={{
              background: "rgba(255,215,0,.08)", border: "1px solid rgba(255,215,0,.3)",
              borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 12, textAlign: "left",
            }}>
              <div style={{ fontSize: 11, color: "var(--acc1)", fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
                {"\u{1F3A8}"} YOU ARE THE ARCHITECT
              </div>
              <div style={{ fontSize: 13, color: "white", lineHeight: 1.5 }}>
                You know what&apos;s being built. Send clue cards and chat so your builder can
                recreate it without ever seeing the answer.
              </div>
            </div>
            <div style={{
              background: "rgba(79,195,247,.08)", border: "1px solid rgba(79,195,247,.3)",
              borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 16, textAlign: "left",
            }}>
              <div style={{ fontSize: 11, color: "var(--acc2)", fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
                {"\u{1F9F1}"} YOU ARE THE BUILDER
              </div>
              <div style={{ fontSize: 13, color: "white", lineHeight: 1.5 }}>
                Someone else is guiding you. Read their clues, ask anything in chat, then build with LEGO
                and photograph each round when the timer runs.
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--textd)", marginBottom: 12 }}>
              Most rounds you play both roles &mdash; one for your pair, one for someone else&apos;s.
            </div>
            <button
              className="lb lb-yellow"
              onClick={(e) => { e.stopPropagation(); setShowIntro(false); }}
              style={{ padding: "10px 32px", fontSize: 13 }}
            >
              GOT IT {"\u2192"}
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
              <div className="card-modal-title" style={{ color: CAT_COLORS[expandedClueData.category] }}>
                {expandedClueData.label}
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl">WHAT YOUR BUILDER WILL SEE</div>
                <div className="card-modal-rule" style={{ fontSize: 16, lineHeight: 2, fontStyle: "italic" }}>
                  &ldquo;{expandedClueData.clueText}&rdquo;
                </div>
              </div>
              <div className="card-modal-section">
                <div className="card-modal-section-lbl card-modal-hr-lbl">STRATEGY TIP</div>
                <div className="card-modal-hr">
                  {expandedClueData.category === "shape"
                    ? "Shape clues directly describe the physical form. Best for round 1 to establish the basic structure."
                    : expandedClueData.category === "feel"
                      ? "Feel clues describe mood and function. Best for round 2 to refine the builder's approach."
                      : "Story clues describe narrative purpose. Best for round 3 to give the builder context about what they've been making."}
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
          {isClueStage ? "\u{1F3A8} CLUE STAGE \u2014 Architects pick a clue" : "\u{1F9F1} BUILD STAGE \u2014 Builders build!"}
        </div>
        <Timer deadline={session?.subPhaseDeadline} />
      </div>

      {/* ── Tab toggle (only the active stage's tab is enabled) ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setTab("architect")}
          disabled={isBuildStage}
          style={{
            flex: 1, padding: "12px 0", border: "none", background: "none",
            cursor: isBuildStage ? "not-allowed" : "pointer",
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
            color: tab === "architect" ? "var(--acc1)" : "var(--textd)",
            borderBottom: tab === "architect" ? "2px solid var(--acc1)" : "2px solid transparent",
            opacity: isBuildStage ? 0.4 : 1,
            transition: "all .15s",
          }}
        >
          {"\u{1F3A8}"} GIVE CLUES {isClueStage && "\u25CF"}
        </button>
        <button
          onClick={() => setTab("builder")}
          disabled={isClueStage}
          style={{
            flex: 1, padding: "12px 0", border: "none", background: "none",
            cursor: isClueStage ? "not-allowed" : "pointer",
            fontFamily: "'Black Han Sans', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
            color: tab === "builder" ? "var(--acc2)" : "var(--textd)",
            borderBottom: tab === "builder" ? "2px solid var(--acc2)" : "2px solid transparent",
            opacity: isClueStage ? 0.4 : 1,
            transition: "all .15s",
          }}
        >
          {"\u{1F9F1}"} BUILD {isBuildStage && "\u25CF"}
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ═══ ARCHITECT TAB ═══ */}
        {tab === "architect" && (
          <div style={{ padding: 16 }}>
            {/* Who they're building for */}
            {architectFor && (
              <div style={{
                background: `${scenarioData.color}10`, border: `1px solid ${scenarioData.color}30`,
                borderRadius: "var(--brick-radius)", padding: "14px 16px", marginBottom: 16,
              }}>
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
                  Switch to the BUILD tab to work on your own build. You&apos;ll see your builder&apos;s photo below when it arrives.
                </div>
              </div>
            )}

            {/* Selected clue confirmation */}
            {selectedClue && !sentThisRound && isClueStage && (() => {
              const card = CLUE_CARDS.find((c) => c.id === selectedClue);
              if (!card) return null;
              return (
                <div style={{
                  background: `${CAT_COLORS[card.category]}10`, border: `2px solid ${CAT_COLORS[card.category]}44`,
                  borderRadius: "var(--brick-radius)", padding: 16, marginBottom: 16,
                }}>
                  <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 9, letterSpacing: 2, color: CAT_COLORS[card.category], textTransform: "uppercase", marginBottom: 6 }}>
                    SELECTED CLUE
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 13, color: "var(--textd)", fontStyle: "italic", marginBottom: 12 }}>
                    &ldquo;{card.clueText}&rdquo;
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
              );
            })()}

            {/* Clue card grid — only during clue stage, only if not yet sent */}
            {!sentThisRound && isClueStage && (
              <div>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
                }}>
                  Choose a clue card to send (Round {currentRound})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
                          background: isSent ? "rgba(255,255,255,.02)" : isSelected ? `${color}15` : "rgba(255,255,255,.04)",
                          border: `2px solid ${isSent ? "var(--border)" : isSelected ? color : "var(--border)"}`,
                          borderRadius: "var(--brick-radius)",
                          padding: 0,
                          cursor: isSent ? "default" : "pointer",
                          opacity: isSent ? 0.35 : 1,
                          transition: "all .15s",
                          overflow: "hidden",
                          position: "relative",
                          boxShadow: isSelected ? `0 0 16px ${color}30` : "var(--brick-shadow)",
                        }}
                      >
                        {/* Card header band */}
                        <div style={{
                          background: isSent ? "rgba(255,255,255,.05)" : color,
                          padding: "6px 10px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{
                            fontFamily: "'Black Han Sans', sans-serif", fontSize: 9,
                            letterSpacing: 1.5, color: isSent ? "var(--textd)" : "#0a0a12",
                            textTransform: "uppercase",
                          }}>
                            {card.category}
                          </span>
                          {isSent && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "var(--acc4)" }}>SENT</span>}
                          {isSelected && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#0a0a12" }}>SELECTED</span>}
                        </div>

                        {/* Card body */}
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: isSent ? "var(--textd)" : "white", marginBottom: 4 }}>
                            {card.label}
                          </div>
                          <div style={{ fontSize: 11, color: isSent ? "var(--textdd)" : "var(--textd)", lineHeight: 1.6 }}>
                            {card.clueText}
                          </div>
                        </div>

                        {/* View details */}
                        {!isSent && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedClue(card.id); }}
                            style={{
                              width: "100%", padding: "8px 0", border: "none",
                              borderTop: "1px solid var(--border)", background: "rgba(255,255,255,.03)",
                              color: "var(--textd)", fontFamily: "'Black Han Sans', sans-serif",
                              fontSize: 9, letterSpacing: 2, cursor: "pointer",
                              transition: "all .15s",
                            }}
                            onMouseOver={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.08)"; }}
                            onMouseOut={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.03)"; }}
                          >
                            VIEW DETAILS
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

        {/* ═══ BUILDER TAB ═══ */}
        {tab === "builder" && (
          <div style={{ padding: 16 }}>
            {/* Clue-stage lock notice */}
            {isClueStage && (
              <div style={{
                background: "rgba(255,215,0,.06)", border: "1px solid rgba(255,215,0,.25)",
                borderRadius: "var(--brick-radius)", padding: "18px 16px", marginBottom: 16,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{"\u23F3"}</div>
                <div style={{ fontSize: 13, color: "var(--acc1)", fontWeight: 800, marginBottom: 4 }}>
                  Hold on &mdash; architects are picking clues.
                </div>
                <div style={{ fontSize: 11, color: "var(--textd)", lineHeight: 1.6 }}>
                  You can&apos;t build yet. Once every architect sends their clue (or the clue timer runs out), the build stage starts.
                </div>
                <div style={{ fontSize: 10, color: "var(--acc2)", marginTop: 8, fontStyle: "italic" }}>
                  {"\u{1F4AC}"} Chat with your architect is open the whole round {"\u2014"} scroll down.
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
                      <div key={clue._id} style={{
                        background: isCurrentRound ? `${color}10` : "rgba(255,255,255,.03)",
                        border: `2px solid ${isCurrentRound ? `${color}44` : "var(--border)"}`,
                        borderRadius: "var(--brick-radius)", overflow: "hidden",
                        transition: "all .3s",
                      }}>
                        <div style={{
                          background: color, padding: "6px 12px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{
                            fontFamily: "'Black Han Sans', sans-serif", fontSize: 9,
                            letterSpacing: 1.5, color: "#0a0a12", textTransform: "uppercase",
                          }}>
                            Round {clue.round} {"\u00B7"} {card.category}
                          </span>
                          {isCurrentRound && (
                            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#0a0a12" }}>CURRENT</span>
                          )}
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{card.label}</div>
                          <div style={{ fontSize: 14, color: "var(--textd)", fontStyle: "italic", lineHeight: 1.7 }}>
                            &ldquo;{card.clueText}&rdquo;
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Camera / Photo — only active during build stage */}
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
                    {"\u{1F4F7}"} OPEN CAMERA
                  </button>
                  <button
                    className="lb lb-ghost"
                    style={{ width: "100%", fontSize: 11, padding: "10px 0" }}
                    onClick={handleUploadFallback}
                  >
                    UPLOAD PHOTO INSTEAD
                  </button>
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

      {/* ═══ PAIR CHAT (always visible) ═══ */}
      {activePairKey && (
        <div style={{
          borderTop: "2px solid var(--border)",
          background: "var(--bg1)",
          display: "flex", flexDirection: "column",
          maxHeight: 240, flexShrink: 0,
        }}>
          {/* Chat header — shows who you're chatting with (anonymous) */}
          <div style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,.03)",
          }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              color: "var(--acc1)", textTransform: "uppercase",
            }}>
              {"\u{1F4AC}"} Chat with your {tab === "architect" ? "Builder" : "Architect"}
            </div>
            <div style={{ fontSize: 9, color: "var(--textdd)", fontWeight: 800, letterSpacing: 1 }}>
              ANONYMOUS {"\u00B7"} {(activeMessages ?? []).length} MSG
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
                No messages yet. Say hi {"\u2014"} your partner is anonymous.
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

          {/* Input row */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendChat(activePairKey); }}
            style={{ display: "flex", gap: 8, padding: "8px 12px 12px", borderTop: "1px solid var(--border)" }}
          >
            <input
              className="chat-input"
              type="text"
              placeholder={`Message your ${tab === "architect" ? "builder" : "architect"}\u2026`}
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
