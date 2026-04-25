// Clue card illustrations. Each clue is shown as a single iconic LEGO
// construction embodying the concept, on a category-matched disc. The disc
// palette is aligned with CAT_COLORS in PairBuildScreen so card frame + art
// feel like one designed object.
//
// Conventions:
//   viewBox 0 0 200 200, disc radius 94
//   Light source from upper-left. Shadows fall lower-right.
//   Studs are ellipses with a small white highlight at top-left.
//   All 18 illustrations share the same visual vocabulary.

type Props = { size?: number };

type Category = "shape" | "feel" | "story";

// Round Math.sin/cos derived coordinates to 2 decimals so SSR and client
// hydration serialize identical strings. Without this, tiny floating-point
// drift at angles like 180 degrees causes React hydration mismatches.
const r2 = (n: number): number => Math.round(n * 100) / 100;

const CATEGORY_DISC: Record<Category, { light: string; mid: string; dark: string; rim: string }> = {
  // Shape: deep ocean blue with a cyan highlight.
  shape: { light: "#8AE0FF", mid: "#2B8FC8", dark: "#0a2a44", rim: "#0a1a2a" },
  // Feel: ember orange to burnt amber.
  feel: { light: "#FFC08A", mid: "#FF7043", dark: "#6a1e10", rim: "#2a0a06" },
  // Story: lilac to deep violet.
  story: { light: "#D7BAFF", mid: "#8E6CD6", dark: "#3a1a6a", rim: "#1a0a32" },
};

// LEGO brick colors used across the illustrations. Kept shared so the set
// feels like one family.
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

function wrap(size: number): React.CSSProperties {
  return { width: size, height: size, display: "block" };
}

// ───────────────────────────────────────────────
//  Shared primitives
// ───────────────────────────────────────────────

function Disc({ id, cat }: { id: string; cat: Category }) {
  const c = CATEGORY_DISC[cat];
  return (
    <>
      <defs>
        <radialGradient id={`disc-${id}`} cx=".5" cy=".38" r=".85">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={`disc-glow-${id}`} cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill={`url(#disc-${id})`} />
      <circle cx="100" cy="100" r="94" fill={`url(#disc-glow-${id})`} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={c.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
    </>
  );
}

// A 2-stud-wide LEGO brick in 3/4 isometric view. Centered at (cx, cy),
// with configurable stud count across and rows tall. One stud-column ~= 14px.
function IsoBrick({
  cx, cy, w, h, depth = 10, palette, studs = true, studCols,
}: {
  cx: number; cy: number; w: number; h: number;
  depth?: number;
  palette: BrickPalette;
  studs?: boolean;
  studCols?: number;
}) {
  // Top face (parallelogram for isometric feel)
  const d = depth;
  const left = cx - w / 2;
  const top = cy - h / 2;
  const right = cx + w / 2;
  const bottom = cy + h / 2;
  const cols = studCols ?? Math.max(1, Math.round(w / 14));
  return (
    <g>
      {/* Right side face */}
      <polygon
        points={`${right},${top} ${right + d},${top - d * 0.4} ${right + d},${bottom - d * 0.4} ${right},${bottom}`}
        fill={palette.side}
      />
      {/* Front face */}
      <rect x={left} y={top} width={w} height={h} fill={palette.front} />
      <rect x={left} y={top} width={w} height="3" fill="rgba(255,255,255,.18)" />
      <rect x={left} y={bottom - 3} width={w} height="3" fill="rgba(0,0,0,.25)" />
      {/* Top face */}
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill={palette.top}
      />
      <polygon
        points={`${left},${top} ${right},${top} ${right + d},${top - d * 0.4} ${left + d},${top - d * 0.4}`}
        fill="none"
        stroke="rgba(0,0,0,.3)"
        strokeWidth="0.6"
      />
      {/* Studs along the top face */}
      {studs && Array.from({ length: cols }).map((_, i) => {
        const sx = left + (w / cols) * (i + 0.5);
        const sy = top - d * 0.2;
        return (
          <g key={i}>
            {/* Stud cylinder side */}
            <ellipse cx={sx + d * 0.3} cy={sy - d * 0.1} rx={4.2} ry={1.6} fill={palette.side} />
            <rect x={sx - 4.2} y={sy - d * 0.25} width="8.4" height="3" fill={palette.front} />
            {/* Stud top */}
            <ellipse cx={sx} cy={sy - d * 0.25} rx={4.2} ry={1.6} fill={palette.stud} />
            <ellipse cx={sx - 1.2} cy={sy - d * 0.35} rx={1.4} ry={0.55} fill="rgba(255,255,255,.8)" />
          </g>
        );
      })}
    </g>
  );
}

// A soft elliptical ground shadow beneath a subject.
function GroundShadow({ cx, cy, rx, ry = 4, alpha = 0.38 }: { cx: number; cy: number; rx: number; ry?: number; alpha?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`rgba(0,0,0,${alpha})`} />;
}

// A baseplate (green LEGO ground plate) at the bottom of the scene.
function Baseplate({ y = 172, color = "#2E7A3A" }: { y?: number; color?: string }) {
  return (
    <g>
      <rect x="12" y={y} width="176" height="18" fill={color} />
      <rect x="12" y={y} width="176" height="3" fill="rgba(255,255,255,.22)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const sx = 22 + i * 14;
        return (
          <g key={i}>
            <ellipse cx={sx} cy={y - 1} rx={3.6} ry={1.3} fill="rgba(255,255,255,.35)" />
            <ellipse cx={sx - 1} cy={y - 1.6} rx={1.2} ry={0.5} fill="rgba(255,255,255,.7)" />
          </g>
        );
      })}
    </g>
  );
}

