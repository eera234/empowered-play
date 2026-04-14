"use client";

import { useRef, useState, useCallback } from "react";

// Keywords that suggest LEGO / building blocks in MobileNet's ImageNet labels
const LEGO_KEYWORDS = [
  "lego", "block", "toy", "brick", "building", "castle", "tower",
  "puzzle", "jigsaw", "container", "crate", "box", "carton",
  "plastic", "duplo", "construction", "miniature", "model",
];

// Confidence threshold — lower = more lenient
const CONFIDENCE_THRESHOLD = 0.08;

interface DetectionResult {
  isLego: boolean;
  label: string;
  confidence: number;
}

export function useLegoDetector() {
  const modelRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return;
    setLoading(true);
    try {
      // Dynamic imports to avoid SSR issues
      const tf = await import("@tensorflow/tfjs");
      const mobilenet = await import("@tensorflow-models/mobilenet");
      await tf.ready();
      modelRef.current = await mobilenet.load({ version: 2, alpha: 0.5 });
      setReady(true);
    } catch (err) {
      console.error("Failed to load MobileNet:", err);
    }
    setLoading(false);
  }, []);

  const detect = useCallback(async (imgElement: HTMLImageElement): Promise<DetectionResult> => {
    if (!modelRef.current) {
      return { isLego: true, label: "model not loaded", confidence: 0 };
    }

    try {
      const predictions = await modelRef.current.classify(imgElement, 10);
      console.log("MobileNet predictions:", predictions);

      // Check if any top prediction matches LEGO-related keywords
      for (const pred of predictions) {
        const label = pred.className.toLowerCase();
        const matchesKeyword = LEGO_KEYWORDS.some((kw) => label.includes(kw));
        if (matchesKeyword && pred.probability > CONFIDENCE_THRESHOLD) {
          return { isLego: true, label: pred.className, confidence: pred.probability };
        }
      }

      // Also check if the image has colorful blocky features
      // MobileNet might classify LEGO as various objects — be lenient
      // If the top prediction confidence is low, it might be an unusual object (like LEGO)
      const topConfidence = predictions[0]?.probability || 0;
      if (topConfidence < 0.3) {
        // Model is uncertain — could be LEGO (unusual object)
        return { isLego: true, label: "uncertain (allowing)", confidence: topConfidence };
      }

      return { isLego: false, label: predictions[0]?.className || "unknown", confidence: predictions[0]?.probability || 0 };
    } catch (err) {
      console.error("Detection error:", err);
      return { isLego: true, label: "error (allowing)", confidence: 0 };
    }
  }, []);

  return { loadModel, detect, loading, ready };
}
