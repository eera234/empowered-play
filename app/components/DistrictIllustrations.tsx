"use client";

// Per-district SVG illustrations. Each is unique to its district name: a
// canopy looks like a canopy, a lighthouse like a lighthouse. Keyed by
// "${scenarioId}_${slug(districtName)}" so they never collide across
// scenarios. Style matches SCENARIO_ILLUSTRATIONS (gradient backgrounds,
// character-rich, soft shadows).

type Props = { size?: number };

// Round trig-derived coordinates to 2 decimals so SSR/client hydration
// serialize identical strings and React doesn't flag a mismatch.
const r2 = (n: number): number => Math.round(n * 100) / 100;

function wrap(size: number): React.CSSProperties {
  return { width: size, height: size, display: "block" };
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function makeDistrictKey(scenarioId: string, districtName: string): string {
  return `${scenarioId}_${slug(districtName)}`;
}

// ─────────────────────────────────────────────────────────────
// Generic fallback for scenarios whose illustrations haven't shipped yet.
// A small LEGO brick silhouette with a question-mark stud.
// ─────────────────────────────────────────────────────────────
function GenericBrickPlaceholder({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="ph-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2842" />
          <stop offset="100%" stopColor="#0a1828" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#ph-bg)" />
      <rect x="50" y="90" width="100" height="55" rx="4" fill="#FFD740" />
      <rect x="50" y="90" width="100" height="8" fill="rgba(255,255,255,.35)" />
      {[70, 100, 130].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="80" r="10" fill="#FFD740" />
          <circle cx={cx} cy="80" r="10" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
        </g>
      ))}
      <text
        x="100" y="130" textAnchor="middle"
        fontFamily="'Black Han Sans', sans-serif"
        fontSize="22" fill="#0a0a12" letterSpacing="2"
      >?</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  HARBORSIDE (rising_tides): 8 districts
// ═════════════════════════════════════════════════════════════

function Lighthouse({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="lh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081a38" />
          <stop offset="100%" stopColor="#1a3a5a" />
        </linearGradient>
        <linearGradient id="lh-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2a44" />
          <stop offset="100%" stopColor="#06182a" />
        </linearGradient>
        <radialGradient id="lh-beacon" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#FFE8A0" stopOpacity=".95" />
          <stop offset="100%" stopColor="#FFC040" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#lh-sky)" />
      {/* Moon and stars */}
      <circle cx="165" cy="30" r="10" fill="#FFF3D0" opacity=".9" />
      {[[20, 20], [60, 30], [130, 45], [180, 60], [40, 50]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="#FFF3D0" opacity=".7" />
      ))}
      {/* Beacon glow */}
      <circle cx="100" cy="72" r="55" fill="url(#lh-beacon)" />
      {/* Rocky base */}
      <path d="M60 160 L72 148 L82 152 L96 144 L112 150 L128 146 L140 158 L200 158 L200 200 L0 200 L0 160 Z" fill="#1a2a38" />
      <path d="M60 160 L72 148 L82 152 L96 144 L112 150 L128 146 L140 158" stroke="rgba(255,255,255,.1)" strokeWidth="1" fill="none" />
      {/* Sea */}
      <rect x="0" y="160" width="200" height="40" fill="url(#lh-sea)" />
      {[[20, 175], [60, 180], [110, 175], [160, 180]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q 6 -3 12 0 q 6 3 12 0`} stroke="rgba(180,220,255,.35)" strokeWidth="1" fill="none" />
      ))}
      {/* Lighthouse body */}
      <rect x="90" y="82" width="20" height="72" fill="#EAEAEA" />
      {[92, 106, 120, 134].map((sy, i) => (
        <rect key={i} x="90" y={sy} width="20" height="6" fill="#C43A3A" />
      ))}
      <rect x="90" y="82" width="20" height="4" fill="rgba(255,255,255,.5)" />
      <rect x="106" y="82" width="4" height="72" fill="rgba(0,0,0,.25)" />
      {/* Gallery */}
      <rect x="86" y="76" width="28" height="6" fill="#3a3a3a" />
      {/* Lantern room */}
      <rect x="88" y="66" width="24" height="10" fill="#2a2a2a" />
      <rect x="90" y="60" width="20" height="7" fill="#FFE8A0" opacity=".8" />
      <rect x="88" y="66" width="24" height="1.5" fill="rgba(255,255,255,.4)" />
      {/* Roof */}
      <polygon points="84,60 116,60 100,44" fill="#C43A3A" />
      <polygon points="84,60 100,44 100,60" fill="rgba(255,255,255,.2)" />
      <rect x="98" y="38" width="4" height="8" fill="#8A2820" />
      <circle cx="100" cy="36" r="2.5" fill="#FFE890" />
      {/* Beam */}
      <path d="M100 68 L170 40 L170 80 Z" fill="#FFE890" opacity=".18" />
      <path d="M100 68 L30 42 L30 78 Z" fill="#FFE890" opacity=".12" />
    </svg>
  );
}

function Lowlands({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="ll-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#142a42" />
          <stop offset="100%" stopColor="#2a4a68" />
        </linearGradient>
        <linearGradient id="ll-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a54" />
          <stop offset="100%" stopColor="#0a1a28" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#ll-sky)" />
      {/* Sea on horizon */}
      <rect x="0" y="68" width="200" height="28" fill="url(#ll-sea)" />
      {[[10, 80], [55, 84], [110, 82], [165, 86]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q 5 -2 10 0 q 5 2 10 0`} stroke="rgba(180,220,255,.3)" strokeWidth=".8" fill="none" />
      ))}
      {/* Distant hills */}
      <path d="M0 92 L40 80 L80 88 L130 78 L170 86 L200 82 L200 104 L0 104 Z" fill="#2a3a48" opacity=".8" />
      {/* Ground */}
      <rect x="0" y="100" width="200" height="100" fill="#2a3a22" />
      {/* Grass tufts */}
      {[[14, 110], [40, 108], [70, 112], [95, 106], [130, 108], [165, 110], [185, 106]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5" ry="1.5" fill="#4a6a2a" opacity=".7" />
      ))}
      {/* Flood line */}
      <path d="M0 122 L200 122" stroke="rgba(90,140,190,.45)" strokeWidth=".8" strokeDasharray="3 4" />
      {/* Wide spread of low cottages */}
      {[
        { x: 18, w: 30, h: 22, roof: "#8C3A2A", wall: "#DDBFA0" },
        { x: 54, w: 28, h: 22, roof: "#6B4A2A", wall: "#E8D8B0" },
        { x: 88, w: 32, h: 20, roof: "#8C3A2A", wall: "#D8C28A" },
        { x: 126, w: 28, h: 22, roof: "#6B4A2A", wall: "#DDBFA0" },
        { x: 158, w: 28, h: 20, roof: "#8C3A2A", wall: "#E8D8B0" },
      ].map((c, i) => {
        const y = 160 - c.h;
        return (
          <g key={i}>
            <rect x={c.x} y={y} width={c.w} height={c.h} fill={c.wall} />
            <rect x={c.x} y={y} width={c.w} height="2" fill="rgba(255,255,255,.25)" />
            <rect x={c.x + c.w - 4} y={y} width="4" height={c.h} fill="rgba(0,0,0,.2)" />
            <polygon points={`${c.x - 3},${y} ${c.x + c.w + 3},${y} ${c.x + c.w / 2},${y - 10}`} fill={c.roof} />
            <rect x={c.x + c.w / 2 - 3} y={y + c.h - 10} width="6" height="8" rx=".5" fill="#FFD070" opacity=".9" />
          </g>
        );
      })}
      {/* Water reflection at edges */}
      <rect x="0" y="155" width="200" height="6" fill="rgba(90,140,190,.25)" />
    </svg>
  );
}

function Seawall({ size = 160 }: Props) {
  // A massive stone defensive wall, sea crashing against the OUTSIDE (left
  // side) while the INSIDE (right side) sits calm and dry. The wall is the
  // subject: 70% of the frame height, clearly thick stone, with one tiny
  // figure on top for scale.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a58" />
          <stop offset="100%" stopColor="#5a7092" />
        </linearGradient>
        <linearGradient id="sw-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a7aA0" />
          <stop offset="100%" stopColor="#0a2040" />
        </linearGradient>
        <linearGradient id="sw-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7060" />
          <stop offset="100%" stopColor="#4a4238" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#sw-sky)" />
      {/* Stormy sea on the OUTSIDE of the wall (left half) */}
      <rect x="0" y="70" width="90" height="110" fill="url(#sw-sea)" />
      <path d="M0 82 Q 22 74 44 82 T 88 82" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" fill="none" />
      <path d="M0 98 Q 22 88 44 98 T 88 98" stroke="rgba(255,255,255,.25)" strokeWidth="1" fill="none" />
      {/* Dry, calm land INSIDE (right half) */}
      <rect x="90" y="140" width="110" height="60" fill="#3a4a28" />
      <path d="M90 140 Q 140 135 200 140" stroke="rgba(255,255,255,.12)" strokeWidth="1" fill="none" />
      {/* THE WALL - dominant vertical stone structure */}
      <rect x="74" y="50" width="32" height="140" fill="url(#sw-stone)" />
      <rect x="74" y="50" width="32" height="6" fill="rgba(255,255,255,.25)" />
      <rect x="100" y="50" width="6" height="140" fill="rgba(0,0,0,.3)" />
      {/* Stone block pattern - clear horizontal courses */}
      {[62, 76, 90, 104, 118, 132, 146, 160, 174].map((y, rowIdx) => (
        <g key={rowIdx}>
          <line x1="74" y1={y} x2="106" y2={y} stroke="rgba(0,0,0,.5)" strokeWidth="1" />
          {rowIdx % 2 === 0 ? (
            <line x1="90" y1={y} x2="90" y2={y + 14} stroke="rgba(0,0,0,.5)" strokeWidth=".7" />
          ) : (
            <>
              <line x1="82" y1={y} x2="82" y2={y + 14} stroke="rgba(0,0,0,.5)" strokeWidth=".7" />
              <line x1="98" y1={y} x2="98" y2={y + 14} stroke="rgba(0,0,0,.5)" strokeWidth=".7" />
            </>
          )}
        </g>
      ))}
      {/* Battlement crenellations on top */}
      <rect x="74" y="44" width="6" height="8" fill="url(#sw-stone)" />
      <rect x="86" y="44" width="6" height="8" fill="url(#sw-stone)" />
      <rect x="98" y="44" width="8" height="8" fill="url(#sw-stone)" />
      {/* Huge wave smashing against the outside face of the wall */}
      <path d="M0 92 Q 30 70 60 82 Q 70 56 74 90 L74 130 Q 50 110 20 120 Q 6 115 0 130 Z"
        fill="rgba(200,230,255,.85)" />
      <path d="M30 82 Q 45 68 60 78" stroke="white" strokeWidth="1.5" fill="none" opacity=".9" />
      <path d="M44 100 Q 58 92 68 104" stroke="white" strokeWidth="1.2" fill="none" opacity=".8" />
      {/* Spray dots */}
      {[[46, 68], [58, 58], [66, 62], [48, 78], [30, 72]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.8} fill="rgba(240,250,255,.95)" />
      ))}
      {/* Wave splashing over the top */}
      <path d="M70 44 Q 80 34 90 46" stroke="white" strokeWidth="1.5" fill="none" opacity=".9" />
      {[[72, 36], [80, 30], [86, 34]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill="rgba(240,250,255,.9)" />
      ))}
      {/* One lone keeper on top of wall for scale */}
      <g transform="translate(90 30)">
        <circle cx="0" cy="0" r="3" fill="#e3b58a" />
        <rect x="-2.5" y="2.5" width="5" height="9" rx="1.5" fill="#3a4a58" />
        <rect x="-3" y="11" width="2" height="5" fill="#2a1a10" />
        <rect x="1" y="11" width="2" height="5" fill="#2a1a10" />
        {/* Lantern */}
        <rect x="3" y="3" width="3" height="4" fill="#FFD740" />
        <circle cx="4.5" cy="5" r="3" fill="rgba(255,232,144,.4)" />
      </g>
      {/* Label clarity: wave/sea arrow pushing AGAINST the wall */}
      <path d="M34 154 L60 154" stroke="rgba(144,200,255,.45)" strokeWidth="2" strokeLinecap="round" markerEnd="" />
      <polygon points="58,150 66,154 58,158" fill="rgba(144,200,255,.45)" />
    </svg>
  );
}

function Crossing({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="cr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20324a" />
          <stop offset="100%" stopColor="#4a6a88" />
        </linearGradient>
        <linearGradient id="cr-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a5478" />
          <stop offset="100%" stopColor="#0a1a30" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#cr-sky)" />
      {/* Shores left + right */}
      <path d="M0 120 L42 114 L50 128 L0 130 Z" fill="#2a3a22" />
      <path d="M200 120 L158 114 L150 128 L200 130 Z" fill="#2a3a22" />
      <ellipse cx="22" cy="118" rx="12" ry="2" fill="#4a6a2a" opacity=".7" />
      <ellipse cx="178" cy="118" rx="12" ry="2" fill="#4a6a2a" opacity=".7" />
      {/* Sea */}
      <rect x="0" y="128" width="200" height="60" fill="url(#cr-sea)" />
      {[[10, 145], [40, 150], [90, 148], [130, 152], [180, 146]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q 5 -2 10 0 q 5 2 10 0`} stroke="rgba(180,220,255,.35)" strokeWidth=".8" fill="none" />
      ))}
      {/* Bridge deck: long horizontal wood */}
      <rect x="35" y="110" width="130" height="6" fill="#8C4A2A" />
      <rect x="35" y="110" width="130" height="2" fill="rgba(255,255,255,.25)" />
      {[42, 58, 74, 90, 106, 122, 138, 154].map((x, i) => (
        <line key={i} x1={x} y1="110" x2={x} y2="116" stroke="#5a2a18" strokeWidth=".8" />
      ))}
      {/* Railings */}
      <line x1="35" y1="106" x2="165" y2="106" stroke="#6a3820" strokeWidth="1.5" />
      {[45, 65, 85, 105, 125, 145].map((x, i) => (
        <line key={i} x1={x} y1="106" x2={x} y2="110" stroke="#6a3820" strokeWidth="1" />
      ))}
      {/* Supports / piers */}
      {[72, 100, 128].map((x, i) => (
        <rect key={i} x={x - 2} y="116" width="4" height="24" fill="#5a2a18" />
      ))}
      {/* Small boat passing under */}
      <g transform="translate(88 150)">
        <path d="M0 0 q 12 -4 24 0 l -2 6 q -10 2 -20 0 Z" fill="#5a3a20" />
        <rect x="10" y="-9" width="1.2" height="10" fill="#3a2010" />
        <polygon points="11.2,-9 11.2,-1 20,-1" fill="#EEE0B8" />
      </g>
      {/* Lanterns hanging from rails */}
      <circle cx="50" cy="105" r="2" fill="#FFD070" opacity=".9" />
      <circle cx="150" cy="105" r="2" fill="#FFD070" opacity=".9" />
    </svg>
  );
}

function SignalFire({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1030" />
          <stop offset="100%" stopColor="#3a1a28" />
        </linearGradient>
        <radialGradient id="sf-glow" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="#FFC840" stopOpacity=".8" />
          <stop offset="100%" stopColor="#FF4020" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#sf-sky)" />
      {/* Stars */}
      {[[20, 30], [170, 25], [50, 45], [150, 55], [95, 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#FFF3D0" opacity=".7" />
      ))}
      {/* Fire glow */}
      <circle cx="100" cy="90" r="65" fill="url(#sf-glow)" />
      {/* Stone brazier base */}
      <polygon points="72,170 128,170 118,145 82,145" fill="#4a4a4a" />
      <rect x="82" y="140" width="36" height="8" fill="#5a5a5a" />
      <rect x="82" y="140" width="36" height="2" fill="rgba(255,255,255,.2)" />
      {/* Stones as detail */}
      {[80, 95, 110].map((x, i) => (
        <rect key={i} x={x} y="152" width="12" height="8" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth=".8" />
      ))}
      {/* Logs */}
      <line x1="84" y1="140" x2="120" y2="140" stroke="#3a2010" strokeWidth="3" />
      <line x1="88" y1="138" x2="116" y2="142" stroke="#2a1408" strokeWidth="2" />
      {/* Flame: layered */}
      <path d="M100 140 Q 80 120 90 100 Q 95 90 100 82 Q 105 90 110 100 Q 120 120 100 140 Z" fill="#FF8020" />
      <path d="M100 135 Q 88 118 95 102 Q 100 92 100 84 Q 100 92 105 102 Q 112 118 100 135 Z" fill="#FFC040" />
      <path d="M100 128 Q 94 115 98 106 Q 100 98 100 94 Q 100 98 102 106 Q 106 115 100 128 Z" fill="#FFE890" />
      {/* Embers */}
      {[[88, 68, 1.2], [112, 65, 1], [94, 50, .8], [108, 48, 1]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFE890" opacity=".85" />
      ))}
      {/* Ground */}
      <rect x="0" y="170" width="200" height="30" fill="#1a0a08" />
    </svg>
  );
}

function MarketDock({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="md-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a58" />
          <stop offset="100%" stopColor="#6a6a48" />
        </linearGradient>
        <linearGradient id="md-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a4a68" />
          <stop offset="100%" stopColor="#0a1828" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#md-sky)" />
      {/* Sea */}
      <rect x="0" y="120" width="200" height="80" fill="url(#md-sea)" />
      {[[15, 150], [50, 155], [115, 152], [170, 158]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q 4 -2 8 0 q 4 2 8 0`} stroke="rgba(180,220,255,.3)" strokeWidth=".7" fill="none" />
      ))}
      {/* Dock platform */}
      <rect x="20" y="115" width="160" height="8" fill="#8a5a30" />
      <rect x="20" y="115" width="160" height="2" fill="rgba(255,255,255,.25)" />
      {[30, 50, 70, 90, 110, 130, 150, 170].map((x, i) => (
        <rect key={i} x={x} y="123" width="3" height="24" fill="#5a2a18" />
      ))}
      {/* Stringer line of crates */}
      {[
        [35, 100, 18, 14, "#8a5a30"],
        [55, 95, 20, 18, "#C4A038"],
        [80, 96, 22, 18, "#8a5a30"],
        [105, 100, 16, 14, "#6a4020"],
        [125, 94, 24, 20, "#C4A038"],
        [155, 100, 18, 14, "#8a5a30"],
      ].map(([x, y, w, h, color], i) => (
        <g key={i}>
          <rect x={x as number} y={y as number} width={w as number} height={h as number} fill={color as string} />
          <rect x={x as number} y={y as number} width={w as number} height="2" fill="rgba(255,255,255,.25)" />
          <line x1={x as number} y1={(y as number) + (h as number) / 2} x2={(x as number) + (w as number)} y2={(y as number) + (h as number) / 2} stroke="rgba(0,0,0,.3)" strokeWidth=".6" />
        </g>
      ))}
      {/* Overhead lantern string */}
      <path d="M15 80 Q 100 70 185 80" stroke="rgba(200,200,200,.4)" strokeWidth=".6" fill="none" />
      {[30, 60, 90, 120, 150, 180].map((x, i) => {
        const y = r2(70 + Math.sin((x - 15) / 30) * 2);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y + 4} stroke="#5a5a5a" strokeWidth=".6" />
            <circle cx={x} cy={y + 7} r="3" fill="#FFD070" opacity=".9" />
            <circle cx={x} cy={y + 7} r="1.5" fill="#FFE890" />
          </g>
        );
      })}
      {/* Fisherman figure */}
      <g transform="translate(150 95)">
        <rect x="-3" y="-6" width="7" height="14" fill="#4a5a7a" />
        <rect x="-4" y="-14" width="9" height="9" rx="1.5" fill="#FFD740" />
        <circle cx=".5" cy="-18" r="4" fill="#FFDAB0" />
        <circle cx=".5" cy="-18" r="4" fill="none" stroke="#2a1a10" strokeWidth=".4" />
        <polygon points="-4,-21 5,-21 .5,-26" fill="#3a2a1a" />
      </g>
      {/* Seagull */}
      <path d="M155 30 q 3 -3 6 0 q 3 -3 6 0" stroke="white" strokeWidth="1" fill="none" opacity=".9" />
    </svg>
  );
}