// A single 1x1 stud (top-down circle stud) — for ambient detail.
function StudTop({ cx, cy, r = 3.5, color = "#FFD740" }: { cx: number; cy: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.35} fill="rgba(255,255,255,.7)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="0.6" />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════
//  SHAPE (blue disc)
// ═════════════════════════════════════════════════════════════

// Tall: a slim vertical stack of 5 bricks reaching up.
function ClTall({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="tall" cat="shape" />
      <GroundShadow cx={100} cy={170} rx={36} />
      {/* Baseplate fragment */}
      <rect x="70" y="164" width="60" height="8" fill="#234F25" />
      <rect x="70" y="164" width="60" height="2" fill="rgba(255,255,255,.25)" />
      {/* 5 stacked bricks, each ~20 tall */}
      <IsoBrick cx={100} cy={152} w={36} h={20} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={100} cy={128} w={36} h={20} palette={BRICK.yellow} studCols={2} />
      <IsoBrick cx={100} cy={104} w={36} h={20} palette={BRICK.green} studCols={2} />
      <IsoBrick cx={100} cy={80} w={36} h={20} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={100} cy={56} w={36} h={20} palette={BRICK.white} studCols={2} />
      {/* Highlight gleam at top stud */}
      <circle cx="94" cy="42" r="16" fill="rgba(255,255,255,.15)" />
    </svg>
  );
}

// Wide: a long horizontal plate of 6 studs across.
function ClWide({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="wide" cat="shape" />
      <GroundShadow cx={100} cy={160} rx={66} ry={5} />
      {/* Wide plate, 2 bricks tall */}
      <IsoBrick cx={100} cy={132} w={126} h={22} palette={BRICK.yellow} studCols={7} />
      <IsoBrick cx={100} cy={110} w={126} h={22} palette={BRICK.red} studCols={7} />
      {/* Baseplate hint */}
      <rect x="24" y="156" width="152" height="6" fill="#234F25" />
      <rect x="24" y="156" width="152" height="1.5" fill="rgba(255,255,255,.25)" />
    </svg>
  );
}

// Enclosed: a hollow 2x2 brick box, open top — you can see INTO it.
function ClEnclosed({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="enclosed" cat="shape" />
      <GroundShadow cx={100} cy={168} rx={50} />
      {/* Back wall (seen through open top) */}
      <polygon points="62,72 138,72 138,94 62,94" fill="#1a1a22" />
      {/* Interior floor seen from above angle */}
      <polygon points="62,94 138,94 134,116 66,116" fill="#0a0a14" />
      {/* Left wall */}
      <polygon points="62,72 62,140 78,150 78,92" fill={BRICK.tan.side} />
      <rect x="62" y="72" width="16" height="68" fill={BRICK.tan.front} />
      {/* Right wall */}
      <polygon points="138,72 138,140 122,150 122,92" fill={BRICK.tan.side} />
      <rect x="122" y="72" width="16" height="68" fill={BRICK.tan.front} />
      {/* Front wall (lower so we see in) */}
      <rect x="78" y="116" width="44" height="32" fill={BRICK.tan.front} />
      <rect x="78" y="116" width="44" height="3" fill="rgba(255,255,255,.18)" />
      <rect x="78" y="145" width="44" height="3" fill="rgba(0,0,0,.3)" />
      {/* Stud rim along top edges of the walls */}
      {[68, 86, 114, 132].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={72} rx={4.2} ry={1.6} fill={BRICK.tan.stud} />
          <ellipse cx={x - 1.2} cy={71.3} rx={1.4} ry={0.55} fill="rgba(255,255,255,.8)" />
        </g>
      ))}
      {/* Baseplate */}
      <rect x="52" y="148" width="96" height="6" fill="#234F25" />
    </svg>
  );
}

