// Vote category illustrations. Four clean award emblems with dimensional
// depth: a gold trophy, a painter's palette, a shield with a lightning bolt,
// and a megaphone. Each object has layered gradients, rim lighting, inner
// shadows, and a cast shadow on the disc so they read as sculpted 3D.

type Props = { size?: number };

const DISC: Record<string, { light: string; mid: string; dark: string; rim: string }> = {
  vc_mvp: { light: "#FFE890", mid: "#FFB020", dark: "#6A3A08", rim: "#2A1404" },
  vc_creative: { light: "#FFBFE0", mid: "#D8448C", dark: "#6A1A48", rim: "#2A0A1E" },
  vc_clutch: { light: "#FFD0A0", mid: "#FF7030", dark: "#7A2204", rim: "#2A0A04" },
  vc_communicator: { light: "#9CDFFF", mid: "#2B9FC8", dark: "#0A3A5A", rim: "#04182A" },
};

function wrap(size: number): React.CSSProperties {
  return { width: size, height: size, display: "block" };
}

function Disc({ id }: { id: string }) {
  const c = DISC[id];
  return (
    <>
      <defs>
        <radialGradient id={`vc-disc-${id}`} cx=".5" cy=".38" r=".85">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={`vc-gloss-${id}`} cx=".5" cy=".2" r=".5">
          <stop offset="0%" stopColor="rgba(255,255,255,.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill={`url(#vc-disc-${id})`} />
      <circle cx="100" cy="100" r="94" fill={`url(#vc-gloss-${id})`} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={c.rim} strokeWidth="3" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
    </>
  );
}

// ═════════════════════════════════════════════════════════════
//  vc_mvp — Team MVP  (gold trophy, dimensional)
// ═════════════════════════════════════════════════════════════

