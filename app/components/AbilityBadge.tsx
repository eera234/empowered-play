"use client";

import type { Ability } from "../../lib/constants";
import { getAbilityIllustration, getAbilityBadge } from "./AbilityIllustrations";

const ABILITY_COLORS: Record<string, string> = {
  citizen: "#E8E8E8",
  mender: "#4FC3F7",
  scout: "#B388FF",
  engineer: "#FF7043",
  anchor: "#66BB6A",
  diplomat: "#FFD740",
};

type Variant = "compact" | "inline" | "full";

type Props = {
  ability: Ability | null | undefined;
  size?: number;
  withLabel?: boolean;
  variant?: Variant;
};

// Unified ability display. Always renders the illustrated SVG at `size` so
// the game shows the same visual for a role everywhere, not emoji in one
// place and SVG in another. Use variant to control layout density.
export default function AbilityBadge({ ability, size = 40, withLabel = false, variant = "inline" }: Props) {
  const id = ability?.id ?? "citizen";
  const color = ABILITY_COLORS[id] ?? "#E8E8E8";
  const label = ability?.label ?? "Citizen";
  // Full illustrations collapse into mud below ~80px. Swap to the simpler
  // badge SVGs (single-glyph silhouettes) at small sizes so the role reads.
  const Art = size < 80 ? getAbilityBadge(id) : getAbilityIllustration(id);

  if (variant === "compact") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 8px 3px 4px",
        borderRadius: 20,
        background: `${color}1a`,
        border: `1px solid ${color}55`,
      }}>
        <div style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", flexShrink: 0 }}>
          <Art size={size} />
        </div>
        {withLabel && (
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: Math.max(9, Math.round(size / 4)),
            letterSpacing: 1, color, textTransform: "uppercase",
          }}>
            {label}
          </div>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: 10,
      }}>
        <div style={{ width: size, height: size, borderRadius: 10, overflow: "hidden" }}>
          <Art size={size} />
        </div>
        {withLabel && (
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif", fontSize: Math.max(10, Math.round(size / 6)),
            letterSpacing: 1.5, color, textTransform: "uppercase",
          }}>
            {label}
          </div>
        )}
      </div>
    );
  }

  // inline
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <Art size={size} />
      </div>
      {withLabel && (
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: Math.max(11, Math.round(size / 4)),
          letterSpacing: 1.5, color, textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