// Pointed: stepped ziggurat narrowing to a single stud at the top.
function ClPointed({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="pointed" cat="shape" />
      <GroundShadow cx={100} cy={170} rx={56} />
      {/* 4 tiers narrowing */}
      <IsoBrick cx={100} cy={150} w={96} h={20} palette={BRICK.blue} studCols={6} />
      <IsoBrick cx={100} cy={128} w={72} h={18} palette={BRICK.blue} studCols={4} />
      <IsoBrick cx={100} cy={108} w={48} h={18} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={100} cy={88} w={24} h={18} palette={BRICK.blue} studCols={1} />
      {/* Single capstone stud with a gleam */}
      <circle cx="98" cy="58" r="22" fill="rgba(255,255,255,.1)" />
      <rect x="94" y="66" width="12" height="14" fill={BRICK.blue.front} />
      <ellipse cx="100" cy="66" rx="6.5" ry="2.4" fill={BRICK.blue.stud} />
      <ellipse cx="98" cy="65" rx="2" ry="0.8" fill="rgba(255,255,255,.8)" />
    </svg>
  );
}

// Opening: a brick arch with clear sky (stars) visible through it.
function ClOpening({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="opening" cat="shape" />
      <GroundShadow cx={100} cy={168} rx={60} />
      {/* Background square so the sky showing through contrasts with disc */}
      <defs>
        <linearGradient id="cl-open-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1028" />
          <stop offset="100%" stopColor="#1a3a6a" />
        </linearGradient>
      </defs>
      {/* Left column */}
      <rect x="46" y="70" width="28" height="86" fill={BRICK.red.front} />
      <rect x="46" y="70" width="28" height="3" fill="rgba(255,255,255,.2)" />
      {/* Column stone lines */}
      {[90, 112, 134].map((y, i) => (
        <line key={i} x1="46" y1={y} x2="74" y2={y} stroke="rgba(0,0,0,.3)" strokeWidth="0.8" />
      ))}
      {/* Right column */}
      <rect x="126" y="70" width="28" height="86" fill={BRICK.red.front} />
      <rect x="126" y="70" width="28" height="3" fill="rgba(255,255,255,.2)" />
      {[90, 112, 134].map((y, i) => (
        <line key={i} x1="126" y1={y} x2="154" y2={y} stroke="rgba(0,0,0,.3)" strokeWidth="0.8" />
      ))}
      {/* Top lintel */}
      <rect x="46" y="52" width="108" height="22" fill={BRICK.red.front} />
      <rect x="46" y="52" width="108" height="3" fill="rgba(255,255,255,.2)" />
      <rect x="46" y="71" width="108" height="3" fill="rgba(0,0,0,.3)" />
      {/* Arch cutout reveals sky */}
      <path d="M74 156 L74 96 Q 100 70 126 96 L126 156 Z" fill="url(#cl-open-sky)" />
      {/* Stars in the arch */}
      <circle cx="90" cy="104" r="1.4" fill="#FFF3D0" />
      <circle cx="108" cy="118" r="1" fill="#FFF3D0" />
      <circle cx="100" cy="92" r="1.2" fill="#FFF3D0" />
      <circle cx="114" cy="100" r="0.8" fill="#FFF3D0" />
      {/* Studs on the top of the lintel */}
      {[64, 86, 108, 130, 152].map((x, i) => (
        <g key={i}>
          <ellipse cx={x - 10} cy="52" rx="4" ry="1.4" fill={BRICK.red.stud} />
          <ellipse cx={x - 11} cy="51.5" rx="1.2" ry="0.5" fill="rgba(255,255,255,.8)" />
        </g>
      ))}
      {/* Baseplate */}
      <rect x="36" y="156" width="128" height="6" fill="#234F25" />
    </svg>
  );
}