function SafeRoom({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="sr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1830" />
          <stop offset="100%" stopColor="#2a3a58" />
        </linearGradient>
        <radialGradient id="sr-window" cx=".5" cy=".5" r=".7">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".9" />
          <stop offset="100%" stopColor="#FFD070" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#sr-sky)" />
      {/* Snow-flecked stars */}
      {[[30, 25], [170, 35], [90, 18], [140, 50]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#FFF3D0" opacity=".7" />
      ))}
      {/* Ground (snow) */}
      <rect x="0" y="155" width="200" height="45" fill="#d8e0ea" opacity=".85" />
      <path d="M0 155 Q 40 148 80 155 Q 120 150 160 156 Q 180 153 200 156 L200 170 L0 170 Z" fill="rgba(255,255,255,.18)" />
      {/* Glow from window */}
      <circle cx="100" cy="120" r="55" fill="url(#sr-window)" />
      {/* Stone cottage */}
      <rect x="72" y="100" width="56" height="58" fill="#6a6a6a" />
      <rect x="72" y="100" width="56" height="4" fill="rgba(255,255,255,.25)" />
      <rect x="124" y="100" width="4" height="58" fill="rgba(0,0,0,.28)" />
      {/* Stone pattern */}
      {[0, 2].map((row) => (
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`sc-${row}-${col}`}
            x={72 + col * 14 + (row % 2 ? -4 : 4)}
            y={106 + row * 18}
            width="13" height="17"
            fill="none" stroke="rgba(0,0,0,.3)" strokeWidth=".5"
          />
        ))
      ))}
      {/* Thick stone roof */}
      <polygon points="64,100 136,100 100,74" fill="#4a4a4a" />
      <polygon points="64,100 100,74 100,100" fill="rgba(255,255,255,.15)" />
      <rect x="60" y="100" width="80" height="4" fill="#3a3a3a" />
      {/* Tiny chimney with a puff */}
      <rect x="114" y="80" width="6" height="14" fill="#5a5a5a" />
      <circle cx="117" cy="70" r="4" fill="rgba(220,220,220,.45)" />
      <circle cx="122" cy="62" r="3" fill="rgba(220,220,220,.35)" />
      {/* Warm window */}
      <rect x="90" y="118" width="20" height="22" fill="#FFD070" />
      <rect x="90" y="118" width="20" height="3" fill="rgba(255,255,255,.4)" />
      <line x1="100" y1="118" x2="100" y2="140" stroke="#3a2a10" strokeWidth="1" />
      <line x1="90" y1="129" x2="110" y2="129" stroke="#3a2a10" strokeWidth="1" />
      {/* Door */}
      <rect x="93" y="144" width="14" height="14" fill="#3a2a1a" />
      <rect x="93" y="144" width="14" height="2" fill="rgba(255,255,255,.2)" />
      <circle cx="104" cy="151" r=".8" fill="#FFD740" />
    </svg>
  );
}

function HarborGate({ size = 160 }: Props) {
  // A massive stone gatehouse at the mouth of the harbor. Two huge stone
  // towers flanking a wide water passage, a raised iron portcullis visible
  // in the arch. A sailing ship is framed directly under the arch, clearly
  // entering the harbor. Palette matches the rest of Harborside: cool blue
  // dusk sky, dark sea, cool grey stone.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <linearGradient id="hg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081a38" />
          <stop offset="100%" stopColor="#2a3a58" />
        </linearGradient>
        <linearGradient id="hg-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2a44" />
          <stop offset="100%" stopColor="#06182a" />
        </linearGradient>
        <linearGradient id="hg-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a6a72" />
          <stop offset="100%" stopColor="#2e2e38" />
        </linearGradient>
        <radialGradient id="hg-moon" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#FFF3D0" stopOpacity=".55" />
          <stop offset="100%" stopColor="#FFF3D0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Dusk sky backdrop */}
      <rect width="200" height="200" rx="10" fill="url(#hg-sky)" />
      {/* Moon + stars (same as Lighthouse) */}
      <circle cx="100" cy="46" r="22" fill="url(#hg-moon)" />
      <circle cx="100" cy="46" r="9" fill="#FFF3D0" opacity=".85" />
      {[[20, 20], [60, 30], [140, 22], [175, 40], [40, 52], [160, 60]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill="#FFF3D0" opacity=".7" />
      ))}
      {/* Harbor water inside the gate */}
      <rect x="0" y="140" width="200" height="60" fill="url(#hg-sea)" />
      {[[16, 154], [48, 160], [116, 156], [156, 162], [182, 166]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q 5 -2 10 0 q 5 2 10 0`} stroke="rgba(180,220,255,.35)" strokeWidth=".9" fill="none" />
      ))}
      {/* Moon reflection on water */}
      <path d="M90 148 Q 100 150 110 148" stroke="rgba(255,243,208,.45)" strokeWidth="1" fill="none" />
      <path d="M86 156 Q 100 158 114 156" stroke="rgba(255,243,208,.3)" strokeWidth="1" fill="none" />
      {/* LEFT TOWER */}
      <rect x="14" y="40" width="46" height="140" fill="url(#hg-stone)" />
      <rect x="14" y="40" width="46" height="5" fill="rgba(255,255,255,.25)" />
      <rect x="56" y="40" width="4" height="140" fill="rgba(0,0,0,.35)" />
      {/* Crenellations on top */}
      <rect x="14" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="26" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="38" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="50" y="32" width="6" height="10" fill="url(#hg-stone)" />
      {/* Stone courses */}
      {[60, 76, 92, 108, 124, 140, 156].map((y, i) => (
        <g key={i}>
          <line x1="14" y1={y} x2="60" y2={y} stroke="rgba(0,0,0,.45)" strokeWidth=".8" />
          {i % 2 === 0 ? (
            <line x1="36" y1={y} x2="36" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
          ) : (
            <>
              <line x1="26" y1={y} x2="26" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
              <line x1="46" y1={y} x2="46" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
            </>
          )}
        </g>
      ))}
      {/* Lit arrow slit window (warm glow) */}
      <rect x="32" y="98" width="4" height="12" fill="#FFD070" />
      <rect x="32" y="70" width="4" height="12" fill="#1a1008" />
      {/* RIGHT TOWER */}
      <rect x="140" y="40" width="46" height="140" fill="url(#hg-stone)" />
      <rect x="140" y="40" width="46" height="5" fill="rgba(255,255,255,.25)" />
      <rect x="182" y="40" width="4" height="140" fill="rgba(0,0,0,.35)" />
      <rect x="140" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="152" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="164" y="32" width="6" height="10" fill="url(#hg-stone)" />
      <rect x="176" y="32" width="6" height="10" fill="url(#hg-stone)" />
      {[60, 76, 92, 108, 124, 140, 156].map((y, i) => (
        <g key={i}>
          <line x1="140" y1={y} x2="186" y2={y} stroke="rgba(0,0,0,.45)" strokeWidth=".8" />
          {i % 2 === 0 ? (
            <line x1="162" y1={y} x2="162" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
          ) : (
            <>
              <line x1="152" y1={y} x2="152" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
              <line x1="172" y1={y} x2="172" y2={y + 16} stroke="rgba(0,0,0,.4)" strokeWidth=".6" />
            </>
          )}
        </g>
      ))}
      <rect x="164" y="98" width="4" height="12" fill="#FFD070" />
      <rect x="164" y="70" width="4" height="12" fill="#1a1008" />
      {/* BIG ARCH connecting the two towers */}
      <path d="M60 40 L 60 94 Q 100 54 140 94 L 140 40 Z" fill="url(#hg-stone)" />
      <path d="M60 94 Q 100 54 140 94" fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="1.2" />
      <path d="M60 88 Q 100 52 140 88" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
      {/* Keystone */}
      <polygon points="92,44 108,44 104,62 96,62" fill="#8a8a90" stroke="rgba(0,0,0,.5)" strokeWidth="1" />
      {/* PORTCULLIS (iron grid) raised, visible in the arch opening */}
      <g>
        {[68, 78, 88, 98, 108, 118, 128].map((x, i) => (
          <line key={i} x1={x} y1="68" x2={x} y2="94" stroke="#1a1410" strokeWidth="1.5" />
        ))}
        <line x1="62" y1="70" x2="138" y2="70" stroke="#1a1410" strokeWidth="1.5" />
        <line x1="62" y1="80" x2="138" y2="80" stroke="#1a1410" strokeWidth="1.5" />
        <line x1="62" y1="90" x2="138" y2="90" stroke="#1a1410" strokeWidth="1.5" />
        {[68, 78, 88, 98, 108, 118, 128].map((x, i) => (
          <polygon key={i} points={`${x - 1.5},94 ${x + 1.5},94 ${x},98`} fill="#1a1410" />
        ))}
      </g>
      {/* Harbor flags fluttering on the towers */}
      <rect x="36" y="14" width="1.5" height="18" fill="#2a2018" />
      <polygon points="37.5,14 52,18 37.5,24" fill="#C43A3A" />
      <rect x="37.5" y="17" width="1" height="3" fill="#FFD740" />
      <rect x="162" y="14" width="1.5" height="18" fill="#2a2018" />
      <polygon points="163.5,14 178,18 163.5,24" fill="#1a5a8a" />
      <rect x="163.5" y="17" width="1" height="3" fill="#FFD740" />
      {/* Ship entering the harbor THROUGH the gate */}
      <g transform="translate(100 150)">
        {/* Hull */}
        <path d="M-16 0 L 16 0 L 14 8 Q 0 10 -14 8 Z" fill="#5a3a20" stroke="#1a1008" strokeWidth="1" />
        <rect x="-14" y="-1" width="28" height="2" fill="#8a6840" />
        {/* Mast */}
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#2a1a10" strokeWidth="1.4" />
        {/* Main sail */}
        <path d="M-10 -20 L 0 -22 L 10 -20 L 10 -6 Q 0 -4 -10 -6 Z" fill="#d8d0b8" stroke="#6a6040" strokeWidth=".7" />
        <line x1="0" y1="-22" x2="0" y2="-4" stroke="#6a6040" strokeWidth=".5" />
        {/* Pennant */}
        <rect x="-.5" y="-24" width="1" height="4" fill="#2a1a10" />
        <polygon points="0,-24 6,-22 0,-20" fill="#C43A3A" />
        {/* Small lantern on bow */}
        <circle cx="12" cy="-2" r="1.5" fill="#FFD070" opacity=".95" />
      </g>
      {/* Pier/quay floor */}
      <rect x="0" y="178" width="200" height="22" fill="#1a2028" />
      <rect x="0" y="178" width="200" height="2" fill="rgba(255,255,255,.2)" />
      {[18, 46, 78, 110, 146, 178].map((x, i) => (
        <line key={i} x1={x} y1="178" x2={x} y2="200" stroke="rgba(0,0,0,.5)" strokeWidth=".8" />
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  DEEP SPACE (last_orbit): 8 modules
// ═════════════════════════════════════════════════════════════

function SpaceStarfield({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-space`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0822" />
          <stop offset="50%" stopColor="#1a0a3a" />
          <stop offset="100%" stopColor="#0a0520" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill={`url(#${id}-space)`} />
      {[[15, 20], [40, 45], [75, 25], [120, 15], [165, 30], [180, 70], [25, 80], [60, 155], [135, 170], [185, 155], [90, 160]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.3 : 0.7} fill="#EEE8FF" opacity={0.4 + (i % 3) * 0.15} />
      ))}
    </>
  );
}

function ObservationTower({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="ot" />
      {/* Planet silhouette */}
      <circle cx="170" cy="175" r="45" fill="#4a2a58" opacity=".6" />
      {/* Tower base */}
      <rect x="90" y="150" width="20" height="35" fill="#3a4a68" />
      <rect x="90" y="150" width="20" height="3" fill="rgba(255,255,255,.25)" />
      <rect x="80" y="180" width="40" height="8" fill="#2a3a58" />
      {/* Spire middle */}
      <polygon points="95,150 105,150 107,110 93,110" fill="#6a7a9a" />
      <rect x="93" y="110" width="14" height="3" fill="rgba(255,255,255,.3)" />
      {/* Dome observatory */}
      <circle cx="100" cy="95" r="22" fill="#8aA8D0" opacity=".9" />
      <path d="M82 95 A 18 18 0 0 1 118 95" fill="rgba(255,255,255,.25)" />
      <path d="M78 95 A 22 22 0 0 1 122 95 L122 110 L78 110 Z" fill="#4a5a78" />
      {/* Slit in dome */}
      <rect x="92" y="70" width="16" height="4" fill="#0a0820" />
      <polygon points="92,70 108,70 104,60 96,60" fill="#0a0820" />
      {/* Telescope peeking out */}
      <rect x="98" y="56" width="4" height="14" fill="#6a7890" />
      <circle cx="100" cy="54" r="3" fill="#FFC040" opacity=".7" />
      {/* Support struts */}
      <line x1="75" y1="115" x2="93" y2="130" stroke="#3a4a68" strokeWidth="1.5" />
      <line x1="125" y1="115" x2="107" y2="130" stroke="#3a4a68" strokeWidth="1.5" />
      {/* Astronaut at telescope eyepiece, visible through a window at mid-height */}
      <rect x="93" y="112" width="14" height="10" fill="#0a1830" />
      <rect x="93" y="112" width="14" height="10" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".6" />
      <circle cx="100" cy="116" r="2.6" fill="#FFDAB0" />
      <rect x="97" y="118" width="6" height="3.5" fill="#E8E8E8" />
      <circle cx="101" cy="114" r="1" fill="#8aC4FF" />
      {/* Distant nebula through dome slit */}
      <circle cx="100" cy="70" r="3" fill="#B388FF" opacity=".6" />
      <circle cx="102" cy="68" r="1.5" fill="#FFD740" opacity=".8" />
      {/* Signal rings radiating */}
      <circle cx="100" cy="95" r="30" fill="none" stroke="rgba(144,200,255,.5)" strokeWidth=".8" strokeDasharray="2 3" />
      <circle cx="100" cy="95" r="42" fill="none" stroke="rgba(144,200,255,.3)" strokeWidth=".6" strokeDasharray="2 4" />
      <circle cx="100" cy="95" r="55" fill="none" stroke="rgba(144,200,255,.18)" strokeWidth=".4" strokeDasharray="1 4" />
    </svg>
  );
}

