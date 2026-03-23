"use client";

import { useState, useRef } from "react";

interface VoiceRecorderProps {
  onRecorded: (audioDataUrl: string) => void;
}

export default function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) onRecorded(reader.result as string);
        };
        reader.readAsDataURL(blob);
        cleanup();
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= 30) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      // Mic denied — fail silently
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setRecording(false);
  }

  function cleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setDuration(0);
  }

  if (recording) {
    return (
      <div className="vr-recording">
        <div className="vr-pulse" />
        <div className="vr-time">{duration}s</div>
        <button className="vr-stop" onClick={stopRecording}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        </button>
        <button className="vr-cancel" onClick={cancelRecording}>
          &times;
        </button>
      </div>
    );
  }

  return (
    <button className="vr-btn" onClick={startRecording} title="Record voice note">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="5" y="1" width="4" height="8" rx="2" fill="currentColor" />
        <path d="M3 6.5a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="11" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
