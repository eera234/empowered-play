"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import PhaseBar from "./PhaseBar";

export default function UploadScreen() {
  const { playerId, set, goTo } = useGame();
  const uploadDistrict = useMutation(api.game.uploadDistrict);

  const [mode, setMode] = useState<"camera" | "file" | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [distName, setDistName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = photo && distName.trim().length > 0;

  function selectMode(m: "camera" | "file") {
    setMode(m);
    setPhoto(null);
    if (m === "camera") startCam();
    else stopCam();
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
      toast("Camera denied. Using file upload.");
      setMode("file");
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

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setPhoto(ev.target?.result as string);
    r.readAsDataURL(f);
    setMode(null);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (ev) => setPhoto(ev.target?.result as string);
    r.readAsDataURL(f);
    setMode(null);
  }

  async function handleSubmit() {
    if (!playerId || !photo) return;
    const name = distName.trim();
    set({ distName: name, photo });
    stopCam();
    await uploadDistrict({
      playerId,
      districtName: name,
      photoDataUrl: photo,
    });
    toast("District transmitted \u2713");
    goTo("s-city");
  }

  return (
    <div className="screen active" id="s-upload">
      <BrandBar backTo="s-build">
        <PhaseBar current={3} />
      </BrandBar>
      <div className="up-inner">
        <div style={{ textAlign: "center", width: "100%" }}>
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 5 }}>
            TRANSMIT YOUR DISTRICT
          </div>
          <div style={{ fontSize: 13, color: "var(--textd)" }}>
            Anonymous until the reveal phase
          </div>
        </div>

        <div className="up-opts">
          <div
            className={`up-opt${mode === "camera" ? " act" : ""}`}
            onClick={() => selectMode("camera")}
          >
            <div className="up-icon">📷</div>
            <div className="up-lbl">Camera</div>
            <div className="up-sub">Webcam or phone</div>
          </div>
          <div
            className={`up-opt${mode === "file" ? " act" : ""}`}
            onClick={() => selectMode("file")}
          >
            <div className="up-icon">📁</div>
            <div className="up-lbl">Upload</div>
            <div className="up-sub">From gallery</div>
          </div>
        </div>

        {mode === "camera" && (
          <div className="cam-area vis">
            <video className="cam-video" ref={videoRef} autoPlay playsInline muted />
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

        {mode === "file" && (
          <div
            className="drop-zone vis"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="dz-icon">📦</div>
            <div className="dz-text">Tap to browse or drag &amp; drop</div>
            <div className="dz-sub">JPG, PNG, HEIC &mdash; phone photo works</div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {photo && (
          <div className="prev-area vis">
            <div className="prev-wrap">
              <img className="prev-img" src={photo} alt="District" />
              <div className="prev-badge">CAPTURED &check;</div>
            </div>
            <button className="retake" onClick={() => setPhoto(null)}>
              ↺ retake
            </button>
          </div>
        )}

        <div style={{ width: "100%" }}>
          <label className="field-lbl" htmlFor="dist-name">Name your district</label>
          <input
            className="linput"
            id="dist-name"
            type="text"
            placeholder="e.g. The Crossing, Signal Tower\u2026"
            maxLength={32}
            value={distName}
            onChange={(e) => setDistName(e.target.value)}
          />
          <div className="anon-pill" style={{ marginTop: 9 }}>🔒 Anonymous until city reveal</div>
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
