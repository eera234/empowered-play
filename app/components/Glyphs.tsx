"use client";

import React from "react";

// Instructional glyphs for map onboarding and the gallery. Drawn in the same
// house style as CrisisIllustrations / AbilityIllustrations / DistrictIllustrations:
// 200x200 viewBox, rounded dark backdrop, gradient sky with scenery, an LEGO
// baseplate with studs at the bottom, isometric bricks with visible side and
// top faces, and (where it helps) a minifig character in the foreground.

type Props = { size?: number };

const wrap = (size: number): React.CSSProperties => ({ width: size, height: size, display: "block" });

// ── Shared house-style palette ───────────────────────────────────────────

const BRICK = {
  red:    { top: "#E74C3C", front: "#B03A2E", side: "#7A2820", stud: "#F08170" },
  yellow: { top: "#FFD740", front: "#C7A030", side: "#8A6E10", stud: "#FFE98A" },
  blue:   { top: "#3A8FD8", front: "#2A6EA8", side: "#1A4E78", stud: "#8ACBF5" },
  green:  { top: "#4CB050", front: "#387A3A", side: "#234F25", stud: "#8ADE8E" },
  white:  { top: "#F0F0F2", front: "#C6C6CA", side: "#8E8E94", stud: "#FFFFFF" },
  grey:   { top: "#6B6F76", front: "#4A4E54", side: "#2E3136", stud: "#9CA0A6" },
  dark:   { top: "#2B2F38", front: "#1A1D24", side: "#0A0D14", stud: "#5A5E66" },
  tan:    { top: "#D6B582", front: "#A0875E", side: "#6E5A3E", stud: "#EED4A8" },
};
type BrickPalette = (typeof BRICK)[keyof typeof BRICK];

// ── Shared primitives ────────────────────────────────────────────────────

// Rounded dark backdrop with a gradient sky and subtle rear brick wall,
// matching the other illustration packs.
function Backdrop({ id, skyTop, skyBottom, accent }: { id: string; skyTop: string; skyBottom: string; accent: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="14" fill={`url(#${id}-sky)`} />
      {/* faint brick-wall texture */}
      {[36, 80, 124].map((y, i) => (
        <g key={y} opacity="0.14">
          {[0, 48, 96, 144].map((x, j) => (
            <rect key={j} x={x + (i % 2) * 24} y={y} width="40" height="14" rx="2" fill="#000" stroke="#FFF" strokeOpacity="0.15" strokeWidth="0.5" />
          ))}
        </g>
      ))}
      {/* focal glow so the subject pops */}
      <rect width="200" height="200" fill={`url(#${id}-glow)`} />
    </>
  );
}

// LEGO baseplate running across the bottom, with studs.
function Baseplate({ color = "#263247", stud = "#4A5A78" }: { color?: string; stud?: string }) {
  return (
    <g>
      <rect x="0" y="158" width="200" height="42" fill={color} />
      <rect x="0" y="158" width="200" height="3" fill="rgba(255,255,255,0.16)" />
      <rect x="0" y="196" width="200" height="4" fill="rgba(0,0,0,0.4)" />
      {[18, 52, 86, 120, 154, 188].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="172" rx="9" ry="3.2" fill="rgba(0,0,0,0.35)" />
          <circle cx={cx} cy="168" r="7" fill={stud} />
          <ellipse cx={cx - 1.5} cy="165.5" rx="3" ry="1.2" fill="rgba(255,255,255,0.55)" />
        </g>
      ))}
    </g>
  );
}

// Isometric LEGO brick with a visible front + top + right side + studs on top.
// (cx, cy) is the center of the FRONT face.
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
      {/* right side */}
      <polygon
        points={`${right},${top} ${right + d},${top - d * 0.4} ${right + d},${bottom - d * 0.4} ${right},${bottom}`}
        fill={palette.side}
      />
      {/* front */}
      <rect x={left} y={top} width={w} height={h} fill={palette.front} />
      <rect x={left} y={top} width={w} height="3" fill="rgba(255,255,255,.18)" />
      <rect x={left} y={bottom - 3} width={w} height="3" fill="rgba(0,0,0,.25)" />
      {/* top */}
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill={palette.top}
      />
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="0.6"
      />
      {/* studs on top face */}
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

