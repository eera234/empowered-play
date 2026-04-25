"use client";

import type { CSSProperties } from "react";

// Single map component for the new story-mode flow. Renders all three state
// images stacked and crossfades between them based on phase + patternComplete.
// Old-flow screens (CityMapScreen, FacLiveScreen) still use the per-theme
// WaterMap/SpaceMap/OceanMap components with the older two-state `rebuilt` prop.

type Theme = "water" | "space" | "ocean" | "forest";
type Phase = "map_ch1" | "map_ch2" | "map_ch3";

interface ThemedMapProps {
  theme: Theme;
  phase: Phase;
  patternComplete?: boolean;
  ch2Damaged?: boolean;
}

// Map each theme to its three-state image set.
const IMAGE_PREFIX: Record<Theme, string> = {
  water: "/maps/rising-tides",
  space: "/maps/deep-space",
  ocean: "/maps/ocean-depths",
  forest: "/maps/rainforest",
};

// Derive which of the three layers should be fully visible for the current
// state. Ch1 shows the world thriving, Ch2 shows it after the crisis hits, Ch3
// crossfades from damaged to rebuilt once the team matches the hidden pattern.
function visibleLayer(phase: Phase, patternComplete: boolean, ch2Damaged: boolean): "intact" | "damaged" | "rebuilt" {
  if (phase === "map_ch1") return "intact";
  if (phase === "map_ch2") return ch2Damaged ? "damaged" : "intact";
  if (phase === "map_ch3" && patternComplete) return "rebuilt";
  return "damaged";
}

export default function ThemedMap({ theme, phase, patternComplete = false, ch2Damaged = true }: ThemedMapProps) {
  const prefix = IMAGE_PREFIX[theme];
  const active = visibleLayer(phase, patternComplete, ch2Damaged);

  const layerStyle = (isActive: boolean): CSSProperties => ({
    position: "absolute",
    inset: 0,
    opacity: isActive ? 1 : 0,
    transition: "opacity 1.6s ease-in-out",
  });

  // Ch3-before-rebuild uses the same damaged PNG as Ch2, but we tint it
  // (desaturated + warmer hue-shift + slightly dimmer) so players can feel
  // the phase shift without a new asset. Once the pattern matches, the
  // rebuilt.png fades in and the filter clears.
  const wrapFilter: CSSProperties["filter"] =
    phase === "map_ch3" && !patternComplete
      ? "saturate(0.65) hue-rotate(-8deg) brightness(0.9)"
      : undefined;

  return (
    <div className="map-img-wrap" style={{ filter: wrapFilter, transition: "filter 1.2s ease-in-out" }}>
      {/* Chapter tint watermark during map_ch3: a subtle dark vignette
          that reinforces the "deeper into the storm" read. */}
      {phase === "map_ch3" && !patternComplete && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(80,20,20,0) 50%, rgba(40,10,10,.35) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
      {/* Base layer forces the wrapper to size from the actual image aspect ratio. */}
      <img
        src={`${prefix}-damaged.png`}
        alt=""
        className="map-bg-img"
        draggable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
        aria-hidden
      />
      <img
        src={`${prefix}-intact.png`}
        alt={`${theme} map, thriving`}
        className="map-bg-img"
        draggable={false}
        style={layerStyle(active === "intact")}
      />
      <img
        src={`${prefix}-damaged.png`}
        alt={`${theme} map, after the crisis`}
        className="map-bg-img"
        draggable={false}
        style={layerStyle(active === "damaged")}
      />
      <img
        src={`${prefix}-rebuilt.png`}
        alt={`${theme} map, rebuilt`}
        className="map-bg-img"
        draggable={false}
        style={layerStyle(active === "rebuilt")}
      />
    </div>
  );
}
