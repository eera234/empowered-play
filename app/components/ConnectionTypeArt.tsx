"use client";

import React from "react";

export type ConnectionTypeKind = "bridge" | "road" | "pier" | "dam";
type Theme = "water" | "space" | "ocean" | "forest";

interface Props {
  type: ConnectionTypeKind;
  size?: number;
  theme?: Theme;
}

// Connection-type illustrations drawn in the same house style as
// CrisisIllustrations / AbilityIllustrations: 200x200 viewBox, rounded dark
// backdrop, per-theme gradient sky with scenery silhouettes, isometric LEGO
// bricks (visible top + side + studs) so the art mirrors the physical build
// players are asked to make. 16 unique scenes: 4 types x 4 themes.

export default function ConnectionTypeArt({ type, size = 160, theme = "water" }: Props) {
  // Pass #19: the brick art originally lived in the lower half of a 200x200
  // square, which at small preview sizes read as "giant sky / tiny bricks".
  // Crop the viewBox to a shorter rectangle (200x140, from y=50) so the
  // bricks occupy most of the visible area. Render at the caller's `size`
  // for width and a proportional height so the tile doesn't stretch.
  const w = size;
  const h = Math.round(size * 0.7);
  return (
    <svg
      viewBox="0 50 200 140"
      width={w}
      height={h}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      aria-label={`${type} (${theme})`}
    >
      <ThemeBackdrop theme={theme} />
      {type === "bridge" && <Bridge theme={theme} />}
      {type === "road"   && <Road   theme={theme} />}
      {type === "pier"   && <Pier   theme={theme} />}
      {type === "dam"    && <Dam    theme={theme} />}
    </svg>
  );
}

// ── Brick palette (matches CrisisIllustrations vibe) ──────────────────

const BRICK = {
  red:    { top: "#E74C3C", front: "#B03A2E", side: "#7A2820", stud: "#F08170" },
  yellow: { top: "#FFD740", front: "#C7A030", side: "#8A6E10", stud: "#FFE98A" },
  blue:   { top: "#3A8FD8", front: "#2A6EA8", side: "#1A4E78", stud: "#8ACBF5" },
  green:  { top: "#4CB050", front: "#387A3A", side: "#234F25", stud: "#8ADE8E" },
  white:  { top: "#F0F0F2", front: "#C6C6CA", side: "#8E8E94", stud: "#FFFFFF" },
  grey:   { top: "#6B6F76", front: "#4A4E54", side: "#2E3136", stud: "#9CA0A6" },
  tan:    { top: "#D6B582", front: "#A0875E", side: "#6E5A3E", stud: "#EED4A8" },
  purple: { top: "#9D6FE0", front: "#6E4AA8", side: "#442870", stud: "#C8A8F0" },
  coral:  { top: "#FF8A65", front: "#D35F3B", side: "#8F3A1F", stud: "#FFB39A" },
  brown:  { top: "#8D6E63", front: "#5D4037", side: "#3E2723", stud: "#BCA299" },
};
type BrickPalette = (typeof BRICK)[keyof typeof BRICK];

// Per-theme palette for the scene (brick choice, accents).
const THEME_PAL: Record<Theme, { deck: BrickPalette; pillar: BrickPalette; accent: string }> = {
  water:  { deck: BRICK.yellow, pillar: BRICK.grey,   accent: "#4FC3F7" },
  space:  { deck: BRICK.purple, pillar: BRICK.grey,   accent: "#FFEB3B" },
  ocean:  { deck: BRICK.coral,  pillar: BRICK.tan,    accent: "#80DEEA" },
  forest: { deck: BRICK.brown,  pillar: BRICK.green,  accent: "#AED581" },
};

// ── Isometric brick primitive (same shape as house style) ─────────────