function SolarArray({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="sa" />
      {/* Distant sun */}
      <defs>
        <radialGradient id="sa-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFE890" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF8040" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="170" cy="38" r="28" fill="url(#sa-sun)" />
      <circle cx="170" cy="38" r="10" fill="#FFE890" />
      {/* Central module */}
      <rect x="86" y="96" width="28" height="26" rx="3" fill="#4a5a78" />
      <rect x="86" y="96" width="28" height="3" fill="rgba(255,255,255,.3)" />
      {/* Solar panel arms */}
      <rect x="30" y="108" width="56" height="6" fill="#3a4a68" />
      <rect x="114" y="108" width="56" height="6" fill="#3a4a68" />
      {/* Left panel */}
      <g>
        <rect x="8" y="80" width="30" height="50" rx="1" fill="#1a2a4a" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => (
            <rect
              key={`sl-${r}-${c}`}
              x={11 + c * 13}
              y={83 + r * 12}
              width="11" height="10"
              fill="#2a5080" stroke="#4a70a0" strokeWidth=".4"
            />
          ))
        )}
        <rect x="8" y="80" width="30" height="2" fill="rgba(144,200,255,.5)" />
      </g>
      {/* Right panel */}
      <g>
        <rect x="162" y="80" width="30" height="50" rx="1" fill="#1a2a4a" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => (
            <rect
              key={`sr-${r}-${c}`}
              x={165 + c * 13}
              y={83 + r * 12}
              width="11" height="10"
              fill="#2a5080" stroke="#4a70a0" strokeWidth=".4"
            />
          ))
        )}
        <rect x="162" y="80" width="30" height="2" fill="rgba(144,200,255,.5)" />
      </g>
      {/* Light rays from sun onto panels */}
      <line x1="160" y1="40" x2="180" y2="85" stroke="rgba(255,232,144,.3)" strokeWidth=".8" />
      <line x1="150" y1="50" x2="168" y2="86" stroke="rgba(255,232,144,.25)" strokeWidth=".8" />
      {/* Suited engineer inspecting left panel with a tether */}
      <g transform="translate(48 78)">
        <circle cx="0" cy="0" r="4" fill="#E8E8E8" />
        <circle cx="0" cy="0" r="3" fill="#0a1830" />
        <circle cx="-.8" cy="-.8" r=".8" fill="#FFE890" opacity=".8" />
        <rect x="-5" y="3" width="10" height="11" rx="2" fill="#E8E8E8" />
        <rect x="-3.5" y="5" width="7" height="3" fill="#FFD740" />
        <rect x="-6" y="13" width="3" height="8" fill="#E8E8E8" />
        <rect x="3" y="13" width="3" height="8" fill="#E8E8E8" />
        <line x1="5" y1="8" x2="16" y2="14" stroke="#8aC4FF" strokeWidth="1.2" strokeDasharray="2 1.5" opacity=".9" />
      </g>
      {/* Cable running from module to panels */}
      <path d="M86 112 Q 60 108 42 108" stroke="#2a3a58" strokeWidth="1.2" fill="none" />
      <path d="M114 112 Q 140 108 172 108" stroke="#2a3a58" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function ShieldModule({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="sm" />
      {/* Energy shield glow */}
      <defs>
        <radialGradient id="sm-energy" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="#8aC4FF" stopOpacity=".25" />
          <stop offset="100%" stopColor="#4060A0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="75" fill="url(#sm-energy)" />
      {/* Hexagonal armor */}
      <polygon points="100,45 148,72 148,128 100,155 52,128 52,72" fill="#3a4a68" />
      <polygon points="100,45 148,72 148,128 100,155 52,128 52,72" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      {/* Inner hexagons for plating */}
      <polygon points="100,62 133,82 133,118 100,138 67,118 67,82" fill="#4a5a7a" />
      <polygon points="100,80 118,90 118,110 100,120 82,110 82,90" fill="#5a6a8a" />
      <polygon points="100,80 118,90 118,110 100,120 82,110 82,90" fill="none" stroke="rgba(144,200,255,.4)" strokeWidth=".6" />
      {/* Energy core pulse */}
      <circle cx="100" cy="100" r="8" fill="#8aC4FF" opacity=".9" />
      <circle cx="100" cy="100" r="4" fill="#DDEEFF" />
      {/* Pilot inside the shield bubble behind energy core */}
      <g transform="translate(100 118)">
        <circle cx="0" cy="-2" r="3.5" fill="#E8E8E8" />
        <circle cx="0" cy="-2" r="2.5" fill="#0a1830" />
        <rect x="-4" y="1" width="8" height="9" rx="1.5" fill="#E8E8E8" />
        <rect x="-3" y="3" width="6" height="3" fill="#FFD740" />
      </g>
      {/* Exterior impact flashes on plating */}
      <g>
        <circle cx="62" cy="80" r="3" fill="#FFE890" opacity=".9" />
        <path d="M58 80 L 52 76 M66 80 L 72 76 M62 76 L 62 70" stroke="#FFE890" strokeWidth="1" opacity=".7" />
      </g>
      <g>
        <circle cx="140" cy="128" r="2.5" fill="#FFA840" opacity=".85" />
        <path d="M142 130 L 148 134 M140 132 L 140 138" stroke="#FFA840" strokeWidth=".8" opacity=".6" />
      </g>
      {/* Shield shimmer rings */}
      <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(144,200,255,.35)" strokeWidth=".7" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(144,200,255,.22)" strokeWidth=".5" strokeDasharray="1 3" />
      {/* Plate studs */}
      {[[100, 45], [148, 72], [148, 128], [100, 155], [52, 128], [52, 72]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#2a3a58" stroke="rgba(255,255,255,.3)" strokeWidth=".5" />
      ))}
    </svg>
  );
}

function DockingArm({ size = 160 }: Props) {
  // A long mechanical ARM extending from the station to grip an arriving
  // ship. Arm is dominant and horizontal. Clamps at the end visibly HOLD
  // the ship. Makes the "dock things here" mechanic obvious.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="da" />
      {/* Station body on the far left (small, anchoring the arm) */}
      <rect x="6" y="74" width="38" height="60" rx="6" fill="#4a5a78" />
      <rect x="6" y="74" width="38" height="5" fill="rgba(255,255,255,.3)" />
      <circle cx="18" cy="90" r="2.5" fill="#FFD740" />
      <circle cx="30" cy="90" r="2.5" fill="#8aC4FF" />
      <circle cx="42" cy="90" r="2.5" fill="#FFA840" />
      {/* THE DOCKING ARM - big, thick, mechanical, segmented */}
      <rect x="44" y="96" width="110" height="16" fill="#6a7a9a" />
      <rect x="44" y="96" width="110" height="3" fill="rgba(255,255,255,.4)" />
      <rect x="44" y="109" width="110" height="3" fill="rgba(0,0,0,.3)" />
      {/* Segment joints - clearly mechanical */}
      {[70, 96, 122].map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y="92" width="6" height="24" fill="#3a4a68" />
          <rect x={x - 3} y="92" width="6" height="2" fill="rgba(255,255,255,.35)" />
          <circle cx={x} cy="104" r="2" fill="#2a3a58" />
        </g>
      ))}
      {/* End of arm: big round clamp head holding the ship */}
      <circle cx="160" cy="104" r="22" fill="#4a5a78" />
      <circle cx="160" cy="104" r="22" fill="none" stroke="#8aA8D0" strokeWidth="2" />
      <circle cx="160" cy="104" r="16" fill="#2a3a58" />
      {/* Three grabbing clamp arms curling around the docked ship */}
      {[0, 120, 240].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = r2(160 + Math.cos(rad) * 18);
        const y1 = r2(104 + Math.sin(rad) * 18);
        const x2 = r2(160 + Math.cos(rad) * 30);
        const y2 = r2(104 + Math.sin(rad) * 30);
        return (
          <g key={angle}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8aA8D0" strokeWidth="5" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="3" fill="#3a4a68" />
          </g>
        );
      })}
      {/* DOCKED SHIP held inside the clamps */}
      <g transform="translate(160 104)">
        <polygon points="-8,-6 10,-6 14,0 10,6 -8,6" fill="#FFD740" stroke="#8a6a10" strokeWidth="1.2" />
        <rect x="-6" y="-4" width="8" height="3" fill="#8aC4FF" opacity=".9" />
        <circle cx="-2" cy="-2.5" r=".8" fill="#2a3a58" />
        <rect x="6" y="-1" width="6" height="2" fill="#FF7043" />
      </g>
      {/* Status light glowing on the arm */}
      <circle cx="75" cy="88" r="3" fill="#4a8a4a" />
      <circle cx="75" cy="88" r="5" fill="rgba(74,138,74,.3)" />
      <circle cx="105" cy="88" r="3" fill="#4a8a4a" />
      <circle cx="105" cy="88" r="5" fill="rgba(74,138,74,.3)" />
      {/* Big arrow in the background showing incoming dock direction */}
      <path d="M178 136 L166 130" stroke="rgba(138,200,255,.4)" strokeWidth="1.5" />
      <path d="M178 136 L170 140" stroke="rgba(138,200,255,.4)" strokeWidth="1.5" />
    </svg>
  );
}

function CommandSpire({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="cs" />
      {/* Large tapering spire */}
      <polygon points="92,180 108,180 116,60 84,60" fill="#3a4a68" />
      <polygon points="92,180 100,180 108,60 100,60" fill="rgba(255,255,255,.12)" />
      {/* Segment rings */}
      {[80, 100, 120, 140, 160].map((y, i) => {
        const w = 32 + (180 - y) * 0.3;
        const x = 100 - w / 2;
        return (
          <g key={i}>
            <rect x={x} y={y - 2} width={w} height="4" fill="#5a6a8a" />
            <rect x={x} y={y - 2} width={w} height="1" fill="rgba(255,255,255,.3)" />
          </g>
        );
      })}
      {/* Command bridge at top (trapezoid glass pod) */}
      <polygon points="80,60 120,60 116,42 84,42" fill="#4a5a78" />
      <rect x="82" y="42" width="36" height="18" fill="#8aC4FF" opacity=".5" />
      <rect x="82" y="42" width="36" height="3" fill="rgba(255,255,255,.5)" />
      {/* Viewport details with crew silhouettes at consoles */}
      {[87, 95, 103, 111].map((x, i) => (
        <g key={i}>
          <rect x={x} y="46" width="6" height="10" fill="rgba(10,10,30,.6)" />
          {/* Silhouetted crew at console */}
          <circle cx={x + 3} cy={50 + (i % 2)} r="1.4" fill="#1a2040" />
          <rect x={x + 1.5} y={52 + (i % 2)} width="3" height="3" fill="#1a2040" />
        </g>
      ))}
      {/* Holographic chart floating inside bridge */}
      <circle cx="100" cy="50" r="3.5" fill="none" stroke="rgba(138,212,255,.7)" strokeWidth=".5" strokeDasharray="1 1" />
      <circle cx="100" cy="50" r="1.2" fill="#8aD4FF" opacity=".6" />
      {/* Rotating radar sweep on the bridge dome */}
      <path d="M100 50 L 115 46 A 16 16 0 0 0 111 41 Z" fill="rgba(138,212,255,.35)" />
      {/* Spire tip antenna */}
      <rect x="99" y="26" width="2" height="16" fill="#8aA8D0" />
      <polygon points="96,26 104,26 100,14" fill="#C43A3A" />
      <circle cx="100" cy="11" r="2.5" fill="#FFE890" />
      {/* Signal waves */}
      <circle cx="100" cy="11" r="10" fill="none" stroke="rgba(255,232,144,.5)" strokeWidth=".7" strokeDasharray="2 2" />
      <circle cx="100" cy="11" r="18" fill="none" stroke="rgba(255,232,144,.3)" strokeWidth=".5" strokeDasharray="2 3" />
      {/* Ground platform */}
      <rect x="60" y="178" width="80" height="8" fill="#2a3a58" />
      <rect x="60" y="178" width="80" height="2" fill="rgba(255,255,255,.2)" />
    </svg>
  );
}

function CommonsDeck({ size = 160 }: Props) {
  // The social/shared space of the station. A big round table with crew
  // clearly seated around it talking, huge window behind showing space +
  // planet. Reads as "the place where the crew gathers to hang out".
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="cd" />
      <defs>
        <radialGradient id="cd-planet" cx=".35" cy=".35" r=".6">
          <stop offset="0%" stopColor="#8aD4FF" />
          <stop offset="100%" stopColor="#2a4a88" />
        </radialGradient>
        <linearGradient id="cd-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5a78" />
          <stop offset="100%" stopColor="#2a3a58" />
        </linearGradient>
      </defs>
      {/* Floor plate */}
      <rect x="10" y="150" width="180" height="42" fill="url(#cd-floor)" />
      <rect x="10" y="150" width="180" height="3" fill="rgba(255,255,255,.25)" />
      {/* Big panoramic viewport wall */}
      <rect x="14" y="26" width="172" height="120" rx="8" fill="#0a1030" />
      <rect x="14" y="26" width="172" height="120" rx="8" fill="none" stroke="#8aA8D0" strokeWidth="2.5" />
      {/* Window frame dividers (cross bars) */}
      <line x1="100" y1="28" x2="100" y2="144" stroke="#6a7a9a" strokeWidth="2" />
      <line x1="16" y1="86" x2="184" y2="86" stroke="#6a7a9a" strokeWidth="2" />
      {/* Planet through window */}
      <circle cx="130" cy="58" r="18" fill="url(#cd-planet)" />
      <ellipse cx="136" cy="56" rx="22" ry="3" fill="rgba(200,160,100,.45)" />
      {/* Extra stars inside window */}
      {[[36, 46], [60, 40], [80, 68], [50, 108], [164, 118], [72, 126]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r=".8" fill="white" opacity=".9" />
      ))}
      {/* ROUND TABLE at the center of the deck */}
      <ellipse cx="100" cy="168" rx="50" ry="10" fill="#5a4a30" stroke="#3a2a18" strokeWidth="1.5" />
      <ellipse cx="100" cy="166" rx="50" ry="10" fill="#8a6a40" />
      <ellipse cx="100" cy="164" rx="48" ry="8" fill="#a08050" />
      {/* Drinks and snacks on the table */}
      <rect x="82" y="160" width="4" height="6" fill="#FFA840" />
      <ellipse cx="84" cy="160" rx="2" ry=".8" fill="#FFE890" />
      <rect x="100" y="158" width="5" height="8" rx="1" fill="#4FC3F7" />
      <rect x="115" y="161" width="4" height="5" fill="#E85090" />
      <circle cx="94" cy="164" r="3" fill="#FFD740" opacity=".8" />
      {/* FOUR CREW clearly sitting around the table, visible torsos + heads */}
      {/* Left side */}
      <g transform="translate(54 146)">
        <circle cx="0" cy="0" r="5" fill="#FFDAB0" />
        <rect x="-5" y="4" width="10" height="14" rx="2" fill="#4FC3F7" />
        {/* Arm reaching to table */}
        <rect x="-2" y="16" width="10" height="3" rx="1.2" fill="#FFDAB0" />
      </g>
      {/* Back-left */}
      <g transform="translate(80 134)">
        <circle cx="0" cy="0" r="4.5" fill="#FFDAB0" />
        <rect x="-4.5" y="3.5" width="9" height="13" rx="2" fill="#FFD740" />
      </g>
      {/* Back-right */}
      <g transform="translate(122 134)">
        <circle cx="0" cy="0" r="4.5" fill="#FFDAB0" />
        <rect x="-4.5" y="3.5" width="9" height="13" rx="2" fill="#B388FF" />
      </g>
      {/* Right side */}
      <g transform="translate(148 146)">
        <circle cx="0" cy="0" r="5" fill="#FFDAB0" />
        <rect x="-5" y="4" width="10" height="14" rx="2" fill="#E85090" />
        <rect x="-10" y="16" width="10" height="3" rx="1.2" fill="#FFDAB0" />
      </g>
      {/* Speech bubble between back-left and back-right to signal conversation */}
      <g transform="translate(100 116)">
        <ellipse cx="0" cy="0" rx="12" ry="7" fill="#fff" opacity=".92" stroke="#1a0a08" strokeWidth="1" />
        <polygon points="-2,6 2,12 3,6" fill="#fff" stroke="#1a0a08" strokeWidth="1" />
        <circle cx="-4" cy="0" r="1.3" fill="#1a0a08" />
        <circle cx="0" cy="0" r="1.3" fill="#1a0a08" />
        <circle cx="4" cy="0" r="1.3" fill="#1a0a08" />
      </g>
      {/* Potted plant in corner */}
      <g transform="translate(24 140)">
        <rect x="0" y="6" width="10" height="10" fill="#8a5a30" />
        <path d="M1 6 Q 5 -4 9 6 Q 6 0 5 6 Q 4 0 1 6 Z" fill="#4a8a4a" />
      </g>
    </svg>
  );
}