// Compact minifig — simplified version of AbilityIllustrations' Minifig,
// trimmed to just what the glyphs need. Feet at (cx, baseY).
function Minifig({
  cx, baseY, torsoColor, torsoDark,
  legColor = "#2A3A58", headColor = "#FFD740",
  hatColor, hatStyle = "none",
  armAngleL = -12, armAngleR = 12,
  scale = 1,
}: {
  cx: number; baseY: number;
  torsoColor: string; torsoDark: string;
  legColor?: string; headColor?: string;
  hatColor?: string; hatStyle?: "none" | "hard" | "cap";
  armAngleL?: number; armAngleR?: number;
  scale?: number;
}) {
  const s = scale;
  const legW = 24 * s, legH = 28 * s;
  const torsoW = 38 * s, torsoH = 34 * s;
  const neckH = 4 * s;
  const headR = 13 * s;
  const armW = 9 * s, armH = 24 * s;

  const feetY = baseY;
  const legsTopY = feetY - legH;
  const torsoBottomY = legsTopY;
  const torsoTopY = torsoBottomY - torsoH;
  const neckY = torsoTopY - neckH;
  const headCY = neckY - headR;

  return (
    <g>
      {/* shadow */}
      <ellipse cx={cx} cy={feetY + 2 * s} rx={24 * s} ry={3.5 * s} fill="rgba(0,0,0,0.45)" />
      {/* legs */}
      <rect x={cx - legW / 2} y={legsTopY} width={legW / 2 - 1} height={legH} fill={legColor} />
      <rect x={cx + 1} y={legsTopY} width={legW / 2 - 1} height={legH} fill={legColor} />
      <rect x={cx - legW / 2} y={legsTopY} width={legW} height={3 * s} fill="rgba(255,255,255,0.18)" />
      <rect x={cx - legW / 2 - 1} y={feetY - 4 * s} width={legW / 2} height={4 * s} fill="#1a1a28" />
      <rect x={cx + 1} y={feetY - 4 * s} width={legW / 2} height={4 * s} fill="#1a1a28" />
      {/* torso */}
      <polygon
        points={`${cx - torsoW / 2 + 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY} ${cx + torsoW / 2},${torsoBottomY} ${cx - torsoW / 2},${torsoBottomY}`}
        fill={torsoColor}
      />
      <polygon
        points={`${cx - torsoW / 2 + 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY + 5 * s} ${cx - torsoW / 2 + 4},${torsoTopY + 5 * s}`}
        fill="rgba(255,255,255,0.28)"
      />
      <line x1={cx} y1={torsoTopY + 4 * s} x2={cx} y2={torsoBottomY - 2 * s} stroke={torsoDark} strokeWidth={1} opacity="0.7" />
      <rect x={cx - 10 * s} y={torsoTopY - 2 * s} width={20 * s} height={4 * s} fill={torsoDark} />
      {/* arms */}
      <g transform={`rotate(${armAngleL} ${cx - torsoW / 2 + 2} ${torsoTopY + 3 * s})`}>
        <rect x={cx - torsoW / 2 - armW + 2} y={torsoTopY + 2 * s} width={armW} height={armH} rx={3 * s} fill={torsoColor} />
        <rect x={cx - torsoW / 2 - armW + 2} y={torsoTopY + 2 * s} width={armW} height={3 * s} rx={2 * s} fill="rgba(255,255,255,0.22)" />
        <circle cx={cx - torsoW / 2 - armW / 2 + 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill={headColor} stroke="rgba(0,0,0,0.25)" strokeWidth={0.7} />
      </g>
      <g transform={`rotate(${armAngleR} ${cx + torsoW / 2 - 2} ${torsoTopY + 3 * s})`}>
        <rect x={cx + torsoW / 2 - 2} y={torsoTopY + 2 * s} width={armW} height={armH} rx={3 * s} fill={torsoColor} />
        <rect x={cx + torsoW / 2 - 2} y={torsoTopY + 2 * s} width={armW} height={3 * s} rx={2 * s} fill="rgba(255,255,255,0.22)" />
        <circle cx={cx + torsoW / 2 + armW / 2 - 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill={headColor} stroke="rgba(0,0,0,0.25)" strokeWidth={0.7} />
      </g>
      {/* neck + head */}
      <rect x={cx - 4 * s} y={torsoTopY - neckH} width={8 * s} height={neckH} fill="#8A7418" />
      <circle cx={cx} cy={headCY} r={headR} fill={headColor} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
      <ellipse cx={cx - 4 * s} cy={headCY - 4 * s} rx={5 * s} ry={3 * s} fill="rgba(255,255,255,0.35)" />
      {/* face */}
      <circle cx={cx - 4 * s} cy={headCY - 1 * s} r={1.6 * s} fill="#1a0a08" />
      <circle cx={cx + 4 * s} cy={headCY - 1 * s} r={1.6 * s} fill="#1a0a08" />
      <path d={`M${cx - 4 * s} ${headCY + 5 * s} Q ${cx} ${headCY + 8 * s} ${cx + 4 * s} ${headCY + 5 * s}`} stroke="#1a0a08" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* hats */}
      {hatStyle === "hard" && (
        <g>
          <path d={`M${cx - headR + 1} ${headCY - 2} Q ${cx} ${headCY - headR - 5} ${cx + headR - 1} ${headCY - 2} L ${cx + headR + 3} ${headCY - 2} L ${cx - headR - 3} ${headCY - 2} Z`} fill={hatColor || "#FFA020"} />
          <rect x={cx - headR - 3} y={headCY - 4} width={(headR + 3) * 2} height={3} fill={hatColor || "#FFA020"} />
          <path d={`M${cx - headR + 2} ${headCY - 6} Q ${cx} ${headCY - headR - 4} ${cx + headR - 2} ${headCY - 6}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        </g>
      )}
      {hatStyle === "cap" && (
        <g>
          <path d={`M${cx - headR + 1} ${headCY - 3} Q ${cx} ${headCY - headR - 4} ${cx + headR - 1} ${headCY - 3}`} fill={hatColor || "#1E4A68"} />
          <rect x={cx - 4} y={headCY - headR + 2} width={headR} height={3} fill={hatColor || "#1E4A68"} />
        </g>
      )}
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  TAP — two LEGO districts on a baseplate, minifig hand tapping between
// ═════════════════════════════════════════════════════════════════════════

export function TapGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Tap to connect">
      <Backdrop id="g-tap" skyTop="#12264A" skyBottom="#060E24" accent="#4FC3F7" />
      <Baseplate />

      {/* left district: red tower */}
      <IsoBrick cx={48} cy={128} w={40} h={22} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={48} cy={106} w={32} h={18} palette={BRICK.yellow} studCols={2} />

      {/* right district: blue tower */}
      <IsoBrick cx={152} cy={128} w={40} h={22} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={152} cy={106} w={32} h={18} palette={BRICK.white} studCols={2} />

      {/* dashed connection arcing between the two */}
      <path
        d="M72 98 Q 100 60 128 98"
        stroke="#4FC3F7" strokeWidth="3" fill="none" strokeLinecap="round"
        strokeDasharray="5 4"
      />

      {/* tap ripples at the connection origin */}
      <circle cx="100" cy="60" r="22" fill="none" stroke="#4FC3F7" strokeOpacity="0.35" strokeWidth="1.4" />
      <circle cx="100" cy="60" r="14" fill="none" stroke="#4FC3F7" strokeOpacity="0.6" strokeWidth="1.4" />
      <circle cx="100" cy="60" r="6"  fill="#4FC3F7" opacity="0.9" />
      <circle cx="100" cy="60" r="2.5" fill="#FFF" />

      {/* pointing hand descending from top */}
      <g transform="translate(100 32)">
        {/* forearm */}
        <rect x="-10" y="-30" width="20" height="24" rx="4" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-10" y="-30" width="20" height="4" rx="2" fill="#FFF3C4" opacity="0.7" />
        {/* palm */}
        <ellipse cx="0" cy="-4" rx="11" ry="8" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        {/* index finger pointing down */}
        <rect x="-3" y="4" width="6" height="16" rx="2.2" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-1.5" y="5" width="3" height="3" rx="1" fill="#FFF3C4" opacity="0.8" />
        {/* motion arcs */}
        <path d="M-14 -4 q-4 3 -6 8" stroke="#4FC3F7" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M14 -4 q4 3 6 8" stroke="#4FC3F7" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  BRICK — minifig assembling an isometric stack, floating brick above
// ═════════════════════════════════════════════════════════════════════════

export function BrickGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Build the LEGO bridge">
      <Backdrop id="g-brk" skyTop="#2A103A" skyBottom="#0E041A" accent="#FF5252" />
      <Baseplate />

      {/* existing stack on the right */}
      <IsoBrick cx={138} cy={136} w={50} h={20} palette={BRICK.red} studCols={3} />
      <IsoBrick cx={138} cy={116} w={44} h={18} palette={BRICK.blue} studCols={3} />
      <IsoBrick cx={138} cy={98}  w={32} h={16} palette={BRICK.yellow} studCols={2} />

      {/* minifig on the left, arm raised to place a brick */}
      <Minifig
        cx={70} baseY={158}
        torsoColor="#4FC088" torsoDark="#2A6A48"
        legColor="#2A3A58" hatStyle="hard" hatColor="#FFA020"
        armAngleL={-18} armAngleR={-80}
        scale={1}
      />

      {/* held / floating brick above the minifig's raised arm */}
      <g>
        <IsoBrick cx={108} cy={54} w={36} h={16} palette={BRICK.red} studCols={2} />
        {/* motion arcs hinting at placement */}
        <path d="M108 70 q8 10 28 16" stroke="#FF5252" strokeWidth="1.6" strokeDasharray="3 3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M98 60 q-6 4 -10 12"  stroke="#FFD740" strokeWidth="1.4" strokeDasharray="2 3" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  CAMERA — minifig holds a chunky LEGO camera, flash burst, target brick
// ═════════════════════════════════════════════════════════════════════════

export function CameraGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Photograph it">
      <Backdrop id="g-cam" skyTop="#3A2408" skyBottom="#140A02" accent="#FFD740" />
      <Baseplate />

      {/* target brick on the right, the thing being photographed */}
      <g>
        <IsoBrick cx={150} cy={130} w={44} h={20} palette={BRICK.yellow} studCols={2} />
        <IsoBrick cx={150} cy={110} w={36} h={16} palette={BRICK.red} studCols={2} />
        {/* capture reticle corners */}
        <g stroke="#FFD740" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9">
          <path d="M120 92 L120 100 M120 92 L128 92" />
          <path d="M180 92 L180 100 M180 92 L172 92" />
          <path d="M120 148 L120 140 M120 148 L128 148" />
          <path d="M180 148 L180 140 M180 148 L172 148" />
        </g>
      </g>

      {/* minifig on the left holding the camera */}
      <Minifig
        cx={60} baseY={158}
        torsoColor="#3A8FD8" torsoDark="#1A4E78"
        legColor="#2A3A58" hatStyle="cap" hatColor="#1A2A44"
        armAngleL={-55} armAngleR={-55}
        scale={1}
      />

      {/* chunky LEGO camera in front of the minifig's face */}
      <g>
        <defs>
          <linearGradient id="cam-body-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3A3F4A" />
            <stop offset="55%" stopColor="#1E2028" />
            <stop offset="100%" stopColor="#0A0C14" />
          </linearGradient>
          <linearGradient id="cam-top-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#50545F" />
            <stop offset="100%" stopColor="#2A2C36" />
          </linearGradient>
          <linearGradient id="cam-side-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14161C" />
            <stop offset="100%" stopColor="#060810" />
          </linearGradient>
          <radialGradient id="cam-lens-outer" cx="40%" cy="35%" r="70%">
            <stop offset="0%"  stopColor="#4A5060" />
            <stop offset="60%" stopColor="#1A1C24" />
            <stop offset="100%" stopColor="#06080E" />
          </radialGradient>
          <radialGradient id="cam-lens-glass" cx="35%" cy="30%" r="75%">
            <stop offset="0%"  stopColor="#9ED8FF" />
            <stop offset="40%" stopColor="#3A8FD8" />
            <stop offset="85%" stopColor="#0D3A7A" />
            <stop offset="100%" stopColor="#061030" />
          </radialGradient>
          <radialGradient id="cam-lens-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#1a2a5a" />
            <stop offset="100%" stopColor="#030814" />
          </radialGradient>
          <linearGradient id="cam-flash-pane" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDE0" />
            <stop offset="100%" stopColor="#FFD740" />
          </linearGradient>
        </defs>

        {/* isometric right side of body for depth */}
        <polygon points="90,80 96,77 96,111 90,114" fill="url(#cam-side-grad)" />
        {/* top face (slightly lighter, shows three round studs like a LEGO brick) */}
        <polygon points="34,80 90,80 96,77 40,77" fill="url(#cam-top-grad)" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
        {[48, 62, 78].map((x) => (
          <g key={x}>
            <ellipse cx={x + 2} cy="76" rx="3.2" ry="1.2" fill="#15171E" />
            <circle cx={x + 2} cy="75" r="2.6" fill="#3A3F4A" stroke="#0A0C14" strokeWidth="0.6" />
            <ellipse cx={x + 1.4} cy="74.2" rx="1.1" ry="0.5" fill="rgba(255,255,255,0.45)" />
          </g>
        ))}

        {/* main body */}
        <rect x="34" y="80" width="56" height="34" rx="4" fill="url(#cam-body-grad)" />
        {/* top highlight band */}
        <rect x="35" y="81" width="54" height="3" rx="1.5" fill="rgba(255,255,255,0.22)" />
        {/* bottom shadow band */}
        <rect x="35" y="110" width="54" height="3" rx="1.5" fill="rgba(0,0,0,0.5)" />
        {/* subtle gold accent trim */}
        <rect x="34" y="98" width="56" height="1.2" fill="#FFD740" opacity="0.55" />

        {/* flash cube perched on the top-right of the body */}
        <g>
          <rect x="72" y="66" width="14" height="11" rx="1.5" fill="#1E2028" />
          <rect x="72" y="66" width="14" height="2" fill="rgba(255,255,255,0.25)" />
          <rect x="73" y="67" width="12" height="8" rx="1" fill="url(#cam-flash-pane)" />
          <rect x="73.5" y="67.5" width="11" height="2" fill="#FFFFFF" opacity="0.65" />
        </g>

        {/* small red shutter button on top, left side */}
        <g>
          <ellipse cx="43" cy="76.8" rx="2.8" ry="1.1" fill="#7A1E18" />
          <circle cx="43" cy="75.6" r="2.4" fill="#E74C3C" stroke="#7A1E18" strokeWidth="0.6" />
          <ellipse cx="42.2" cy="74.8" rx="1" ry="0.5" fill="rgba(255,255,255,0.55)" />
        </g>

        {/* viewfinder window on the upper-left of the body */}
        <g>
          <rect x="38" y="86" width="12" height="6" rx="1" fill="#050710" stroke="#FFD740" strokeWidth="0.9" />
          <rect x="38.8" y="86.6" width="10.4" height="1.4" rx="0.6" fill="#4FC3F7" opacity="0.55" />
        </g>

        {/* lens barrel — multi-ring */}
        <g>
          {/* outer gold bezel */}
          <circle cx="68" cy="100" r="15" fill="#FFD740" />
          <circle cx="68" cy="100" r="15" fill="none" stroke="#5E3A00" strokeWidth="0.8" />
          {/* outer ring with gradient depth */}
          <circle cx="68" cy="100" r="13" fill="url(#cam-lens-outer)" />
          {/* mid ring */}
          <circle cx="68" cy="100" r="10.5" fill="#0A0C14" stroke="#3A3F4A" strokeWidth="0.8" />
          {/* glass */}
          <circle cx="68" cy="100" r="8.5" fill="url(#cam-lens-glass)" />
          {/* iris */}
          <circle cx="68" cy="100" r="4.2" fill="url(#cam-lens-iris)" />
          {/* catchlights */}
          <ellipse cx="64" cy="96" rx="2.8" ry="1.8" fill="#E1F5FE" opacity="0.9" transform="rotate(-25 64 96)" />
          <circle cx="72.5" cy="103.5" r="1" fill="#FFFFFF" opacity="0.8" />
          {/* tiny engraved dot marks around bezel */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx="68" cy="100"
              r="0.6"
              fill="#5E3A00"
              transform={`rotate(${deg} 68 100) translate(0 -13.2)`}
            />
          ))}
        </g>

        {/* neck strap vanishing behind the body */}
        <path d="M34 86 q-8 -2 -14 4" stroke="#5E3A00" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M90 86 q8 -2 14 4" stroke="#5E3A00" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* flash burst radiating from the flash cube */}
      <g transform="translate(79 62)" opacity="0.95">
        <circle r="10" fill="#FFFDE0" opacity="0.55" />
        <circle r="5"  fill="#FFFFE0" />
        <circle r="2"  fill="#FFFFFF" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <line
            key={deg}
            x1="0" y1={i % 2 === 0 ? "-11" : "-10"} x2="0" y2={i % 2 === 0 ? "-22" : "-18"}
            stroke="#FFD740" strokeWidth={i % 2 === 0 ? 2.2 : 1.4} strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  PATTERN — baseplate with a polygon of studded plates at each vertex
// ═════════════════════════════════════════════════════════════════════════

export function PatternGlyph({ size = 120 }: Props) {
  const pts: Array<[number, number]> = [
    [100, 44],
    [150, 82],
    [132, 134],
    [68, 134],
    [50, 82],
  ];
  const poly = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Match the pattern">
      <Backdrop id="g-pat" skyTop="#0E2A1A" skyBottom="#030E08" accent="#69F0AE" />
      <Baseplate />

      {/* center glow */}
      <defs>
        <radialGradient id="g-pat-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD740" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFD740" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* polygon fill as soft glow */}
      <polygon points={poly} fill="url(#g-pat-center)" />
      {/* polygon outline */}
      <polygon points={poly} fill="none" stroke="#69F0AE" strokeWidth="2.6" strokeLinejoin="round" opacity="0.95" />
      {/* inner beam crosslinks for visual richness */}
      <line x1="100" y1="44" x2="132" y2="134" stroke="#69F0AE" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
      <line x1="100" y1="44" x2="68"  y2="134" stroke="#69F0AE" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />

      {/* vertex plates — isometric bricks at each point */}
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x - 100} ${y - 96})`}>
          <IsoBrick cx={100} cy={96} w={22} h={10} palette={BRICK.blue} studCols={2} depth={6} />
        </g>
      ))}

      {/* center gold brick marking completion */}
      <IsoBrick cx={100} cy={92} w={28} h={12} palette={BRICK.yellow} studCols={2} depth={6} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  REPAIR — minifig with wrench mending a cracked tower, spark at the seam
// ═════════════════════════════════════════════════════════════════════════

export function RepairGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Repair the damage">
      <Backdrop id="g-rep" skyTop="#3A2410" skyBottom="#140A02" accent="#FFD740" />
      <Baseplate />

      {/* broken tower on the right: bottom intact yellow, middle cracked grey (damaged) */}
      <IsoBrick cx={140} cy={136} w={48} h={20} palette={BRICK.yellow} studCols={3} />

      {/* damaged middle row shown as a split/cracked brick: draw two halves */}
      <g>
        {/* left half of damaged row */}
        <IsoBrick cx={124} cy={116} w={16} h={18} palette={BRICK.grey} studCols={1} depth={8} />
        {/* right half */}
        <IsoBrick cx={156} cy={116} w={16} h={18} palette={BRICK.grey} studCols={1} depth={8} />
        {/* zigzag crack between halves */}
        <path
          d="M140 106 L136 112 L144 118 L138 124 L142 128"
          stroke="#FFE082" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.95"
        />
      </g>

      {/* top intact gold brick (the repair target) */}
      <IsoBrick cx={140} cy={96} w={36} h={14} palette={BRICK.yellow} studCols={2} depth={8} />

      {/* spark burst at the crack */}
      <g transform="translate(140 116)">
        <circle r="6" fill="#FFF3C4" opacity="0.95" />
        <circle r="3" fill="#FFFFE0" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="0" y1="-8" x2="0" y2="-14"
            stroke="#FFD740" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* minifig on the left, arm up holding a wrench */}
      <Minifig
        cx={64} baseY={158}
        torsoColor="#FFD740" torsoDark="#8A6E10"
        legColor="#2A3A58" hatStyle="hard" hatColor="#E74C3C"
        armAngleL={-18} armAngleR={-75}
        scale={1}
      />

      {/* wrench in the raised right hand — tilted toward the crack */}
      <g transform="translate(96 86) rotate(30)">
        {/* shaft */}
        <rect x="-3" y="-2" width="44" height="6" rx="2" fill="#8D6E63" stroke="#3E2723" strokeWidth="1.1" />
        <rect x="-3" y="-2" width="44" height="1.8" rx="1" fill="#fff" opacity="0.28" />
        {/* jaw */}
        <path
          d="M36 -6 L46 -6 L46 -2 L42 -2 L42 2 L46 2 L46 6 L36 6 Z"
          fill="#8D6E63" stroke="#3E2723" strokeWidth="1.1" strokeLinejoin="round"
        />
        {/* grip */}
        <rect x="-10" y="-3" width="8" height="8" rx="1.5" fill="#5D4037" stroke="#3E2723" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  SHIELD — isometric LEGO shield on baseplate, glossy green face, check
// ═════════════════════════════════════════════════════════════════════════

export function ShieldGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Shielded">
      <Backdrop id="g-shd" skyTop="#0E2A1A" skyBottom="#030E08" accent="#69F0AE" />
      <Baseplate />

      <defs>
        <radialGradient id="g-shd-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#69F0AE" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#69F0AE" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#69F0AE" stopOpacity="0" />
        </radialGradient>
        {/* front face: subtle vertical lighting, no harsh black edge */}
        <linearGradient id="g-shd-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#D8F7DB" />
          <stop offset="35%" stopColor="#7EE49A" />
          <stop offset="70%" stopColor="#3FAE63" />
          <stop offset="100%" stopColor="#1E6B30" />
        </linearGradient>
        {/* left-side diagonal sheen for dimensionality */}
        <linearGradient id="g-shd-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* back face offset — makes the shield read as a solid plate in depth */}
        <linearGradient id="g-shd-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1F5A2A" />
          <stop offset="100%" stopColor="#08250F" />
        </linearGradient>
        {/* soft rim instead of a black outline */}
        <linearGradient id="g-shd-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3FAE63" />
          <stop offset="100%" stopColor="#0B3311" />
        </linearGradient>
        {/* stud radial */}
        <radialGradient id="g-shd-stud" cx="38%" cy="35%" r="70%">
          <stop offset="0%"  stopColor="#F3FFF6" />
          <stop offset="60%" stopColor="#8EE8A7" />
          <stop offset="100%" stopColor="#1E6B30" />
        </radialGradient>
        {/* checkmark bevel */}
        <linearGradient id="g-shd-chk-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#B9EEC2" />
        </linearGradient>
      </defs>

      {/* aura */}
      <circle cx="100" cy="96" r="80" fill="url(#g-shd-aura)" />

      <g>
        {/* back plate, offset down-right, no stroke */}
        <path
          d="M100 36 L144 52 V82 Q144 114 100 138 Q56 114 56 82 V52 Z"
          fill="url(#g-shd-back)" opacity="0.95"
          transform="translate(5 4)"
        />
        {/* bevel rim — slightly larger than face, soft gradient, no black line */}
        <path
          d="M100 28 L148 46 V82 Q148 118 100 142 Q52 118 52 82 V46 Z"
          fill="url(#g-shd-rim)"
        />
        {/* front face — sits just inside the rim */}
        <path
          d="M100 32 L145 48 V82 Q145 115 100 137 Q55 115 55 82 V48 Z"
          fill="url(#g-shd-face)"
        />
        {/* diagonal sheen over the upper-left half */}
        <path
          d="M100 34 L142 50 V82 Q142 108 100 132 Q60 108 60 82 V50 Z"
          fill="url(#g-shd-sheen)"
        />
        {/* thin bright highlight tracing the upper inner edge */}
        <path
          d="M60 52 L100 38 L132 50"
          fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* rivets / studs inset on the shield face, corner positions */}
        {[
          { cx: 70,  cy: 56 },
          { cx: 130, cy: 56 },
          { cx: 66,  cy: 108 },
          { cx: 134, cy: 108 },
        ].map((s) => (
          <g key={`${s.cx}-${s.cy}`}>
            <ellipse cx={s.cx} cy={s.cy + 1.8} rx="4" ry="1.2" fill="rgba(0,0,0,0.35)" />
            <circle cx={s.cx} cy={s.cy} r="3.4" fill="url(#g-shd-stud)" />
            <ellipse cx={s.cx - 0.9} cy={s.cy - 0.9} rx="1.3" ry="0.6" fill="rgba(255,255,255,0.8)" />
          </g>
        ))}

        {/* embossed checkmark — two-tone bevel (lit top edge, darker bottom) */}
        <g>
          {/* shadow under checkmark */}
          <path
            d="M72 90 L92 108 L132 66"
            fill="none" stroke="#0A2A12" strokeOpacity="0.55"
            strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
          />
          {/* dark body — no pure black, tied to the green palette */}
          <path
            d="M70 88 L90 106 L130 64"
            fill="none" stroke="#1B5E20"
            strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
          />
          {/* lit highlight stroke on top edge */}
          <path
            d="M70 88 L90 106 L130 64"
            fill="none" stroke="url(#g-shd-chk-top)"
            strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.95"
          />
          {/* specular dot on the angle of the check */}
          <circle cx="90" cy="106" r="1.6" fill="#FFFFFF" opacity="0.9" />
        </g>
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  CLUE CARD PICK — three fanned cards on a baseplate, hand reaching for centre
// ═════════════════════════════════════════════════════════════════════════