// Dense: a solid 4x4 stud block, chunky and weighty.
function ClDense({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="dense" cat="shape" />
      <GroundShadow cx={100} cy={168} rx={58} ry={6} alpha={0.5} />
      {/* Three stacked courses of 4-stud bricks = feels dense */}
      <IsoBrick cx={100} cy={148} w={96} h={26} palette={BRICK.grey} studCols={4} />
      <IsoBrick cx={100} cy={118} w={96} h={26} palette={BRICK.grey} studCols={4} />
      <IsoBrick cx={100} cy={88} w={96} h={26} palette={BRICK.grey} studCols={4} />
      {/* Crack highlights to suggest weight */}
      <line x1="56" y1="90" x2="56" y2="160" stroke="rgba(0,0,0,.35)" strokeWidth="0.8" />
      <line x1="144" y1="90" x2="144" y2="160" stroke="rgba(0,0,0,.35)" strokeWidth="0.8" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  FEEL (orange disc)
// ═════════════════════════════════════════════════════════════

// Safe: a brick house with a warm-glowing window. Shelter feel.
function ClSafe({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="safe" cat="feel" />
      <GroundShadow cx={100} cy={172} rx={52} />
      {/* Glow aura behind the house */}
      <defs>
        <radialGradient id="cl-safe-glow" cx=".5" cy=".6" r=".55">
          <stop offset="0%" stopColor="rgba(255,232,144,.85)" />
          <stop offset="100%" stopColor="rgba(255,232,144,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="120" r="60" fill="url(#cl-safe-glow)" />
      {/* Chimney */}
      <rect x="126" y="68" width="10" height="20" fill={BRICK.red.front} />
      <ellipse cx="131" cy="68" rx="5" ry="1.8" fill={BRICK.red.stud} />
      {/* Smoke puffs */}
      <circle cx="133" cy="58" r="4" fill="rgba(255,255,255,.5)" />
      <circle cx="140" cy="48" r="3" fill="rgba(255,255,255,.4)" />
      <circle cx="146" cy="40" r="2.5" fill="rgba(255,255,255,.3)" />
      {/* House body */}
      <rect x="62" y="104" width="76" height="56" fill={BRICK.tan.front} />
      <rect x="62" y="104" width="76" height="3" fill="rgba(255,255,255,.25)" />
      <rect x="62" y="157" width="76" height="3" fill="rgba(0,0,0,.3)" />
      {/* Pitched roof */}
      <polygon points="54,104 146,104 100,70" fill={BRICK.red.front} />
      <polygon points="54,104 100,70 100,104" fill={BRICK.red.top} />
      <polygon points="54,104 100,70 146,104" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="0.8" />
      {/* Warm window */}
      <rect x="88" y="118" width="24" height="24" fill="#FFD770" />
      <rect x="88" y="118" width="24" height="3" fill="rgba(255,255,255,.5)" />
      <line x1="100" y1="118" x2="100" y2="142" stroke="#6a4a20" strokeWidth="1.2" />
      <line x1="88" y1="130" x2="112" y2="130" stroke="#6a4a20" strokeWidth="1.2" />
      {/* Door */}
      <rect x="93" y="144" width="14" height="16" fill="#5a3a1a" />
      <circle cx="104" cy="152" r="0.8" fill="#FFD740" />
      {/* Baseplate */}
      <rect x="40" y="160" width="120" height="6" fill="#234F25" />
    </svg>
  );
}

// Exposed: one lone minifig on an empty baseplate, spotlight above, long shadow.
function ClExposed({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="exposed" cat="feel" />
      {/* Spotlight cone from top */}
      <defs>
        <linearGradient id="cl-exp-beam" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <polygon points="88,24 112,24 150,170 50,170" fill="url(#cl-exp-beam)" />
      {/* Long slanted shadow */}
      <ellipse cx="120" cy="166" rx="40" ry="5" fill="rgba(0,0,0,.45)" />
      {/* Empty baseplate stretching left and right */}
      <rect x="14" y="164" width="172" height="10" fill="#234F25" />
      <rect x="14" y="164" width="172" height="2.5" fill="rgba(255,255,255,.25)" />
      {Array.from({ length: 10 }).map((_, i) => (
        <StudTop key={i} cx={24 + i * 18} cy={166} r={2.4} color="#4CB050" />
      ))}
      {/* Lone minifig, centered */}
      {/* Legs */}
      <rect x="90" y="136" width="8" height="26" fill="#1E4AD0" />
      <rect x="102" y="136" width="8" height="26" fill="#1E4AD0" />
      <rect x="88" y="158" width="10" height="6" fill="#0a1a40" />
      <rect x="102" y="158" width="10" height="6" fill="#0a1a40" />
      {/* Torso */}
      <rect x="86" y="112" width="28" height="26" fill="#C63535" />
      <rect x="86" y="112" width="28" height="3" fill="rgba(255,255,255,.28)" />
      {/* Arms */}
      <rect x="78" y="116" width="9" height="22" rx="2" fill="#C63535" />
      <rect x="113" y="116" width="9" height="22" rx="2" fill="#C63535" />
      {/* Head */}
      <rect x="90" y="86" width="20" height="24" rx="3" fill="#FFCE45" />
      <rect x="90" y="86" width="20" height="3" rx="3" fill="rgba(255,255,255,.35)" />
      {/* Face */}
      <circle cx="96" cy="97" r="1.4" fill="#0a0a12" />
      <circle cx="104" cy="97" r="1.4" fill="#0a0a12" />
      <path d="M96 104 Q 100 101 104 104" stroke="#0a0a12" strokeWidth="1.2" fill="none" />
      {/* Hair/hat suggestion */}
      <rect x="88" y="80" width="24" height="8" rx="2" fill="#3a2010" />
      {/* Stud on head */}
      <ellipse cx="100" cy="80" rx="4" ry="1.5" fill="#6a4a20" />
    </svg>
  );
}

// Connected: two bricks separated, a bridge brick joining them across the gap.
function ClConnected({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="connected" cat="feel" />
      <GroundShadow cx={100} cy={168} rx={62} />
      {/* Left tower (3 bricks tall) */}
      <IsoBrick cx={58} cy={148} w={32} h={20} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={58} cy={126} w={32} h={20} palette={BRICK.red} studCols={2} />
      <IsoBrick cx={58} cy={104} w={32} h={20} palette={BRICK.red} studCols={2} />
      {/* Right tower */}
      <IsoBrick cx={142} cy={148} w={32} h={20} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={142} cy={126} w={32} h={20} palette={BRICK.blue} studCols={2} />
      <IsoBrick cx={142} cy={104} w={32} h={20} palette={BRICK.blue} studCols={2} />
      {/* Gap between towers is visible (the disc shows through) */}
      {/* BRIDGE brick spanning the gap */}
      <IsoBrick cx={100} cy={82} w={100} h={18} palette={BRICK.yellow} studCols={6} />
      {/* Glow on bridge to emphasize its role */}
      <rect x="48" y="74" width="104" height="4" fill="rgba(255,232,144,.5)" />
      {/* Baseplate */}
      <rect x="20" y="162" width="160" height="6" fill="#234F25" />
    </svg>
  );
}

// Strong: a heavy anchored block — thick base, chained mass feel.
function ClStrong({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="strong" cat="feel" />
      <GroundShadow cx={100} cy={172} rx={72} ry={7} alpha={0.55} />
      {/* Wide stable base brick */}
      <IsoBrick cx={100} cy={156} w={140} h={18} palette={BRICK.dark} studCols={8} />
      {/* Heavy middle block */}
      <IsoBrick cx={100} cy={128} w={108} h={30} palette={BRICK.grey} studCols={6} />
      {/* Top smaller block */}
      <IsoBrick cx={100} cy={92} w={76} h={26} palette={BRICK.grey} studCols={4} />
      {/* Cracks/weathered streaks */}
      <line x1="74" y1="110" x2="78" y2="142" stroke="rgba(0,0,0,.4)" strokeWidth="0.9" />
      <line x1="128" y1="110" x2="124" y2="142" stroke="rgba(0,0,0,.4)" strokeWidth="0.9" />
      <line x1="82" y1="80" x2="84" y2="104" stroke="rgba(0,0,0,.35)" strokeWidth="0.8" />
      {/* Chain/mooring ring on side as a "grounded" cue */}
      <circle cx="52" cy="140" r="6" fill="none" stroke="#3a3a40" strokeWidth="2.5" />
      <line x1="52" y1="146" x2="52" y2="160" stroke="#3a3a40" strokeWidth="2.5" />
      <circle cx="148" cy="140" r="6" fill="none" stroke="#3a3a40" strokeWidth="2.5" />
      <line x1="148" y1="146" x2="148" y2="160" stroke="#3a3a40" strokeWidth="2.5" />
    </svg>
  );
}

// Fragile: a wobbly precarious stack with a tilted brick on top about to fall.
function ClFragile({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="fragile" cat="feel" />
      <GroundShadow cx={100} cy={172} rx={28} ry={3} alpha={0.35} />
      {/* Narrow tippy stack offset slightly with each level */}
      <g>
        <IsoBrick cx={100} cy={154} w={30} h={18} palette={BRICK.white} studCols={2} />
        <IsoBrick cx={104} cy={134} w={22} h={18} palette={BRICK.white} studCols={1} />
        <IsoBrick cx={96} cy={114} w={22} h={18} palette={BRICK.white} studCols={1} />
        <IsoBrick cx={106} cy={94} w={20} h={18} palette={BRICK.white} studCols={1} />
      </g>
      {/* The TILTED brick about to fall */}
      <g transform="translate(110 70) rotate(22)">
        <rect x="-12" y="-10" width="24" height="18" fill={BRICK.red.front} />
        <rect x="-12" y="-10" width="24" height="3" fill="rgba(255,255,255,.28)" />
        <rect x="-12" y="4" width="24" height="3" fill="rgba(0,0,0,.3)" />
        <ellipse cx="0" cy="-12" rx="4.2" ry="1.6" fill={BRICK.red.stud} />
        <ellipse cx="-1.2" cy="-12.5" rx="1.4" ry="0.55" fill="rgba(255,255,255,.8)" />
      </g>
      {/* Motion/wobble lines */}
      <path d="M80 60 Q 90 50 100 60" stroke="rgba(255,255,255,.5)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M126 70 Q 134 60 142 70" stroke="rgba(255,255,255,.5)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Tiny detached stud falling */}
      <circle cx="136" cy="90" r="3" fill={BRICK.white.stud} />
      <circle cx="136" cy="90" r="3" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="0.6" />
      {/* Base */}
      <rect x="40" y="166" width="120" height="6" fill="#234F25" />
    </svg>
  );
}

// Busy: multiple minifigs crossing a plaza, motion lines.
function ClBusy({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="busy" cat="feel" />
      <GroundShadow cx={100} cy={174} rx={74} ry={5} />
      {/* Plaza plate */}
      <rect x="20" y="140" width="160" height="28" fill={BRICK.tan.top} />
      <rect x="20" y="140" width="160" height="3" fill="rgba(255,255,255,.25)" />
      <rect x="20" y="166" width="160" height="3" fill="rgba(0,0,0,.3)" />
      {/* Stud rows on plaza */}
      {[34, 54, 74, 94, 114, 134, 154, 174].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={145} rx={4.5} ry={1.5} fill={BRICK.tan.stud} />
          <ellipse cx={x - 1.2} cy={144.3} rx={1.4} ry={0.5} fill="rgba(255,255,255,.7)" />
        </g>
      ))}
      {/* 4 mini minifigs crossing */}
      {[
        { x: 48, color: "#C63535" },
        { x: 82, color: "#2B8FC8" },
        { x: 118, color: "#4CB050" },
        { x: 154, color: "#B388FF" },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x} 106)`}>
          <rect x="-3" y="18" width="3" height="14" fill="#0a1a40" />
          <rect x="0" y="18" width="3" height="14" fill="#0a1a40" />
          <rect x="-4" y="6" width="8" height="14" fill={f.color} />
          <rect x="-5" y="0" width="10" height="8" rx="1.5" fill="#FFCE45" />
          <circle cx="-2" cy="4" r="0.6" fill="#0a0a12" />
          <circle cx="2" cy="4" r="0.6" fill="#0a0a12" />
          <ellipse cx="0" cy="-2" rx="2.8" ry="0.9" fill="#8A6E10" />
        </g>
      ))}
      {/* Horizontal motion lines */}
      <path d="M20 120 L 44 120" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M156 128 L 180 128" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 132 L 50 132" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M150 118 L 172 118" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  STORY (violet disc)
// ═════════════════════════════════════════════════════════════

// First: a sprouting seedling next to a single foundational brick.
function ClFirst({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="first" cat="story" />
      <GroundShadow cx={100} cy={172} rx={58} />
      {/* Foundation brick */}
      <IsoBrick cx={100} cy={150} w={90} h={26} palette={BRICK.yellow} studCols={5} />
      {/* Soil mound on top of brick */}
      <path d="M76 138 Q 100 128 124 138 L 124 142 L 76 142 Z" fill="#5a3a1a" />
      {/* Seedling sprout */}
      <line x1="100" y1="138" x2="100" y2="80" stroke="#2E7A3A" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 110 Q 78 104 72 88 Q 96 92 100 110" fill="#4CB050" />
      <path d="M100 96 Q 122 90 128 74 Q 104 78 100 96" fill="#4CB050" />
      <path d="M100 84 Q 94 70 100 58 Q 106 70 100 84" fill="#8ADE8E" />
      {/* Sunburst rays */}
      {[-40, -20, 0, 20, 40].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={r2(100 + Math.sin(rad) * 34)}
            y1={r2(50 - Math.cos(rad) * 34)}
            x2={r2(100 + Math.sin(rad) * 46)}
            y2={r2(50 - Math.cos(rad) * 46)}
            stroke="#FFE890"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        );
      })}
      <circle cx="100" cy="50" r="9" fill="#FFE890" opacity="0.85" />
    </svg>
  );
}

// Last: checkered flag planted on a final brick — the finish line.
function ClLast({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="last" cat="story" />
      <GroundShadow cx={100} cy={172} rx={50} />
      {/* Final brick podium */}
      <IsoBrick cx={100} cy={152} w={84} h={22} palette={BRICK.red} studCols={4} />
      <IsoBrick cx={100} cy={128} w={60} h={20} palette={BRICK.red} studCols={3} />
      {/* Flag pole */}
      <rect x="97" y="50" width="4" height="76" fill="#2a1a10" />
      {/* Flag cloth, checkered */}
      <rect x="101" y="54" width="48" height="32" fill="#ffffff" />
      {/* Checker pattern */}
      {Array.from({ length: 4 }).map((_, row) => (
        Array.from({ length: 6 }).map((_, col) => {
          const filled = (row + col) % 2 === 0;
          if (!filled) return null;
          return <rect key={`${row}-${col}`} x={101 + col * 8} y={54 + row * 8} width="8" height="8" fill="#0a0a14" />;
        })
      ))}
      {/* Wave suggestion on flag trailing edge */}
      <path d="M149 54 Q 146 70 149 86" stroke="rgba(0,0,0,.35)" strokeWidth="1" fill="none" />
      {/* Finial on pole top */}
      <circle cx="99" cy="48" r="4" fill={BRICK.yellow.top} />
      <circle cx="98" cy="47" r="1.3" fill="rgba(255,255,255,.7)" />
    </svg>
  );
}

// Hidden: a closed brick chest with a tiny gem peeking out.
function ClHidden({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="hidden" cat="story" />
      <GroundShadow cx={100} cy={172} rx={60} />
      {/* Chest body */}
      <rect x="50" y="108" width="100" height="56" fill={BRICK.tan.front} />
      <rect x="50" y="108" width="100" height="3" fill="rgba(255,255,255,.28)" />
      <rect x="50" y="161" width="100" height="3" fill="rgba(0,0,0,.35)" />
      {/* Vertical slats */}
      {[72, 94, 116, 138].map((x, i) => (
        <line key={i} x1={x} y1={108} x2={x} y2={164} stroke="rgba(0,0,0,.3)" strokeWidth="0.9" />
      ))}
      {/* Chest lid (slightly lifted) */}
      <path d="M46 108 L 154 108 L 152 82 Q 100 68 48 82 Z" fill={BRICK.tan.front} />
      <path d="M46 108 L 154 108 L 152 82 Q 100 68 48 82 Z" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="0.9" />
      <path d="M48 82 Q 100 68 152 82" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" fill="none" />
      {/* Iron band */}
      <rect x="46" y="100" width="108" height="6" fill="#3a2a1a" />
      {/* Keyhole lock */}
      <rect x="95" y="120" width="10" height="14" fill="#3a2a1a" />
      <circle cx="100" cy="124" r="2" fill={BRICK.yellow.top} />
      <rect x="99" y="124" width="2" height="5" fill={BRICK.yellow.top} />
      {/* GEM glowing from the gap under the lid */}
      <g transform="translate(125 94)">
        <polygon points="0,-6 6,0 0,8 -6,0" fill="#8ADEFF" />
        <polygon points="0,-6 6,0 0,0" fill="#C8F0FF" />
        <circle cx="0" cy="0" r="10" fill="rgba(160,230,255,.45)" />
      </g>
      {/* Sparkles */}
      <g fill="#FFF3D0">
        <circle cx="140" cy="84" r="1.4" />
        <circle cx="116" cy="82" r="1" />
        <circle cx="132" cy="74" r="0.8" />
      </g>
      {/* Baseplate */}
      <rect x="32" y="164" width="136" height="6" fill="#234F25" />
    </svg>
  );
}

// Landmark: a tall beacon tower with radiating rays — the eye-catcher.
function ClLandmark({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="landmark" cat="story" />
      {/* Radiating rays behind */}
      {[-60, -40, -20, 0, 20, 40, 60].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={r2(100 + Math.sin(rad) * 20)}
            y1={r2(64 - Math.cos(rad) * 20)}
            x2={r2(100 + Math.sin(rad) * 62)}
            y2={r2(64 - Math.cos(rad) * 62)}
            stroke="#FFE890"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.6"
          />
        );
      })}
      <GroundShadow cx={100} cy={172} rx={46} />
      {/* Tower body (tall, slim) */}
      <rect x="84" y="90" width="32" height="74" fill={BRICK.white.front} />
      <rect x="84" y="90" width="32" height="3" fill="rgba(255,255,255,.5)" />
      {/* Red stripes (lighthouse style) */}
      <rect x="84" y="108" width="32" height="8" fill={BRICK.red.front} />
      <rect x="84" y="132" width="32" height="8" fill={BRICK.red.front} />
      <rect x="84" y="156" width="32" height="8" fill={BRICK.red.front} />
      {/* Balcony gallery */}
      <rect x="78" y="82" width="44" height="8" fill={BRICK.grey.front} />
      {/* Lantern room */}
      <rect x="86" y="62" width="28" height="22" fill="#FFD770" />
      <rect x="86" y="62" width="28" height="3" fill="rgba(255,255,255,.5)" />
      {/* Little windows in lantern */}
      <line x1="96" y1="62" x2="96" y2="84" stroke="#6a4a20" strokeWidth="1" />
      <line x1="104" y1="62" x2="104" y2="84" stroke="#6a4a20" strokeWidth="1" />
      {/* Dome top */}
      <path d="M84 62 L 116 62 L 100 44 Z" fill={BRICK.red.front} />
      <circle cx="100" cy="40" r="3" fill={BRICK.yellow.top} />
      {/* Baseplate */}
      <rect x="40" y="164" width="120" height="6" fill="#234F25" />
      {/* Glow */}
      <circle cx="100" cy="72" r="34" fill="rgba(255,232,144,.2)" />
    </svg>
  );
}

// Gather: a ring of 4 minifigs around a central table brick.
function ClGather({ size = 120 }: Props) {
  const figs = [
    { x: 60, y: 130, color: "#C63535" },
    { x: 140, y: 130, color: "#2B8FC8" },
    { x: 78, y: 88, color: "#4CB050" },
    { x: 122, y: 88, color: "#FFA030" },
  ];
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="gather" cat="story" />
      <GroundShadow cx={100} cy={172} rx={60} />
      {/* Circular plaza */}
      <ellipse cx="100" cy="130" rx="72" ry="26" fill={BRICK.tan.top} />
      <ellipse cx="100" cy="130" rx="72" ry="26" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
      <ellipse cx="100" cy="126" rx="72" ry="26" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1" />
      {/* Stud dots on the plaza */}
      {[44, 64, 84, 100, 116, 136, 156].map((x, i) => (
        <ellipse key={i} cx={x} cy={130} rx={3.5} ry={1.2} fill={BRICK.tan.stud} opacity="0.85" />
      ))}
      {/* Central table brick */}
      <IsoBrick cx={100} cy={118} w={34} h={16} palette={BRICK.yellow} studCols={2} />
      {/* 4 minifigs around */}
      {figs.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          {/* Legs */}
          <rect x="-4" y="8" width="3.5" height="12" fill="#0a1a40" />
          <rect x="0.5" y="8" width="3.5" height="12" fill="#0a1a40" />
          {/* Torso */}
          <rect x="-6" y="-6" width="12" height="14" fill={f.color} />
          <rect x="-6" y="-6" width="12" height="2.5" fill="rgba(255,255,255,.3)" />
          {/* Arms */}
          <rect x="-10" y="-4" width="4" height="12" rx="1" fill={f.color} />
          <rect x="6" y="-4" width="4" height="12" rx="1" fill={f.color} />
          {/* Head */}
          <rect x="-5" y="-18" width="10" height="12" rx="1.5" fill="#FFCE45" />
          <circle cx="-2" cy="-12" r="0.7" fill="#0a0a12" />
          <circle cx="2" cy="-12" r="0.7" fill="#0a0a12" />
          <ellipse cx="0" cy="-19" rx="3.5" ry="1.1" fill="#8A6E10" />
        </g>
      ))}
      {/* Speech-cluster dots above center */}
      <circle cx="90" cy="58" r="2.5" fill="rgba(255,255,255,.7)" />
      <circle cx="100" cy="50" r="3" fill="rgba(255,255,255,.8)" />
      <circle cx="110" cy="58" r="2.5" fill="rgba(255,255,255,.7)" />
    </svg>
  );
}

// Edge: a brick tile at the corner of a platform, void beyond.
function ClEdge({ size = 120 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="edge" cat="story" />
      {/* Dark void at the right showing the disc */}
      {/* Platform (left 60%) */}
      <defs>
        <linearGradient id="cl-edge-void" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,.55)" />
        </linearGradient>
      </defs>
      <rect x="14" y="108" width="120" height="56" fill={BRICK.tan.top} />
      {/* Platform top highlight */}
      <rect x="14" y="108" width="120" height="4" fill="rgba(255,255,255,.3)" />
      {/* Platform front face going down */}
      <polygon points="14,164 134,164 132,180 16,180" fill={BRICK.tan.side} />
      {/* Stud rows on the platform */}
      {[24, 44, 64, 84, 104, 124].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={114} rx={4} ry={1.4} fill={BRICK.tan.stud} />
          <ellipse cx={x - 1.1} cy={113.4} rx={1.2} ry={0.5} fill="rgba(255,255,255,.7)" />
        </g>
      ))}
      {[24, 44, 64, 84, 104, 124].map((x, i) => (
        <g key={`b-${i}`}>
          <ellipse cx={x} cy={140} rx={4} ry={1.4} fill={BRICK.tan.stud} opacity=".85" />
        </g>
      ))}
      {/* THE EDGE brick — bright red, sitting right at the cliff */}
      <IsoBrick cx={118} cy={96} w={32} h={18} palette={BRICK.red} studCols={2} />
      {/* Crumbling rubble going off the edge */}
      <circle cx="140" cy="118" r="3" fill={BRICK.tan.side} />
      <circle cx="146" cy="128" r="2.4" fill={BRICK.tan.side} opacity=".7" />
      <circle cx="150" cy="142" r="2" fill={BRICK.tan.side} opacity=".5" />
      <circle cx="156" cy="156" r="1.6" fill={BRICK.tan.side} opacity=".4" />
      {/* Void gradient on the right */}
      <rect x="134" y="18" width="52" height="162" fill="url(#cl-edge-void)" />
      {/* A few distant stars in the void to sell "beyond" */}
      <circle cx="156" cy="52" r="1.1" fill="#FFF3D0" opacity=".8" />
      <circle cx="172" cy="78" r="0.9" fill="#FFF3D0" opacity=".7" />
      <circle cx="164" cy="104" r="0.8" fill="#FFF3D0" opacity=".6" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  Registry
// ═════════════════════════════════════════════════════════════

const REGISTRY: Record<string, (p: Props) => React.JSX.Element> = {
  cl_tall: ClTall,
  cl_wide: ClWide,
  cl_enclosed: ClEnclosed,
  cl_pointed: ClPointed,
  cl_opening: ClOpening,
  cl_dense: ClDense,
  cl_safe: ClSafe,
  cl_exposed: ClExposed,
  cl_connected: ClConnected,
  cl_strong: ClStrong,
  cl_fragile: ClFragile,
  cl_busy: ClBusy,
  cl_first: ClFirst,
  cl_last: ClLast,
  cl_hidden: ClHidden,
  cl_landmark: ClLandmark,
  cl_gather: ClGather,
  cl_edge: ClEdge,
};

export function getClueIllustration(cardId: string): (props: Props) => React.JSX.Element {
  return REGISTRY[cardId] ?? ClTall;
}