function CoreReactor({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <SpaceStarfield id="cr" />
      {/* Energy glow */}
      <defs>
        <radialGradient id="cr-core" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFA840" stopOpacity="1" />
          <stop offset="80%" stopColor="#C43A3A" stopOpacity=".6" />
          <stop offset="100%" stopColor="#C43A3A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cr-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFA840" stopOpacity=".55" />
          <stop offset="100%" stopColor="#FFA840" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#cr-glow)" />
      {/* Cylinder body */}
      <rect x="70" y="60" width="60" height="95" rx="3" fill="#3a4a68" />
      <rect x="70" y="60" width="60" height="5" fill="rgba(255,255,255,.25)" />
      <rect x="126" y="60" width="4" height="95" fill="rgba(0,0,0,.3)" />
      {/* Top ring */}
      <ellipse cx="100" cy="60" rx="30" ry="7" fill="#4a5a78" />
      <ellipse cx="100" cy="60" rx="30" ry="7" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".8" />
      {/* Bottom stand */}
      <rect x="60" y="155" width="80" height="10" fill="#2a3a58" />
      <rect x="60" y="155" width="80" height="2" fill="rgba(255,255,255,.2)" />
      {/* Core window */}
      <ellipse cx="100" cy="105" rx="18" ry="26" fill="#2a0820" />
      <ellipse cx="100" cy="105" rx="18" ry="26" fill="none" stroke="#8a4030" strokeWidth="1" />
      <ellipse cx="100" cy="105" rx="14" ry="22" fill="url(#cr-core)" />
      {/* Pulsing lines around the core */}
      <path d="M100 78 Q 110 95 100 112 Q 90 130 100 132" stroke="#FFE890" strokeWidth="1" fill="none" opacity=".9" />
      <path d="M100 78 Q 90 95 100 112 Q 110 130 100 132" stroke="#FFE890" strokeWidth="1" fill="none" opacity=".5" />
      {/* Vent grilles on sides */}
      {[72, 82, 138, 148].map((x, i) => (
        [90, 100, 110, 120, 130].map((y, j) => (
          <rect key={`cv-${i}-${j}`} x={x} y={y} width="6" height="2" fill="#6a7a9a" />
        ))
      ))}
      {/* Warning stripes */}
      <rect x="70" y="148" width="60" height="4" fill="#FFD740" />
      {[72, 80, 88, 96, 104, 112, 120, 128].map((x, i) => (
        <rect key={i} x={x} y="148" width="4" height="4" fill="#2a2010" opacity={i % 2 === 0 ? 1 : 0} />
      ))}
      {/* Engineer at control console on the right side */}
      <g transform="translate(150 140)">
        {/* Console */}
        <rect x="0" y="10" width="18" height="15" fill="#3a4a68" />
        <rect x="2" y="12" width="14" height="5" fill="#FFA840" opacity=".8" />
        <rect x="2" y="18" width="6" height="2" fill="#FFD740" />
        <rect x="10" y="18" width="6" height="2" fill="#4a8a4a" />
        {/* Engineer with hard hat */}
        <circle cx="9" cy="3" r="3" fill="#FFDAB0" />
        <path d="M6 3 Q 9 -1 12 3" fill="#FFA840" />
        <rect x="6" y="6" width="6" height="8" rx="1" fill="#FF7043" />
        {/* Arm reaching to console */}
        <rect x="9" y="9" width="6" height="2" rx="1" fill="#FFDAB0" />
      </g>
      {/* Steam vents escaping from sides */}
      <g opacity=".45">
        <ellipse cx="56" cy="75" rx="6" ry="3" fill="#cccccc" />
        <ellipse cx="52" cy="68" rx="5" ry="2.5" fill="#cccccc" />
        <ellipse cx="148" cy="78" rx="6" ry="3" fill="#cccccc" />
        <ellipse cx="152" cy="70" rx="5" ry="2.5" fill="#cccccc" />
      </g>
      {/* Warning sirens blinking */}
      <circle cx="75" cy="65" r="2.5" fill="#C43A3A" />
      <circle cx="75" cy="65" r="5" fill="none" stroke="rgba(196,58,58,.45)" strokeWidth=".8" />
      <circle cx="125" cy="65" r="2.5" fill="#C43A3A" />
      <circle cx="125" cy="65" r="5" fill="none" stroke="rgba(196,58,58,.45)" strokeWidth=".8" />
    </svg>
  );
}

function MainAirlock({ size = 160 }: Props) {
  // The transition chamber between INSIDE the station (safe, floor, lights)
  // and OUTSIDE (vacuum, stars). Split-view: left half is the lit interior
  // with a suited astronaut stepping up to the door; right half shows the
  // hatch opening out to stars. A clear "door to space" read.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <radialGradient id="al-stars" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#101830" />
          <stop offset="100%" stopColor="#020510" />
        </radialGradient>
        <linearGradient id="al-interior" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a5a78" />
          <stop offset="100%" stopColor="#3a4a68" />
        </linearGradient>
      </defs>
      {/* INTERIOR (left 55%): lit station corridor */}
      <rect x="0" y="0" width="110" height="200" fill="url(#al-interior)" />
      {/* Floor */}
      <rect x="0" y="150" width="110" height="50" fill="#2a3a58" />
      <rect x="0" y="150" width="110" height="3" fill="rgba(255,255,255,.3)" />
      {/* Ceiling light strip */}
      <rect x="0" y="30" width="110" height="4" fill="#FFE890" opacity=".7" />
      <rect x="0" y="30" width="110" height="10" fill="rgba(255,232,144,.2)" />
      {/* OUTSIDE (right 45%): space with stars, visible through open hatch */}
      <rect x="110" y="0" width="90" height="200" fill="url(#al-stars)" />
      {[[130, 30], [148, 70], [170, 50], [180, 130], [122, 150], [160, 170], [145, 110], [186, 92]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.8 + (i % 3) * 0.4} fill="white" opacity=".9" />
      ))}
      <circle cx="168" cy="48" r="1.6" fill="white" />
      {/* THE CIRCULAR HATCH DOOR sitting right on the boundary (open) */}
      {/* Frame rim */}
      <circle cx="110" cy="100" r="70" fill="none" stroke="#5a6a8a" strokeWidth="5" />
      <circle cx="110" cy="100" r="70" fill="none" stroke="#8aA8D0" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Hatch door itself (open, swung INTO the interior) */}
      <g transform="translate(62 100) rotate(-20)">
        <ellipse cx="0" cy="0" rx="34" ry="56" fill="#4a5a78" />
        <ellipse cx="0" cy="0" rx="34" ry="56" fill="none" stroke="#6a7a9a" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="28" ry="48" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
        {/* Central wheel handle */}
        <circle cx="0" cy="0" r="12" fill="#6a7a9a" />
        <circle cx="0" cy="0" r="12" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".8" />
        {[0, 45, 90, 135].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = r2(Math.cos(rad) * 6);
          const y1 = r2(Math.sin(rad) * 6);
          const x2 = r2(Math.cos(rad) * 11);
          const y2 = r2(Math.sin(rad) * 11);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a4a68" strokeWidth="2" />;
        })}
        <circle cx="0" cy="0" r="2.5" fill="#FFD740" />
        {/* Locking bolts around the rim */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = r2(Math.cos(rad) * 30);
          const y = r2(Math.sin(rad) * 50);
          return <circle key={i} cx={x} cy={y} r="2" fill="#2a3a58" />;
        })}
      </g>
      {/* Warning chevrons on the open doorway (inside edge) */}
      <g>
        {[24, 40, 56, 72, 88, 104, 120, 136, 152, 168, 184].map((y, i) => (
          <g key={i}>
            <rect x="106" y={y} width="8" height="8" fill={i % 2 ? "#FFD740" : "#1a1010"} />
          </g>
        ))}
      </g>
      {/* Astronaut in full suit stepping up to the threshold */}
      <g transform="translate(56 128)">
        {/* Boots */}
        <rect x="-6" y="32" width="6" height="5" rx="1" fill="#2a2a30" />
        <rect x="1" y="32" width="6" height="5" rx="1" fill="#2a2a30" />
        {/* Legs */}
        <rect x="-5" y="16" width="5" height="17" rx="1" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth=".6" />
        <rect x="1" y="16" width="5" height="17" rx="1" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth=".6" />
        {/* Torso with control pack */}
        <rect x="-9" y="0" width="16" height="18" rx="2" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth=".8" />
        <rect x="-3" y="5" width="6" height="5" fill="#4FC3F7" />
        <circle cx="-5" cy="3" r=".8" fill="#C43A3A" />
        <circle cx="5" cy="3" r=".8" fill="#4a8a4a" />
        {/* Arms (one gripping the frame) */}
        <rect x="-13" y="1" width="5" height="14" rx="1.5" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth=".6" />
        <rect x="7" y="1" width="5" height="14" rx="1.5" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth=".6" />
        <rect x="-14" y="12" width="6" height="5" rx="1.2" fill="#C8C8D8" />
        <rect x="8" y="12" width="6" height="5" rx="1.2" fill="#C8C8D8" />
        {/* Helmet */}
        <circle cx="-1" cy="-10" r="10" fill="#E8ECF4" stroke="#8aA8D0" strokeWidth="1" />
        <ellipse cx="-1" cy="-10" rx="6" ry="5" fill="#1a2a58" stroke="#4FC3F7" strokeWidth=".8" />
        <ellipse cx="-3" cy="-12" rx="2.5" ry="1.5" fill="rgba(255,255,255,.4)" />
        {/* Oxygen tank on back */}
        <rect x="8" y="2" width="3" height="14" rx="1" fill="#FFA840" />
      </g>
      {/* "EXIT TO VACUUM" arrow */}
      <path d="M78 65 L100 65" stroke="rgba(255,232,144,.6)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="98,61 108,65 98,69" fill="rgba(255,232,144,.6)" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  OCEAN DEPTHS (deep_current): 8 sectors
// ═════════════════════════════════════════════════════════════

function OceanBackdrop({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2850" />
          <stop offset="100%" stopColor="#020818" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill={`url(#${id}-water)`} />
      {/* Floating bioluminescent particles */}
      {[[25, 50], [55, 30], [90, 20], [135, 40], [172, 60], [40, 110], [165, 130], [30, 170], [150, 170], [100, 15]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#8aD4FF" opacity={0.4 + (i % 3) * 0.2} />
      ))}
      {/* Light rays from surface */}
      <path d="M40 0 L60 200 L70 200 L50 0 Z" fill="rgba(170,220,255,.05)" />
      <path d="M120 0 L150 200 L158 200 L128 0 Z" fill="rgba(170,220,255,.04)" />
    </>
  );
}

function CoralSpire({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="cp" />
      {/* Seafloor */}
      <path d="M0 185 Q 50 175 100 180 Q 150 182 200 178 L200 200 L0 200 Z" fill="#3a2038" />
      {/* Main coral branch */}
      <path d="M98 180 L96 140 L92 100 L98 70 L110 55 L104 45" stroke="#E85090" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M104 45 Q 100 30 96 28" stroke="#E85090" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Secondary branches */}
      <path d="M92 100 Q 76 92 68 78" stroke="#E85090" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M98 70 Q 118 66 130 55" stroke="#E85090" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M96 140 Q 112 136 118 128" stroke="#E85090" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M110 55 Q 120 42 125 36" stroke="#E85090" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Coral tips with bioluminescence */}
      {[[96, 28, 3], [68, 78, 2.5], [130, 55, 2.5], [118, 128, 2], [125, 36, 2]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 3} fill="#FFA0D0" opacity=".4" />
          <circle cx={x} cy={y} r={r as number} fill="#FFE0F0" />
        </g>
      ))}
      {/* Small fish */}
      <g transform="translate(40 120)">
        <ellipse cx="0" cy="0" rx="5" ry="2" fill="#FFD740" />
        <polygon points="-5,0 -9,-2 -9,2" fill="#FFD740" />
        <circle cx="2" cy="-.5" r=".6" fill="#2a1a10" />
      </g>
      <g transform="translate(155 110)">
        <ellipse cx="0" cy="0" rx="4" ry="1.5" fill="#FF7043" />
        <polygon points="4,0 7,-2 7,2" fill="#FF7043" />
      </g>
      {/* Diver approaching the spire with a headlamp */}
      <g transform="translate(150 130)">
        <ellipse cx="0" cy="0" rx="9" ry="6" fill="#3a4a68" />
        <circle cx="-6" cy="-1" r="3" fill="#8aC4FF" opacity=".8" />
        <circle cx="-6" cy="-1" r="2" fill="#DDE8FF" />
        <rect x="-3" y="4" width="6" height="5" fill="#FFD740" />
        <line x1="-3" y1="7" x2="-12" y2="10" stroke="#3a4a68" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="7" x2="10" y2="12" stroke="#3a4a68" strokeWidth="1.5" strokeLinecap="round" />
        {/* Headlamp beam */}
        <path d="M-8 -1 L-28 -8 L-28 6 Z" fill="#FFE890" opacity=".15" />
      </g>
      {/* Tiny bubbles rising */}
      {[[94, 158, 1.5], [100, 150, 1], [93, 140, 1.2], [98, 122, .8], [148, 124, 1], [152, 118, .8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r as number} fill="none" stroke="rgba(200,230,255,.5)" strokeWidth=".6" />
      ))}
    </svg>
  );
}