function VcMvp({ size = 64 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="vc_mvp" />
      <defs>
        {/* Cup side-to-side gradient (not top-down) for proper left-lit curvature */}
        <linearGradient id="vc-mvp-cup" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="35%" stopColor="#FFD046" />
          <stop offset="65%" stopColor="#D49520" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <linearGradient id="vc-mvp-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C08028" />
        </linearGradient>
        <linearGradient id="vc-mvp-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE890" />
          <stop offset="100%" stopColor="#8A5E10" />
        </linearGradient>
        <linearGradient id="vc-mvp-base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE890" />
          <stop offset="50%" stopColor="#D49520" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <linearGradient id="vc-mvp-base-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE890" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <radialGradient id="vc-mvp-bowl" cx=".5" cy=".2" r=".7">
          <stop offset="0%" stopColor="#3A1A04" />
          <stop offset="100%" stopColor="#8A5E10" />
        </radialGradient>
      </defs>

      {/* Cast shadow on the disc */}
      <ellipse cx="100" cy="164" rx="62" ry="6" fill="rgba(0,0,0,.5)" />
      <ellipse cx="100" cy="164" rx="44" ry="3" fill="rgba(0,0,0,.4)" />

      {/* LEFT HANDLE — behind the cup */}
      <path d="M 58 58 Q 26 60 30 94 Q 34 112 60 106"
        fill="none" stroke="url(#vc-mvp-handle)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 58 60 Q 32 62 34 92" fill="none" stroke="#FFF3D0" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 56 80 Q 26 94 42 104" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2" strokeLinecap="round" />

      {/* RIGHT HANDLE */}
      <path d="M 142 58 Q 174 60 170 94 Q 166 112 140 106"
        fill="none" stroke="url(#vc-mvp-handle)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 142 60 Q 168 62 166 92" fill="none" stroke="#FFE890" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <path d="M 144 80 Q 174 94 158 104" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2" strokeLinecap="round" />

      {/* CUP body with curved 3D gradient */}
      <path d="M 56 46 L 144 46 L 136 100 Q 100 118 64 100 Z"
        fill="url(#vc-mvp-cup)" stroke="#3A1A04" strokeWidth="2.4" strokeLinejoin="round" />

      {/* Inner bowl shadow (the open top of the cup) */}
      <ellipse cx="100" cy="48" rx="44" ry="8" fill="url(#vc-mvp-bowl)" />
      <ellipse cx="100" cy="47" rx="44" ry="6.5" fill="none" stroke="#3A1A04" strokeWidth="1.4" />

      {/* Cup rim ring — bright at top, dark at bottom of rim */}
      <rect x="56" y="44" width="88" height="6" fill="url(#vc-mvp-rim)" />
      <rect x="56" y="44" width="88" height="2" fill="#FFFFFF" opacity="0.8" />

      {/* Cup body vertical highlight (sheen down the left side) */}
      <path d="M 66 52 Q 62 80 72 104" stroke="rgba(255,255,255,.5)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 66 52 Q 62 80 72 104" stroke="#FFFFFF" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Right side soft shadow */}
      <path d="M 132 52 Q 136 80 128 102" stroke="rgba(0,0,0,.3)" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Fluted body ridges for dimension */}
      <line x1="82" y1="52" x2="78" y2="100" stroke="rgba(0,0,0,.2)" strokeWidth="1" />
      <line x1="100" y1="52" x2="100" y2="108" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      <line x1="118" y1="52" x2="122" y2="100" stroke="rgba(0,0,0,.2)" strokeWidth="1" />

      {/* Star with bevel */}
      <polygon points="100,58 106,76 124,76 110,86 116,104 100,94 84,104 90,86 76,76 94,76"
        fill="#FFF8D8" stroke="#6A3A08" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Star highlight on upper-left points */}
      <polygon points="100,58 103,68 110,76 100,72" fill="#FFFFFF" opacity="0.85" />
      {/* Gem in center */}
      <circle cx="100" cy="80" r="4" fill="#E74C3C" stroke="#6A1A10" strokeWidth="0.8" />
      <circle cx="98.5" cy="78.5" r="1.4" fill="#FFF3D0" />

      {/* STEM — beveled */}
      <rect x="90" y="110" width="20" height="20" fill="url(#vc-mvp-base)" />
      <rect x="90" y="110" width="20" height="4" fill="#FFE890" />
      <rect x="90" y="126" width="20" height="4" fill="rgba(0,0,0,.3)" />
      <rect x="90" y="110" width="3" height="20" fill="rgba(255,255,255,.35)" />
      <rect x="107" y="110" width="3" height="20" fill="rgba(0,0,0,.25)" />

      {/* UPPER BASE tier — with isometric top face for 3D feel */}
      <polygon points="72,130 128,130 132,126 68,126" fill="#FFE890" stroke="#3A1A04" strokeWidth="1.2" />
      <rect x="68" y="130" width="64" height="12" fill="url(#vc-mvp-base-face)" stroke="#3A1A04" strokeWidth="1.2" />
      <rect x="68" y="130" width="64" height="2.5" fill="#FFF3D0" opacity="0.5" />
      <rect x="68" y="140" width="64" height="2" fill="rgba(0,0,0,.3)" />

      {/* LOWER BASE tier */}
      <polygon points="58,146 142,146 146,142 54,142" fill="#FFE890" stroke="#3A1A04" strokeWidth="1.2" />
      <rect x="54" y="146" width="92" height="14" fill="url(#vc-mvp-base-face)" stroke="#3A1A04" strokeWidth="1.2" />
      <rect x="54" y="146" width="92" height="2.5" fill="#FFF3D0" opacity="0.5" />
      <rect x="54" y="158" width="92" height="2" fill="rgba(0,0,0,.35)" />

      {/* Glint sparkle on cup */}
      <g opacity="0.9">
        <circle cx="70" cy="60" r="2.2" fill="#FFFFFF" />
        <circle cx="70" cy="60" r="4" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  vc_creative — Most Creative  (palette + brush, dimensional)
// ═════════════════════════════════════════════════════════════