export function ClueCardPickGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Pick a clue card">
      <Backdrop id="g-clue" skyTop="#3A2408" skyBottom="#140A02" accent="#FFD740" />
      <Baseplate />

      {/* glow halo behind the centre card */}
      <circle cx="100" cy="108" r="44" fill="#FFD740" opacity="0.2" />
      <circle cx="100" cy="108" r="32" fill="#FFD740" opacity="0.15" />

      {/* left card, tilted */}
      <g transform="rotate(-14 70 120)">
        <rect x="50" y="84" width="44" height="64" rx="5" fill="#1F2540" stroke="#5B6FA0" strokeWidth="1.4" />
        {/* stud row at the top edge — LEGO/card hybrid */}
        {[60, 72, 84].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="84" rx="3.2" ry="1.2" fill="rgba(0,0,0,0.4)" />
            <circle cx={cx} cy="82" r="3" fill="#5B6FA0" />
            <ellipse cx={cx - 0.8} cy="80.6" rx="1.2" ry="0.5" fill="rgba(255,255,255,0.7)" />
          </g>
        ))}
        {/* card pattern: question mark glyph */}
        <text x="72" y="124" textAnchor="middle" fontFamily="Black Han Sans, sans-serif" fontSize="22" fill="#FFD740" opacity="0.6">?</text>
      </g>

      {/* right card, tilted */}
      <g transform="rotate(14 130 120)">
        <rect x="106" y="84" width="44" height="64" rx="5" fill="#1F2540" stroke="#5B6FA0" strokeWidth="1.4" />
        {[116, 128, 140].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="84" rx="3.2" ry="1.2" fill="rgba(0,0,0,0.4)" />
            <circle cx={cx} cy="82" r="3" fill="#5B6FA0" />
            <ellipse cx={cx - 0.8} cy="80.6" rx="1.2" ry="0.5" fill="rgba(255,255,255,0.7)" />
          </g>
        ))}
        <text x="128" y="124" textAnchor="middle" fontFamily="Black Han Sans, sans-serif" fontSize="22" fill="#FFD740" opacity="0.6">?</text>
      </g>

      {/* centre card — the chosen one, brighter and with a glow ring */}
      <g>
        <rect x="78" y="74" width="44" height="64" rx="5" fill="#2D3A6A" stroke="#FFD740" strokeWidth="2.2" />
        {[88, 100, 112].map(cx => (
          <g key={cx}>
            <ellipse cx={cx} cy="74" rx="3.2" ry="1.2" fill="rgba(0,0,0,0.4)" />
            <circle cx={cx} cy="72" r="3" fill="#FFD740" />
            <ellipse cx={cx - 0.8} cy="70.6" rx="1.2" ry="0.5" fill="rgba(255,255,255,0.7)" />
          </g>
        ))}
        <text x="100" y="116" textAnchor="middle" fontFamily="Black Han Sans, sans-serif" fontSize="28" fill="#FFD740">?</text>
        {/* glow ring */}
        <rect x="76" y="72" width="48" height="68" rx="6" fill="none" stroke="#FFD740" strokeOpacity="0.5" strokeWidth="1.4" />
      </g>

      {/* pointing hand descending from top */}
      <g transform="translate(100 30)">
        <rect x="-10" y="-30" width="20" height="24" rx="4" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-10" y="-30" width="20" height="4" rx="2" fill="#FFF3C4" opacity="0.7" />
        <ellipse cx="0" cy="-4" rx="11" ry="8" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-3" y="4" width="6" height="16" rx="2.2" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-1.5" y="5" width="3" height="3" rx="1" fill="#FFF3C4" opacity="0.8" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  SWAP ROLES — two minifigs facing each other with a circular arrow loop