function IsoBrick({
  cx, cy, w, h, depth = 10, palette, studs = true, studCols,
}: {
  cx: number; cy: number; w: number; h: number;
  depth?: number; palette: BrickPalette; studs?: boolean; studCols?: number;
}) {
  const d = depth;
  const left = cx - w / 2;
  const top = cy - h / 2;
  const right = cx + w / 2;
  const bottom = cy + h / 2;
  const cols = studCols ?? Math.max(1, Math.round(w / 14));
  return (
    <g>
      <polygon
        points={`${right},${top} ${right + d},${top - d * 0.4} ${right + d},${bottom - d * 0.4} ${right},${bottom}`}
        fill={palette.side}
      />
      <rect x={left} y={top} width={w} height={h} fill={palette.front} />
      <rect x={left} y={top} width={w} height="3" fill="rgba(255,255,255,.18)" />
      <rect x={left} y={bottom - 3} width={w} height="3" fill="rgba(0,0,0,.25)" />
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill={palette.top}
      />
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="0.6"
      />
      {studs && Array.from({ length: cols }).map((_, i) => {
        const sx = left + (w / cols) * (i + 0.5);
        const sy = top - d * 0.2;
        return (
          <g key={i}>
            <rect x={sx - 4.2} y={sy - d * 0.25} width="8.4" height="3" fill={palette.front} />
            <ellipse cx={sx} cy={sy - d * 0.25} rx={4.2} ry={1.6} fill={palette.stud} />
            <ellipse cx={sx - 1.2} cy={sy - d * 0.35} rx={1.4} ry={0.55} fill="rgba(255,255,255,.8)" />
          </g>
        );
      })}
    </g>
  );
}

// ── Per-theme backdrop (sky + scenery silhouettes + ground) ────────────

function ThemeBackdrop({ theme }: { theme: Theme }) {
  if (theme === "water")  return <WaterBackdrop />;
  if (theme === "space")  return <SpaceBackdrop />;
  if (theme === "ocean")  return <OceanBackdrop />;
  return <ForestBackdrop />;
}

function WaterBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="cta-w-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A1F3C" />
          <stop offset="60%" stopColor="#1E4A7A" />
          <stop offset="100%" stopColor="#3A7AB8" />
        </linearGradient>
        <linearGradient id="cta-w-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E7BBA" />
          <stop offset="100%" stopColor="#0A2844" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="14" fill="url(#cta-w-sky)" />
      {/* moon */}
      <circle cx="160" cy="36" r="10" fill="#FFF3D0" opacity="0.85" />
      {[[24, 22], [64, 14], [132, 40], [184, 60]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill="#FFF3D0" opacity="0.65" />
      ))}
      {/* distant city silhouette */}
      <g opacity="0.55">
        <path d="M0 128 L18 128 L22 116 L36 116 L40 110 L54 110 L58 120 L72 120 L72 106 L82 106 L86 114 L108 114 L112 104 L124 104 L128 118 L142 118 L146 110 L160 110 L164 118 L180 118 L184 112 L200 112 L200 142 L0 142 Z"
          fill="#081424" />
        {/* windows */}
        {[26, 46, 62, 76, 96, 118, 138, 152, 174].map((x, i) => (
          <rect key={i} x={x} y={120 + (i % 2) * 6} width="2" height="3" fill="#FFE890" opacity="0.7" />
        ))}
      </g>
      {/* sea band */}
      <rect x="0" y="142" width="200" height="58" fill="url(#cta-w-sea)" />
      {[148, 158, 168].map((y, i) => (
        <path key={i}
          d={`M0 ${y} q 10 -3 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0`}
          stroke="rgba(180,220,255,0.45)" strokeWidth="0.9" fill="none" opacity={0.7 - i * 0.2}
        />
      ))}
    </g>
  );
}