function ReefShelf({ size = 160 }: Props) {
  // A dense garden of coral on a wide flat underwater SHELF (visible
  // stepped ledge). Make the shelf structure obvious: rocky terrace
  // stepped down into the abyss. Dense, diverse coral colony on top.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="rs" />
      {/* Shelf: clearly stepped ledge shape, three tiers visible */}
      <path d="M0 148 L30 148 L30 156 L60 156 L60 166 L200 166 L200 200 L0 200 Z" fill="#3a2850" />
      <path d="M0 148 L30 148 L30 156 L60 156 L60 166 L200 166" stroke="rgba(255,255,255,.2)" strokeWidth="1.2" fill="none" />
      {/* Deep water below the shelf drop-off (far left) */}
      <rect x="0" y="148" width="30" height="0" />
      {/* Shelf top surface (flat) */}
      <rect x="60" y="162" width="140" height="6" fill="#4a3868" />
      {/* Sandy top surface */}
      {[72, 94, 118, 144, 170, 190].map((x, i) => (
        <ellipse key={i} cx={x} cy="164" rx="8" ry="1.5" fill="rgba(255,230,180,.25)" />
      ))}
      {/* DENSE coral garden on the shelf - varied sizes and colors */}
      {/* Big central brain coral */}
      <g transform="translate(102 156)">
        <ellipse cx="0" cy="0" rx="14" ry="7" fill="#B8408A" />
        <path d="M-10 -2 Q 0 -6 10 -2" stroke="#E85090" strokeWidth="1" fill="none" />
        <path d="M-10 1 Q 0 -3 10 1" stroke="#E85090" strokeWidth="1" fill="none" />
        <path d="M-10 3 Q 0 -1 10 3" stroke="#E85090" strokeWidth="1" fill="none" />
      </g>
      {/* Branching coral trees in many colors, different heights */}
      {[
        { x: 70, h: 28, color: "#E85090" },
        { x: 86, h: 22, color: "#FFD740" },
        { x: 124, h: 32, color: "#FF7043" },
        { x: 142, h: 20, color: "#8aC4FF" },
        { x: 158, h: 26, color: "#E85090" },
        { x: 176, h: 18, color: "#FFA840" },
        { x: 194, h: 14, color: "#8aE8C0" },
      ].map((c) => (
        <g key={c.x}>
          <path d={`M${c.x} 162 L${c.x - 2} ${162 - c.h * 0.4} L${c.x + 2} ${162 - c.h * 0.7} L${c.x - 2} ${162 - c.h}`} stroke={c.color} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d={`M${c.x + 3} ${162 - c.h * 0.2} L${c.x + 6} ${162 - c.h * 0.5} L${c.x + 4} ${162 - c.h * 0.7}`} stroke={c.color} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={`M${c.x - 4} ${162 - c.h * 0.3} L${c.x - 7} ${162 - c.h * 0.6}`} stroke={c.color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx={c.x - 2} cy={162 - c.h} r="2.5" fill={c.color} />
        </g>
      ))}
      {/* Anemones nestled between coral */}
      {[[78, 160], [112, 161], [152, 160]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="6" ry="2" fill="#8a3a78" />
          {[-4, -1.5, 1.5, 4].map((dx, j) => (
            <line key={j} x1={x + dx} y1={y - 1} x2={x + dx + (j - 1.5) * 2} y2={y - 7} stroke="#B8408A" strokeWidth="1.2" />
          ))}
        </g>
      ))}
      {/* School of small yellow fish swimming over the reef */}
      {[[64, 80], [72, 78], [82, 82], [90, 78], [100, 80], [110, 76], [120, 80]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="3" ry="1.2" fill="#FFD740" />
          <polygon points={`${x - 3},${y} ${x - 5},${y - 1.2} ${x - 5},${y + 1.2}`} fill="#FFD740" />
        </g>
      ))}
      {/* Sea turtle gliding overhead */}
      <g transform="translate(146 64)">
        <ellipse cx="0" cy="0" rx="16" ry="10" fill="#3a6842" stroke="#2a4028" strokeWidth="1" />
        <path d="M-8 -6 Q 0 -9 8 -6" stroke="#2a4028" strokeWidth=".8" fill="none" />
        <path d="M-10 0 L10 0" stroke="#2a4028" strokeWidth=".8" />
        {[[-6, -3], [6, -3], [-6, 3], [6, 3], [0, 0]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#6a9a58" />
        ))}
        <ellipse cx="-16" cy="0" rx="5" ry="3.5" fill="#4a7a48" />
        <circle cx="-18" cy="-1" r=".6" fill="#0a0a10" />
        <path d="M-8 -8 Q -16 -14 -20 -10 Q -14 -8 -8 -6" fill="#4a7a48" />
        <path d="M8 -8 Q 16 -14 20 -10 Q 14 -8 8 -6" fill="#4a7a48" />
        <path d="M-8 8 Q -14 12 -16 10 Q -12 8 -8 6" fill="#4a7a48" />
        <path d="M8 8 Q 14 12 16 10 Q 12 8 8 6" fill="#4a7a48" />
      </g>
      {/* Shelf EDGE marker - left side drops off to void */}
      <path d="M30 156 Q 25 172 20 200" stroke="rgba(0,0,0,.5)" strokeWidth="1.5" fill="none" />
      {/* Rising bubbles */}
      {[[48, 118], [52, 92], [138, 104], [144, 82]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="none" stroke="rgba(200,230,255,.5)" strokeWidth=".5" />
      ))}
    </svg>
  );
}

function PressureVault({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="pv" />
      {/* Seafloor */}
      <rect x="0" y="170" width="200" height="30" fill="#1a1025" />
      {/* Rounded pressure chamber */}
      <ellipse cx="100" cy="110" rx="58" ry="55" fill="#4a5a78" />
      <ellipse cx="100" cy="110" rx="58" ry="55" fill="none" stroke="#6a7a9a" strokeWidth="2" />
      <ellipse cx="100" cy="110" rx="58" ry="55" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      {/* Highlight */}
      <ellipse cx="80" cy="90" rx="24" ry="14" fill="rgba(255,255,255,.2)" />
      {/* Support legs */}
      <rect x="70" y="158" width="8" height="14" fill="#3a4a68" />
      <rect x="122" y="158" width="8" height="14" fill="#3a4a68" />
      <rect x="58" y="170" width="32" height="4" fill="#2a3a58" />
      <rect x="110" y="170" width="32" height="4" fill="#2a3a58" />
      {/* Circular porthole */}
      <circle cx="100" cy="105" r="22" fill="#0a2840" />
      <circle cx="100" cy="105" r="22" fill="none" stroke="#6a7a9a" strokeWidth="3" />
      <circle cx="100" cy="105" r="22" fill="none" stroke="rgba(144,200,255,.3)" strokeWidth=".8" />
      {/* Bolts around porthole */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = r2(100 + Math.cos(rad) * 24);
        const y = r2(105 + Math.sin(rad) * 24);
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#2a3a58" />;
      })}
      {/* Inside porthole: glowing interior with a figure looking out */}
      <circle cx="100" cy="105" r="15" fill="#0a1a28" />
      <circle cx="100" cy="105" r="12" fill="#2a6a98" opacity=".55" />
      <circle cx="100" cy="108" r="4" fill="#FFDAB0" />
      <rect x="96" y="110" width="8" height="6" rx="1.2" fill="#E85090" />
      <circle cx="98.5" cy="107" r=".6" fill="#0a0a20" />
      <circle cx="101.5" cy="107" r=".6" fill="#0a0a20" />
      {/* Flashing warning lights on either side */}
      <circle cx="64" cy="100" r="3" fill="#C43A3A" />
      <circle cx="64" cy="100" r="6" fill="#C43A3A" opacity=".3" />
      <circle cx="136" cy="100" r="3" fill="#C43A3A" />
      <circle cx="136" cy="100" r="6" fill="#C43A3A" opacity=".3" />
      {/* Particles of silt floating outside */}
      {[[44, 80], [48, 140], [152, 82], [156, 138], [80, 60], [120, 62]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.8 + (i % 2) * 0.5} fill="rgba(170,200,220,.6)" />
      ))}
      {/* Pressure rings on chamber */}
      <path d="M42 110 Q 100 70 158 110" stroke="rgba(0,0,0,.35)" strokeWidth="1" fill="none" />
      <path d="M42 110 Q 100 150 158 110" stroke="rgba(0,0,0,.35)" strokeWidth="1" fill="none" />
      {/* Pressure warning */}
      <g transform="translate(48 148)">
        <polygon points="0,0 12,0 6,-10" fill="#FFD740" />
        <text x="6" y="-2" textAnchor="middle" fontSize="8" fill="#2a1a10" fontWeight="900">!</text>
      </g>
    </svg>
  );
}

function CurrentBridge({ size = 160 }: Props) {
  // A horizontal tube/tunnel with powerful water current flowing LEFT TO
  // RIGHT through it. Fish and a diver are being SWEPT through in the same
  // direction. Big directional arrows. Reads clearly as "water flows
  // through this structure".
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="cb" />
      {/* Two rocky seafloor platforms, left and right */}
      <path d="M0 152 L40 150 L50 170 L0 175 Z" fill="#2a1830" />
      <path d="M0 175 L60 172 L60 200 L0 200 Z" fill="#1a1028" />
      <path d="M200 152 L160 150 L150 170 L200 175 Z" fill="#2a1830" />
      <path d="M200 175 L140 172 L140 200 L200 200 Z" fill="#1a1028" />
      {/* Big horizontal tunnel stretching between the platforms */}
      <rect x="30" y="88" width="140" height="64" rx="8" fill="#3a4a68" />
      <rect x="30" y="88" width="140" height="6" fill="rgba(255,255,255,.3)" />
      <rect x="30" y="146" width="140" height="6" fill="rgba(0,0,0,.35)" />
      {/* Tunnel interior - visible water flowing through */}
      <rect x="34" y="96" width="132" height="48" rx="4" fill="#0a2850" />
      <rect x="34" y="96" width="132" height="4" fill="rgba(144,200,255,.15)" />
      {/* Tunnel support ribs */}
      {[54, 84, 114, 144].map((x, i) => (
        <rect key={i} x={x} y="88" width="3" height="64" fill="#2a3a58" />
      ))}
      {/* STRONG current lines flowing LEFT to RIGHT */}
      {[104, 114, 124, 134].map((y, i) => (
        <g key={i}>
          <path d={`M36 ${y} Q 100 ${y - 4} 164 ${y}`} stroke="rgba(144,220,255,.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <polygon points={`162,${y - 4} 168,${y} 162,${y + 4}`} fill="rgba(144,220,255,.8)" />
        </g>
      ))}
      {/* Fish being carried by the current, oriented with flow */}
      <g transform="translate(78 108)">
        <ellipse cx="0" cy="0" rx="6" ry="2.5" fill="#FFD740" />
        <polygon points="-6,0 -10,-2.5 -10,2.5" fill="#FFD740" />
        <circle cx="3" cy="-.5" r=".8" fill="#1a0a08" />
        <path d="M6 0 L 10 0" stroke="rgba(255,215,64,.5)" strokeWidth="1" />
      </g>
      <g transform="translate(120 124)">
        <ellipse cx="0" cy="0" rx="5" ry="2" fill="#FF7043" />
        <polygon points="-5,0 -8,-2 -8,2" fill="#FF7043" />
        <circle cx="2.5" cy="-.3" r=".6" fill="#1a0a08" />
      </g>
      <g transform="translate(54 134)">
        <ellipse cx="0" cy="0" rx="4" ry="1.6" fill="#8aC4FF" />
        <polygon points="-4,0 -7,-1.6 -7,1.6" fill="#8aC4FF" />
      </g>
      {/* Diver being swept along, body tilted with the flow */}
      <g transform="translate(150 118) rotate(-5)">
        <ellipse cx="0" cy="0" rx="12" ry="6" fill="#3a4a68" />
        <circle cx="11" cy="-1" r="5" fill="#8aC4FF" opacity=".9" />
        <circle cx="11" cy="-1" r="3.5" fill="#DDE8FF" />
        <circle cx="11" cy="-1" r="1" fill="#2a3a58" />
        {/* Oxygen tank */}
        <rect x="-6" y="-4" width="4" height="8" rx="1" fill="#FFA840" />
        {/* Flippers trailing BEHIND the flow (i.e., left) */}
        <path d="M-10 -2 L -18 -5 L -18 -1 Z" fill="#FFD740" />
        <path d="M-10 2 L -18 5 L -18 1 Z" fill="#FFD740" />
        {/* Bubbles trailing off behind */}
        <circle cx="-20" cy="-3" r="1.2" fill="none" stroke="rgba(200,230,255,.6)" strokeWidth=".5" />
        <circle cx="-24" cy="-5" r="1" fill="none" stroke="rgba(200,230,255,.5)" strokeWidth=".5" />
      </g>
      {/* Label arrow at top: HUGE directional indicator */}
      <g transform="translate(100 68)">
        <rect x="-36" y="-6" width="72" height="4" fill="rgba(144,220,255,.5)" rx="2" />
        <polygon points="30,-10 46,-4 30,2" fill="rgba(144,220,255,.65)" />
      </g>
      {/* Support pillars under the bridge */}
      <rect x="44" y="152" width="6" height="18" fill="#2a1830" />
      <rect x="150" y="152" width="6" height="18" fill="#2a1830" />
    </svg>
  );
}

function BiolumeBeacon({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="bb" />
      {/* Bioluminescent glow */}
      <defs>
        <radialGradient id="bb-glow" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="#8aD4FF" stopOpacity=".9" />
          <stop offset="100%" stopColor="#4aA0D0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="80" r="55" fill="url(#bb-glow)" />
      {/* Seafloor */}
      <path d="M0 180 Q 50 175 100 178 Q 150 180 200 176 L200 200 L0 200 Z" fill="#1a1028" />
      {/* Tapered coral beacon */}
      <polygon points="86,180 114,180 108,110 92,110" fill="#5a2840" />
      <polygon points="92,110 108,110 104,70 96,70" fill="#8a4068" />
      <polygon points="96,70 104,70 100,40" fill="#C45090" />
      <polygon points="86,180 100,180 104,110 100,110" fill="rgba(255,255,255,.15)" />
      {/* Glowing tip */}
      <circle cx="100" cy="38" r="12" fill="#DDE8FF" opacity=".95" />
      <circle cx="100" cy="38" r="7" fill="#FFFFFF" />
      {/* Glowing nodules along the spire */}
      {[[93, 120, 2], [107, 115, 2], [95, 90, 2.5], [105, 85, 2.5], [97, 60, 2], [103, 55, 2]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 2} fill="#8aD4FF" opacity=".5" />
          <circle cx={x} cy={y} r={r as number} fill="#DDE8FF" />
        </g>
      ))}
      {/* Beam rays going outward */}
      {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = r2(100 + Math.cos(rad) * 14);
        const y1 = r2(38 + Math.sin(rad) * 14);
        const x2 = r2(100 + Math.cos(rad) * 26);
        const y2 = r2(38 + Math.sin(rad) * 26);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(200,230,255,.45)" strokeWidth="1" />;
      })}
      {/* Tiny fish drawn to the light */}
      {[[65, 52], [140, 58], [50, 80], [150, 82]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="3" ry="1.2" fill="#FFD740" opacity=".85" />
          <polygon points={`${(x as number) - 3},${y} ${(x as number) - 5},${(y as number) - 1} ${(x as number) - 5},${(y as number) + 1}`} fill="#FFD740" opacity=".85" />
        </g>
      ))}
      {/* Lone diver below gazing up at the beacon */}
      <g transform="translate(55 165)">
        {/* Body */}
        <ellipse cx="0" cy="0" rx="7" ry="4" fill="#3a4a68" />
        {/* Helmet tilted upward */}
        <circle cx="2" cy="-5" r="3.5" fill="#8aC4FF" opacity=".85" />
        <circle cx="2" cy="-5" r="2.5" fill="#DDE8FF" />
        {/* Silhouetted head profile */}
        <circle cx="2" cy="-4.5" r="1.2" fill="#2a3a58" />
        {/* Tank */}
        <rect x="-4" y="-3" width="3" height="5" rx=".5" fill="#FFA840" />
        {/* Flippers */}
        <path d="M6 2 L12 4 L10 -1 Z" fill="#FFD740" />
        {/* Bubble trail rising toward beacon */}
        {[[4, -10, 1], [6, -18, 1.2], [5, -26, .8], [7, -34, 1]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r as number} fill="none" stroke="rgba(200,230,255,.55)" strokeWidth=".4" />
        ))}
      </g>
      {/* Glowing filaments trailing off the spire tip */}
      <path d="M100 38 Q 85 46 70 52" stroke="rgba(138,212,255,.4)" strokeWidth=".6" fill="none" strokeDasharray="1 2" />
      <path d="M100 38 Q 115 46 130 52" stroke="rgba(138,212,255,.4)" strokeWidth=".6" fill="none" strokeDasharray="1 2" />
      <path d="M100 38 Q 100 28 95 20" stroke="rgba(138,212,255,.35)" strokeWidth=".5" fill="none" strokeDasharray="1 2" />
    </svg>
  );
}