// ═════════════════════════════════════════════════════════════════════════

export function SwapRolesGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Swap roles">
      <Backdrop id="g-swap" skyTop="#0E2A4A" skyBottom="#04101F" accent="#5AC8FA" />
      <Baseplate />

      {/* left minifig: green */}
      <Minifig
        cx={62} baseY={158}
        torsoColor="#4FC088" torsoDark="#2A6A48"
        legColor="#2A3A58" hatStyle="cap" hatColor="#2A6A48"
        armAngleL={-10} armAngleR={10}
      />
      {/* right minifig: blue */}
      <Minifig
        cx={138} baseY={158}
        torsoColor="#3A8FD8" torsoDark="#1A4E78"
        legColor="#2A3A58" hatStyle="cap" hatColor="#1A4E78"
        armAngleL={-10} armAngleR={10}
      />

      {/* circular dashed arrow loop above the minifigs, reading as "swap" */}
      <g>
        {/* top arc going right — from left minifig to right minifig */}
        <path
          d="M 62 80 Q 100 36 138 80"
          fill="none" stroke="#5AC8FA" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round"
        />
        {/* arrow head at right end (pointing down-right) */}
        <polygon points="138,80 132,72 144,72" fill="#5AC8FA" />

        {/* bottom arc going left — from right back to left */}
        <path
          d="M 138 96 Q 100 124 62 96"
          fill="none" stroke="#FFA040" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round"
        />
        <polygon points="62,96 68,88 56,88" fill="#FFA040" />
      </g>

      {/* small "x3" badge top-right indicating three rounds */}
      <g transform="translate(170 28)">
        <circle r="14" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.4" />
        <text textAnchor="middle" y="5" fontFamily="Black Han Sans, sans-serif" fontSize="14" fill="#5E3A00">x3</text>
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  RIDDLE — minifig holding a sealed scroll/card with a thought-bubble "?"
// ═════════════════════════════════════════════════════════════════════════

