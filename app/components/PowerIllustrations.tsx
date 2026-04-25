// Power card illustrations. Five one-time abilities rendered as rich layered
// LEGO scenes with the same craft bar as the clue and district illustrations:
// two bricks trading places through paired portals, a tower sheltered in a
// hex force-field, a brick teleporting along a glowing arc, a crystal orb
// of revelation on a gold stand, and a gold-reinforced double link.

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
  gold: { top: "#FFD046", front: "#D49520", side: "#8A5E10", stud: "#FFE890" },
};

type BrickPalette = (typeof BRICK)[keyof typeof BRICK];

const DISC: Record<string, { light: string; mid: string; dark: string; rim: string }> = {
  pw_swap: { light: "#FFE890", mid: "#FFB020", dark: "#7A4A08", rim: "#2A1804" },
  pw_shield: { light: "#A8F0C4", mid: "#3CA05E", dark: "#1A4A2A", rim: "#0A1E12" },
  pw_move: { light: "#90DEFF", mid: "#2B8FC8", dark: "#0A3A5A", rim: "#04182A" },
  pw_reveal: { light: "#DCBFFF", mid: "#8E6CD6", dark: "#3A1A6A", rim: "#1A0A32" },
  pw_double: { light: "#FFC8A0", mid: "#FF8040", dark: "#8A2A08", rim: "#2A0A04" },
};

function wrap(size: number): React.CSSProperties {
  return { width: size, height: size, display: "block" };
}

function Disc({ id }: { id: string }) {
  const c = DISC[id];
  return (
    <>
      <defs>
        <radialGradient id={`pw-disc-${id}`} cx=".5" cy=".38" r=".85">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={`pw-gloss-${id}`} cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill={`url(#pw-disc-${id})`} />
      <circle cx="100" cy="100" r="94" fill={`url(#pw-gloss-${id})`} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={c.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
    </>
  );
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
            <ellipse cx={sx + d * 0.3} cy={sy - d * 0.1} rx={4.2} ry={1.6} fill={palette.side} />
            <rect x={sx - 4.2} y={sy - d * 0.25} width="8.4" height="3" fill={palette.front} />
            <ellipse cx={sx} cy={sy - d * 0.25} rx={4.2} ry={1.6} fill={palette.stud} />
            <ellipse cx={sx - 1.2} cy={sy - d * 0.35} rx={1.4} ry={0.55} fill="rgba(255,255,255,.8)" />
          </g>
        );
      })}
    </g>
  );
}

function GroundShadow({ cx, cy, rx, ry = 4, alpha = 0.4 }: { cx: number; cy: number; rx: number; ry?: number; alpha?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`rgba(0,0,0,${alpha})`} />;
}