function TidalCommons({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="tc" />
      {/* Sandy plaza floor */}
      <ellipse cx="100" cy="170" rx="90" ry="18" fill="#6a5238" />
      <ellipse cx="100" cy="170" rx="90" ry="18" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      <ellipse cx="100" cy="170" rx="74" ry="14" fill="#4a3a28" />
      {/* Kelp forest fringing */}
      {[
        [20, 170, 80], [40, 170, 95], [165, 170, 85], [180, 170, 75],
      ].map(([x, base, h], i) => (
        <g key={i}>
          <path
            d={`M${x} ${base} Q ${(x as number) - 4} ${(base as number) - (h as number) / 2} ${x} ${(base as number) - h} Q ${(x as number) + 4} ${(base as number) - (h as number) * 1.1} ${(x as number) + 2} ${(base as number) - (h as number) * 1.3}`}
            stroke="#2a6a42" strokeWidth="4" fill="none" strokeLinecap="round"
          />
          {/* Kelp leaves */}
          {[0.3, 0.55, 0.8].map((t, j) => (
            <ellipse
              key={j}
              cx={(x as number) - 4 + j * 2}
              cy={(base as number) - (h as number) * t}
              rx="4" ry="1.5"
              fill="#3a8a58"
            />
          ))}
        </g>
      ))}
      {/* School of fish swirling overhead */}
      {[[55, 80], [65, 76], [75, 82], [85, 78], [95, 80], [105, 74], [115, 80], [125, 84], [135, 78]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="2.5" ry="1" fill="#FFD740" opacity=".85" />
          <polygon points={`${x - 2.5},${y} ${x - 4},${y - .8} ${x - 4},${y + .8}`} fill="#FFD740" opacity=".85" />
        </g>
      ))}
      {/* Central meeting stone */}
      <ellipse cx="100" cy="158" rx="20" ry="5" fill="#5a4a30" />
      <ellipse cx="100" cy="156" rx="18" ry="4" fill="#8a7a50" />
      <ellipse cx="100" cy="156" rx="18" ry="4" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".6" />
      {/* Two figures on stone */}
      <g transform="translate(92 150)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2" y="2" width="5" height="7" rx="1" fill="#4aA0D0" />
      </g>
      <g transform="translate(108 150)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2" y="2" width="5" height="7" rx="1" fill="#E85090" />
      </g>
      {/* Giant manta ray gliding overhead */}
      <g transform="translate(100 42)">
        {/* Wings (diamond body) */}
        <path d="M0 0 Q -42 -6 -48 0 Q -42 6 0 8 Q 42 6 48 0 Q 42 -6 0 0 Z" fill="#2a3848" />
        <path d="M0 0 Q -42 -6 -48 0 Q -42 6 0 8 Q 42 6 48 0 Q 42 -6 0 0 Z" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".7" />
        {/* Wing tips flaring */}
        <path d="M-42 -4 Q -50 -2 -48 2" stroke="#1a2030" strokeWidth="1" fill="none" />
        <path d="M42 -4 Q 50 -2 48 2" stroke="#1a2030" strokeWidth="1" fill="none" />
        {/* Central body */}
        <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="#1a2838" />
        {/* Head horns */}
        <path d="M-3 -2 L-5 -6" stroke="#1a2030" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 -2 L5 -6" stroke="#1a2030" strokeWidth="1.5" strokeLinecap="round" />
        {/* Eyes */}
        <circle cx="-3" cy="1" r=".7" fill="#0a0a10" />
        <circle cx="3" cy="1" r=".7" fill="#0a0a10" />
        {/* Tail */}
        <path d="M0 8 Q 2 20 -3 28" stroke="#1a2030" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Central ring stone decor */}
      <circle cx="100" cy="156" r="14" fill="none" stroke="rgba(200,180,120,.4)" strokeWidth=".8" />
      {/* Bubbles */}
      {[[85, 115, 1.2], [115, 110, 1], [130, 125, .8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r as number} fill="none" stroke="rgba(200,230,255,.5)" strokeWidth=".6" />
      ))}
    </svg>
  );
}

function AbyssPod({ size = 160 }: Props) {
  // A deep-sea submersible pod sitting on the ocean floor in the pitch
  // black abyss. ONE big round porthole dominates the pod face, showing a
  // clear silhouette of a person looking out. Surroundings are very dark,
  // a giant tentacled creature drifts ominously in the background.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <defs>
        <radialGradient id="ap-void" cx=".5" cy=".3" r=".9">
          <stop offset="0%" stopColor="#08102a" />
          <stop offset="100%" stopColor="#000004" />
        </radialGradient>
        <radialGradient id="ap-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".5" />
          <stop offset="100%" stopColor="#FFE890" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill="url(#ap-void)" />
      {/* Deep seafloor */}
      <path d="M0 168 Q 40 162 80 166 Q 130 170 200 160 L200 200 L0 200 Z" fill="#080412" />
      {/* Distant giant tentacle creature drifting (ominous) */}
      <g opacity=".35">
        <path d="M14 24 Q 30 40 26 80 Q 32 60 48 72 Q 38 54 54 46" stroke="#3a1a58" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="22" cy="22" rx="14" ry="10" fill="#3a1a58" />
        <circle cx="18" cy="20" r="1.5" fill="#FFE890" opacity=".8" />
      </g>
      {/* Light halo around the pod */}
      <ellipse cx="100" cy="120" rx="80" ry="40" fill="url(#ap-glow)" />
      {/* THE POD - big round submersible body */}
      <circle cx="100" cy="126" r="48" fill="#4a5a78" />
      <circle cx="100" cy="126" r="48" fill="none" stroke="#8aA8D0" strokeWidth="2.5" />
      <circle cx="100" cy="126" r="42" fill="#5a6a8a" />
      <ellipse cx="80" cy="104" rx="22" ry="12" fill="rgba(255,255,255,.15)" />
      {/* Rivets around the outer rim */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = r2(100 + Math.cos(rad) * 44);
        const y = r2(126 + Math.sin(rad) * 44);
        return <circle key={i} cx={x} cy={y} r="2" fill="#2a3a58" stroke="rgba(255,255,255,.3)" strokeWidth=".4" />;
      })}
      {/* ONE BIG PORTHOLE with person visible inside */}
      <circle cx="100" cy="120" r="22" fill="#0a0818" />
      <circle cx="100" cy="120" r="22" fill="none" stroke="#8aA8D0" strokeWidth="3" />
      <circle cx="100" cy="120" r="22" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      {/* Porthole bolts */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = r2(100 + Math.cos(rad) * 24);
        const y = r2(120 + Math.sin(rad) * 24);
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#2a3a58" />;
      })}
      {/* Warm interior glow inside porthole */}
      <circle cx="100" cy="120" r="18" fill="#FFE890" opacity=".85" />
      {/* Person silhouette looking out */}
      <g transform="translate(100 122)">
        <circle cx="0" cy="-3" r="5" fill="#2a3a58" />
        <rect x="-5" y="2" width="10" height="10" rx="2" fill="#2a3a58" />
        {/* Hand pressed to glass */}
        <ellipse cx="-8" cy="3" rx="2.5" ry="3.5" fill="#2a3a58" />
      </g>
      {/* Top hatch */}
      <rect x="90" y="82" width="20" height="6" fill="#2a3a58" />
      <rect x="88" y="78" width="24" height="5" rx="1" fill="#3a4a68" />
      <rect x="97" y="72" width="6" height="8" fill="#3a4a68" />
      {/* Exterior spotlights shining forward */}
      <circle cx="68" cy="108" r="2.5" fill="#FFE890" />
      <path d="M66 108 L 40 96 L 40 124 L 66 112 Z" fill="rgba(255,232,144,.25)" />
      <circle cx="132" cy="108" r="2.5" fill="#FFE890" />
      <path d="M134 108 L 160 96 L 160 124 L 134 112 Z" fill="rgba(255,232,144,.25)" />
      {/* Pod support legs resting on seafloor */}
      <g stroke="#2a3a58" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M72 166 L 60 180" />
        <path d="M100 174 L 100 186" />
        <path d="M128 166 L 140 180" />
      </g>
      {/* Small deep-sea particles drifting */}
      {[[30, 60], [40, 110], [170, 82], [165, 150]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.8} fill="rgba(170,200,220,.5)" />
      ))}
    </svg>
  );
}