function VcCreative({ size = 64 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="vc_creative" />
      <defs>
        <linearGradient id="vc-cr-pal-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8E0" />
          <stop offset="100%" stopColor="#E0BE8A" />
        </linearGradient>
        <linearGradient id="vc-cr-pal-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B88040" />
          <stop offset="100%" stopColor="#6A3A1A" />
        </linearGradient>
        <linearGradient id="vc-cr-handle" x1="0" y1="-0.3" x2="0" y2="1.3">
          <stop offset="0%" stopColor="#D0A060" />
          <stop offset="45%" stopColor="#8A5E28" />
          <stop offset="100%" stopColor="#4A2A10" />
        </linearGradient>
        <linearGradient id="vc-cr-ferrule" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0F0F4" />
          <stop offset="50%" stopColor="#8A8E94" />
          <stop offset="100%" stopColor="#3A3E44" />
        </linearGradient>
        <linearGradient id="vc-cr-bristle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8070" />
          <stop offset="100%" stopColor="#8A1810" />
        </linearGradient>
        <radialGradient id="vc-cr-dab-red" cx=".35" cy=".3" r=".7">
          <stop offset="0%" stopColor="#FFB8B0" />
          <stop offset="50%" stopColor="#E74C3C" />
          <stop offset="100%" stopColor="#5A1810" />
        </radialGradient>
        <radialGradient id="vc-cr-dab-yel" cx=".35" cy=".3" r=".7">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="50%" stopColor="#FFD046" />
          <stop offset="100%" stopColor="#8A5E10" />
        </radialGradient>
        <radialGradient id="vc-cr-dab-grn" cx=".35" cy=".3" r=".7">
          <stop offset="0%" stopColor="#B8E8B8" />
          <stop offset="50%" stopColor="#4CB050" />
          <stop offset="100%" stopColor="#234F25" />
        </radialGradient>
        <radialGradient id="vc-cr-dab-blu" cx=".35" cy=".3" r=".7">
          <stop offset="0%" stopColor="#B8D8F8" />
          <stop offset="50%" stopColor="#3A8FD8" />
          <stop offset="100%" stopColor="#1A4E78" />
        </radialGradient>
      </defs>

      {/* Cast shadow under palette */}
      <ellipse cx="104" cy="156" rx="72" ry="7" fill="rgba(0,0,0,.45)" />

      {/* Palette BACK edge (the dark side/thickness — gives depth) */}
      <path d="M 54 112
               Q 50 62 100 58
               Q 156 54 166 96
               Q 174 132 140 150
               Q 108 166 78 156
               Q 54 146 54 126
               Q 54 114 66 114
               Q 76 114 76 124
               Q 76 132 66 132
               Q 54 132 54 112 Z"
        fill="url(#vc-cr-pal-edge)" transform="translate(0 7)" />

      {/* Palette TOP surface with light gradient */}
      <path d="M 52 108
               Q 48 58 100 54
               Q 156 50 166 92
               Q 174 128 140 146
               Q 108 162 78 152
               Q 52 142 52 122
               Q 52 110 64 110
               Q 74 110 74 120
               Q 74 128 64 128
               Q 52 128 52 108 Z"
        fill="url(#vc-cr-pal-top)" stroke="#5A3A1A" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Top-surface sheen */}
      <path d="M 72 72 Q 120 66 152 86" stroke="rgba(255,255,255,.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 70 90 Q 108 84 148 98" stroke="rgba(255,255,255,.3)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Inner shadow along bottom curve */}
      <path d="M 76 148 Q 110 158 140 142" stroke="rgba(90,58,26,.4)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Thumb hole inner shadow */}
      <ellipse cx="64" cy="120" rx="10" ry="10" fill="none" stroke="rgba(90,58,26,.55)" strokeWidth="1.8" />

      {/* PAINT DABS — domed blobs with radial gradient (convex) */}
      <g>
        {/* Red */}
        <ellipse cx="88" cy="88" rx="11" ry="10" fill="url(#vc-cr-dab-red)" stroke="#3A0A04" strokeWidth="1" />
        <ellipse cx="84" cy="82" rx="3.5" ry="2.2" fill="rgba(255,255,255,.8)" />
        {/* Yellow */}
        <ellipse cx="118" cy="78" rx="11" ry="10" fill="url(#vc-cr-dab-yel)" stroke="#5A3A08" strokeWidth="1" />
        <ellipse cx="114" cy="72" rx="3.5" ry="2.2" fill="rgba(255,255,255,.85)" />
        {/* Green */}
        <ellipse cx="138" cy="108" rx="11" ry="10" fill="url(#vc-cr-dab-grn)" stroke="#153A18" strokeWidth="1" />
        <ellipse cx="134" cy="102" rx="3.5" ry="2.2" fill="rgba(255,255,255,.75)" />
        {/* Blue */}
        <ellipse cx="104" cy="124" rx="11" ry="10" fill="url(#vc-cr-dab-blu)" stroke="#0a2a48" strokeWidth="1" />
        <ellipse cx="100" cy="118" rx="3.5" ry="2.2" fill="rgba(255,255,255,.8)" />
      </g>

      {/* BRUSH — diagonal across upper-right */}
      <g transform="translate(128 40) rotate(42)">
        {/* Cast shadow of brush on palette */}
        <rect x="2" y="4" width="60" height="12" fill="rgba(0,0,0,.3)" rx="1" />

        {/* Wooden handle — cylindrical shading */}
        <rect x="0" y="-5" width="56" height="10" fill="url(#vc-cr-handle)" stroke="#3A1A04" strokeWidth="1.2" />
        <rect x="0" y="-5" width="56" height="2.5" fill="rgba(255,255,255,.55)" />
        <rect x="0" y="2" width="56" height="2" fill="rgba(0,0,0,.35)" />

        {/* Ferrule (metallic cylinder) */}
        <rect x="56" y="-6" width="14" height="12" fill="url(#vc-cr-ferrule)" stroke="#2A2E34" strokeWidth="1.2" />
        <rect x="56" y="-6" width="14" height="3" fill="#FFFFFF" opacity="0.8" />
        <rect x="56" y="2" width="14" height="3" fill="rgba(0,0,0,.4)" />
        {/* Ferrule crimp lines */}
        <line x1="60" y1="-6" x2="60" y2="6" stroke="#3A3E44" strokeWidth="0.8" />
        <line x1="66" y1="-6" x2="66" y2="6" stroke="#3A3E44" strokeWidth="0.8" />

        {/* Bristles — 3D bundle */}
        <path d="M 70 -7 L 94 -9 L 98 0 L 94 9 L 70 7 Z"
          fill="url(#vc-cr-bristle)" stroke="#3A0A00" strokeWidth="1.2" strokeLinejoin="round" />
        {/* Bristle strand highlights */}
        <path d="M 72 -5 L 92 -7" stroke="rgba(255,255,255,.65)" strokeWidth="1" strokeLinecap="round" />
        <path d="M 73 -1 L 94 -2" stroke="rgba(255,255,255,.35)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 73 4 L 92 5" stroke="rgba(0,0,0,.35)" strokeWidth="0.8" strokeLinecap="round" />
        {/* Bristle tip drip */}
        <circle cx="100" cy="4" r="2.2" fill="url(#vc-cr-dab-red)" stroke="#3A0A04" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  vc_clutch — Clutch Player  (shield + bolt, dimensional)
// ═════════════════════════════════════════════════════════════

function VcClutch({ size = 64 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="vc_clutch" />
      <defs>
        <linearGradient id="vc-cl-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE0B8" />
          <stop offset="45%" stopColor="#FF7030" />
          <stop offset="100%" stopColor="#5A1004" />
        </linearGradient>
        <linearGradient id="vc-cl-bevel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE0B8" />
          <stop offset="100%" stopColor="#8A3A10" />
        </linearGradient>
        <linearGradient id="vc-cl-bolt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFD046" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <radialGradient id="vc-cl-inner" cx=".5" cy=".4" r=".65">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,.4)" />
        </radialGradient>
      </defs>

      {/* Cast shadow under shield */}
      <ellipse cx="100" cy="176" rx="56" ry="6" fill="rgba(0,0,0,.5)" />

      {/* BACK bevel (drop layer behind the main shield for 3D edge) */}
      <path d="M 100 42 L 160 62 L 160 112 Q 160 152 100 178 Q 40 152 40 112 L 40 62 Z"
        fill="url(#vc-cl-bevel)" stroke="#2A0600" strokeWidth="2" strokeLinejoin="round" />

      {/* MAIN shield body */}
      <path d="M 100 38 L 156 58 L 156 108 Q 156 146 100 170 Q 44 146 44 108 L 44 58 Z"
        fill="url(#vc-cl-shield)" stroke="#2A0600" strokeWidth="3" strokeLinejoin="round" />

      {/* Inner rim (embossed) */}
      <path d="M 100 50 L 148 68 L 148 108 Q 148 140 100 160 Q 52 140 52 108 L 52 68 Z"
        fill="none" stroke="rgba(255,220,170,.75)" strokeWidth="1.8" />
      <path d="M 100 52 L 146 70 L 146 106 Q 146 138 100 156 Q 54 138 54 106 L 54 70 Z"
        fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />

      {/* Top-highlight sheen on upper-left half */}
      <path d="M 58 72 L 100 54 L 140 68 Q 120 90 100 84 Q 80 78 60 88 Z"
        fill="rgba(255,240,200,.35)" />

      {/* Inner vignette for depth */}
      <path d="M 100 50 L 148 68 L 148 108 Q 148 140 100 160 Q 52 140 52 108 L 52 68 Z"
        fill="url(#vc-cl-inner)" />

      {/* Lightning BOLT with shadow layer (drop shadow) */}
      <path d="M 116 66 L 84 114 L 106 114 L 90 150 L 128 100 L 106 100 L 122 66 Z"
        fill="rgba(0,0,0,.4)" transform="translate(3 3)" />

      {/* Lightning bolt main */}
      <path d="M 116 66 L 84 114 L 106 114 L 90 150 L 128 100 L 106 100 L 122 66 Z"
        fill="url(#vc-cl-bolt)" stroke="#5A2A00" strokeWidth="2.2" strokeLinejoin="round" />

      {/* Bolt highlight ridge (left outer edge) */}
      <path d="M 118 68 L 86 112" stroke="rgba(255,255,255,.9)" strokeWidth="2.4"
        fill="none" strokeLinecap="round" />
      {/* Bolt secondary highlight (inside lower half) */}
      <path d="M 126 102 L 94 146" stroke="rgba(255,248,200,.5)" strokeWidth="1.4"
        fill="none" strokeLinecap="round" />

      {/* Rivets on corners for dimensional studs */}
      {[[56, 66], [144, 66], [56, 108], [144, 108]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.2" fill="#5A1810" stroke="#2A0600" strokeWidth="0.8" />
          <circle cx={x - 0.8} cy={y - 0.8} r="1.2" fill="#FFE890" />
        </g>
      ))}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
//  vc_communicator — Best Communicator  (megaphone, dimensional)
// ═════════════════════════════════════════════════════════════

function VcCommunicator({ size = 64 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <Disc id="vc_communicator" />
      <defs>
        <linearGradient id="vc-cm-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE8B8" />
          <stop offset="35%" stopColor="#FF9040" />
          <stop offset="75%" stopColor="#D02810" />
          <stop offset="100%" stopColor="#6A1004" />
        </linearGradient>
        <linearGradient id="vc-cm-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A5E38" />
          <stop offset="50%" stopColor="#5A3A20" />
          <stop offset="100%" stopColor="#2A1A08" />
        </linearGradient>
        <linearGradient id="vc-cm-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="40%" stopColor="#FFD046" />
          <stop offset="100%" stopColor="#6A3A08" />
        </linearGradient>
        <radialGradient id="vc-cm-mouth" cx=".5" cy=".5" r=".6">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="80%" stopColor="#3A0A04" />
          <stop offset="100%" stopColor="#8A3A10" />
        </radialGradient>
      </defs>

      {/* Cast shadow */}
      <ellipse cx="92" cy="174" rx="62" ry="6" fill="rgba(0,0,0,.45)" />

      {/* Sound waves — behind the megaphone */}
      <path d="M 152 54 Q 184 108 152 162" stroke="rgba(0,0,0,.35)" strokeWidth="5"
        fill="none" strokeLinecap="round" transform="translate(2 2)" />
      <path d="M 152 54 Q 184 108 152 162" stroke="#FFFFFF" strokeWidth="4"
        fill="none" strokeLinecap="round" />
      <path d="M 164 36 Q 202 108 164 180" stroke="#FFFFFF" strokeWidth="3"
        fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M 142 72 Q 162 108 142 144" stroke="#FFFFFF" strokeWidth="2.6"
        fill="none" strokeLinecap="round" opacity="0.55" />

      {/* HANDLE — cylindrical with shading */}
      <rect x="28" y="88" width="18" height="36" rx="2" fill="url(#vc-cm-handle)" stroke="#2A1A08" strokeWidth="1.4" />
      <rect x="28" y="88" width="18" height="4" fill="rgba(255,255,255,.5)" />
      <rect x="28" y="120" width="18" height="4" fill="rgba(0,0,0,.4)" />
      {/* Grip ridges */}
      <line x1="32" y1="98" x2="42" y2="98" stroke="#1a0a04" strokeWidth="0.8" />
      <line x1="32" y1="104" x2="42" y2="104" stroke="#1a0a04" strokeWidth="0.8" />
      <line x1="32" y1="110" x2="42" y2="110" stroke="#1a0a04" strokeWidth="0.8" />

      {/* BODY back-shadow (behind the main body, slightly offset) */}
      <path d="M 48 82 L 48 138 L 132 160 L 132 60 Z"
        fill="rgba(0,0,0,.35)" transform="translate(3 3)" />

      {/* MEGAPHONE body — conical, wider at right */}
      <path d="M 46 78 L 46 136 L 130 158 L 130 56 Z"
        fill="url(#vc-cm-body)" stroke="#2A0600" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Top edge highlight */}
      <path d="M 46 78 L 130 56" stroke="rgba(255,255,255,.75)" strokeWidth="3.5"
        fill="none" strokeLinecap="round" />
      <path d="M 46 78 L 130 56" stroke="#FFFFFF" strokeWidth="1.2"
        fill="none" strokeLinecap="round" />
      {/* Bottom edge dark shadow */}
      <path d="M 46 136 L 130 158" stroke="rgba(0,0,0,.55)" strokeWidth="3"
        fill="none" strokeLinecap="round" />

      {/* Vertical fluted ridges (inner cone contours) */}
      <line x1="68" y1="80" x2="68" y2="144" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
      <line x1="92" y1="76" x2="92" y2="152" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
      <line x1="114" y1="70" x2="114" y2="158" stroke="rgba(0,0,0,.25)" strokeWidth="1" />

      {/* Highlight strips (left of each ridge) */}
      <line x1="56" y1="80" x2="56" y2="140" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
      <line x1="80" y1="78" x2="80" y2="148" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <line x1="104" y1="72" x2="104" y2="156" stroke="rgba(255,255,255,.2)" strokeWidth="1" />

      {/* Gold BELL RIM — beveled */}
      <rect x="130" y="56" width="8" height="102" fill="url(#vc-cm-gold)" stroke="#2A0600" strokeWidth="1.4" />
      <rect x="130" y="56" width="8" height="4" fill="#FFF3D0" />
      <rect x="130" y="154" width="8" height="4" fill="rgba(0,0,0,.45)" />
      <line x1="134" y1="56" x2="134" y2="158" stroke="rgba(0,0,0,.3)" strokeWidth="0.8" />

      {/* Mouth opening (dark interior with radial gradient) */}
      <ellipse cx="138" cy="108" rx="6" ry="50" fill="url(#vc-cm-mouth)" stroke="#FFE890" strokeWidth="1.4" />
      <ellipse cx="136" cy="86" rx="2.4" ry="10" fill="rgba(255,220,140,.35)" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════

const REGISTRY: Record<string, (p: Props) => React.JSX.Element> = {
  vc_mvp: VcMvp,
  vc_creative: VcCreative,
  vc_clutch: VcClutch,
  vc_communicator: VcCommunicator,
};

export function getVoteCategoryIllustration(id: string): (props: Props) => React.JSX.Element {
  return REGISTRY[id] ?? VcMvp;
}