function Sparkle({ cx, cy, r = 4, fill = "#FFFFFF", opacity = 0.9 }: { cx: number; cy: number; r?: number; fill?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={`M ${cx} ${cy - r * 1.6} L ${cx + r * 0.35} ${cy - r * 0.35} L ${cx + r * 1.6} ${cy} L ${cx + r * 0.35} ${cy + r * 0.35} L ${cx} ${cy + r * 1.6} L ${cx - r * 0.35} ${cy + r * 0.35} L ${cx - r * 1.6} ${cy} L ${cx - r * 0.35} ${cy - r * 0.35} Z`} fill={fill} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════
//  pw_swap — Trade Places
// ═════════════════════════════════════════════════════════════

function PwSwap({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pw_swap" />
      <defs>
        <radialGradient id="pw-sw-portalL" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFC850" />
          <stop offset="100%" stopColor="#6A3A00" />
        </radialGradient>
        <radialGradient id="pw-sw-portalR" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFC850" />
          <stop offset="100%" stopColor="#6A3A00" />
        </radialGradient>
      </defs>
      <GroundShadow cx={100} cy={176} rx={80} ry={6} alpha={0.35} />

      {/* Baseplate */}
      <rect x="12" y="166" width="176" height="14" fill="#6A3A00" />
      <rect x="12" y="166" width="176" height="3" fill="rgba(255,255,255,.22)" />
      {[24, 44, 64, 84, 104, 124, 144, 164, 184].map((x, i) => (
        <g key={i}>
          <ellipse cx={x - 2} cy={166} rx={3.4} ry={1.3} fill="rgba(255,255,255,.28)" />
        </g>
      ))}

      {/* Left portal pad */}
      <ellipse cx="48" cy="162" rx="30" ry="8" fill="url(#pw-sw-portalL)" opacity="0.7" />
      <ellipse cx="48" cy="162" rx="22" ry="6" fill="none" stroke="#FFE890" strokeWidth="1.5" />
      <ellipse cx="48" cy="162" rx="12" ry="3.6" fill="#FFF8D0" opacity="0.85" />

      {/* Right portal pad */}
      <ellipse cx="152" cy="162" rx="30" ry="8" fill="url(#pw-sw-portalR)" opacity="0.7" />
      <ellipse cx="152" cy="162" rx="22" ry="6" fill="none" stroke="#FFE890" strokeWidth="1.5" />
      <ellipse cx="152" cy="162" rx="12" ry="3.6" fill="#FFF8D0" opacity="0.85" />

      {/* Bricks mid-swap — left brick hovering above right portal area */}
      <IsoBrick cx={152} cy={132} w={42} h={22} palette={BRICK.blue} studCols={2} />
      {/* Right brick hovering above left portal area */}
      <IsoBrick cx={48} cy={132} w={42} h={22} palette={BRICK.red} studCols={2} />

      {/* Vertical light beams rising from portals (hints that they just teleported) */}
      <rect x="42" y="140" width="12" height="22" fill="rgba(255,232,144,.3)" />
      <rect x="146" y="140" width="12" height="22" fill="rgba(255,232,144,.3)" />

      {/* Top swap arc (left → right) */}
      <path d="M 60 116 Q 100 44 140 116"
        stroke="#FFE890" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 60 116 Q 100 44 140 116"
        stroke="rgba(255,255,255,.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="144,116 132,106 130,122" fill="#FFE890" stroke="#8A6A10" strokeWidth="0.8" />

      {/* Bottom swap arc (right → left) */}
      <path d="M 140 148 Q 100 188 60 148"
        stroke="#FFE890" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.95" />
      <polygon points="56,148 68,138 70,154" fill="#FFE890" stroke="#8A6A10" strokeWidth="0.8" />

      {/* Sparkles */}
      <Sparkle cx={86} cy={70} r={3.5} fill="#FFFFFF" />
      <Sparkle cx={120} cy={62} r={3} fill="#FFF3D0" />
      <Sparkle cx={100} cy={90} r={2.4} fill="#FFFFFF" opacity={0.8} />
      <Sparkle cx={30} cy={110} r={2.2} fill="#FFE890" opacity={0.85} />
      <Sparkle cx={170} cy={104} r={2.2} fill="#FFE890" opacity={0.85} />

      {/* Motion blur streaks near bricks */}
      <line x1="72" y1="130" x2="86" y2="130" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="114" y1="130" x2="128" y2="130" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  pw_shield — Force Field
// ═════════════════════════════════════════════════════════════

function PwShield({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pw_shield" />
      <defs>
        <radialGradient id="pw-sh-bubble" cx=".35" cy=".3" r=".75">
          <stop offset="0%" stopColor="rgba(240,255,248,.7)" />
          <stop offset="50%" stopColor="rgba(120,240,170,.28)" />
          <stop offset="100%" stopColor="rgba(40,120,60,.18)" />
        </radialGradient>
        <radialGradient id="pw-sh-apex" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#66DD8E" />
        </radialGradient>
        <linearGradient id="pw-sh-bolt" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="100%" stopColor="#FFB030" />
        </linearGradient>
      </defs>

      {/* Stars above */}
      {[[30, 34, 0.9], [62, 22, 0.8], [142, 26, 1], [172, 36, 0.9]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E8FFE8" opacity="0.75" />
      ))}

      {/* Lightning bolt from upper-left striking the dome */}
      <g>
        <path d="M 22 26 L 30 46 L 42 44 L 52 66 L 64 62"
          stroke="rgba(255,255,200,.3)" strokeWidth="8" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 22 26 L 30 46 L 42 44 L 52 66 L 64 62"
          stroke="url(#pw-sh-bolt)" strokeWidth="3.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 22 26 L 30 46 L 42 44 L 52 66"
          stroke="#FFFFFF" strokeWidth="1.2" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <GroundShadow cx={100} cy={176} rx={66} ry={6} />

      {/* Green baseplate with studs */}
      <rect x="20" y="168" width="160" height="12" fill="#234F25" stroke="#0A1E12" strokeWidth="1.2" />
      <rect x="20" y="168" width="160" height="3" fill="rgba(255,255,255,.28)" />
      {[28, 46, 64, 82, 100, 118, 136, 154, 172].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={167.5} rx={3.6} ry={1.3} fill="rgba(200,255,220,.55)" />
          <ellipse cx={x - 1} cy={166.8} rx={1.2} ry={0.5} fill="rgba(255,255,255,.8)" />
        </g>
      ))}

      {/* Brick tower inside the bubble */}
      <IsoBrick cx={100} cy={156} w={60} h={22} palette={BRICK.green} studCols={3} />
      <IsoBrick cx={100} cy={130} w={46} h={22} palette={BRICK.green} studCols={2} />
      <IsoBrick cx={100} cy={106} w={32} h={20} palette={BRICK.green} studCols={2} />

      {/* Shield emblem on middle brick */}
      <g transform="translate(100 130)">
        <path d="M -10 -11 L 10 -11 L 10 2 Q 10 11 0 15 Q -10 11 -10 2 Z"
          fill="rgba(230,255,236,.96)" stroke="#1A6A2A" strokeWidth="1.6" />
        <path d="M -5 -1 L -1 4 L 7 -6"
          stroke="#1A6A2A" strokeWidth="2.4"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* ROUND force-field bubble — translucent dome */}
      <circle cx="100" cy="108" r="72" fill="url(#pw-sh-bubble)"
        stroke="#66DD8E" strokeWidth="3" />
      {/* Inner ring */}
      <circle cx="100" cy="108" r="64" fill="none"
        stroke="rgba(224,255,232,.55)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Sheen on upper left */}
      <path d="M 48 80 Q 60 50 96 44"
        stroke="rgba(255,255,255,.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 50 102 Q 50 86 60 74"
        stroke="rgba(255,255,255,.3)" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Impact flash where bolt meets dome */}
      <circle cx="64" cy="62" r="10" fill="rgba(255,255,255,.55)" />
      <circle cx="64" cy="62" r="6" fill="#FFFFFF" />
      <circle cx="64" cy="62" r="14" fill="none" stroke="#FFF3D0" strokeWidth="1.2" opacity="0.7" />
      {/* Ricochet sparks */}
      <path d="M 64 62 L 48 52" stroke="#FFF3D0" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 64 62 L 54 74" stroke="#FFF3D0" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 64 62 L 76 52" stroke="#FFF3D0" strokeWidth="1.4" strokeLinecap="round" />

      {/* Apex pulse at top of dome */}
      <circle cx="100" cy="36" r="5" fill="url(#pw-sh-apex)" />
      <circle cx="100" cy="36" r="9" fill="none" stroke="rgba(208,255,224,.55)" strokeWidth="1.2" />
      <circle cx="100" cy="36" r="14" fill="none" stroke="rgba(208,255,224,.3)" strokeWidth="0.8" />

      {/* Interior sparkles */}
      <Sparkle cx={128} cy={86} r={2.6} fill="#D0FFE0" opacity={0.85} />
      <Sparkle cx={80} cy={94} r={2.2} fill="#D0FFE0" opacity={0.8} />
      <Sparkle cx={140} cy={130} r={2} fill="#FFFFFF" opacity={0.7} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  pw_move — Relocate
// ═════════════════════════════════════════════════════════════

function PwMove({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pw_move" />
      <defs>
        <radialGradient id="pw-mv-pad" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#8ACBF5" />
          <stop offset="100%" stopColor="#1A4E78" />
        </radialGradient>
        <linearGradient id="pw-mv-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(138,203,245,.9)" />
          <stop offset="100%" stopColor="rgba(138,203,245,0)" />
        </linearGradient>
      </defs>

      {/* Stars in sky */}
      {[[28, 30, 0.9], [52, 20, 0.7], [170, 24, 1], [184, 60, 0.9], [14, 54, 0.8], [160, 44, 0.8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E8F4FF" opacity="0.8" />
      ))}

      <GroundShadow cx={100} cy={176} rx={80} ry={6} />
      {/* Baseplate */}
      <rect x="12" y="166" width="176" height="14" fill="#1A3A58" />
      <rect x="12" y="166" width="176" height="3" fill="rgba(255,255,255,.22)" />
      {[24, 44, 64, 84, 104, 124, 144, 164, 184].map((x, i) => (
        <ellipse key={i} cx={x - 2} cy={166} rx={3.4} ry={1.3} fill="rgba(255,255,255,.25)" />
      ))}

      {/* Origin slot (left) — dashed empty outline with poof */}
      <rect x="28" y="148" width="46" height="18" fill="none" stroke="rgba(255,255,255,.75)"
        strokeWidth="1.8" strokeDasharray="4 3" rx="2" />
      <ellipse cx="52" cy="166" rx="24" ry="4" fill="rgba(255,255,255,.25)" />
      {/* Dust poof clouds */}
      <circle cx="38" cy="154" r="5" fill="rgba(255,255,255,.35)" />
      <circle cx="30" cy="150" r="3.6" fill="rgba(255,255,255,.3)" />
      <circle cx="66" cy="152" r="4" fill="rgba(255,255,255,.3)" />
      <circle cx="74" cy="148" r="3" fill="rgba(255,255,255,.25)" />

      {/* Destination pad (right) — glowing */}
      <ellipse cx="148" cy="166" rx="30" ry="8" fill="url(#pw-mv-pad)" opacity="0.75" />
      <ellipse cx="148" cy="166" rx="22" ry="6" fill="none" stroke="#8ACBF5" strokeWidth="1.6" />
      <ellipse cx="148" cy="166" rx="11" ry="3.4" fill="#FFF3D0" opacity="0.9" />

      {/* Light beams from destination pad */}
      <rect x="144" y="100" width="8" height="66" fill="url(#pw-mv-beam)" opacity="0.8" />
      <rect x="132" y="120" width="4" height="46" fill="url(#pw-mv-beam)" opacity="0.5" />
      <rect x="160" y="120" width="4" height="46" fill="url(#pw-mv-beam)" opacity="0.5" />

      {/* Arcing dashed trajectory */}
      <path d="M 52 148 Q 100 16 148 148" fill="none" stroke="#FFE890"
        strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
      {/* Trajectory glow */}
      <path d="M 52 148 Q 100 16 148 148" fill="none" stroke="rgba(255,232,144,.3)"
        strokeWidth="7" />

      {/* Brick at apex */}
      <IsoBrick cx={100} cy={56} w={50} h={24} palette={BRICK.blue} studCols={3} />

      {/* Particle trail following the arc */}
      <circle cx="70" cy="98" r="2.2" fill="#FFE890" opacity="0.9" />
      <circle cx="82" cy="72" r="1.8" fill="#FFE890" opacity="0.85" />
      <circle cx="120" cy="72" r="1.8" fill="#FFE890" opacity="0.85" />
      <circle cx="132" cy="98" r="2.2" fill="#FFE890" opacity="0.9" />
      <Sparkle cx={60} cy={120} r={2.6} fill="#FFFFFF" opacity={0.85} />
      <Sparkle cx={140} cy={122} r={2.6} fill="#FFFFFF" opacity={0.85} />
      <Sparkle cx={100} cy={36} r={3} fill="#FFFFFF" />

      {/* Arrow head at target */}
      <polygon points="138,142 150,156 156,144" fill="#FFE890" stroke="#8A6A10" strokeWidth="0.8" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  pw_reveal — Crisis Override  (crystal orb on gold stand)
// ═════════════════════════════════════════════════════════════

function PwReveal({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pw_reveal" />
      <defs>
        <radialGradient id="pw-rv-orb" cx=".4" cy=".35" r=".65">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#F0CFFF" />
          <stop offset="70%" stopColor="#A868E0" />
          <stop offset="100%" stopColor="#3A1068" />
        </radialGradient>
        <linearGradient id="pw-rv-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE890" />
          <stop offset="55%" stopColor="#D49520" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <radialGradient id="pw-rv-aura" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="rgba(255,220,255,.65)" />
          <stop offset="100%" stopColor="rgba(255,220,255,0)" />
        </radialGradient>
      </defs>

      {/* Starfield */}
      {[[22, 26, 1.1], [50, 16, 0.9], [80, 28, 0.8], [160, 22, 1.2], [186, 40, 0.9], [16, 58, 1], [178, 80, 0.8], [24, 112, 0.8], [176, 120, 0.9], [108, 14, 0.7]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#F0E0FF" opacity={0.85} />
      ))}

      {/* Radiating beams from orb. Coordinates rounded to 2 decimals so SSR
          serialization matches client hydration exactly (Math.sin/cos at
          angles like 180 degrees produces tiny floating-point drift between
          Node and browser V8 otherwise). */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const r = (n: number) => Math.round(n * 100) / 100;
        return (
          <line key={i}
            x1={r(100 + Math.cos(rad) * 46)}
            y1={r(90 + Math.sin(rad) * 46)}
            x2={r(100 + Math.cos(rad) * (i % 2 ? 84 : 90))}
            y2={r(90 + Math.sin(rad) * (i % 2 ? 84 : 90))}
            stroke="#FFE890" strokeWidth={i % 2 ? 1.8 : 3}
            strokeLinecap="round" opacity={i % 2 ? 0.5 : 0.85}
          />
        );
      })}

      {/* Aura behind orb */}
      <circle cx="100" cy="90" r="56" fill="url(#pw-rv-aura)" />

      {/* Gold stand base */}
      <ellipse cx="100" cy="170" rx="44" ry="8" fill="rgba(0,0,0,.4)" />
      <rect x="60" y="160" width="80" height="12" rx="2" fill="url(#pw-rv-gold)" stroke="#3A1A04" strokeWidth="1.4" />
      <rect x="60" y="160" width="80" height="3" rx="2" fill="rgba(255,255,255,.5)" />
      {/* Stand pillar */}
      <rect x="78" y="138" width="44" height="24" fill="url(#pw-rv-gold)" stroke="#3A1A04" strokeWidth="1.2" />
      <rect x="78" y="138" width="44" height="3" fill="rgba(255,255,255,.5)" />
      {/* Cradle claws */}
      <path d="M 78 138 Q 78 124 92 122" stroke="#8A5E10" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 122 138 Q 122 124 108 122" stroke="#8A5E10" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 92 122 Q 100 116 108 122" stroke="#8A5E10" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Crystal orb */}
      <circle cx="100" cy="90" r="34" fill="url(#pw-rv-orb)" stroke="#2A0A48" strokeWidth="1.8" />
      {/* Swirl inside orb */}
      <path d="M 82 82 Q 100 70 118 88 Q 110 100 96 96 Q 86 92 82 82 Z"
        fill="rgba(255,255,255,.35)" />
      <path d="M 88 104 Q 100 110 114 104" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" fill="none" />
      {/* Orb glint */}
      <ellipse cx="90" cy="78" rx="8" ry="4" fill="rgba(255,255,255,.75)" transform="rotate(-30 90 78)" />
      <circle cx="96" cy="74" r="2" fill="#FFFFFF" />

      {/* Floating magical glyphs/runes */}
      <g fill="#FFE890" opacity="0.9">
        {/* Rune 1 — star */}
        <g transform="translate(36 76)">
          <path d="M 0 -7 L 2 -2 L 7 -1 L 3 2 L 5 8 L 0 4 L -5 8 L -3 2 L -7 -1 L -2 -2 Z" />
        </g>
        {/* Rune 2 — crescent */}
        <g transform="translate(164 74)">
          <path d="M -5 -5 A 6 6 0 1 0 -5 5 A 4 4 0 1 1 -5 -5 Z" />
        </g>
        {/* Rune 3 — triangle */}
        <g transform="translate(44 130)">
          <polygon points="0,-6 5,4 -5,4" fill="none" stroke="#FFE890" strokeWidth="1.6" />
          <circle cx="0" cy="0" r="1.2" fill="#FFE890" />
        </g>
        {/* Rune 4 — bolt */}
        <g transform="translate(158 126)">
          <path d="M -2 -7 L -5 1 L -1 1 L -4 8 L 4 -1 L 0 -1 L 3 -7 Z" />
        </g>
      </g>

      {/* Sparkles */}
      <Sparkle cx={68} cy={44} r={3} fill="#FFFFFF" />
      <Sparkle cx={132} cy={48} r={2.6} fill="#FFFFFF" opacity={0.9} />
      <Sparkle cx={148} cy={100} r={2.4} fill="#F0E0FF" opacity={0.85} />
      <Sparkle cx={52} cy={104} r={2.4} fill="#F0E0FF" opacity={0.85} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  pw_double — Double Link
// ═════════════════════════════════════════════════════════════

function PwDouble({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pw_double" />
      <defs>
        <linearGradient id="pw-db-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="45%" stopColor="#FFD046" />
          <stop offset="100%" stopColor="#8A5E10" />
        </linearGradient>
        <radialGradient id="pw-db-aura" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="rgba(255,232,144,.7)" />
          <stop offset="100%" stopColor="rgba(255,232,144,0)" />
        </radialGradient>
      </defs>

      {/* Aura behind the gold link */}
      <ellipse cx="100" cy="108" rx="82" ry="38" fill="url(#pw-db-aura)" />

      <GroundShadow cx={100} cy={176} rx={76} ry={6} />
      {/* Baseplate */}
      <rect x="12" y="166" width="176" height="14" fill="#234F25" />
      <rect x="12" y="166" width="176" height="3" fill="rgba(255,255,255,.22)" />
      {[24, 42, 60, 78, 96, 114, 132, 150, 168, 184].map((x, i) => (
        <ellipse key={i} cx={x} cy={166} rx={3.4} ry={1.3} fill="rgba(255,255,255,.28)" />
      ))}

      {/* Left anchor brick tower */}
      <IsoBrick cx={40} cy={156} w={36} h={22} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={40} cy={132} w={36} h={22} palette={BRICK.red} studCols={2} />

      {/* Right anchor brick tower */}
      <IsoBrick cx={160} cy={156} w={36} h={22} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={160} cy={132} w={36} h={22} palette={BRICK.blue} studCols={2} />

      {/* Gold link slab between them */}
      <rect x="56" y="92" width="88" height="36" rx="5" fill="url(#pw-db-gold)"
        stroke="#5A3A08" strokeWidth="1.8" />
      <rect x="56" y="92" width="88" height="7" rx="5" fill="rgba(255,255,255,.55)" />
      <rect x="56" y="122" width="88" height="4" rx="1" fill="rgba(0,0,0,.22)" />
      {/* Studs on gold link */}
      {[68, 84, 116, 132].map((x, i) => (
        <g key={i}>
          <ellipse cx={x + 2} cy={90} rx={4.4} ry={1.6} fill="#8A5E10" />
          <rect x={x - 4.4} y={87.5} width="8.8" height="3" fill="#D49520" />
          <ellipse cx={x} cy={87.5} rx={4.4} ry={1.7} fill="#FFE890" />
          <ellipse cx={x - 1.4} cy={86.7} rx={1.5} ry={0.6} fill="rgba(255,255,255,.9)" />
        </g>
      ))}

      {/* Rivet caps on the ends */}
      <circle cx="62" cy="118" r="2.8" fill="#8A5E10" />
      <circle cx="62" cy="118" r="1.2" fill="#FFE890" />
      <circle cx="138" cy="118" r="2.8" fill="#8A5E10" />
      <circle cx="138" cy="118" r="1.2" fill="#FFE890" />

      {/* Lightning energy running through the link */}
      <path d="M 62 110 L 76 102 L 88 112 L 102 100 L 114 112 L 126 102 L 138 110"
        stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M 62 110 L 76 102 L 88 112 L 102 100 L 114 112 L 126 102 L 138 110"
        stroke="#FFE890" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* 2x badge */}
      <g transform="translate(100 110)">
        <circle cx="0" cy="0" r="16" fill="#3A1A10" stroke="#FFE890" strokeWidth="2.2" />
        <circle cx="0" cy="0" r="13" fill="none" stroke="rgba(255,232,144,.4)" strokeWidth="0.8" />
        <text x="0" y="5.5" textAnchor="middle"
          fontFamily="'Black Han Sans', sans-serif"
          fontSize="16" fontWeight="900" fill="#FFE890" letterSpacing="0.3">2x</text>
      </g>

      {/* Absorbing-a-hit crack stopped by the link */}
      <path d="M 100 46 L 94 60 L 104 70 L 96 82" stroke="#FFE890"
        strokeWidth="2.4" fill="none" strokeLinejoin="round" opacity="0.9" />
      <path d="M 100 46 L 94 60 L 104 70 L 96 82" stroke="#FFFFFF"
        strokeWidth="0.8" fill="none" strokeLinejoin="round" />
      {/* Impact flash at top of link */}
      <circle cx="100" cy="90" r="5" fill="rgba(255,255,255,.8)" />
      <circle cx="100" cy="90" r="9" fill="none" stroke="rgba(255,232,144,.6)" strokeWidth="1" />

      {/* Sparkle stars */}
      <Sparkle cx={72} cy={66} r={3.2} fill="#FFFFFF" />
      <Sparkle cx={128} cy={62} r={2.8} fill="#FFF3D0" />
      <Sparkle cx={50} cy={104} r={2.2} fill="#FFE890" opacity={0.85} />
      <Sparkle cx={150} cy={104} r={2.2} fill="#FFE890" opacity={0.85} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════

const REGISTRY: Record<string, (p: Props) => React.JSX.Element> = {
  pw_swap: PwSwap,
  pw_shield: PwShield,
  pw_move: PwMove,
  pw_reveal: PwReveal,
  pw_double: PwDouble,
  // New cards share a visual language with existing ones until dedicated
  // illustrations land. Relay reuses the Reveal eye (mystical comms);
  // Foresight also reads as sight/premonition via the same mark.
  pw_relay: PwReveal,
  pw_foresight: PwReveal,
};

export function getPowerIllustration(id: string): (props: Props) => React.JSX.Element {
  return REGISTRY[id] ?? PwSwap;
}