function SpaceBackdrop() {
  return (
    <g>
      <defs>
        <radialGradient id="cta-s-sky" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#2A1464" />
          <stop offset="60%" stopColor="#120640" />
          <stop offset="100%" stopColor="#05011A" />
        </radialGradient>
        <radialGradient id="cta-s-planet" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#B39DDB" />
          <stop offset="80%" stopColor="#5E35B1" />
          <stop offset="100%" stopColor="#1A0840" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="14" fill="url(#cta-s-sky)" />
      {/* starfield */}
      {[[18, 26], [36, 12], [58, 32], [88, 18], [116, 28], [148, 14], [172, 36], [188, 60], [12, 64], [48, 58], [78, 64], [176, 90], [24, 96], [164, 124]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.8} fill="#FFF" opacity={0.55 + (i % 3) * 0.2} />
      ))}
      {/* distant planet */}
      <circle cx="156" cy="74" r="28" fill="url(#cta-s-planet)" opacity="0.85" />
      <ellipse cx="156" cy="78" rx="38" ry="4" fill="none" stroke="#C8A8F0" strokeOpacity="0.45" strokeWidth="1.4" />
      {/* lower platform band */}
      <rect x="0" y="148" width="200" height="52" fill="#0B0628" />
      <rect x="0" y="148" width="200" height="4" fill="rgba(255,235,59,0.22)" />
      {/* grid dots on platform */}
      {[20, 60, 100, 140, 180].map((x) => (
        <circle key={x} cx={x} cy="174" r="1" fill="rgba(255,235,59,0.5)" />
      ))}
    </g>
  );
}

function OceanBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="cta-o-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#114048" />
          <stop offset="60%" stopColor="#0B3038" />
          <stop offset="100%" stopColor="#062026" />
        </linearGradient>
        <linearGradient id="cta-o-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C6A72" />
          <stop offset="100%" stopColor="#0A2A30" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="14" fill="url(#cta-o-sky)" />
      {/* light rays from above */}
      <path d="M40 0 L24 160 L70 160 L80 0 Z"   fill="#80DEEA" opacity="0.06" />
      <path d="M120 0 L110 160 L160 160 L150 0 Z" fill="#80DEEA" opacity="0.05" />
      {/* bubbles */}
      {[[20, 60], [30, 34], [46, 78], [164, 50], [180, 90], [150, 28], [60, 108], [120, 22]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.2 + (i % 3) * 0.5} fill="#80DEEA" opacity="0.6" />
      ))}
      {/* kelp silhouettes */}
      <path d="M8 170 q4 -30 -2 -60 q6 -20 2 -40" stroke="#1E5A52" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M192 170 q-4 -28 2 -56 q-6 -22 -2 -42" stroke="#1E5A52" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* sea floor */}
      <rect x="0" y="150" width="200" height="50" fill="url(#cta-o-floor)" />
      <path d="M0 156 q 20 -6 40 0 t 40 0 t 40 0 t 40 0 t 40 0 L 200 164 L 0 164 Z" fill="#082830" opacity="0.8" />
    </g>
  );
}

function ForestBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="cta-f-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A3A2A" />
          <stop offset="60%" stopColor="#0E2418" />
          <stop offset="100%" stopColor="#05130C" />
        </linearGradient>
        <linearGradient id="cta-f-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D5A2B" />
          <stop offset="100%" stopColor="#14200D" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="14" fill="url(#cta-f-sky)" />
      {/* canopy silhouette */}
      <g opacity="0.9">
        <circle cx="18"  cy="44" r="22" fill="#163A1A" />
        <circle cx="44"  cy="30" r="28" fill="#0F2E15" />
        <circle cx="80"  cy="38" r="24" fill="#163A1A" />
        <circle cx="120" cy="28" r="26" fill="#0F2E15" />
        <circle cx="158" cy="40" r="24" fill="#163A1A" />
        <circle cx="188" cy="32" r="22" fill="#0F2E15" />
      </g>
      {/* hanging leaves + fireflies */}
      {[[30, 58], [90, 62], [150, 56]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="#AED581" opacity="0.7" />
      ))}
      {[[62, 82], [132, 90], [170, 70]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#FFE082" opacity="0.75" />
      ))}
      {/* tree trunks on sides */}
      <rect x="0"   y="80" width="14" height="90" fill="#2E1810" />
      <rect x="186" y="80" width="14" height="90" fill="#2E1810" />
      {/* forest floor */}
      <rect x="0" y="150" width="200" height="50" fill="url(#cta-f-floor)" />
      {/* grass tufts */}
      {[10, 30, 70, 110, 150, 184].map((x, i) => (
        <path key={i} d={`M${x} 150 l -3 -8 M${x + 3} 150 l 2 -9 M${x + 6} 150 l -1 -7`} stroke="#8FC16A" strokeWidth="0.9" fill="none" opacity="0.8" />
      ))}
    </g>
  );
}

