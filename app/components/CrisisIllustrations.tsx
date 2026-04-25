// Crisis card illustrations. Four dramatic disaster scenes rendered as rich
// layered LEGO-world compositions: a storm-swept flood overtaking a skyline,
// a ground fissure cracking the earth open, a blackout under a dead sky, and
// two landmasses ripped apart by a cosmic bolt.

type Props = { size?: number };

const BRICK = {
  red: { top: "#E74C3C", front: "#B03A2E", side: "#7A2820", stud: "#F08170" },
  yellow: { top: "#FFD740", front: "#C7A030", side: "#8A6E10", stud: "#FFE98A" },
  blue: { top: "#3A8FD8", front: "#2a6EA8", side: "#1A4E78", stud: "#8ACBF5" },
  green: { top: "#4CB050", front: "#387A3A", side: "#234F25", stud: "#8ADE8E" },
  white: { top: "#F0F0F2", front: "#C6C6CA", side: "#8E8E94", stud: "#FFFFFF" },
  tan: { top: "#D6B582", front: "#A0875E", side: "#6E5A3E", stud: "#EED4A8" },
  grey: { top: "#6B6F76", front: "#4A4E54", side: "#2E3136", stud: "#9CA0A6" },
  dark: { top: "#2B2F38", front: "#1A1D24", side: "#0A0D14", stud: "#5A5E66" },
};

type BrickPalette = (typeof BRICK)[keyof typeof BRICK];

const DISC: Record<string, { light: string; mid: string; dark: string; rim: string }> = {
  cr_flood: { light: "#9CDFFF", mid: "#2B7FB8", dark: "#0A2844", rim: "#04152A" },
  cr_quake: { light: "#FFB068", mid: "#C0401A", dark: "#3A1008", rim: "#1A0604" },
  cr_blackout: { light: "#8C90AC", mid: "#2A2E44", dark: "#0A0C1A", rim: "#05060E" },
  cr_split: { light: "#D890FF", mid: "#7040C0", dark: "#2A0E58", rim: "#120428" },
};

function wrap(size: number): React.CSSProperties {
  return { width: size, height: size, display: "block" };
}

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