export function RiddleGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Your riddle">
      <Backdrop id="g-rid" skyTop="#2A1648" skyBottom="#0E0420" accent="#FFD740" />
      <Baseplate />

      {/* minifig holding a scroll up to chest level, slight lean inward */}
      <Minifig
        cx={70} baseY={158}
        torsoColor="#7E57C2" torsoDark="#4A2E8A"
        legColor="#2A3A58" hatStyle="none"
        armAngleL={-30} armAngleR={-50}
      />

      {/* the scroll/card the minifig is holding */}
      <g transform="translate(108 92)">
        {/* scroll body */}
        <rect x="-22" y="-22" width="44" height="48" rx="4" fill="#F0E0B8" stroke="#5E3A00" strokeWidth="1.6" />
        {/* parchment ridges */}
        <line x1="-16" y1="-12" x2="16" y2="-12" stroke="#A0855A" strokeWidth="0.8" opacity="0.6" />
        <line x1="-16" y1="-4" x2="16" y2="-4" stroke="#A0855A" strokeWidth="0.8" opacity="0.6" />
        <line x1="-16" y1="4" x2="14" y2="4" stroke="#A0855A" strokeWidth="0.8" opacity="0.6" />
        <line x1="-16" y1="12" x2="12" y2="12" stroke="#A0855A" strokeWidth="0.8" opacity="0.6" />
        {/* wax seal / padlock badge */}
        <circle cx="-22" cy="22" r="7" fill="#C2185B" stroke="#5E0E2E" strokeWidth="1.2" />
        <rect x="-25" y="20" width="6" height="4" rx="0.6" fill="#5E0E2E" />
        <rect x="-23.6" y="17.5" width="3.2" height="3" rx="1.6" fill="none" stroke="#5E0E2E" strokeWidth="0.8" />
      </g>

      {/* thought bubble: gold cloud-edge with a stylised "?" inside */}
      <g>
        <ellipse cx="146" cy="60" rx="22" ry="18" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.4" />
        <circle cx="124" cy="80" r="4.5" fill="#FFD740" stroke="#5E3A00" strokeWidth="1" />
        <circle cx="118" cy="92" r="2.6" fill="#FFD740" stroke="#5E3A00" strokeWidth="0.8" />
        <text x="146" y="68" textAnchor="middle" fontFamily="Black Han Sans, sans-serif" fontSize="26" fill="#5E3A00">?</text>
      </g>

      {/* "ONLY YOU" lock icon top-left as a private-info cue */}
      <g transform="translate(28 30)">
        <rect x="-9" y="-4" width="18" height="14" rx="2" fill="#FFD740" stroke="#5E3A00" strokeWidth="1" />
        <path d="M -5 -4 v -5 a 5 5 0 0 1 10 0 v 5" fill="none" stroke="#FFD740" strokeWidth="2" />
        <circle cx="0" cy="3" r="1.6" fill="#5E3A00" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  DRAG TO ZONE — hand pulling brick along a dashed arc onto a glowing zone