// ── Theme-specific accent flourish placed on the structure ────────────

function ThemeFlourish({ theme, cx, cy }: { theme: Theme; cx: number; cy: number }) {
  if (theme === "water") {
    // mooring pennant flag
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <line x1="0" y1="0" x2="0" y2="-18" stroke="#FFF" strokeWidth="1.4" />
        <polygon points="0,-18 14,-14 0,-10" fill="#4FC3F7" stroke="#1A4E78" strokeWidth="0.8" />
        <circle cx="0" cy="-18" r="1.6" fill="#FFD740" />
      </g>
    );
  }
  if (theme === "space") {
    // signal beacon
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#FFEB3B" strokeWidth="1.4" />
        <circle cx="0" cy="-22" r="4" fill="#FFEB3B" opacity="0.9" />
        <circle cx="0" cy="-22" r="8" fill="none" stroke="#FFEB3B" strokeOpacity="0.5" strokeWidth="1.2" />
        <circle cx="0" cy="-22" r="12" fill="none" stroke="#FFEB3B" strokeOpacity="0.25" strokeWidth="1" />
      </g>
    );
  }
  if (theme === "ocean") {
    // coral sprig
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <path d="M0 0 q-2 -8 0 -14 q4 -6 2 -16" stroke="#FF7043" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="-2" cy="-16" r="2" fill="#FF7043" />
        <circle cx="3"  cy="-8"  r="1.6" fill="#FFAB91" />
      </g>
    );
  }
  // forest: leafy vine
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d="M-12 0 q4 -10 12 -14 q10 -4 18 -16" stroke="#4CB050" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="-2" cy="-10" r="3" fill="#4CB050" />
      <circle cx="10" cy="-18" r="3" fill="#8FC16A" />
      <circle cx="18" cy="-22" r="2.4" fill="#AED581" />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  BRIDGE — two piers with an arched isometric brick deck
// ═════════════════════════════════════════════════════════════════════════