function TrenchGate({ size = 160 }: Props) {
  // A massive stone gateway standing at the edge of a great chasm dropping
  // into the deep ocean. Two tall coral-rock pillars flank a wide arch.
  // The trench behind it is pure black with faint glows. One diver stands
  // at the threshold, casting a spotlight down into the abyss.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <OceanBackdrop id="tg" />
      <defs>
        <linearGradient id="tg-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#040818" />
          <stop offset="100%" stopColor="#000002" />
        </linearGradient>
        <linearGradient id="tg-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2850" />
          <stop offset="100%" stopColor="#1a0818" />
        </linearGradient>
        <radialGradient id="tg-abyssglow" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#08183a" stopOpacity=".8" />
          <stop offset="100%" stopColor="#040818" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Seafloor ledges on the near side of the trench */}
      <path d="M0 148 L28 148 L44 158 L0 168 Z" fill="#1a0818" />
      <path d="M200 148 L172 148 L156 158 L200 168 Z" fill="#1a0818" />
      {/* The trench itself — a pitch-black chasm between the ledges */}
      <path d="M44 158 L 156 158 L 200 200 L 0 200 Z" fill="url(#tg-deep)" />
      {/* Faint glow from deep inside the trench */}
      <ellipse cx="100" cy="190" rx="80" ry="20" fill="url(#tg-abyssglow)" />
      {/* LEFT GATE PILLAR — tall, hulking, clearly carved stone */}
      <rect x="22" y="36" width="34" height="126" fill="url(#tg-stone)" />
      <rect x="22" y="36" width="34" height="4" fill="rgba(255,255,255,.25)" />
      <rect x="52" y="36" width="4" height="126" fill="rgba(0,0,0,.4)" />
      {/* Pillar stone courses */}
      {[54, 72, 90, 108, 126, 144].map((y, i) => (
        <line key={i} x1="22" y1={y} x2="56" y2={y} stroke="rgba(0,0,0,.55)" strokeWidth="1" />
      ))}
      {/* Pillar capital */}
      <rect x="18" y="28" width="42" height="10" fill="url(#tg-stone)" />
      <rect x="18" y="28" width="42" height="2" fill="rgba(255,255,255,.3)" />
      {/* Coral growth clinging to the pillar */}
      <path d="M22 130 L 18 122 L 22 114 L 18 108 L 24 104" stroke="#E85090" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M56 90 L 60 82 L 56 74" stroke="#FFA840" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* RIGHT GATE PILLAR */}
      <rect x="144" y="36" width="34" height="126" fill="url(#tg-stone)" />
      <rect x="144" y="36" width="34" height="4" fill="rgba(255,255,255,.25)" />
      <rect x="174" y="36" width="4" height="126" fill="rgba(0,0,0,.4)" />
      {[54, 72, 90, 108, 126, 144].map((y, i) => (
        <line key={i} x1="144" y1={y} x2="178" y2={y} stroke="rgba(0,0,0,.55)" strokeWidth="1" />
      ))}
      <rect x="140" y="28" width="42" height="10" fill="url(#tg-stone)" />
      <rect x="140" y="28" width="42" height="2" fill="rgba(255,255,255,.3)" />
      <path d="M178 130 L 182 122 L 178 114 L 182 108 L 176 104" stroke="#E85090" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M144 90 L 140 82 L 144 74" stroke="#FFA840" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* MASSIVE lintel / arch spanning the two pillars */}
      <path d="M18 28 L 182 28 L 182 40 Q 100 60 18 40 Z" fill="url(#tg-stone)" />
      <path d="M18 28 L 182 28" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
      <path d="M18 40 Q 100 60 182 40" stroke="rgba(0,0,0,.5)" strokeWidth="1" fill="none" />
      {/* Keystone */}
      <polygon points="90,28 110,28 106,42 94,42" fill="#7a5888" stroke="#2a1830" strokeWidth="1" />
      {/* Glowing runes carved into the lintel */}
      {[[40, 34], [70, 34], [100, 38], [130, 34], [160, 34]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2" fill="#8aD4FF" />
          <circle cx={x} cy={y} r="4" fill="rgba(138,212,255,.4)" />
        </g>
      ))}
      {/* Gate threshold floor between the pillars (stone platform) */}
      <rect x="56" y="154" width="88" height="8" fill="url(#tg-stone)" />
      <rect x="56" y="154" width="88" height="2" fill="rgba(255,255,255,.2)" />
      {/* Edge of the drop - clearly visible cliff */}
      <path d="M56 162 L 40 170 L 56 170 Z" fill="#1a0818" />
      <path d="M144 162 L 160 170 L 144 170 Z" fill="#1a0818" />
      {/* Explorer diver standing ON the threshold shining light DOWN into the trench */}
      <g transform="translate(100 148)">
        {/* Flashlight beam pointing DOWNWARD into the abyss */}
        <path d="M0 4 L -18 38 L 18 38 Z" fill="rgba(255,232,144,.25)" />
        {/* Body */}
        <ellipse cx="0" cy="0" rx="7" ry="5" fill="#3a4a68" />
        {/* Helmet */}
        <circle cx="0" cy="-5" r="4.5" fill="#8aC4FF" opacity=".9" />
        <circle cx="0" cy="-5" r="3.5" fill="#DDE8FF" />
        <circle cx="0" cy="-5" r="1.5" fill="#2a3a58" />
        {/* Tank */}
        <rect x="4" y="-3" width="3.5" height="6" rx="1" fill="#FFA840" />
        {/* Arm holding flashlight down */}
        <rect x="-2" y="3" width="3" height="6" rx="1" fill="#3a4a68" />
        <rect x="-3" y="8" width="5" height="3" rx="1" fill="#2a3a58" />
        <circle cx="-.5" cy="11" r="1.5" fill="#FFE890" />
        {/* Flippers */}
        <path d="M-6 4 L -11 8 L -9 2 Z" fill="#FFD740" />
        <path d="M6 4 L 11 8 L 9 2 Z" fill="#FFD740" />
      </g>
      {/* Faint glowing lifeforms deep in the trench */}
      {[[64, 192, 1], [100, 196, 1.2], [140, 192, .9], [80, 182, .7], [126, 182, .7]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 1.5} fill="#8aD4FF" opacity=".3" />
          <circle cx={x} cy={y} r={r as number} fill="#8aD4FF" opacity=".8" />
        </g>
      ))}
      {/* Drifting particles */}
      {[[50, 80, 1], [150, 76, 1], [40, 134, .8], [164, 130, .8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r as number} fill="rgba(170,200,220,.5)" />
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  RAINFOREST (roothold): 8 outposts
// ═════════════════════════════════════════════════════════════

function ForestBackdrop({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-forest`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3428" />
          <stop offset="100%" stopColor="#0a1810" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="10" fill={`url(#${id}-forest)`} />
      {/* Sunbeams filtering through */}
      <path d="M50 0 L30 200 L40 200 L60 0 Z" fill="rgba(255,232,144,.08)" />
      <path d="M140 0 L160 200 L170 200 L150 0 Z" fill="rgba(255,232,144,.07)" />
      {/* Distant leaves silhouette */}
      {[[14, 25, 14], [45, 20, 18], [90, 30, 22], [135, 22, 16], [172, 28, 18]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r as number} ry="8" fill="#0a2818" opacity=".5" />
      ))}
    </>
  );
}

function Canopy({ size = 160 }: Props) {
  // The leafy roof of the forest, dense green foliage dominating the upper
  // two thirds of the frame. Forest backdrop keeps the rainforest mood
  // consistent across all eight Roothold districts. Tiny figures on the
  // ground look up, making the "this is the treetop layer" read obvious.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="cp" />
      <defs>
        <radialGradient id="cp-beam" cx=".5" cy="0" r=".8">
          <stop offset="0%" stopColor="#FFF0A0" stopOpacity=".5" />
          <stop offset="100%" stopColor="#FFF0A0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Sunbeams streaming down through gaps */}
      <path d="M64 20 L 48 200 L 80 200 L 84 20 Z" fill="url(#cp-beam)" opacity=".6" />
      <path d="M136 30 L 120 200 L 152 200 L 156 30 Z" fill="url(#cp-beam)" opacity=".5" />
      {/* Massive leaf dome filling most of the frame */}
      <ellipse cx="100" cy="80" rx="110" ry="70" fill="#2a5a32" />
      {/* Layered leaf masses creating the canopy texture */}
      {[
        { cx: 40, cy: 70, rx: 42, ry: 30, fill: "#3a7042" },
        { cx: 100, cy: 52, rx: 58, ry: 36, fill: "#4a8a52" },
        { cx: 160, cy: 70, rx: 42, ry: 30, fill: "#3a7042" },
        { cx: 70, cy: 100, rx: 40, ry: 24, fill: "#4a8a52" },
        { cx: 130, cy: 100, rx: 40, ry: 24, fill: "#4a8a52" },
        { cx: 20, cy: 110, rx: 28, ry: 18, fill: "#2a5a32" },
        { cx: 180, cy: 110, rx: 28, ry: 18, fill: "#2a5a32" },
      ].map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.fill} />
      ))}
      {/* Highlighted leaves catching sunlight (lighter) */}
      {[
        [56, 40, 12], [90, 32, 14], [134, 40, 12], [70, 74, 10], [130, 74, 10], [40, 90, 9], [160, 90, 9], [100, 88, 9],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={(r as number) + 3} ry={r as number} fill="#7aC880" opacity=".9" />
          <ellipse cx={(x as number) - 2} cy={(y as number) - 1} rx={(r as number) * 0.5} ry={(r as number) * 0.3} fill="#a0E0A0" opacity=".7" />
        </g>
      ))}
      {/* Individual leaf shapes on the bottom edge for detail */}
      {[
        [28, 140], [54, 145], [80, 148], [110, 146], [140, 145], [168, 142], [188, 138],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} Q ${(x as number) - 4} ${(y as number) + 6} ${(x as number) - 2} ${(y as number) + 10} Q ${x} ${(y as number) + 8} ${(x as number) + 4} ${(y as number) + 10} Q ${(x as number) + 6} ${(y as number) + 4} ${x} ${y}`} fill="#3a7042" />
          <path d={`M${x} ${y} L ${x} ${(y as number) + 9}`} stroke="#2a4028" strokeWidth=".5" />
        </g>
      ))}
      {/* Single vertical tree trunk peeking down through the canopy */}
      <rect x="96" y="140" width="8" height="40" fill="#4a2a18" />
      <rect x="96" y="140" width="2" height="40" fill="rgba(255,255,255,.2)" />
      {/* Forest floor at the bottom */}
      <rect x="0" y="178" width="200" height="22" fill="#1a2810" />
      {/* TINY figures on the forest floor looking UP at the canopy */}
      <g transform="translate(40 172)">
        <circle cx="0" cy="0" r="2.5" fill="#FFDAB0" />
        <rect x="-2" y="2" width="4" height="6" rx="1" fill="#4FC3F7" />
        {/* Arm pointing up */}
        <line x1="0" y1="2" x2="4" y2="-4" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g transform="translate(154 174)">
        <circle cx="0" cy="0" r="2.5" fill="#FFDAB0" />
        <rect x="-2" y="2" width="4" height="5" rx="1" fill="#E85090" />
        <line x1="0" y1="2" x2="-4" y2="-4" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Bird silhouettes against sky */}
      <path d="M20 30 q 3 -2 6 0 q 3 -2 6 0" stroke="#2a3028" strokeWidth="1.2" fill="none" />
      <path d="M170 22 q 2 -1.5 4 0 q 2 -1.5 4 0" stroke="#2a3028" strokeWidth="1" fill="none" />
    </svg>
  );
}

function UndergrowthHollow({ size = 160 }: Props) {
  // A large, obvious ARCHED OPENING in the forest floor — like a burrow or
  // cave mouth — framed by dense tangled roots, ferns, and mushrooms. A
  // small path leads INTO the darkness. A glowing animal eye inside makes
  // the "hollow" read as a sheltered hidden space to crawl into.
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="uh" />
      {/* Ground: soil mound that the hollow sits inside of */}
      <path d="M0 130 Q 50 110 100 120 Q 150 130 200 115 L200 200 L0 200 Z" fill="#1a2818" />
      {/* Mound detail */}
      <path d="M0 130 Q 50 110 100 120 Q 150 130 200 115" stroke="rgba(255,255,255,.08)" strokeWidth="1" fill="none" />
      {/* THE HOLLOW - a huge dark arched opening in the mound */}
      <path d="M52 180 L 52 148 Q 100 90 148 148 L 148 180 Z" fill="#080208" />
      {/* Glow from deep inside */}
      <ellipse cx="100" cy="160" rx="20" ry="24" fill="#3a2018" opacity=".6" />
      {/* Thick root border framing the opening - clearly a natural den */}
      <path d="M52 180 L 52 148 Q 100 90 148 148 L 148 180" fill="none" stroke="#4a2818" strokeWidth="10" strokeLinecap="round" />
      <path d="M58 180 L 58 150 Q 100 100 142 150 L 142 180" fill="none" stroke="#6a3822" strokeWidth="3" strokeLinecap="round" />
      {/* Gnarled roots curling outward on both sides */}
      <path d="M16 180 Q 22 150 40 148 Q 48 160 52 174" stroke="#4a2818" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M184 180 Q 178 150 160 148 Q 152 160 148 174" stroke="#4a2818" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M28 180 Q 34 166 44 170" stroke="#6a3822" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M172 180 Q 166 166 156 170" stroke="#6a3822" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Moss on top of the mound */}
      {[28, 74, 126, 172].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy="128" rx="12" ry="3" fill="#4a8a32" opacity=".8" />
          <ellipse cx={x - 4} cy="127" rx="4" ry="1.5" fill="#6aB850" opacity=".9" />
        </g>
      ))}
      {/* Path of dirt leading INTO the hollow */}
      <path d="M100 198 Q 100 180 100 164" stroke="#5a4018" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".7" />
      {/* Two glowing eyes inside the hollow - clearly something lives there */}
      <circle cx="94" cy="158" r="1.8" fill="#FFE890" />
      <circle cx="106" cy="158" r="1.8" fill="#FFE890" />
      <circle cx="94" cy="158" r="3.5" fill="#FFE890" opacity=".35" />
      <circle cx="106" cy="158" r="3.5" fill="#FFE890" opacity=".35" />
      {/* Fireflies floating near the opening */}
      {[[70, 130, 1.2], [130, 128, 1.4], [60, 152, 1], [140, 152, 1.1]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 3} fill="#FFE890" opacity=".3" />
          <circle cx={x} cy={y} r={r as number} fill="#FFFCD0" />
        </g>
      ))}
      {/* Colorful mushrooms clustered at the hollow entrance */}
      {[
        [26, 172, "#C43A3A"], [42, 174, "#E85090"], [64, 170, "#FFA840"],
        [136, 170, "#C43A3A"], [158, 174, "#E85090"], [178, 172, "#FFA840"],
      ].map(([x, y, color], i) => (
        <g key={i}>
          <rect x={(x as number) - 1.8} y={y as number} width="3.6" height="8" fill="#EAEACD" />
          <path d={`M${(x as number) - 7} ${y} Q ${x} ${(y as number) - 7} ${(x as number) + 7} ${y} Z`} fill={color as string} />
          <circle cx={(x as number) - 2.5} cy={(y as number) - 2.5} r="1.2" fill="white" opacity=".8" />
          <circle cx={(x as number) + 2} cy={(y as number) - 1.5} r=".8" fill="white" opacity=".8" />
        </g>
      ))}
      {/* Ferns on both sides */}
      {[{ x: 14, y: 146 }, { x: 186, y: 148 }, { x: 32, y: 160 }, { x: 168, y: 162 }].map((f, i) => (
        <g key={i}>
          {[0, 20, 40, 60, 80].map((a, j) => {
            const rad = ((a - 40) * Math.PI) / 180;
            return (
              <line
                key={j}
                x1={f.x}
                y1={f.y}
                x2={r2(f.x + Math.cos(rad) * 10)}
                y2={r2(f.y - 10 - j * 0.3)}
                stroke="#4a8a32" strokeWidth="1.4" strokeLinecap="round"
              />
            );
          })}
        </g>
      ))}
      {/* Small acorn scattered on the path */}
      <ellipse cx="88" cy="188" rx="2.5" ry="3" fill="#8a5a30" />
      <path d="M86 186 Q 88 184 90 186" stroke="#5a3820" strokeWidth="1" fill="none" />
    </svg>
  );
}

function TheHollow({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="th" />
      {/* Massive tree trunk filling the frame */}
      <rect x="20" y="20" width="160" height="180" fill="#4a2a18" />
      {/* Bark texture */}
      {[30, 55, 80, 110, 140, 170].map((x, i) => (
        <path
          key={i}
          d={`M${x} 20 Q ${x - 4} 60 ${x} 120 Q ${x + 4} 160 ${x} 200`}
          stroke="#3a1e10" strokeWidth="1.5" fill="none"
        />
      ))}
      {/* Knots */}
      <circle cx="48" cy="52" r="4" fill="#3a1e10" />
      <circle cx="148" cy="40" r="3" fill="#3a1e10" />
      <circle cx="160" cy="150" r="5" fill="#3a1e10" />
      {/* Cavity (hollow opening) */}
      <path d="M62 90 Q 100 50 138 90 L138 180 L62 180 Z" fill="#0a0504" />
      <path d="M62 90 Q 100 50 138 90" fill="none" stroke="#2a1408" strokeWidth="2" />
      {/* High knothole above with morning light beaming through */}
      <ellipse cx="140" cy="32" rx="6" ry="4" fill="#3a1e10" />
      <ellipse cx="140" cy="32" rx="3.5" ry="2.5" fill="#FFE890" opacity=".95" />
      <path d="M138 34 L 110 70 L 124 90 L 146 68 Z" fill="rgba(255,232,144,.25)" />
      {/* Soft light glow inside */}
      <ellipse cx="100" cy="130" rx="28" ry="20" fill="rgba(255,232,144,.2)" />
      <circle cx="100" cy="138" r="6" fill="#FFE890" opacity=".7" />
      {/* Nest of twigs at bottom of cavity */}
      <ellipse cx="100" cy="162" rx="28" ry="6" fill="#3a2010" />
      <path d="M76 164 Q 100 156 124 164" stroke="#5a3a22" strokeWidth="1.2" fill="none" />
      <path d="M80 166 Q 100 160 120 166" stroke="#4a2e18" strokeWidth="1" fill="none" />
      {/* Small creature peeking out */}
      <g transform="translate(100 140)">
        <ellipse cx="0" cy="0" rx="8" ry="6" fill="#8a5028" />
        <circle cx="-3" cy="-1" r="1.2" fill="white" />
        <circle cx="3" cy="-1" r="1.2" fill="white" />
        <circle cx="-3" cy="-1" r=".6" fill="#0a0a10" />
        <circle cx="3" cy="-1" r=".6" fill="#0a0a10" />
        <ellipse cx="0" cy="2" rx="1.5" ry="1" fill="#4a2a18" />
        {/* Small ears */}
        <path d="M-6 -5 L-4 -8 L-2 -5 Z" fill="#8a5028" />
        <path d="M2 -5 L4 -8 L6 -5 Z" fill="#8a5028" />
      </g>
      {/* Small squirrel tail curled in the nest */}
      <path d="M80 158 Q 70 150 74 140 Q 78 148 84 156" fill="#C86A2A" />
      <path d="M80 158 Q 70 150 74 140 Q 78 148 84 156" stroke="#8a4a20" strokeWidth=".5" fill="none" />
      {/* Roots at base */}
      <path d="M20 180 Q 40 170 60 180 Q 80 175 100 180 Q 120 175 140 180 Q 160 172 180 180" stroke="#2a1408" strokeWidth="4" fill="none" />
      {/* Vines hanging */}
      {[40, 160].map((x, i) => (
        <path key={i} d={`M${x} 24 Q ${x + (i ? -3 : 3)} 40 ${x - (i ? -3 : 3)} 56 Q ${x} 70 ${x + (i ? -2 : 2)} 80`} stroke="#4a8a32" strokeWidth="1.5" fill="none" />
      ))}
    </svg>
  );
}

function VineBridge({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="vb" />
      {/* Two trees, one on each side */}
      <rect x="20" y="40" width="20" height="145" fill="#4a2a18" />
      <path d="M20 40 Q 30 20 40 40" fill="#2a5a32" />
      <ellipse cx="30" cy="35" rx="22" ry="16" fill="#3a7042" />
      <ellipse cx="30" cy="35" rx="18" ry="12" fill="#4a8a52" />
      <rect x="160" y="40" width="20" height="145" fill="#4a2a18" />
      <path d="M160 40 Q 170 20 180 40" fill="#2a5a32" />
      <ellipse cx="170" cy="35" rx="22" ry="16" fill="#3a7042" />
      <ellipse cx="170" cy="35" rx="18" ry="12" fill="#4a8a52" />
      {/* Vine suspension bridge */}
      {/* Main top cables */}
      <path d="M30 80 Q 100 55 170 80" stroke="#4a2a18" strokeWidth="2" fill="none" />
      <path d="M30 75 Q 100 50 170 75" stroke="#4a2a18" strokeWidth="2" fill="none" />
      {/* Foot ropes */}
      <path d="M30 120 Q 100 140 170 120" stroke="#4a2a18" strokeWidth="2.5" fill="none" />
      <path d="M30 125 Q 100 145 170 125" stroke="#4a2a18" strokeWidth="2.5" fill="none" />
      {/* Wooden planks */}
      {[
        [42, 127], [56, 131], [70, 134], [86, 136], [100, 137], [114, 136], [128, 134], [142, 131], [156, 127],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={(x as number) - 5} y={y} width="10" height="3.5" fill="#8A5A30" />
          <rect x={(x as number) - 5} y={y} width="10" height="1" fill="rgba(255,255,255,.2)" />
        </g>
      ))}
      {/* Verticals tying planks to ropes */}
      {[42, 56, 70, 86, 100, 114, 128, 142, 156].map((x, i) => (
        <line key={i} x1={x} y1="78" x2={x} y2="128" stroke="#4a2a18" strokeWidth="1" opacity=".7" />
      ))}
      {/* Vines with leaves hanging */}
      {[[50, 80], [90, 62], [130, 70], [160, 85]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} Q ${(x as number) + 3} ${(y as number) + 20} ${(x as number) - 2} ${(y as number) + 35}`} stroke="#4a8a32" strokeWidth="1.2" fill="none" />
          <ellipse cx={(x as number) - 1} cy={(y as number) + 22} rx="3" ry="1.5" fill="#4a8a32" />
          <ellipse cx={(x as number) + 1} cy={(y as number) + 32} rx="3" ry="1.5" fill="#4a8a32" />
        </g>
      ))}
      {/* Two figures crossing: one leading, one carrying a bundle */}
      <g transform="translate(80 122)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2.5" y="2" width="5" height="8" rx="1" fill="#FFA840" />
        {/* Walking stick */}
        <line x1="3" y1="2" x2="5" y2="11" stroke="#4a2a18" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g transform="translate(118 120)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2.5" y="2" width="5" height="8" rx="1" fill="#4FC3F7" />
        {/* Bundle on their back */}
        <rect x="-5" y="1" width="4" height="5" rx="1" fill="#8A5A30" />
        <line x1="-5" y1="1" x2="-5" y2="6" stroke="#3a1e10" strokeWidth=".6" />
        <line x1="-1" y1="1" x2="-1" y2="6" stroke="#3a1e10" strokeWidth=".6" />
      </g>
      {/* Extra leaves blowing off the vines (motion) */}
      <ellipse cx="68" cy="92" rx="2.5" ry="1" fill="#4a8a32" transform="rotate(20 68 92)" />
      <ellipse cx="50" cy="98" rx="2" ry=".8" fill="#6aB470" transform="rotate(-10 50 98)" />
      <ellipse cx="150" cy="96" rx="2" ry=".8" fill="#4a8a32" transform="rotate(15 150 96)" />
      {/* Ground */}
      <rect x="0" y="184" width="200" height="16" fill="#1a2810" />
    </svg>
  );
}

function AncientTree({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="at" />
      {/* Glow around tree */}
      <defs>
        <radialGradient id="at-glow" cx=".5" cy=".35" r=".55">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".45" />
          <stop offset="100%" stopColor="#FFE890" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="70" r="75" fill="url(#at-glow)" />
      {/* Trunk tapering upward */}
      <polygon points="82,180 118,180 108,40 92,40" fill="#5a3020" />
      <polygon points="82,180 100,180 100,40 92,40" fill="rgba(255,255,255,.1)" />
      <polygon points="100,180 118,180 108,40 100,40" fill="rgba(0,0,0,.22)" />
      {/* Root flares at base */}
      <path d="M82 180 Q 62 175 50 180 L82 180 Z" fill="#4a2818" />
      <path d="M118 180 Q 138 175 150 180 L118 180 Z" fill="#4a2818" />
      {/* Bark patterns */}
      {[60, 90, 120, 150].map((y, i) => (
        <line key={i} x1={88 + (180 - y) * 0.06} y1={y} x2={112 - (180 - y) * 0.06} y2={y} stroke="#3a1e10" strokeWidth=".8" />
      ))}
      {/* Branches and crown */}
      <ellipse cx="100" cy="36" rx="38" ry="22" fill="#2a5a32" />
      {/* Multiple layered leaves, glowing */}
      {[
        { cx: 75, cy: 38, rx: 18, ry: 12, fill: "#3a7042" },
        { cx: 125, cy: 38, rx: 18, ry: 12, fill: "#3a7042" },
        { cx: 100, cy: 22, rx: 20, ry: 14, fill: "#4a8a52" },
        { cx: 88, cy: 28, rx: 12, ry: 8, fill: "#6aB470" },
        { cx: 114, cy: 26, rx: 12, ry: 8, fill: "#6aB470" },
      ].map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.fill} />
      ))}
      {/* Glowing leaves sprinkled */}
      {[[80, 22, 1.5], [108, 14, 2], [122, 28, 1.2], [92, 40, 1.2], [116, 44, 1.5]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 2} fill="#FFE890" opacity=".5" />
          <circle cx={x} cy={y} r={r as number} fill="#FFFCD0" />
        </g>
      ))}
      {/* Glowing runes on trunk */}
      {[[96, 90], [104, 108], [96, 128], [104, 148], [96, 168]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.5" fill="#FFE890" />
          <circle cx={x} cy={y} r="3.5" fill="rgba(255,232,144,.35)" />
        </g>
      ))}
      <path d="M94 100 L 98 96 L 94 92" stroke="#FFE890" strokeWidth=".7" fill="none" opacity=".7" />
      <path d="M106 120 L 102 116 L 106 112" stroke="#FFE890" strokeWidth=".7" fill="none" opacity=".7" />
      <path d="M94 140 L 98 136 L 94 132" stroke="#FFE890" strokeWidth=".7" fill="none" opacity=".7" />
      {/* Vine ropes hanging from the canopy */}
      <path d="M68 50 Q 66 90 72 130 Q 74 160 72 180" stroke="#4a2a18" strokeWidth="1.4" fill="none" />
      <path d="M132 50 Q 134 90 128 130 Q 126 160 128 180" stroke="#4a2a18" strokeWidth="1.4" fill="none" />
      {/* Climber ascending on left vine */}
      <g transform="translate(71 110)">
        <circle cx="0" cy="0" r="2.5" fill="#FFDAB0" />
        <rect x="-2" y="2" width="4" height="6" rx="1" fill="#FF7043" />
        {/* Arms gripping the vine */}
        <line x1="-2" y1="3" x2="-5" y2="1" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="3" x2="4" y2="5" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Second climber on right vine */}
      <g transform="translate(130 140)">
        <circle cx="0" cy="0" r="2.5" fill="#FFDAB0" />
        <rect x="-2" y="2" width="4" height="6" rx="1" fill="#B388FF" />
        <line x1="-2" y1="3" x2="-4" y2="5" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="3" x2="5" y2="1" stroke="#FFDAB0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Circling hawk near the crown */}
      <g transform="translate(150 28)">
        <path d="M0 0 q -6 -4 -10 0 q -2 -3 0 -4 M0 0 q 6 -4 10 0 q 2 -3 0 -4" stroke="#3a2010" strokeWidth="1.4" fill="none" />
        <circle cx="0" cy="0" r="1.5" fill="#3a2010" />
      </g>
      {/* Ground */}
      <rect x="0" y="184" width="200" height="16" fill="#1a2810" />
      {/* Glowing petals floating */}
      <circle cx="42" cy="90" r="1.5" fill="#FFE890" opacity=".7" />
      <circle cx="156" cy="104" r="1.5" fill="#FFE890" opacity=".7" />
      <circle cx="64" cy="120" r="1.2" fill="#FFE890" opacity=".7" />
    </svg>
  );
}