// ═════════════════════════════════════════════════════════════════════════

export function DragToZoneGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Drag into zone">
      <Backdrop id="g-drag" skyTop="#0A2A2A" skyBottom="#02100E" accent="#4ADBA8" />
      <Baseplate />

      {/* glowing destination zone outlined on the baseplate */}
      <g>
        {/* outer glow */}
        <rect x="118" y="110" width="62" height="44" rx="4" fill="#4ADBA8" opacity="0.18" />
        <rect x="124" y="116" width="50" height="32" rx="3" fill="#4ADBA8" opacity="0.32" />
        {/* dashed boundary */}
        <rect
          x="124" y="116" width="50" height="32" rx="3"
          fill="none" stroke="#4ADBA8" strokeWidth="2.2" strokeDasharray="6 4"
        />
        {/* 4 corner markers */}
        {[
          { cx: 124, cy: 116 }, { cx: 174, cy: 116 },
          { cx: 124, cy: 148 }, { cx: 174, cy: 148 },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#4ADBA8" />
        ))}
      </g>

      {/* brick mid-flight along the arc, near the destination */}
      <g transform="translate(140 86)">
        <IsoBrick cx={0} cy={0} w={32} h={16} palette={BRICK.yellow} studCols={2} />
      </g>

      {/* dashed motion arc from hand to zone */}
      <path
        d="M 56 50 Q 110 30 140 86"
        fill="none" stroke="#FFD740" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round"
      />
      {/* arrow head at destination end */}
      <polygon points="140,86 134,80 144,76" fill="#FFD740" />

      {/* hand at the start of the arc, gripping the brick origin */}
      <g transform="translate(50 50)">
        <ellipse cx="0" cy="0" rx="11" ry="8" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-3" y="6" width="6" height="14" rx="2.2" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-1.5" y="7" width="3" height="3" rx="1" fill="#FFF3C4" opacity="0.8" />
        <rect x="-10" y="-22" width="20" height="22" rx="4" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-10" y="-22" width="20" height="4" rx="2" fill="#FFF3C4" opacity="0.7" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  TIMER LOCK — round LEGO clock face with a padlock badge
// ═════════════════════════════════════════════════════════════════════════