function Sparkle({ cx, cy, r = 4, fill = "#FFFFFF", opacity = 0.9 }: { cx: number; cy: number; r?: number; fill?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={`M ${cx} ${cy - r * 1.6} L ${cx + r * 0.4} ${cy - r * 0.4} L ${cx + r * 1.6} ${cy} L ${cx + r * 0.4} ${cy + r * 0.4} L ${cx} ${cy + r * 1.6} L ${cx - r * 0.4} ${cy + r * 0.4} L ${cx - r * 1.6} ${cy} L ${cx - r * 0.4} ${cy - r * 0.4} Z`} fill={fill} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════
//  cr_flood — Rising Waters
// ═════════════════════════════════════════════════════════════

function CrFlood({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="cr-fl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050f28" />
          <stop offset="55%" stopColor="#0e2a58" />
          <stop offset="100%" stopColor="#3a6ea0" />
        </linearGradient>
        <linearGradient id="cr-fl-w1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFEAFF" />
          <stop offset="100%" stopColor="#3A8FC8" />
        </linearGradient>
        <linearGradient id="cr-fl-w2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4FA0D8" />
          <stop offset="100%" stopColor="#163E64" />
        </linearGradient>
        <linearGradient id="cr-fl-w3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E4A78" />
          <stop offset="100%" stopColor="#061626" />
        </linearGradient>
        <radialGradient id="cr-fl-moon" cx=".4" cy=".4" r=".6">
          <stop offset="0%" stopColor="#FFF8D8" />
          <stop offset="100%" stopColor="#C8B878" />
        </radialGradient>
        <clipPath id="cr-fl-clip">
          <circle cx="100" cy="100" r="94" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="94" fill="url(#cr-fl-sky)" />

      <g clipPath="url(#cr-fl-clip)">
        {/* Storm clouds */}
        <ellipse cx="40" cy="28" rx="46" ry="12" fill="#121a32" opacity="0.85" />
        <ellipse cx="140" cy="20" rx="60" ry="14" fill="#121a32" opacity="0.9" />
        <ellipse cx="90" cy="44" rx="36" ry="8" fill="#1a2344" opacity="0.7" />

        {/* Moon peeking through */}
        <circle cx="146" cy="48" r="12" fill="url(#cr-fl-moon)" />
        <circle cx="142" cy="44" r="3" fill="rgba(0,0,0,.12)" />
        <circle cx="150" cy="52" r="2" fill="rgba(0,0,0,.1)" />

        {/* Stars */}
        {[[30, 40], [62, 28], [172, 62], [14, 74], [184, 38]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 0.9 : 1.3} fill="#E8EEFF" opacity={0.7} />
        ))}

        {/* Lightning bolt in sky */}
        <path d="M 70 18 L 58 44 L 68 44 L 54 72 L 76 44 L 66 44 L 78 18 Z"
          fill="#FFF0A0" stroke="#C0A020" strokeWidth="0.8" strokeLinejoin="round" opacity="0.95" />
        <path d="M 70 18 L 58 44 L 68 44 L 54 72"
          stroke="rgba(255,255,255,.9)" strokeWidth="0.6" fill="none" />

        {/* City skyline silhouette — half submerged */}
        <g fill="#091224">
          <rect x="30" y="100" width="20" height="54" />
          <rect x="52" y="86" width="18" height="68" />
          <rect x="72" y="96" width="14" height="58" />
          <polygon points="86,108 96,92 106,108 106,154 86,154" />
          <rect x="108" y="102" width="16" height="52" />
          <rect x="126" y="88" width="18" height="66" />
          <rect x="146" y="98" width="14" height="56" />
          <rect x="162" y="104" width="18" height="50" />
          {/* Antenna + spire */}
          <rect x="60" y="74" width="2" height="12" />
          <rect x="134" y="74" width="2" height="14" />
        </g>
        {/* Lit windows in silhouette */}
        <g fill="#FFE08A">
          <rect x="34" y="110" width="3" height="4" />
          <rect x="42" y="120" width="3" height="4" />
          <rect x="56" y="100" width="3" height="4" />
          <rect x="64" y="116" width="3" height="4" />
          <rect x="76" y="108" width="3" height="4" />
          <rect x="112" y="116" width="3" height="4" />
          <rect x="118" y="130" width="3" height="4" />
          <rect x="130" y="104" width="3" height="4" />
          <rect x="138" y="118" width="3" height="4" />
          <rect x="168" y="112" width="3" height="4" />
        </g>

        {/* Distant rain */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 10 + i * 14;
          return <line key={i} x1={x} y1={40 + (i % 3) * 6} x2={x - 6} y2={60 + (i % 3) * 6}
            stroke="rgba(180,220,255,.45)" strokeWidth="1" strokeLinecap="round" />;
        })}

        {/* The hero curling wave */}
        <path
          d="M -10 118
             C 20 84, 56 80, 84 110
             C 100 126, 120 128, 132 110
             C 142 94, 156 96, 166 112
             C 172 122, 180 130, 196 120
             L 210 210 L -10 210 Z"
          fill="url(#cr-fl-w1)"
          stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round"
        />
        {/* Wave curl foam — tube shape */}
        <path
          d="M 4 116 C 22 96, 50 92, 78 116
             C 92 130, 114 130, 124 110
             C 118 124, 96 128, 82 116
             C 60 98, 26 102, 10 120 Z"
          fill="rgba(255,255,255,.75)"
        />
        {/* Second layer */}
        <path
          d="M -10 142
             Q 40 130 90 148
             Q 140 168 210 140
             L 210 210 L -10 210 Z"
          fill="url(#cr-fl-w2)"
        />
        {/* Mid crest line */}
        <path d="M -10 142 Q 40 130 90 148 Q 140 168 210 140"
          stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none" />

        {/* Deep foreground water */}
        <path
          d="M -10 170 Q 50 158 100 170 Q 150 184 210 166 L 210 210 L -10 210 Z"
          fill="url(#cr-fl-w3)"
        />
        {/* Foam ripple lines */}
        <path d="M 20 178 Q 36 172 52 178" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 112 186 Q 134 180 156 186" stroke="rgba(255,255,255,.4)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 70 192 Q 86 188 98 194" stroke="rgba(255,255,255,.35)" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Spray droplets above crest */}
        <circle cx="24" cy="96" r="2.4" fill="#FFFFFF" />
        <circle cx="46" cy="82" r="1.8" fill="#FFFFFF" opacity="0.8" />
        <circle cx="68" cy="92" r="2" fill="#FFFFFF" />
        <circle cx="108" cy="94" r="2.4" fill="#FFFFFF" />
        <circle cx="140" cy="86" r="1.6" fill="#FFFFFF" opacity="0.85" />
        <circle cx="162" cy="96" r="1.8" fill="#FFFFFF" opacity="0.75" />

        {/* Foreground rain streaks */}
        {Array.from({ length: 10 }).map((_, i) => {
          const x = 18 + i * 18;
          return <line key={`r${i}`} x1={x} y1={96 + (i % 2) * 10} x2={x - 8} y2={122 + (i % 2) * 10}
            stroke="rgba(200,230,255,.55)" strokeWidth="1.2" strokeLinecap="round" />;
        })}
      </g>

      <circle cx="100" cy="100" r="94" fill="none" stroke={DISC.cr_flood.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  cr_quake — Ground Shift
// ═════════════════════════════════════════════════════════════

function CrQuake({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <radialGradient id="cr-qk-sky" cx=".5" cy=".3" r=".9">
          <stop offset="0%" stopColor="#FFB068" />
          <stop offset="55%" stopColor="#8a3a18" />
          <stop offset="100%" stopColor="#2a0410" />
        </radialGradient>
        <radialGradient id="cr-qk-gloss" cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="cr-qk-lava" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFF8D0" />
          <stop offset="40%" stopColor="#FF7030" />
          <stop offset="100%" stopColor="#3A0A04" />
        </linearGradient>
        <radialGradient id="cr-qk-halo" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="rgba(255,200,80,.8)" />
          <stop offset="100%" stopColor="rgba(255,80,20,0)" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="94" fill="url(#cr-qk-sky)" />
      <circle cx="100" cy="100" r="94" fill="url(#cr-qk-gloss)" />

      {/* Embers rising in the sky */}
      {[[36, 84, 1.4], [58, 58, 1], [82, 72, 0.8], [136, 56, 1.2], [166, 80, 1], [120, 44, 0.9], [46, 40, 0.7]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFD060" opacity={0.85} />
      ))}
      {/* Dark smoke wisps */}
      <ellipse cx="60" cy="34" rx="28" ry="6" fill="rgba(42,6,10,.5)" />
      <ellipse cx="144" cy="28" rx="34" ry="7" fill="rgba(42,6,10,.55)" />

      {/* LEFT baseplate half — tilted down-right toward rift */}
      <g transform="rotate(-4 58 152)">
        <rect x="6" y="146" width="100" height="16" fill="#3a1a10" stroke="#1a0402" strokeWidth="1.2" />
        <rect x="6" y="146" width="100" height="3" fill="rgba(255,180,100,.4)" />
        {[18, 36, 54, 72, 90].map((x, i) => (
          <ellipse key={i} cx={x} cy={147.5} rx={3.4} ry={1.3} fill="rgba(255,180,100,.55)" />
        ))}
      </g>

      {/* RIGHT baseplate half — tilted down-left toward rift */}
      <g transform="rotate(4 140 152)">
        <rect x="94" y="146" width="100" height="16" fill="#3a1a10" stroke="#1a0402" strokeWidth="1.2" />
        <rect x="94" y="146" width="100" height="3" fill="rgba(255,180,100,.4)" />
        {[108, 126, 144, 162, 180].map((x, i) => (
          <ellipse key={i} cx={x} cy={147.5} rx={3.4} ry={1.3} fill="rgba(255,180,100,.55)" />
        ))}
      </g>

      {/* Halo of lava light behind the rift */}
      <ellipse cx="100" cy="160" rx="36" ry="22" fill="url(#cr-qk-halo)" />

      {/* HERO molten rift — vertical fissure between the plates */}
      <path
        d="M 90 142
           L 78 156
           L 96 168
           L 82 184
           L 102 198
           L 118 184
           L 106 168
           L 122 156
           L 110 142 Z"
        fill="url(#cr-qk-lava)" stroke="#1a0402" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Bright core */}
      <path
        d="M 94 148 L 86 158 L 100 170 L 90 184 L 102 196 L 114 184 L 102 170 L 116 158 L 106 148 Z"
        fill="#FFF8A8" opacity="0.7"
      />

      {/* Radiating surface cracks on both plates */}
      <path d="M 90 146 L 60 150 L 42 146 L 20 152" stroke="#2a0a04" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M 90 152 L 54 160" stroke="#2a0a04" strokeWidth="1.2" fill="none" />
      <path d="M 110 146 L 140 150 L 160 146 L 182 152" stroke="#2a0a04" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M 110 152 L 148 162" stroke="#2a0a04" strokeWidth="1.2" fill="none" />

      {/* HERO LEGO tower on left, cracked and tilting */}
      <g transform="rotate(-10 58 130)">
        {/* Base brick */}
        <g>
          <polygon points="74,142 84,138 84,156 74,160" fill={BRICK.red.side} />
          <rect x="42" y="142" width="32" height="18" fill={BRICK.red.front} />
          <rect x="42" y="142" width="32" height="3" fill="rgba(255,255,255,.22)" />
          <polygon points="42,142 74,142 84,138 52,138" fill={BRICK.red.top} />
          {/* Studs */}
          <ellipse cx="54" cy="140" rx="3.8" ry="1.4" fill={BRICK.red.stud} />
          <ellipse cx="70" cy="140" rx="3.8" ry="1.4" fill={BRICK.red.stud} />
        </g>
        {/* Middle brick — tilted + cracked */}
        <g>
          <polygon points="70,124 80,120 80,138 70,142" fill={BRICK.yellow.side} />
          <rect x="46" y="124" width="24" height="18" fill={BRICK.yellow.front} />
          <rect x="46" y="124" width="24" height="3" fill="rgba(255,255,255,.25)" />
          <polygon points="46,124 70,124 80,120 56,120" fill={BRICK.yellow.top} />
          <ellipse cx="58" cy="122" rx="3.6" ry="1.3" fill={BRICK.yellow.stud} />
          {/* Big crack through middle brick */}
          <path d="M 52 124 L 58 132 L 52 142" stroke="#3a1a08" strokeWidth="2" fill="none" strokeLinejoin="round" />
        </g>
        {/* Top brick — about to topple */}
        <g transform="translate(56 110) rotate(18)">
          <rect x="-10" y="-8" width="20" height="14" fill={BRICK.blue.front} />
          <rect x="-10" y="-8" width="20" height="3" fill="rgba(255,255,255,.25)" />
          <ellipse cx="-4" cy="-10" rx="3.6" ry="1.3" fill={BRICK.blue.stud} />
          <ellipse cx="4" cy="-10" rx="3.6" ry="1.3" fill={BRICK.blue.stud} />
        </g>
      </g>

      {/* Tumbling debris bricks */}
      <g transform="translate(140 96) rotate(32)">
        <rect x="-9" y="-5" width="18" height="10" fill={BRICK.red.front} stroke="#3a0a04" strokeWidth="0.8" />
        <rect x="-9" y="-5" width="18" height="2" fill="rgba(255,200,140,.5)" />
        <ellipse cx="-4" cy="-6" rx="2.6" ry="1" fill={BRICK.red.stud} />
        <ellipse cx="4" cy="-6" rx="2.6" ry="1" fill={BRICK.red.stud} />
      </g>
      <g transform="translate(168 116) rotate(-18)">
        <rect x="-7" y="-4" width="14" height="8" fill={BRICK.yellow.front} stroke="#3a0a04" strokeWidth="0.8" />
        <rect x="-7" y="-4" width="14" height="2" fill="rgba(255,220,120,.5)" />
      </g>
      <g transform="translate(126 70) rotate(48)">
        <rect x="-6" y="-3.5" width="12" height="7" fill={BRICK.blue.front} stroke="#3a0a04" strokeWidth="0.8" />
      </g>
      {/* Motion lines */}
      <line x1="154" y1="82" x2="146" y2="74" stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="172" y1="98" x2="178" y2="92" stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeLinecap="round" />

      {/* Dust clouds at base of rift */}
      <ellipse cx="100" cy="190" rx="36" ry="6" fill="rgba(100,50,26,.5)" />
      <circle cx="84" cy="186" r="5" fill="rgba(100,60,40,.5)" />
      <circle cx="116" cy="186" r="5" fill="rgba(100,60,40,.5)" />
      <circle cx="76" cy="180" r="3.5" fill="rgba(120,80,50,.4)" />
      <circle cx="124" cy="180" r="3.5" fill="rgba(120,80,50,.4)" />

      <circle cx="100" cy="100" r="94" fill="none" stroke={DISC.cr_quake.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  cr_blackout — Signal Lost
// ═════════════════════════════════════════════════════════════

function CrBlackout({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <radialGradient id="cr-bk-sky" cx=".5" cy=".35" r=".85">
          <stop offset="0%" stopColor="#3a3e58" />
          <stop offset="55%" stopColor="#1a1e34" />
          <stop offset="100%" stopColor="#050716" />
        </radialGradient>
        <radialGradient id="cr-bk-gloss" cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="cr-bk-moon" cx=".4" cy=".4" r=".6">
          <stop offset="0%" stopColor="#E8ECF0" />
          <stop offset="100%" stopColor="#6A6E80" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="94" fill="url(#cr-bk-sky)" />
      <circle cx="100" cy="100" r="94" fill="url(#cr-bk-gloss)" />

      {/* Stars scattered across the sky */}
      {[[20, 36, 1.1], [48, 22, 0.9], [78, 40, 1], [126, 26, 1.2], [158, 36, 1], [180, 56, 0.9], [16, 76, 0.9], [184, 96, 0.8], [40, 58, 0.7], [66, 16, 0.8], [140, 54, 0.9]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E8ECFF" opacity={0.85} />
      ))}
      {/* Cross-star accents */}
      <g transform="translate(34 38)" opacity="0.8">
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="0.8" />
      </g>
      <g transform="translate(156 76)" opacity="0.7">
        <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="0.7" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="0.7" />
      </g>

      {/* Crescent moon — visible because lights are out */}
      <g transform="translate(42 56)">
        <circle cx="0" cy="0" r="14" fill="url(#cr-bk-moon)" />
        <circle cx="4" cy="-2" r="12" fill="#1a1e34" />
        <circle cx="-3" cy="2" r="1.4" fill="rgba(0,0,0,.25)" />
        <circle cx="-5" cy="-3" r="0.8" fill="rgba(0,0,0,.2)" />
      </g>

      {/* Ground shadow */}
      <ellipse cx="100" cy="170" rx="74" ry="5" fill="rgba(0,0,0,.45)" />

      {/* Dark baseplate */}
      <rect x="14" y="162" width="172" height="12" fill="#0a0c1a" />
      <rect x="14" y="162" width="172" height="3" fill="rgba(140,144,172,.22)" />
      {[24, 42, 60, 78, 96, 114, 132, 150, 168, 184].map((x, i) => (
        <ellipse key={i} cx={x} cy={161.5} rx={3.4} ry={1.3} fill="rgba(140,144,172,.35)" />
      ))}

      {/* Hero LEGO antenna tower — centered, dark, dead */}
      {/* Base brick (wide) */}
      <IsoBrick cx={100} cy={150} w={68} h={20} palette={BRICK.dark} studCols={4} />
      {/* Middle narrower */}
      <IsoBrick cx={100} cy={126} w={48} h={22} palette={BRICK.dark} studCols={3} />
      {/* Top brick with antenna */}
      <IsoBrick cx={100} cy={102} w={30} h={20} palette={BRICK.dark} studCols={2} />
      {/* Antenna mast */}
      <rect x="98" y="56" width="4" height="36" fill="#2A2E44" />
      <rect x="98" y="56" width="4" height="3" fill="rgba(255,255,255,.25)" />
      {/* Cross braces */}
      {[64, 74, 84].map((y, i) => (
        <line key={i} x1="93" y1={y} x2="107" y2={y + 4} stroke="#0a0c1a" strokeWidth="0.9" />
      ))}
      {/* Dead warning light */}
      <circle cx="100" cy="54" r="4" fill="#4A2020" stroke="#1A0608" strokeWidth="1" />
      <circle cx="99" cy="53" r="1.4" fill="rgba(255,200,200,.2)" />

      {/* Broken signal waves radiating out — dashed, dim */}
      <g opacity="0.5" fill="none" strokeLinecap="round" strokeDasharray="4 4" strokeWidth="2">
        <path d="M 112 52 Q 132 56 140 72" stroke="#9CA0BC" />
        <path d="M 118 42 Q 146 46 158 68" stroke="#9CA0BC" opacity="0.7" />
        <path d="M 88 52 Q 68 56 60 72" stroke="#9CA0BC" />
        <path d="M 82 42 Q 54 46 42 68" stroke="#9CA0BC" opacity="0.7" />
      </g>

      {/* Dark cloud drifting across */}
      <ellipse cx="100" cy="84" rx="60" ry="8" fill="rgba(10,12,26,.5)" />
      <ellipse cx="130" cy="76" rx="24" ry="5" fill="rgba(10,12,26,.45)" />

      {/* Big red NO symbol over the antenna */}
      <circle cx="100" cy="102" r="44" fill="none" stroke="rgba(231,76,60,.25)" strokeWidth="10" />
      <circle cx="100" cy="102" r="44" fill="none" stroke="#E74C3C" strokeWidth="5.5" />
      <line x1="70" y1="72" x2="130" y2="132" stroke="#E74C3C" strokeWidth="5.5" strokeLinecap="round" />

      <circle cx="100" cy="100" r="94" fill="none" stroke={DISC.cr_blackout.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  cr_split — The Divide
// ═════════════════════════════════════════════════════════════

function CrSplit({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <radialGradient id="cr-sp-sky" cx=".5" cy=".5" r=".9">
          <stop offset="0%" stopColor="#9060E0" />
          <stop offset="55%" stopColor="#3A1068" />
          <stop offset="100%" stopColor="#0A041A" />
        </radialGradient>
        <radialGradient id="cr-sp-gloss" cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="cr-sp-bolt" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F0B8FF" />
          <stop offset="100%" stopColor="#6020A0" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="94" fill="url(#cr-sp-sky)" />
      <circle cx="100" cy="100" r="94" fill="url(#cr-sp-gloss)" />

      {/* Starfield */}
      {[[20, 34, 1], [48, 22, 0.9], [84, 36, 0.8], [124, 24, 1.2], [166, 32, 1.1], [184, 62, 0.8], [16, 70, 0.9], [38, 52, 0.7], [160, 74, 0.9], [68, 14, 0.8], [148, 14, 0.7]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#F0E8FF" opacity={0.85} />
      ))}
      <g transform="translate(56 60)" opacity="0.7">
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="0.7" />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="0.7" />
      </g>
      <g transform="translate(150 50)" opacity="0.6">
        <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="0.7" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="0.7" />
      </g>

      {/* LEFT green baseplate — tilted toward chasm */}
      <g transform="rotate(-5 44 156)">
        <rect x="10" y="152" width="72" height="16" fill="#2E7A3A" stroke="#0a0420" strokeWidth="1.2" />
        <rect x="10" y="152" width="72" height="3" fill="rgba(255,255,255,.28)" />
        <rect x="10" y="164" width="72" height="3" fill="rgba(0,0,0,.3)" />
        {[18, 34, 50, 66].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={152} rx={3.6} ry={1.3} fill="rgba(255,255,255,.45)" />
            <ellipse cx={x - 1} cy={151.4} rx={1.2} ry={0.5} fill="rgba(255,255,255,.8)" />
          </g>
        ))}
      </g>
      {/* RIGHT green baseplate — tilted the other way */}
      <g transform="rotate(5 156 156)">
        <rect x="118" y="152" width="72" height="16" fill="#2E7A3A" stroke="#0a0420" strokeWidth="1.2" />
        <rect x="118" y="152" width="72" height="3" fill="rgba(255,255,255,.28)" />
        <rect x="118" y="164" width="72" height="3" fill="rgba(0,0,0,.3)" />
        {[134, 150, 166, 182].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={152} rx={3.6} ry={1.3} fill="rgba(255,255,255,.45)" />
            <ellipse cx={x - 1} cy={151.4} rx={1.2} ry={0.5} fill="rgba(255,255,255,.8)" />
          </g>
        ))}
      </g>

      {/* Brick tower on left */}
      <IsoBrick cx={42} cy={138} w={40} h={20} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={42} cy={116} w={30} h={20} palette={BRICK.blue} studCols={2} />
      {/* Brick tower on right */}
      <IsoBrick cx={158} cy={138} w={40} h={20} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={158} cy={116} w={30} h={20} palette={BRICK.red} studCols={2} />

      {/* Broken yellow bridge — two halves dangling inward */}
      <g transform="translate(72 102) rotate(-28)">
        <rect x="-28" y="-5" width="28" height="10" fill={BRICK.yellow.front} stroke="#5a4808" strokeWidth="1" />
        <rect x="-28" y="-5" width="28" height="3" fill={BRICK.yellow.top} />
        <rect x="-28" y="3" width="28" height="2" fill="rgba(0,0,0,.25)" />
        <ellipse cx="-20" cy="-6" rx="3.6" ry="1.4" fill={BRICK.yellow.stud} />
        <ellipse cx="-8" cy="-6" rx="3.6" ry="1.4" fill={BRICK.yellow.stud} />
      </g>
      <g transform="translate(128 102) rotate(28)">
        <rect x="0" y="-5" width="28" height="10" fill={BRICK.yellow.front} stroke="#5a4808" strokeWidth="1" />
        <rect x="0" y="-5" width="28" height="3" fill={BRICK.yellow.top} />
        <rect x="0" y="3" width="28" height="2" fill="rgba(0,0,0,.25)" />
        <ellipse cx="8" cy="-6" rx="3.6" ry="1.4" fill={BRICK.yellow.stud} />
        <ellipse cx="20" cy="-6" rx="3.6" ry="1.4" fill={BRICK.yellow.stud} />
      </g>

      {/* Chasm glow — matches the bolt silhouette */}
      <path d="M 108 22 L 58 118 L 100 118 L 92 178 L 142 82 L 100 82 Z"
        fill="rgba(200,140,255,.35)" />

      {/* HERO lightning bolt — classic feather-style 6-vertex shape */}
      <path d="M 104 28 L 64 114 L 100 114 L 96 172 L 136 86 L 100 86 Z"
        fill="url(#cr-sp-bolt)" stroke="#2a0a5a" strokeWidth="2" strokeLinejoin="round" />
      {/* Bolt highlight along the upper-left edge */}
      <path d="M 104 28 L 64 114"
        stroke="rgba(255,255,255,.85)" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Secondary mini-bolts */}
      <path d="M 112 156 L 124 166 L 118 172 L 126 182" stroke="#F0B8FF" strokeWidth="1.6" fill="none" strokeLinejoin="round" opacity="0.85" />
      <path d="M 92 154 L 80 164 L 86 170 L 78 180" stroke="#F0B8FF" strokeWidth="1.6" fill="none" strokeLinejoin="round" opacity="0.85" />

      {/* Sparks along the bolt */}
      {[[82, 62], [118, 76], [82, 110], [118, 124], [96, 150]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.1 : 1.6} fill="#FFE890" opacity="0.9" />
      ))}
      <Sparkle cx={74} cy={86} r={3.4} fill="#FFFFFF" opacity={0.85} />
      <Sparkle cx={126} cy={96} r={3.2} fill="#FFFFFF" opacity={0.8} />
      <Sparkle cx={100} cy={40} r={2.8} fill="#F0B8FF" opacity={0.9} />

      {/* Pull-apart arrows on the ground */}
      <path d="M 60 184 L 40 184 M 46 178 L 40 184 L 46 190"
        stroke="rgba(255,220,180,.85)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 140 184 L 160 184 M 154 178 L 160 184 L 154 190"
        stroke="rgba(255,220,180,.85)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="100" cy="100" r="94" fill="none" stroke={DISC.cr_split.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════

const REGISTRY: Record<string, (p: Props) => React.JSX.Element> = {
  cr_flood: CrFlood,
  cr_quake: CrQuake,
  cr_blackout: CrBlackout,
  cr_split: CrSplit,
};

export function getCrisisIllustration(id: string): (props: Props) => React.JSX.Element {
  return REGISTRY[id] ?? CrFlood;
}