function Bridge({ theme }: { theme: Theme }) {
  const p = THEME_PAL[theme];
  return (
    <g>
      {/* left pier — two stacked isometric bricks */}
      <IsoBrick cx={36} cy={138} w={28} h={22} palette={p.pillar} studCols={2} studs={false} />
      <IsoBrick cx={36} cy={118} w={24} h={14} palette={p.pillar} studCols={2} />

      {/* right pier */}
      <IsoBrick cx={164} cy={138} w={28} h={22} palette={p.pillar} studCols={2} studs={false} />
      <IsoBrick cx={164} cy={118} w={24} h={14} palette={p.pillar} studCols={2} />

      {/* suspension cables */}
      <path d="M36 108 Q 100 48 164 108" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
      <path d="M50 102 L50 110 M70 88 L70 106 M100 74 L100 104 M130 88 L130 106 M150 102 L150 110"
        stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" />

      {/* arched deck — draw as a sequence of isometric bricks following the arch */}
      {[
        { x: 50,  y: 108 }, { x: 70, y: 96 }, { x: 90, y: 88 }, { x: 110, y: 88 }, { x: 130, y: 96 }, { x: 150, y: 108 },
      ].map((pt, i) => (
        <g key={i}>
          <IsoBrick cx={pt.x} cy={pt.y} w={22} h={12} palette={p.deck} studCols={2} depth={7} />
        </g>
      ))}

      {/* central theme flourish atop the arch peak */}
      <ThemeFlourish theme={theme} cx={100} cy={82} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  ROAD — isometric laid path with studs receding toward the horizon
// ═════════════════════════════════════════════════════════════════════════

function Road({ theme }: { theme: Theme }) {
  const p = THEME_PAL[theme];
  // Three rows of laid plates at decreasing size for a perspective feel.
  return (
    <g>
      {/* far row (smallest) */}
      <IsoBrick cx={100} cy={112} w={72}  h={10} palette={p.deck} studCols={5} depth={6} />
      {/* middle row */}
      <IsoBrick cx={100} cy={126} w={104} h={12} palette={p.deck} studCols={6} depth={8} />
      {/* near row (largest) */}
      <IsoBrick cx={100} cy={142} w={140} h={14} palette={p.deck} studCols={7} depth={10} />

      {/* milestone markers on either side (pillar palette) */}
      <IsoBrick cx={22}  cy={134} w={12} h={14} palette={p.pillar} studCols={1} depth={6} />
      <IsoBrick cx={178} cy={134} w={12} h={14} palette={p.pillar} studCols={1} depth={6} />

      {/* centerline accent */}
      <g>
        <rect x="94" y="128" width="12" height="3" fill={p.accent} opacity="0.9" rx="1" />
        <rect x="94" y="140" width="12" height="3" fill={p.accent} opacity="0.8" rx="1" />
        <rect x="94" y="150" width="12" height="3" fill={p.accent} opacity="0.7" rx="1" />
      </g>

      {/* theme flourish — a roadside sign on the left milestone */}
      <ThemeFlourish theme={theme} cx={22} cy={118} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  PIER — shore block + deck extending out, 4 pylons dropping into water
// ═════════════════════════════════════════════════════════════════════════

function Pier({ theme }: { theme: Theme }) {
  const p = THEME_PAL[theme];
  return (
    <g>
      {/* shore block on the left */}
      <IsoBrick cx={30}  cy={128} w={40} h={34} palette={p.pillar} studCols={2} />

      {/* deck extending right */}
      <IsoBrick cx={128} cy={114} w={140} h={12} palette={p.deck} studCols={7} depth={8} />
      <IsoBrick cx={128} cy={126} w={140} h={8}  palette={p.pillar} studCols={7} studs={false} depth={8} />

      {/* pylons dropping into water — repeated thin bricks */}
      {[70, 100, 130, 160, 190].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="134" width="6" height="24" fill={p.pillar.side} />
          <rect x={x - 3} y="134" width="6" height="3" fill="rgba(255,255,255,0.2)" />
        </g>
      ))}

      {/* theme flourish at tip of the pier */}
      <ThemeFlourish theme={theme} cx={190} cy={106} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  DAM — tall stacked wall of isometric bricks spanning full width
// ═════════════════════════════════════════════════════════════════════════

function Dam({ theme }: { theme: Theme }) {
  const p = THEME_PAL[theme];
  return (
    <g>
      {/* footing */}
      <rect x="8" y="148" width="184" height="6" fill={p.pillar.side} />
      <rect x="8" y="148" width="184" height="1.5" fill="rgba(255,255,255,0.2)" />

      {/* 4 rows of staggered bricks */}
      <IsoBrick cx={100} cy={140} w={170} h={12} palette={p.deck}   studCols={8} depth={8} />
      <IsoBrick cx={92}  cy={126} w={156} h={12} palette={p.pillar} studCols={7} depth={8} />
      <IsoBrick cx={108} cy={112} w={140} h={12} palette={p.deck}   studCols={6} depth={8} />
      <IsoBrick cx={100} cy={96}  w={120} h={12} palette={p.pillar} studCols={5} depth={8} />

      {/* crenellation caps on top */}
      {[60, 80, 100, 120, 140].map((x) => (
        <rect key={x} x={x - 4} y="80" width="8" height="8" fill={p.pillar.front} stroke={p.pillar.side} strokeWidth="0.6" />
      ))}

      {/* theme flourish above the wall */}
      <ThemeFlourish theme={theme} cx={100} cy={74} />

      {/* theme-specific water/flow detail at base, where applicable */}
      {theme === "water" && (
        <g>
          <rect x="92" y="142" width="16" height="12" fill="#081424" opacity="0.8" />
          {[94, 98, 102, 106].map((x) => (
            <line key={x} x1={x} y1="148" x2={x} y2="158" stroke="#80CCFF" strokeWidth="1" opacity="0.8" />
          ))}
        </g>
      )}
      {theme === "ocean" && (
        <g>
          {/* barnacles along the base */}
          <circle cx="30"  cy="144" r="2" fill="#80DEEA" opacity="0.7" />
          <circle cx="170" cy="144" r="2.4" fill="#80DEEA" opacity="0.7" />
          <circle cx="54"  cy="146" r="1.6" fill="#80DEEA" opacity="0.6" />
        </g>
      )}
    </g>
  );
}