export function TimerLockGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Timer locks it in">
      <Backdrop id="g-tim" skyTop="#3A180A" skyBottom="#180802" accent="#FF7043" />
      <Baseplate />

      {/* clock outer ring */}
      <g transform="translate(100 96)">
        {/* shadow under clock */}
        <ellipse cx="0" cy="56" rx="48" ry="6" fill="rgba(0,0,0,0.45)" />
        {/* outer rim */}
        <circle r="54" fill="#C6C6CA" stroke="#1a1a28" strokeWidth="1.6" />
        <circle r="54" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.4" />
        {/* face */}
        <circle r="46" fill="#F0F0F2" stroke="#7A7A82" strokeWidth="1" />
        {/* face highlight */}
        <ellipse cx="-14" cy="-22" rx="20" ry="10" fill="rgba(255,255,255,0.55)" />

        {/* tick marks at 12/3/6/9 (chunky, LEGO-y) */}
        <rect x="-3" y="-44" width="6" height="9" rx="1.4" fill="#1a1a28" />
        <rect x="35" y="-3" width="9" height="6" rx="1.4" fill="#1a1a28" />
        <rect x="-3" y="35" width="6" height="9" rx="1.4" fill="#1a1a28" />
        <rect x="-44" y="-3" width="9" height="6" rx="1.4" fill="#1a1a28" />

        {/* hands at 12 (locked-in moment) */}
        <line x1="0" y1="0" x2="0" y2="-32" stroke="#FF5252" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#1a1a28" strokeWidth="5" strokeLinecap="round" />
        <circle r="4.5" fill="#1a1a28" />
        <circle r="2" fill="#FF5252" />
      </g>

      {/* padlock badge in the lower-right of the clock */}
      <g transform="translate(140 134)">
        {/* lock body */}
        <rect x="-13" y="-2" width="26" height="22" rx="3" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.6" />
        {/* shackle */}
        <path d="M -7 -2 v -8 a 7 7 0 0 1 14 0 v 8" fill="none" stroke="#FFD740" strokeWidth="3.5" />
        <path d="M -7 -2 v -8 a 7 7 0 0 1 14 0 v 8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        {/* keyhole */}
        <circle cx="0" cy="6" r="2.4" fill="#5E3A00" />
        <rect x="-1.2" y="6" width="2.4" height="6" rx="0.6" fill="#5E3A00" />
      </g>

      {/* "0:00" tag at the top */}
      <g transform="translate(100 30)">
        <rect x="-22" y="-12" width="44" height="22" rx="4" fill="#1a1a28" stroke="#FF7043" strokeWidth="1.4" />
        <text textAnchor="middle" y="4" fontFamily="Black Han Sans, sans-serif" fontSize="15" fill="#FF7043">0:00</text>
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  CRISIS INCOMING — storm cloud with lightning over a tiny LEGO district
// ═════════════════════════════════════════════════════════════════════════

export function CrisisIncomingGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="A crisis is coming">
      <Backdrop id="g-cri" skyTop="#2A0810" skyBottom="#0E0204" accent="#FF5252" />
      <Baseplate color="#1F2636" stud="#3A4358" />

      {/* tiny LEGO district under the storm */}
      <IsoBrick cx={100} cy={140} w={56} h={22} palette={BRICK.blue} studCols={3} />
      <IsoBrick cx={100} cy={120} w={42} h={18} palette={BRICK.yellow} studCols={2} />
      <IsoBrick cx={100} cy={104} w={28} h={14} palette={BRICK.red} studCols={2} />

      {/* storm cloud at the top — overlapping rounded humps */}
      <g>
        {/* shadow */}
        <ellipse cx="100" cy="58" rx="78" ry="14" fill="rgba(0,0,0,0.45)" />
        {/* cloud body */}
        <ellipse cx="68" cy="46" rx="22" ry="16" fill="#3A3A4A" />
        <ellipse cx="100" cy="38" rx="28" ry="20" fill="#4A4A5A" />
        <ellipse cx="134" cy="48" rx="24" ry="16" fill="#3A3A4A" />
        <ellipse cx="84" cy="56" rx="22" ry="12" fill="#5A5A6A" />
        <ellipse cx="118" cy="56" rx="22" ry="12" fill="#5A5A6A" />
        {/* highlight */}
        <ellipse cx="92" cy="32" rx="16" ry="6" fill="rgba(255,255,255,0.18)" />
      </g>

      {/* two lightning bolts striking down toward the district */}
      <g>
        <polygon
          points="80,68 70,90 82,90 70,116 88,86 76,86 86,68"
          fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" strokeLinejoin="round"
        />
        <polygon
          points="80,68 70,90 82,90 70,116 88,86 76,86 86,68"
          fill="rgba(255,255,255,0.4)" opacity="0.6"
        />
        <polygon
          points="120,72 112,92 122,92 110,118 128,90 118,90 126,72"
          fill="#FF5252" stroke="#5E0E0E" strokeWidth="1.2" strokeLinejoin="round"
        />
        <polygon
          points="120,72 112,92 122,92 110,118 128,90 118,90 126,72"
          fill="rgba(255,255,255,0.3)" opacity="0.5"
        />
      </g>

      {/* warning triangle above the cloud */}
      <g transform="translate(170 36)">
        <polygon points="0,-12 12,8 -12,8" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.4" />
        <rect x="-1.6" y="-4" width="3.2" height="8" fill="#5E3A00" />
        <circle cx="0" cy="6" r="1.6" fill="#5E3A00" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  BRIDGE SCENE — two districts with two minifigs, partial bridge being placed
// ═════════════════════════════════════════════════════════════════════════

export function BridgeSceneGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Build a bridge">
      <Backdrop id="g-brg" skyTop="#0E2A4A" skyBottom="#04101F" accent="#4FC3F7" />
      <Baseplate />

      {/* left district stack */}
      <IsoBrick cx={42} cy={140} w={40} h={20} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={42} cy={122} w={32} h={16} palette={BRICK.yellow} studCols={2} />
      {/* right district stack */}
      <IsoBrick cx={158} cy={140} w={40} h={20} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={158} cy={122} w={32} h={16} palette={BRICK.white} studCols={2} />

      {/* small left minifig on top of left district (scale 0.6) */}
      <Minifig
        cx={42} baseY={114}
        torsoColor="#4FC088" torsoDark="#2A6A48"
        legColor="#2A3A58" hatStyle="cap" hatColor="#2A6A48"
        armAngleL={-12} armAngleR={-50}
        scale={0.55}
      />
      {/* small right minifig on top of right district */}
      <Minifig
        cx={158} baseY={114}
        torsoColor="#3A8FD8" torsoDark="#1A4E78"
        legColor="#2A3A58" hatStyle="cap" hatColor="#1A4E78"
        armAngleL={-50} armAngleR={-12}
        scale={0.55}
      />

      {/* the partial 1×4 bridge being lowered between them */}
      <g>
        {/* dashed arc showing it descending into place */}
        <path
          d="M 100 38 Q 100 58 100 84"
          fill="none" stroke="#FFD740" strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" opacity="0.7"
        />
        {/* the bridge brick */}
        <IsoBrick cx={100} cy={84} w={68} h={14} palette={BRICK.tan} studCols={4} />
      </g>

      {/* camera "click" sparkle near the bridge */}
      <g transform="translate(150 60)">
        <circle r="3" fill="#FFD740" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke="#FFD740" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#FFD740" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#FFD740" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        <line x1="-5" y1="5" x2="5" y2="-5" stroke="#FFD740" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  LAST DROP — minifig dropping a brick into the last slot of a glowing pattern
// ═════════════════════════════════════════════════════════════════════════