function Clearing({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="cl" />
      {/* Bright sunlit circle */}
      <defs>
        <radialGradient id="cl-sun" cx=".5" cy=".5" r=".55">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".7" />
          <stop offset="100%" stopColor="#FFC040" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="150" rx="92" ry="36" fill="#2a5a32" />
      <ellipse cx="100" cy="150" rx="80" ry="28" fill="#4a8a52" />
      <ellipse cx="100" cy="150" rx="60" ry="18" fill="#6aB470" />
      {/* Overhead light beam */}
      <circle cx="100" cy="130" r="60" fill="url(#cl-sun)" />
      {/* Surrounding trees (silhouettes) */}
      {[
        { x: 10, y: 140, h: 70 },
        { x: 30, y: 150, h: 60 },
        { x: 170, y: 148, h: 65 },
        { x: 190, y: 140, h: 70 },
      ].map((t, i) => (
        <g key={i}>
          <rect x={t.x - 4} y={t.y - t.h + 20} width="8" height={t.h} fill="#1a0a08" />
          <ellipse cx={t.x} cy={t.y - t.h + 16} rx="22" ry="18" fill="#0a2818" />
        </g>
      ))}
      {/* Flowers in the grass */}
      {[[50, 158, "#FFE890"], [80, 162, "#E85090"], [120, 160, "#8aC4FF"], [150, 158, "#FFA840"], [70, 170, "#FFE890"], [130, 172, "#E85090"]].map(([x, y, color], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.5" fill={color as string} />
          <circle cx={x} cy={y} r="1" fill="white" />
        </g>
      ))}
      {/* Central campfire */}
      <ellipse cx="100" cy="154" rx="14" ry="3.5" fill="#3a2a18" />
      {/* Fire logs */}
      <rect x="94" y="151" width="12" height="2" fill="#4a2a18" transform="rotate(-20 100 152)" />
      <rect x="94" y="154" width="12" height="2" fill="#4a2a18" transform="rotate(20 100 155)" />
      {/* Flames */}
      <path d="M100 148 Q 96 142 98 138 Q 100 142 102 138 Q 104 142 100 148 Z" fill="#FFA840" />
      <path d="M100 146 Q 98 142 100 140 Q 102 142 100 146 Z" fill="#FFE890" />
      {/* Ember glow */}
      <circle cx="100" cy="154" r="10" fill="rgba(255,168,64,.3)" />
      {/* Figures around the campfire */}
      {[
        { x: 82, color: "#FFD740", tilt: 10 },
        { x: 122, color: "#8aC4FF", tilt: -10 },
        { x: 100, color: "#E85090", tilt: 0, back: true },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x} 150) rotate(${f.tilt})`}>
          <rect x="-2" y="-4" width="4" height="7" fill={f.color} />
          <circle cx="0" cy="-7" r="2.5" fill={f.back ? "#2a1a10" : "#FFDAB0"} />
        </g>
      ))}
      {/* Deer at the tree line (on the left) */}
      <g transform="translate(40 135)">
        {/* Body */}
        <ellipse cx="0" cy="0" rx="10" ry="4" fill="#A87048" />
        <path d="M-10 0 L-10 8 M-8 0 L-8 8" stroke="#A87048" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 0 L10 8 M8 0 L8 8" stroke="#A87048" strokeWidth="2" strokeLinecap="round" />
        {/* Neck */}
        <path d="M8 -2 Q 12 -8 14 -12" stroke="#A87048" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="15" cy="-13" rx="3" ry="2" fill="#A87048" />
        {/* Antlers */}
        <path d="M14 -15 L 12 -19 L 10 -18 M16 -15 L 18 -19 L 20 -18" stroke="#6a4028" strokeWidth="1" fill="none" />
        {/* Eye */}
        <circle cx="16" cy="-13" r=".4" fill="#0a0a10" />
        {/* Tail */}
        <rect x="-11" y="-2" width="2" height="3" fill="#E8D4B0" />
      </g>
      {/* Butterflies */}
      <path d="M60 100 q -3 -3 -6 0 q 0 -4 3 -2 M60 100 q 3 -3 6 0 q 0 -4 -3 -2" stroke="#E85090" strokeWidth="1" fill="none" />
      <path d="M148 112 q -2 -2 -4 0 q 0 -3 2 -1 M148 112 q 2 -2 4 0 q 0 -3 -2 -1" stroke="#FFE890" strokeWidth="1" fill="none" />
    </svg>
  );
}

function SeedBank({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="sb" />
      {/* Underground mound */}
      <path d="M20 100 Q 100 60 180 100 L180 200 L20 200 Z" fill="#2a1a10" />
      <path d="M20 100 Q 100 60 180 100" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      {/* Glow seeping through soil */}
      <defs>
        <radialGradient id="sb-glow" cx=".5" cy=".6" r=".45">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".65" />
          <stop offset="100%" stopColor="#FFE890" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="145" rx="70" ry="40" fill="url(#sb-glow)" />
      {/* Wooden door into the mound */}
      <path d="M80 145 L80 185 L120 185 L120 145 Q 100 130 80 145 Z" fill="#4a2a18" />
      <path d="M80 145 Q 100 130 120 145" fill="none" stroke="#3a1e10" strokeWidth="1" />
      {/* Door planks */}
      <line x1="92" y1="140" x2="92" y2="185" stroke="#3a1e10" strokeWidth=".8" />
      <line x1="108" y1="140" x2="108" y2="185" stroke="#3a1e10" strokeWidth=".8" />
      <circle cx="114" cy="165" r="1.5" fill="#FFD740" />
      {/* Glowing seeds and acorns stashed inside/through door cracks */}
      {[[96, 172, 2], [86, 168, 1.5], [104, 178, 1.8], [110, 170, 1.5], [90, 178, 1.5]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 1.5} fill="#FFE890" opacity=".6" />
          <ellipse cx={x} cy={y} rx={r as number} ry={(r as number) + .5} fill="#FFFCD0" />
        </g>
      ))}
      {/* Roots wrapping around the mound */}
      <path d="M10 110 Q 40 120 60 110" stroke="#4a2a18" strokeWidth="3" fill="none" />
      <path d="M140 110 Q 170 120 195 110" stroke="#4a2a18" strokeWidth="3" fill="none" />
      <path d="M30 150 Q 45 160 60 150" stroke="#4a2a18" strokeWidth="2" fill="none" />
      <path d="M140 150 Q 155 160 170 150" stroke="#4a2a18" strokeWidth="2" fill="none" />
      {/* Sprouts emerging from top of mound */}
      {[[68, 95], [92, 85], [108, 83], [132, 90]].map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={(y as number) + 6} stroke="#4a8a32" strokeWidth="1.2" />
          <path d={`M${x} ${y} q -3 -3 -5 0 q -2 -5 5 -3 q 7 -2 5 3 q -2 -3 -5 0 Z`} fill="#6aB470" />
        </g>
      ))}
      {/* Labels (jars of seeds) through door */}
      <rect x="89" y="175" width="3" height="4" fill="#C43A3A" opacity=".8" />
      <rect x="95" y="178" width="3" height="3" fill="#4a8a32" opacity=".8" />
      <rect x="102" y="176" width="3" height="4" fill="#FFD740" opacity=".8" />
      {/* Seed keeper seated by the door sorting seeds */}
      <g transform="translate(62 175)">
        {/* Body */}
        <rect x="-3" y="0" width="6" height="10" rx="1.2" fill="#4a8a32" />
        {/* Head */}
        <circle cx="0" cy="-3" r="3" fill="#FFDAB0" />
        {/* Straw hat */}
        <path d="M-5 -4 L 5 -4 L 4 -6 L -4 -6 Z" fill="#FFD740" />
        <ellipse cx="0" cy="-4" rx="5" ry=".8" fill="#C4A030" />
        {/* Arms reaching to basket */}
        <rect x="2" y="2" width="5" height="2" rx="1" fill="#FFDAB0" />
        {/* Small seed basket */}
        <path d="M6 4 L14 4 L13 9 L7 9 Z" fill="#8A5A30" />
        <rect x="6" y="4" width="8" height="1" fill="#C4A030" />
        <circle cx="9" cy="6" r="1" fill="#FFE890" />
        <circle cx="11.5" cy="7" r=".8" fill="#C43A3A" />
      </g>
      {/* Trail of planted sprouts leading away from the door */}
      {[[50, 192], [38, 188], [26, 192], [14, 188]].map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={(y as number) - 3} stroke="#4a8a32" strokeWidth="1" strokeLinecap="round" />
          <ellipse cx={(x as number) - 1} cy={(y as number) - 3} rx="1.5" ry=".8" fill="#6aB470" />
          <ellipse cx={(x as number) + 1} cy={(y as number) - 4} rx="1.5" ry=".8" fill="#6aB470" />
        </g>
      ))}
      {/* Warm cellar light spilling from door crack */}
      <path d="M78 148 L 76 185 L 80 185 Z" fill="rgba(255,232,144,.35)" />
    </svg>
  );
}

function RootArch({ size = 160 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <ForestBackdrop id="ra" />
      {/* Clearing on the other side (slightly brighter) */}
      <defs>
        <radialGradient id="ra-clearing" cx=".5" cy=".5" r=".45">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".4" />
          <stop offset="100%" stopColor="#FFE890" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="40" fill="url(#ra-clearing)" />
      {/* Massive root arch framing an opening */}
      {/* Left root column (vertical twisting) */}
      <path d="M28 185 Q 35 140 42 100 Q 48 70 60 60 Q 72 52 88 52" stroke="#4a2a18" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* Right root column */}
      <path d="M172 185 Q 165 140 158 100 Q 152 70 140 60 Q 128 52 112 52" stroke="#4a2a18" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* Arching top where roots meet */}
      <path d="M86 52 Q 100 38 114 52" stroke="#4a2a18" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* Inner detail on roots */}
      <path d="M34 170 Q 40 135 46 105 Q 52 78 64 68 Q 76 58 88 58" stroke="#5a3a22" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M166 170 Q 160 135 154 105 Q 148 78 136 68 Q 124 58 112 58" stroke="#5a3a22" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Moss on roots */}
      {[[40, 120], [48, 84], [152, 124], [148, 88]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="6" ry="2" fill="#4a8a32" opacity=".8" />
      ))}
      {/* Little glowing creatures inside */}
      {[[90, 130, 1.5], [110, 128, 1.5], [100, 134, 1]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={(r as number) + 2} fill="#FFE890" opacity=".5" />
          <circle cx={x} cy={y} r={r as number} fill="#FFFCD0" />
        </g>
      ))}
      {/* Opening at the bottom (dark forest floor visible through) */}
      <path d="M62 170 Q 100 160 138 170 L138 185 L62 185 Z" fill="#1a1208" />
      {/* Small caravan walking through with torches */}
      {/* Lead figure holding a torch */}
      <g transform="translate(88 172)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2.5" y="2" width="5" height="7" rx="1" fill="#FF7043" />
        {/* Torch */}
        <line x1="3" y1="0" x2="7" y2="-6" stroke="#4a2a18" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M7 -6 Q 5 -10 7 -12 Q 9 -10 7 -6 Z" fill="#FFA840" />
        <circle cx="7" cy="-8" r="4" fill="rgba(255,168,64,.35)" />
      </g>
      {/* Second figure with a satchel */}
      <g transform="translate(104 174)">
        <circle cx="0" cy="0" r="3" fill="#FFDAB0" />
        <rect x="-2.5" y="2" width="5" height="7" rx="1" fill="#4FC3F7" />
        {/* Satchel */}
        <ellipse cx="3" cy="5" rx="2.2" ry="1.5" fill="#8A5A30" />
      </g>
      {/* Third figure trailing behind */}
      <g transform="translate(120 173)">
        <circle cx="0" cy="0" r="2.5" fill="#FFDAB0" />
        <rect x="-2" y="2" width="4" height="6" rx="1" fill="#B388FF" />
      </g>
      {/* Torchlight warming the ground */}
      <ellipse cx="100" cy="180" rx="30" ry="5" fill="rgba(255,168,64,.18)" />
      {/* Ground */}
      <rect x="0" y="184" width="200" height="16" fill="#1a1208" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Keyed registry. Scenarios not yet authored resolve to the placeholder.
// ─────────────────────────────────────────────────────────────

export const DISTRICT_ILLUSTRATIONS: Record<string, React.FC<Props>> = {
  // Harborside (rising_tides)
  rising_tides_the_lighthouse: Lighthouse,
  rising_tides_the_lowlands: Lowlands,
  rising_tides_the_seawall: Seawall,
  rising_tides_the_crossing: Crossing,
  rising_tides_the_signal_fire: SignalFire,
  rising_tides_the_market_dock: MarketDock,
  rising_tides_the_safe_room: SafeRoom,
  rising_tides_the_harbor_gate: HarborGate,
  // Deep Space (last_orbit)
  last_orbit_observation_tower: ObservationTower,
  last_orbit_solar_array: SolarArray,
  last_orbit_shield_module: ShieldModule,
  last_orbit_docking_arm: DockingArm,
  last_orbit_command_spire: CommandSpire,
  last_orbit_commons_deck: CommonsDeck,
  last_orbit_core_reactor: CoreReactor,
  last_orbit_main_airlock: MainAirlock,
  // Ocean Depths (deep_current)
  deep_current_coral_spire: CoralSpire,
  deep_current_reef_shelf: ReefShelf,
  deep_current_pressure_vault: PressureVault,
  deep_current_current_bridge: CurrentBridge,
  deep_current_biolume_beacon: BiolumeBeacon,
  deep_current_tidal_commons: TidalCommons,
  deep_current_abyss_pod: AbyssPod,
  deep_current_trench_gate: TrenchGate,
  // Rainforest (roothold)
  roothold_the_canopy: Canopy,
  roothold_undergrowth_hollow: UndergrowthHollow,
  roothold_the_hollow: TheHollow,
  roothold_the_vine_bridge: VineBridge,
  roothold_the_ancient_tree: AncientTree,
  roothold_the_clearing: Clearing,
  roothold_the_seed_bank: SeedBank,
  roothold_the_root_arch: RootArch,
};

export function getDistrictIllustration(scenarioId: string, districtName: string | undefined | null): React.FC<Props> {
  if (!districtName) return GenericBrickPlaceholder;
  const key = makeDistrictKey(scenarioId, districtName);
  return DISTRICT_ILLUSTRATIONS[key] ?? GenericBrickPlaceholder;
}
