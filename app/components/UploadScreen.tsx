"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CARDS, SCENARIOS } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";
import CardIcon from "./CardIcon";

// ── Shape silhouette SVG paths ──
// These define the outline shown on camera/preview
const SHAPE_PATHS: Record<string, { path: string; viewBox: string; label: string }> = {
  "tall-narrow": {
    path: "M35 10 L55 10 Q60 10 60 15 L60 85 Q60 90 55 90 L35 90 Q30 90 30 85 L30 15 Q30 10 35 10 Z",
    viewBox: "0 0 90 100",
    label: "TALL",
  },
  "wide-flat": {
    path: "M10 35 L80 35 Q85 35 85 40 L85 65 Q85 70 80 70 L10 70 Q5 70 5 65 L5 40 Q5 35 10 35 Z",
    viewBox: "0 0 90 100",
    label: "WIDE",
  },
  "enclosed-square": {
    path: "M20 20 L70 20 Q75 20 75 25 L75 75 Q75 80 70 80 L20 80 Q15 80 15 75 L15 25 Q15 20 20 20 Z M30 30 L60 30 L60 70 L30 70 Z",
    viewBox: "0 0 90 100",
    label: "ENCLOSED",
  },
  "long-horizontal": {
    path: "M5 38 L85 38 Q90 38 90 43 L90 57 Q90 62 85 62 L5 62 Q0 62 0 57 L0 43 Q0 38 5 38 Z",
    viewBox: "0 0 90 100",
    label: "LONG",
  },
  "tapered-peak": {
    path: "M45 10 L60 35 L65 85 Q65 90 60 90 L30 90 Q25 90 25 85 L30 35 Z",
    viewBox: "0 0 90 100",
    label: "TAPERED",
  },
  "open-organic": {
    path: "M45 15 Q65 15 70 30 Q80 45 70 60 Q65 75 50 80 Q35 85 25 70 Q15 55 20 40 Q25 25 45 15 Z",
    viewBox: "0 0 90 100",
    label: "OPEN",
  },
  "compact-dense": {
    path: "M30 25 L60 25 Q65 25 65 30 L65 70 Q65 75 60 75 L30 75 Q25 75 25 70 L25 30 Q25 25 30 25 Z",
    viewBox: "0 0 90 100",
    label: "COMPACT",
  },
  "gateway-opening": {
    path: "M20 15 L40 15 Q42 15 42 17 L42 55 Q45 70 48 55 L48 17 Q48 15 50 15 L70 15 Q75 15 75 20 L75 85 Q75 90 70 90 L20 90 Q15 90 15 85 L15 20 Q15 15 20 15 Z",
    viewBox: "0 0 90 100",
    label: "GATEWAY",
  },
};

function ShapeOverlay({ shape, color }: { shape: string; color: string }) {
  const s = SHAPE_PATHS[shape];
  if (!s) return null;
  return (
    <div className="shape-overlay">
      <svg viewBox={s.viewBox} className="shape-svg" preserveAspectRatio="xMidYMid meet">
        <path
          d={s.path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="8 4"
          opacity=".7"
        />
      </svg>
      <div className="shape-label" style={{ color }}>
        {s.label}
      </div>
    </div>
  );
}

export default function UploadScreen() {
  const { playerId, myCard, sessionCode, scenario, set, goTo } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const uploadDistrict = useMutation(api.game.uploadDistrict);

  const scenarioData = SCENARIOS.find((s) => s.id === (scenario || session?.scenario)) || SCENARIOS[0];
  const districtName = myCard ? scenarioData.districtNames[myCard.id] : "";

  const [mode, setMode] = useState<"camera" | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [distName, setDistName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canSubmit = photo && distName.trim().length > 0;

  function selectCamera() {
    setMode("camera");
    setPhoto(null);
    startCam();
  }

  async function startCam() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      toast("Camera access denied. Please allow camera permissions and try again.");
      setMode(null);
    }
  }

  function stopCam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function capturePhoto() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.85));
    stopCam();
    setMode(null);
  }


  async function handleSubmit() {
    if (!playerId || !photo) return;
    const finalName = distName.trim();
    set({ distName: finalName, photo });
    stopCam();
    await uploadDistrict({
      playerId,
      districtName: finalName,
      photoDataUrl: photo,
    });
    toast("District transmitted \u2713");
    goTo("s-city");
  }

  return (
    <div className="screen active stud-bg-subtle" id="s-upload">
      <BrandBar backTo="s-build">
        <PhaseBar current={3} />
      </BrandBar>
      <div className="up-inner">
        <div style={{ textAlign: "center", width: "100%" }}>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 5 }}>
            TRANSMIT YOUR DISTRICT
          </div>
          {myCard && (
            <div className="up-card-reminder" style={{ borderColor: myCard.color + "44" }}>
              <span style={{ color: myCard.color }}><CardIcon icon={myCard.icon} size={16} /> {myCard.title}</span>
              <span className="up-card-shape">{myCard.shapeHint.split(".")[0]}</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 6 }}>
            Position your LEGO build to fit the shape outline, then capture
          </div>
        </div>

        <div className="up-opts">
          <div
            className={`up-opt${mode === "camera" ? " act" : ""}`}
            onClick={selectCamera}
          >
            <div className="up-icon">{"\u{1F4F7}"}</div>
            <div className="up-lbl">Camera</div>
            <div className="up-sub">Webcam or phone</div>
          </div>
        </div>

        {mode === "camera" && (
          <div className="cam-area vis">
            <div className="cam-viewport">
              <video className="cam-video" ref={videoRef} autoPlay playsInline muted />
              {myCard && (
                <ShapeOverlay shape={myCard.shape} color={myCard.color} />
              )}
            </div>
            <div className="cam-ctrl">
              <button className="lb lb-red" style={{ fontSize: 13, padding: "9px 18px" }} onClick={capturePhoto}>
                CAPTURE
              </button>
              <button className="lb lb-ghost" style={{ fontSize: 12, padding: "9px 14px" }} onClick={() => { stopCam(); setMode(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}



        <canvas ref={canvasRef} style={{ display: "none" }} />

        {photo && (
          <div className="prev-area vis">
            <div className="prev-wrap">
              <img className="prev-img" src={photo} alt="District" />
              {myCard && (
                <ShapeOverlay shape={myCard.shape} color={myCard.color} />
              )}
              <div className="prev-badge">CAPTURED &#10003;</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="retake" onClick={() => setPhoto(null)}>
                {"\u21BA"} retake
              </button>
              <button className="retake" onClick={selectCamera}>
                {"\u{1F4F7}"} new capture
              </button>
            </div>
          </div>
        )}

        <div style={{ width: "100%" }}>
          <label className="field-lbl" htmlFor="dist-name">District name</label>
          <input
            className="linput"
            id="dist-name"
            type="text"
            placeholder={districtName || "Name your district\u2026"}
            maxLength={32}
            value={distName}
            onChange={(e) => setDistName(e.target.value)}
          />
          <div className="anon-pill" style={{ marginTop: 9 }}>Anonymous until the reveal</div>
        </div>

        <button
          className="lb lb-green"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{ width: "100%" }}
        >
          TRANSMIT TO CITY MAP &rarr;
        </button>
      </div>
    </div>
  );
}