export function LastDropGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Last drop rebuilds">
      <Backdrop id="g-drop" skyTop="#1A0A3A" skyBottom="#06021A" accent="#FFD740" />
      <Baseplate />

      {/* faint dashed pattern outline (pentagon) connecting 5 slot dots */}
      <g>
        <polygon
          points="100,60 152,98 132,158 68,158 48,98"
          fill="none" stroke="#FFD740" strokeWidth="2" strokeDasharray="5 4" opacity="0.6"
        />
        {/* 4 already-filled slots (gold, complete) */}
        {[
          { cx: 152, cy: 98 }, { cx: 132, cy: 158 },
          { cx: 68, cy: 158 }, { cx: 48, cy: 98 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="9" fill="#FFD740" opacity="0.8" />
            <circle cx={p.cx} cy={p.cy} r="5" fill="#FFFFFF" opacity="0.7" />
          </g>
        ))}
        {/* the LAST slot — bright halo, not yet filled */}
        <circle cx="100" cy="60" r="22" fill="#FFD740" opacity="0.22" />
        <circle cx="100" cy="60" r="14" fill="#FFD740" opacity="0.4" />
        <circle cx="100" cy="60" r="9" fill="none" stroke="#FFD740" strokeWidth="2.4" strokeDasharray="3 2" />
      </g>

      {/* the brick mid-flight, dropping into the last slot */}
      <g>
        {/* trail */}
        <path d="M 100 26 V 50" stroke="#FFD740" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" opacity="0.7" />
        <IsoBrick cx={100} cy={36} w={28} h={14} palette={BRICK.yellow} studCols={2} />
      </g>

      {/* minifig off to the side, arm raised — the "dropper" */}
      <Minifig
        cx={32} baseY={158}
        torsoColor="#7E57C2" torsoDark="#4A2E8A"
        legColor="#2A3A58" hatStyle="hard" hatColor="#FFA020"
        armAngleL={-12} armAngleR={-60}
        scale={0.7}
      />

      {/* sparkle around the final slot to show "rebuild moment" */}
      {[
        { cx: 80, cy: 50 }, { cx: 122, cy: 48 }, { cx: 130, cy: 70 }, { cx: 72, cy: 72 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.cx} ${p.cy})`}>
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFD740" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFD740" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  NEW POSITIONS — irregular cluster of glowing spots, no closed polygon
//  Used for Ch3 P1. Must NOT pre-reveal triangle/pentagon/hexagon.
// ═════════════════════════════════════════════════════════════════════════

export function NewPositionsGlyph({ size = 120 }: Props) {
  // Five spots scattered across the baseplate. Deliberately not connected
  // by any outline: no polygon, no chord lines, no arrows between them.
  const spots = [
    { cx:  62, cy: 122, r: 11 },
    { cx: 108, cy: 102, r: 12 },
    { cx: 152, cy: 130, r: 11 },
    { cx:  86, cy: 148, r: 10 },
    { cx: 134, cy: 158, r: 10 },
  ];
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="New positions appear">
      <Backdrop id="g-newpos" skyTop="#1A0A3A" skyBottom="#06021A" accent="#FFD740" />
      <Baseplate />

      {/* one minifig at the side, looking outward toward the new spots */}
      <Minifig
        cx={32} baseY={170}
        torsoColor="#3A8FD8" torsoDark="#1A4E78"
        legColor="#2A3A58" hatStyle="cap" hatColor="#FFD740"
        armAngleL={-20} armAngleR={20}
        scale={0.65}
      />

      {/* the five glowing spots, drawn as halo + bright ring + dashed boundary */}
      {spots.map((p, i) => (
        <g key={i}>
          <circle cx={p.cx} cy={p.cy} r={p.r + 8} fill="#FFD740" opacity="0.16" />
          <circle cx={p.cx} cy={p.cy} r={p.r + 2} fill="#FFD740" opacity="0.32" />
          <circle
            cx={p.cx} cy={p.cy} r={p.r}
            fill="none" stroke="#FFD740" strokeWidth="2.2" strokeDasharray="3 2"
          />
          <circle cx={p.cx} cy={p.cy} r={p.r - 5} fill="#FFFFFF" opacity="0.55" />
        </g>
      ))}

      {/* small drift sparkles over the cluster to read as "appearing" */}
      {[
        { cx:  84, cy:  92 }, { cx: 130, cy:  82 }, { cx: 166, cy: 104 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.cx} ${p.cy})`}>
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFD740" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFD740" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  TAP PARTNER — own district highlighted gold + finger taps it, dashed arc
//  to teammate's district. Used for Ch2 P1 ("TAP TO PAIR UP").
// ═════════════════════════════════════════════════════════════════════════

export function TapPartnerGlyph({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)} aria-label="Tap to pair up">
      <Backdrop id="g-tap2" skyTop="#12264A" skyBottom="#060E24" accent="#FFD740" />
      <Baseplate />

      {/* left district — own, highlighted gold */}
      <g>
        <circle cx={60} cy={140} r="32" fill="#FFD740" opacity="0.18" />
        <IsoBrick cx={60} cy={144} w={42} h={20} palette={BRICK.yellow} studCols={2} />
        <IsoBrick cx={60} cy={124} w={34} h={16} palette={BRICK.red} studCols={2} />
      </g>

      {/* right district — teammate */}
      <g>
        <IsoBrick cx={144} cy={144} w={42} h={20} palette={BRICK.blue} studCols={2} />
        <IsoBrick cx={144} cy={124} w={34} h={16} palette={BRICK.white} studCols={2} />
      </g>

      {/* dashed arc from own to teammate, with arrow at end */}
      <path
        d="M 60 100 Q 102 56 144 100"
        fill="none" stroke="#FFD740" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round"
      />
      <polygon points="144,100 138,94 148,90" fill="#FFD740" />

      {/* finger / pointer tapping the gold (own) district from below-left */}
      <g transform="translate(34 96)">
        {/* arm cuff */}
        <rect x="-12" y="14" width="22" height="22" rx="5" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <rect x="-12" y="14" width="22" height="4" rx="2" fill="#FFF3C4" opacity="0.7" />
        {/* hand */}
        <ellipse cx="0" cy="6" rx="11" ry="8" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        {/* index finger pointing up-right toward the gold district */}
        <rect x="-2" y="-12" width="6" height="18" rx="2.4" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" transform="rotate(20 1 -3)" />
        {/* tap pulse on the gold district */}
        <circle cx="22" cy="-18" r="6" fill="none" stroke="#FFD740" strokeWidth="1.6" opacity="0.9" />
        <circle cx="22" cy="-18" r="11" fill="none" stroke="#FFD740" strokeWidth="1.2" opacity="0.5" />
      </g>

      {/* "1" badge over own district, "2" over teammate */}
      <g>
        <circle cx={60} cy={88} r="10" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <text x={60} y={92} textAnchor="middle" fontSize="12" fontWeight="900" fill="#3A2410" fontFamily="'Black Han Sans', sans-serif">1</text>
        <circle cx={144} cy={88} r="10" fill="#FFD740" stroke="#5E3A00" strokeWidth="1.2" />
        <text x={144} y={92} textAnchor="middle" fontSize="12" fontWeight="900" fill="#3A2410" fontFamily="'Black Han Sans', sans-serif">2</text>
      </g>
    </svg>
  );
}
