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
function visibleLayer(phase: Phase, patternComplete: boolean): "intact" | "damaged" | "rebuilt" {
  if (phase === "map_ch1") return "intact";
  if (phase === "map_ch3" && patternComplete) return "rebuilt";
  return "damaged";
}

export default function ThemedMap({ theme, phase, patternComplete = false }: ThemedMapProps) {
  const prefix = IMAGE_PREFIX[theme];
  const active = visibleLayer(phase, patternComplete);

  const layerStyle = (isActive: boolean): CSSProperties => ({
    position: "absolute",
    inset: 0,
    opacity: isActive ? 1 : 0,
    transition: "opacity 1.6s ease-in-out",
  });

  return (
    <div className="map-img-wrap">
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
