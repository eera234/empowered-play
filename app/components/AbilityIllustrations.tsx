// LEGO-minifig styled inline SVG illustrations for each ability. Rendered on
// the role-reveal card and the facilitator assignment grid at ~160-200px. All
// six illustrations share a common construction: colored baseplate with studs,
// brick backdrop in the role color, and a minifig in the foreground holding a
// role-specific LEGO prop. Small-size variants live below as *Badge functions.

type Props = { size?: number };

const wrap = (size: number): React.CSSProperties => ({
  width: size,
  height: size,
  display: "block",
});

// Shared LEGO-style backdrop. Colored rear wall + baseplate with studs.
function LegoBackdrop({ id, color, darkColor, lightColor }: { id: string; color: string; darkColor: string; lightColor: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lightColor} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkColor} />
          <stop offset="100%" stopColor="#1a1a28" />
        </linearGradient>
        <radialGradient id={`${id}-stud`} cx=".3" cy=".3" r=".7">
          <stop offset="0%" stopColor={lightColor} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={darkColor} />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="12" fill={`url(#${id}-sky)`} />
      {/* Rear brick wall texture, faint */}
      {[40, 80, 120, 160].map((y, i) => (
        <g key={i} opacity=".18">
          {[0, 48, 96, 144].map((x, j) => (
            <rect key={j} x={x + (i % 2) * 24} y={y} width="40" height="16" rx="2" fill={darkColor} stroke={lightColor} strokeWidth=".5" />
          ))}
        </g>
      ))}
      {/* Baseplate */}
      <rect x="0" y="154" width="200" height="46" fill={`url(#${id}-plate)`} />
      <rect x="0" y="154" width="200" height="4" fill="rgba(255,255,255,.12)" />
      {/* Baseplate studs */}
      {[16, 48, 80, 112, 144, 176].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy="168" rx="9" ry="3" fill="rgba(0,0,0,.3)" />
          <circle cx={x} cy="164" r="7" fill={`url(#${id}-stud)`} />
          <ellipse cx={x - 1.5} cy="161.5" rx="3" ry="1.2" fill="rgba(255,255,255,.45)" />
        </g>
      ))}
    </>
  );
}

// LEGO minifig. One shared primitive used by all six illustrations. Placed at
// (cx, baseY) where baseY is the ground line. Role color drives the torso.
type MinifigProps = {
  cx: number;
  baseY: number;
  torsoColor: string;
  torsoColorDark: string;
  legColor?: string;
  headColor?: string;
  hatColor?: string;
  hatStyle?: "none" | "hard" | "scout" | "cap" | "envoy";
  armAngleL?: number;
  armAngleR?: number;
  scale?: number;
};
function Minifig({
  cx, baseY, torsoColor, torsoColorDark,
  legColor = "#2e3a58", headColor = "#FFD740",
  hatColor, hatStyle = "none",
  armAngleL = -12, armAngleR = 12,
  scale = 1,
}: MinifigProps) {
  // Minifig dimensions (before scale). Origin: bottom center of feet.
  const s = scale;
  const legW = 24 * s, legH = 30 * s;
  const torsoW = 40 * s, torsoH = 36 * s;
  const neckH = 4 * s;
  const headR = 14 * s;
  const armW = 10 * s, armH = 26 * s;

  const feetY = baseY;
  const legsTopY = feetY - legH;
  const torsoBottomY = legsTopY;
  const torsoTopY = torsoBottomY - torsoH;
  const neckY = torsoTopY - neckH;
  const headCenterY = neckY - headR;

  return (
    <g>
      {/* Shadow under feet */}
      <ellipse cx={cx} cy={feetY + 2 * s} rx={26 * s} ry={4 * s} fill="rgba(0,0,0,.35)" />
      {/* Legs */}
      <rect x={cx - legW / 2} y={legsTopY} width={legW / 2 - 1} height={legH} fill={legColor} />
      <rect x={cx + 1} y={legsTopY} width={legW / 2 - 1} height={legH} fill={legColor} />
      {/* Leg hip highlight */}
      <rect x={cx - legW / 2} y={legsTopY} width={legW} height={3 * s} fill="rgba(255,255,255,.18)" />
      {/* Feet */}
      <rect x={cx - legW / 2 - 1} y={feetY - 4 * s} width={legW / 2} height={4 * s} fill="#1a1a28" />
      <rect x={cx + 1} y={feetY - 4 * s} width={legW / 2} height={4 * s} fill="#1a1a28" />
      {/* Torso (trapezoid) */}
      <polygon
        points={`${cx - torsoW / 2 + 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY} ${cx + torsoW / 2},${torsoBottomY} ${cx - torsoW / 2},${torsoBottomY}`}
        fill={torsoColor}
      />
      {/* Torso shoulder highlight */}
      <polygon
        points={`${cx - torsoW / 2 + 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY} ${cx + torsoW / 2 - 4},${torsoTopY + 5 * s} ${cx - torsoW / 2 + 4},${torsoTopY + 5 * s}`}
        fill="rgba(255,255,255,.28)"
      />
      {/* Torso vertical seam */}
      <line x1={cx} y1={torsoTopY + 4 * s} x2={cx} y2={torsoBottomY - 2 * s} stroke={torsoColorDark} strokeWidth={1} opacity=".7" />
      {/* Collar */}
      <rect x={cx - 10 * s} y={torsoTopY - 2 * s} width={20 * s} height={4 * s} fill={torsoColorDark} />
      {/* Arms (rotated). Left arm. */}
      <g transform={`rotate(${armAngleL} ${cx - torsoW / 2 + 2} ${torsoTopY + 3 * s})`}>
        <rect x={cx - torsoW / 2 - armW + 2} y={torsoTopY + 2 * s} width={armW} height={armH} rx={3 * s} fill={torsoColor} />
        <rect x={cx - torsoW / 2 - armW + 2} y={torsoTopY + 2 * s} width={armW} height={3 * s} rx={2 * s} fill="rgba(255,255,255,.22)" />
        {/* Hand */}
        <circle cx={cx - torsoW / 2 - armW / 2 + 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill={headColor} />
        <circle cx={cx - torsoW / 2 - armW / 2 + 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill="none" stroke="rgba(0,0,0,.25)" strokeWidth={0.7} />
      </g>
      {/* Right arm */}
      <g transform={`rotate(${armAngleR} ${cx + torsoW / 2 - 2} ${torsoTopY + 3 * s})`}>
        <rect x={cx + torsoW / 2 - 2} y={torsoTopY + 2 * s} width={armW} height={armH} rx={3 * s} fill={torsoColor} />
        <rect x={cx + torsoW / 2 - 2} y={torsoTopY + 2 * s} width={armW} height={3 * s} rx={2 * s} fill="rgba(255,255,255,.22)" />
        {/* Hand */}
        <circle cx={cx + torsoW / 2 + armW / 2 - 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill={headColor} />
        <circle cx={cx + torsoW / 2 + armW / 2 - 2} cy={torsoTopY + armH + 4 * s} r={5 * s} fill="none" stroke="rgba(0,0,0,.25)" strokeWidth={0.7} />
      </g>
      {/* Neck */}
      <rect x={cx - 4 * s} y={torsoTopY - neckH} width={8 * s} height={neckH} fill="#8a7418" />
      {/* Head */}
      <circle cx={cx} cy={headCenterY} r={headR} fill={headColor} />
      <circle cx={cx} cy={headCenterY} r={headR} fill="none" stroke="rgba(0,0,0,.3)" strokeWidth={0.8} />
      {/* Head highlight */}
      <ellipse cx={cx - 4 * s} cy={headCenterY - 4 * s} rx={5 * s} ry={3 * s} fill="rgba(255,255,255,.35)" />
      {/* Face */}
      <circle cx={cx - 4 * s} cy={headCenterY - 1 * s} r={1.6 * s} fill="#1a0a08" />
      <circle cx={cx + 4 * s} cy={headCenterY - 1 * s} r={1.6 * s} fill="#1a0a08" />
      <path d={`M${cx - 4 * s} ${headCenterY + 5 * s} Q ${cx} ${headCenterY + 8 * s} ${cx + 4 * s} ${headCenterY + 5 * s}`} stroke="#1a0a08" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* Hat / hair */}
      {hatStyle === "hard" && (
        <g>
          <path d={`M${cx - headR + 1} ${headCenterY - 2} Q ${cx} ${headCenterY - headR - 5} ${cx + headR - 1} ${headCenterY - 2} L ${cx + headR + 3} ${headCenterY - 2} L ${cx - headR - 3} ${headCenterY - 2} Z`} fill={hatColor || "#FFA020"} />
          <rect x={cx - headR - 3} y={headCenterY - 4} width={(headR + 3) * 2} height={3} fill={hatColor || "#FFA020"} />
          <path d={`M${cx - headR + 2} ${headCenterY - 6} Q ${cx} ${headCenterY - headR - 4} ${cx + headR - 2} ${headCenterY - 6}`} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={1} />
        </g>
      )}
      {hatStyle === "scout" && (
        <g>
          <path d={`M${cx - headR + 1} ${headCenterY - 3} Q ${cx} ${headCenterY - headR - 5} ${cx + headR - 1} ${headCenterY - 3} L ${cx + headR + 4} ${headCenterY - 3} L ${cx - headR - 4} ${headCenterY - 3} Z`} fill={hatColor || "#8a4a10"} />
          <path d={`M${cx - 2} ${headCenterY - headR + 2} L ${cx - 6} ${headCenterY - headR - 6} L ${cx + 2} ${headCenterY - headR - 2} Z`} fill={hatColor || "#8a4a10"} />
          <rect x={cx - headR - 4} y={headCenterY - 5} width={(headR + 4) * 2} height={2.5} fill="#5a2a08" />
        </g>
      )}
      {hatStyle === "cap" && (
        <g>
          <path d={`M${cx - headR + 1} ${headCenterY - 3} Q ${cx} ${headCenterY - headR - 4} ${cx + headR - 1} ${headCenterY - 3}`} fill={hatColor || "#1e4a68"} />
          <rect x={cx - 4} y={headCenterY - headR + 2} width={headR} height={3} fill={hatColor || "#1e4a68"} />
        </g>
      )}
      {hatStyle === "envoy" && (
        <g>
          {/* Brimmed envoy hat */}
          <rect x={cx - headR - 5} y={headCenterY - 4} width={(headR + 5) * 2} height={3} fill={hatColor || "#3a2a28"} />
          <path d={`M${cx - headR + 2} ${headCenterY - 4} Q ${cx} ${headCenterY - headR - 4} ${cx + headR - 2} ${headCenterY - 4}`} fill={hatColor || "#3a2a28"} />
        </g>
      )}
    </g>
  );
}

// LEGO brick prop. Usable as building block, held object, or background.
function LegoBrick({
  x, y, w, h, color, darkColor, lightColor, studs = 2,
  withStuds = true,
}: {
  x: number; y: number; w: number; h: number; color: string; darkColor: string; lightColor: string; studs?: number; withStuds?: boolean;
}) {
  const studR = Math.min(w / (studs * 2.5), 4);
  return (
    <g>
      {/* Shadow under brick */}
      <rect x={x + 2} y={y + h - 2} width={w} height={4} fill="rgba(0,0,0,.3)" rx={1} />
      {/* Brick body */}
      <rect x={x} y={y} width={w} height={h} fill={color} rx={2} />
      <rect x={x} y={y} width={w} height={3} fill={lightColor} rx={2} />
      <rect x={x} y={y + h - 3} width={w} height={3} fill={darkColor} rx={2} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={darkColor} strokeWidth={0.8} rx={2} />
      {/* Studs */}
      {withStuds && Array.from({ length: studs }).map((_, i) => {
        const spacing = w / studs;
        const sx = x + spacing * (i + 0.5);
        return (
          <g key={i}>
            <ellipse cx={sx} cy={y + 1} rx={studR} ry={1.6} fill={darkColor} />
            <circle cx={sx} cy={y - studR + 1} r={studR} fill={color} />
            <circle cx={sx} cy={y - studR + 1} r={studR} fill="none" stroke={darkColor} strokeWidth={0.5} />
            <ellipse cx={sx - studR / 3} cy={y - studR} rx={studR / 2} ry={studR / 3} fill="rgba(255,255,255,.5)" />
          </g>
        );
      })}
    </g>
  );
}

function CitizenIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="ct" color="#6c7a99" darkColor="#344055" lightColor="#9aa6c2" />
      {/* Stack of bricks being built together on the baseplate */}
      <LegoBrick x={36} y={132} w={36} h={16} color="#C43A3A" darkColor="#7a1e18" lightColor="#E85040" studs={2} />
      <LegoBrick x={44} y={116} w={28} h={16} color="#4FC3F7" darkColor="#1e6a94" lightColor="#90DEFF" studs={2} />
      <LegoBrick x={126} y={132} w={36} h={16} color="#FFD740" darkColor="#8a6a10" lightColor="#FFE890" studs={2} />
      {/* Central minifig holding a brick aloft */}
      <Minifig cx={100} baseY={148} torsoColor="#4fC088" torsoColorDark="#2a6a48" legColor="#2a3a58" hatStyle="none" armAngleL={-20} armAngleR={-70} />
      {/* Held LEGO brick above the raised right arm */}
      <LegoBrick x={110} y={46} w={32} h={14} color="#C43A3A" darkColor="#7a1e18" lightColor="#E85040" studs={2} />
    </svg>
  );
}

function MenderIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="md" color="#4FC3F7" darkColor="#1e6a94" lightColor="#90DEFF" />
      {/* Broken brick gap on the right, being repaired */}
      <LegoBrick x={120} y={132} w={28} h={16} color="#4a5a78" darkColor="#2a3a58" lightColor="#6a7a9a" studs={2} withStuds={false} />
      <LegoBrick x={156} y={132} w={28} h={16} color="#4a5a78" darkColor="#2a3a58" lightColor="#6a7a9a" studs={2} withStuds={false} />
      {/* Spark between two halves */}
      <g transform="translate(150 140)">
        {[0, 45, 90, 135].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = (n: number) => Math.round(n * 100) / 100;
          return (
            <line
              key={i}
              x1={r(Math.cos(rad) * 4)}
              y1={r(Math.sin(rad) * 4)}
              x2={r(Math.cos(rad) * 9)}
              y2={r(Math.sin(rad) * 9)}
              stroke="#FFE890" strokeWidth={2} strokeLinecap="round"
            />
          );
        })}
        <circle cx="0" cy="0" r="4" fill="#FFF3D0" />
      </g>
      {/* Mender minifig with wrench raised */}
      <Minifig cx={66} baseY={148} torsoColor="#2a8a55" torsoColorDark="#15552f" legColor="#2a3a58" hatStyle="cap" hatColor="#1e6a94" armAngleR={-80} armAngleL={-10} />
      {/* Wrench in raised right hand */}
      <g transform="translate(82 64) rotate(20)">
        <rect x="0" y="-2" width="24" height="4" rx="1.5" fill="#B0B8C4" />
        <rect x="0" y="-2" width="24" height="1.5" fill="rgba(255,255,255,.5)" />
        <path d="M22 -5 Q 32 -5 32 0 Q 32 5 22 5 L 22 2 Q 28 2 28 0 Q 28 -2 22 -2 Z" fill="#B0B8C4" />
      </g>
      {/* Small toolbox brick */}
      <LegoBrick x={36} y={132} w={28} h={16} color="#C94A3A" darkColor="#7a1e18" lightColor="#E85040" studs={2} />
    </svg>
  );
}

function ScoutIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="sc" color="#B388FF" darkColor="#5a3a8a" lightColor="#DCBFFF" />
      {/* LEGO tower on the right, watchable */}
      <LegoBrick x={142} y={124} w={34} h={24} color="#8a4a10" darkColor="#5a2a08" lightColor="#C47038" studs={2} />
      <LegoBrick x={142} y={100} w={34} h={24} color="#8a4a10" darkColor="#5a2a08" lightColor="#C47038" studs={2} />
      <LegoBrick x={148} y={76} w={22} h={24} color="#8a4a10" darkColor="#5a2a08" lightColor="#C47038" studs={2} withStuds={false} />
      {/* Flag on top */}
      <rect x="158" y="60" width="2" height="18" fill="#1a1a28" />
      <polygon points="160,62 178,66 160,70" fill="#FFE890" />
      {/* Minifig holding spyglass up */}
      <Minifig cx={72} baseY={148} torsoColor="#FF9040" torsoColorDark="#a83a1a" legColor="#2a3a58" hatStyle="scout" hatColor="#5a2a08" armAngleR={-75} armAngleL={-14} />
      {/* Spyglass */}
      <g transform="translate(88 64) rotate(-10)">
        <rect x="0" y="-4" width="28" height="8" rx="2" fill="#B8860B" />
        <rect x="0" y="-4" width="28" height="2.5" fill="rgba(255,255,255,.45)" />
        <rect x="8" y="-4" width="2" height="8" fill="#6a4808" />
        <rect x="18" y="-4" width="2" height="8" fill="#6a4808" />
        <rect x="26" y="-6" width="8" height="12" rx="2" fill="#6a4808" />
        <circle cx="30" cy="0" r="3.5" fill="#8aC4FF" />
        <circle cx="29" cy="-1" r="1.2" fill="#fff" />
      </g>
      {/* Twinkling star that scout has seen */}
      <g transform="translate(38 52)">
        <path d="M0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#FFE890" />
      </g>
      <g transform="translate(24 90)" opacity=".7">
        <path d="M0 -5 L 1.5 -1.5 L 5 0 L 1.5 1.5 L 0 5 L -1.5 1.5 L -5 0 L -1.5 -1.5 Z" fill="#FFE890" />
      </g>
    </svg>
  );
}

function EngineerIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="eg" color="#FF7043" darkColor="#a83a1a" lightColor="#FFA280" />
      {/* LEGO bridge span mid-construction */}
      <LegoBrick x={24} y={132} w={44} h={16} color="#8a4a10" darkColor="#5a2a08" lightColor="#C47038" studs={3} />
      <LegoBrick x={132} y={132} w={44} h={16} color="#8a4a10" darkColor="#5a2a08" lightColor="#C47038" studs={3} />
      {/* Spanning beam to be placed */}
      <g>
        <rect x="66" y="108" width="70" height="10" fill="#FFC040" />
        <rect x="66" y="108" width="70" height="3" fill="rgba(255,255,255,.35)" />
        <rect x="66" y="115" width="70" height="3" fill="rgba(0,0,0,.28)" />
        {/* Rivets */}
        {[72, 86, 100, 114, 128].map((x, i) => (
          <circle key={i} cx={x} cy="113" r="1.2" fill="#3a4252" />
        ))}
      </g>
      {/* Gap between the two banks, showing the river hazard */}
      <rect x="68" y="148" width="64" height="6" fill="#1a2838" />
      {[74, 86, 98, 110, 122].map((x, i) => (
        <path key={i} d={`M${x} 151 q 4 -2 8 0`} stroke="#4FC3F7" strokeWidth="1" fill="none" opacity=".6" />
      ))}
      {/* Engineer minifig holding girder */}
      <Minifig cx={100} baseY={148} torsoColor="#FFC040" torsoColorDark="#a8700c" legColor="#2a3a58" hatStyle="hard" hatColor="#FFA020" armAngleL={-85} armAngleR={-85} />
      {/* Spark glow */}
      <circle cx="150" cy="100" r="12" fill="#FFE890" opacity=".55" />
      <g transform="translate(150 100)">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = (n: number) => Math.round(n * 100) / 100;
          return <line key={i} x1={r(Math.cos(rad) * 3)} y1={r(Math.sin(rad) * 3)} x2={r(Math.cos(rad) * 10)} y2={r(Math.sin(rad) * 10)} stroke="#FFE890" strokeWidth={2} strokeLinecap="round" />;
        })}
      </g>
    </svg>
  );
}

function AnchorIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="ac" color="#66BB6A" darkColor="#2a5a34" lightColor="#9BE0A5" />
      {/* Safe-zone rings behind */}
      <defs>
        <radialGradient id="ac-glow" cx=".5" cy=".55" r=".5">
          <stop offset="0%" stopColor="#A8F0C4" stopOpacity=".6" />
          <stop offset="100%" stopColor="#66BB6A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="70" fill="url(#ac-glow)" />
      <circle cx="100" cy="110" r="54" fill="none" stroke="rgba(168,240,196,.55)" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="100" cy="110" r="38" fill="none" stroke="rgba(168,240,196,.7)" strokeWidth="1.2" strokeDasharray="2 4" />
      {/* Four small satellite bricks around the center */}
      <LegoBrick x={20} y={62} w={24} h={14} color="#4FC3F7" darkColor="#1e6a94" lightColor="#90DEFF" studs={2} />
      <LegoBrick x={156} y={62} w={24} h={14} color="#FFD740" darkColor="#8a6a10" lightColor="#FFE890" studs={2} />
      <LegoBrick x={16} y={132} w={20} h={14} color="#C43A3A" darkColor="#7a1e18" lightColor="#E85040" studs={2} />
      <LegoBrick x={164} y={132} w={20} h={14} color="#B388FF" darkColor="#5a3a8a" lightColor="#DCBFFF" studs={2} />
      {/* Connection lines from center to satellites */}
      <line x1="100" y1="100" x2="32" y2="70" stroke="rgba(168,240,196,.5)" strokeWidth="1.2" strokeDasharray="2 2" />
      <line x1="100" y1="100" x2="168" y2="70" stroke="rgba(168,240,196,.5)" strokeWidth="1.2" strokeDasharray="2 2" />
      <line x1="100" y1="100" x2="26" y2="140" stroke="rgba(168,240,196,.5)" strokeWidth="1.2" strokeDasharray="2 2" />
      <line x1="100" y1="100" x2="174" y2="140" stroke="rgba(168,240,196,.5)" strokeWidth="1.2" strokeDasharray="2 2" />
      {/* Central anchor minifig with outstretched arms */}
      <Minifig cx={100} baseY={148} torsoColor="#3a9a58" torsoColorDark="#1f4f2c" legColor="#2a3a58" hatStyle="none" armAngleL={-85} armAngleR={85} />
    </svg>
  );
}

function DiplomatIllustration({ size = 180 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      <LegoBackdrop id="dp" color="#FFD740" darkColor="#8a6a10" lightColor="#FFE890" />
      {/* Two minifigs facing each other with a shared speech bubble */}
      <Minifig cx={54} baseY={148} torsoColor="#B388FF" torsoColorDark="#5a3a8a" legColor="#2a3a58" hatStyle="none" armAngleL={-20} armAngleR={55} />
      <Minifig cx={146} baseY={148} torsoColor="#69F0AE" torsoColorDark="#2a7a4a" legColor="#2a3a58" hatStyle="none" armAngleL={-55} armAngleR={20} />
      {/* Central speech bubble: private channel — drawn as a single path so
          the tails blend into the bubble without visible seams */}
      <path
        d="M 128 30
           Q 128 18 100 18
           Q 72 18 72 30
           Q 72 40 84 42
           L 76 52
           L 94 42
           L 106 42
           L 124 52
           L 116 42
           Q 128 40 128 30 Z"
        fill="#fff" stroke="#8a6a10" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Three dots */}
      <circle cx="88" cy="30" r="2.8" fill="#5a4a10" />
      <circle cx="100" cy="30" r="2.8" fill="#5a4a10" />
      <circle cx="112" cy="30" r="2.8" fill="#5a4a10" />
    </svg>
  );
}

export const ABILITY_ILLUSTRATIONS: Record<string, React.FC<Props>> = {
  citizen: CitizenIllustration,
  mender: MenderIllustration,
  scout: ScoutIllustration,
  engineer: EngineerIllustration,
  anchor: AnchorIllustration,
  diplomat: DiplomatIllustration,
};

export function getAbilityIllustration(abilityId: string | undefined | null): React.FC<Props> {
  if (!abilityId) return CitizenIllustration;
  return ABILITY_ILLUSTRATIONS[abilityId] ?? CitizenIllustration;
}

// ── Badge variants (simpler silhouettes for <80px rendering) ────────────
// The full illustrations collapse into dark mush when scaled below ~70px.
// These versions render a single centered glyph on a color-matched disc so
// the ability reads clearly at 40-56px. Shared visual language across roles:
// thick white stroke on a color-tinted disc.

const BG_BY_ABILITY: Record<string, string> = {
  citizen: "#6c7a99", mender: "#4FC3F7", scout: "#B388FF",
  engineer: "#FF7043", anchor: "#66BB6A", diplomat: "#FFD740",
};
const BG_DARK_BY_ABILITY: Record<string, string> = {
  citizen: "#344055", mender: "#1e6a94", scout: "#5a3a8a",
  engineer: "#a83a1a", anchor: "#2a5a34", diplomat: "#8a6a10",
};
const BG_LIGHT_BY_ABILITY: Record<string, string> = {
  citizen: "#9aa6c2", mender: "#90deff", scout: "#dcbfff",
  engineer: "#ffa280", anchor: "#9be0a5", diplomat: "#ffe8a0",
};

function disc(id: string) {
  const mid = BG_BY_ABILITY[id] ?? "#6c7a99";
  const dark = BG_DARK_BY_ABILITY[id] ?? "#344055";
  const light = BG_LIGHT_BY_ABILITY[id] ?? "#9aa6c2";
  return (
    <>
      <defs>
        <radialGradient id={`bg-${id}`} cx=".5" cy=".3" r=".85">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill={`url(#bg-${id})`} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={dark} strokeWidth="5" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
    </>
  );
}

function CitizenBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("citizen")}
      {/* Warm glow behind figure */}
      <defs>
        <radialGradient id="cit-glow" cx=".5" cy=".6" r=".45">
          <stop offset="0%" stopColor="#FFE890" stopOpacity=".55" />
          <stop offset="100%" stopColor="#FFE890" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="120" r="64" fill="url(#cit-glow)" />
      {/* Ground shadow */}
      <ellipse cx="100" cy="172" rx="42" ry="6" fill="rgba(0,0,0,.4)" />
      {/* Legs */}
      <rect x="82" y="138" width="14" height="32" rx="2" fill="#2a3a58" />
      <rect x="104" y="138" width="14" height="32" rx="2" fill="#2a3a58" />
      <rect x="80" y="166" width="18" height="6" rx="1" fill="#1a1a28" />
      <rect x="102" y="166" width="18" height="6" rx="1" fill="#1a1a28" />
      {/* Torso with highlight */}
      <rect x="70" y="92" width="60" height="52" rx="8" fill="#4fC088" />
      <rect x="70" y="92" width="60" height="10" fill="rgba(255,255,255,.28)" />
      <rect x="70" y="136" width="60" height="8" fill="rgba(0,0,0,.22)" />
      {/* Left arm down, right arm raised with brick */}
      <rect x="54" y="100" width="18" height="32" rx="5" fill="#4fC088" />
      <rect x="128" y="76" width="16" height="30" rx="5" fill="#4fC088" transform="rotate(14 136 91)" />
      {/* Neck shadow */}
      <rect x="92" y="84" width="16" height="10" fill="#D8A070" />
      {/* Head */}
      <circle cx="100" cy="70" r="24" fill="#FFDAB0" />
      <path d="M100 94 A 24 24 0 0 0 124 70 Q 116 82 100 84 Q 84 82 76 70 A 24 24 0 0 0 100 94 Z" fill="#E8B890" />
      {/* Hair */}
      <path d="M76 68 Q 82 42 100 40 Q 118 42 124 68 Q 120 52 100 50 Q 80 52 76 68 Z" fill="#3a2410" />
      {/* Eyes */}
      <circle cx="91" cy="70" r="2.8" fill="#1a0a08" />
      <circle cx="109" cy="70" r="2.8" fill="#1a0a08" />
      <circle cx="92" cy="69" r="1" fill="#fff" />
      <circle cx="110" cy="69" r="1" fill="#fff" />
      {/* Smile */}
      <path d="M90 80 Q 100 88 110 80" stroke="#1a0a08" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Cheek blush */}
      <ellipse cx="84" cy="78" rx="4" ry="2" fill="#F08090" opacity=".45" />
      <ellipse cx="116" cy="78" rx="4" ry="2" fill="#F08090" opacity=".45" />
      {/* LEGO brick raised */}
      <g transform="translate(128 50)">
        <rect x="0" y="0" width="30" height="18" rx="1.5" fill="#C43A3A" />
        <rect x="0" y="0" width="30" height="4" fill="rgba(255,255,255,.45)" />
        <rect x="0" y="14" width="30" height="4" fill="rgba(0,0,0,.3)" />
        {[7, 23].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="-4" r="4" fill="#C43A3A" stroke="rgba(0,0,0,.4)" strokeWidth=".7" />
            <circle cx={x - 1} cy="-5" r="1.3" fill="rgba(255,255,255,.55)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function MenderBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("mender")}
      {/* Spark glow at repair point */}
      <defs>
        <radialGradient id="md-spark-bg" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFE890" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFA840" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="40" fill="url(#md-spark-bg)" />
      {/* Broken chain link on left (dark silhouette) */}
      <g>
        <path d="M38 100 A 20 20 0 0 1 78 100 L 78 110 A 20 20 0 0 1 38 110 Z" fill="none" stroke="#1a2838" strokeWidth="10" strokeLinecap="round" />
        <path d="M38 100 A 20 20 0 0 1 78 100 L 78 110 A 20 20 0 0 1 38 110 Z" fill="none" stroke="#4a6a88" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* Right chain link (glowing golden, repaired) */}
      <g>
        <path d="M120 100 A 20 20 0 0 1 160 100 L 160 110 A 20 20 0 0 1 120 110 Z" fill="none" stroke="#B8860B" strokeWidth="10" strokeLinecap="round" />
        <path d="M120 100 A 20 20 0 0 1 160 100 L 160 110 A 20 20 0 0 1 120 110 Z" fill="none" stroke="#FFD740" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* Wrench diagonally across */}
      <g transform="rotate(-38 100 100)">
        {/* Handle */}
        <rect x="50" y="92" width="80" height="14" rx="4" fill="#8a95a8" />
        <rect x="50" y="92" width="80" height="4" fill="rgba(255,255,255,.45)" />
        <rect x="50" y="102" width="80" height="4" fill="rgba(0,0,0,.3)" />
        {/* Jaw head */}
        <path d="M126 86 Q 148 86 148 100 Q 148 112 140 114 L 128 114 Q 130 108 130 100 Q 130 92 128 86 Z" fill="#8a95a8" />
        <path d="M126 86 Q 148 86 148 100" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
        <rect x="132" y="94" width="12" height="10" fill="#3a4252" />
        {/* Grip texture */}
        <line x1="60" y1="96" x2="60" y2="102" stroke="#3a4252" strokeWidth="1.2" />
        <line x1="68" y1="96" x2="68" y2="102" stroke="#3a4252" strokeWidth="1.2" />
        <line x1="76" y1="96" x2="76" y2="102" stroke="#3a4252" strokeWidth="1.2" />
      </g>
      {/* Spark burst at the repair center */}
      <g transform="translate(100 100)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = (n: number) => Math.round(n * 100) / 100;
          const x1 = r(Math.cos(rad) * 10);
          const y1 = r(Math.sin(rad) * 10);
          const x2 = r(Math.cos(rad) * 24);
          const y2 = r(Math.sin(rad) * 24);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFE890" strokeWidth="3" strokeLinecap="round" />;
        })}
        <circle cx="0" cy="0" r="9" fill="#FFF3D0" />
        <circle cx="0" cy="0" r="5" fill="#fff" />
      </g>
    </svg>
  );
}

function ScoutBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("scout")}
      {/* Distant storm cloud silhouette */}
      <ellipse cx="60" cy="64" rx="22" ry="10" fill="#2a1838" opacity=".85" />
      <ellipse cx="72" cy="58" rx="16" ry="8" fill="#3a2448" opacity=".75" />
      {/* Tiny lightning */}
      <polyline points="62,70 58,76 64,76 60,84" stroke="#FFE890" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Cliff/ground silhouette */}
      <path d="M0 170 L 60 170 L 80 160 L 200 160 L 200 200 L 0 200 Z" fill="#2a1838" />
      {/* Character body */}
      <rect x="88" y="120" width="32" height="48" rx="6" fill="#FF9040" />
      <rect x="88" y="120" width="32" height="8" fill="rgba(255,255,255,.3)" />
      <rect x="88" y="160" width="32" height="8" fill="rgba(0,0,0,.25)" />
      {/* Belt */}
      <rect x="86" y="148" width="36" height="6" fill="#8a4a10" />
      {/* Arms - one holding spyglass up */}
      <rect x="72" y="126" width="20" height="30" rx="5" fill="#FF9040" />
      <rect x="118" y="96" width="16" height="32" rx="5" fill="#FF9040" transform="rotate(-30 126 112)" />
      {/* Head */}
      <circle cx="104" cy="94" r="20" fill="#FFDAB0" />
      <path d="M104 114 A 20 20 0 0 0 124 94 Q 118 104 104 106 Q 90 104 84 94 A 20 20 0 0 0 104 114 Z" fill="#E8B890" />
      {/* Scout hat */}
      <path d="M82 86 Q 104 58 126 86 L 130 90 L 78 90 Z" fill="#8a4a10" />
      <rect x="78" y="86" width="52" height="5" fill="#6a3a08" />
      <path d="M82 86 Q 104 58 126 86" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.2" />
      {/* Visible eye not covered by spyglass */}
      <circle cx="96" cy="94" r="2.2" fill="#1a0a08" />
      {/* Mouth - focused */}
      <path d="M99 104 L 107 104" stroke="#1a0a08" strokeWidth="2" strokeLinecap="round" />
      {/* Spyglass body */}
      <g transform="translate(114 74) rotate(-26)">
        <rect x="0" y="-5" width="38" height="10" rx="2" fill="#B8860B" />
        <rect x="0" y="-5" width="38" height="3" fill="rgba(255,255,255,.4)" />
        <rect x="0" y="2" width="38" height="3" fill="rgba(0,0,0,.3)" />
        {/* Brass bands */}
        <rect x="10" y="-5" width="2" height="10" fill="#6a4808" />
        <rect x="24" y="-5" width="2" height="10" fill="#6a4808" />
        {/* Wide lens end */}
        <rect x="36" y="-7" width="10" height="14" rx="2" fill="#6a4808" />
        <rect x="36" y="-7" width="10" height="4" fill="#8a5a10" />
        <circle cx="41" cy="0" r="4" fill="#8aC4FF" />
        <circle cx="40" cy="-1" r="1.5" fill="#fff" />
      </g>
      {/* Twinkling star above */}
      <g transform="translate(148 44)">
        <path d="M0 -6 L 1.5 -1.5 L 6 0 L 1.5 1.5 L 0 6 L -1.5 1.5 L -6 0 L -1.5 -1.5 Z" fill="#FFE890" />
      </g>
    </svg>
  );
}

function EngineerBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("engineer")}
      {/* Dark canyon behind */}
      <path d="M10 156 L 70 156 L 80 168 L 120 168 L 130 156 L 190 156 L 190 180 L 10 180 Z" fill="#2a1a18" />
      <path d="M80 168 L 120 168 L 120 190 L 80 190 Z" fill="#0a0408" />
      {/* Girder/I-beam across shoulder */}
      <g transform="translate(100 80) rotate(-14)">
        <rect x="-48" y="-8" width="96" height="16" fill="#6a7488" />
        <rect x="-48" y="-8" width="96" height="4" fill="rgba(255,255,255,.35)" />
        <rect x="-48" y="4" width="96" height="4" fill="rgba(0,0,0,.3)" />
        <rect x="-48" y="-12" width="96" height="4" fill="#5a6478" />
        <rect x="-48" y="8" width="96" height="4" fill="#5a6478" />
        {/* Rivets */}
        {[-36, -20, -4, 12, 28, 42].map((x, i) => (
          <circle key={i} cx={x} cy="0" r="1.8" fill="#3a4252" />
        ))}
      </g>
      {/* Character body (hi-vis vest) */}
      <rect x="78" y="112" width="44" height="48" rx="6" fill="#FFC040" />
      <rect x="78" y="112" width="44" height="8" fill="rgba(255,255,255,.3)" />
      {/* Reflective stripes */}
      <rect x="78" y="126" width="44" height="3" fill="rgba(255,255,255,.7)" />
      <rect x="78" y="144" width="44" height="3" fill="rgba(255,255,255,.7)" />
      {/* Vest opening (shirt inside) */}
      <polygon points="94,112 106,112 100,132" fill="#C04030" />
      {/* Legs */}
      <rect x="82" y="156" width="14" height="22" rx="2" fill="#3a4052" />
      <rect x="104" y="156" width="14" height="22" rx="2" fill="#3a4052" />
      <rect x="80" y="174" width="18" height="6" rx="1" fill="#1a1a28" />
      <rect x="102" y="174" width="18" height="6" rx="1" fill="#1a1a28" />
      {/* Arms - one gripping girder, one at side */}
      <rect x="60" y="94" width="20" height="24" rx="5" fill="#FFC040" transform="rotate(-22 70 106)" />
      <rect x="120" y="120" width="18" height="32" rx="5" fill="#FFC040" />
      {/* Hand gripping girder */}
      <circle cx="64" cy="88" r="5" fill="#FFDAB0" />
      {/* Head */}
      <circle cx="100" cy="78" r="20" fill="#FFDAB0" />
      <path d="M100 98 A 20 20 0 0 0 120 78 Q 114 88 100 90 Q 86 88 80 78 A 20 20 0 0 0 100 98 Z" fill="#E8B890" />
      {/* Hard hat */}
      <path d="M80 74 Q 80 52 100 50 Q 120 52 120 74 L 126 74 L 74 74 Z" fill="#FFA020" />
      <rect x="74" y="70" width="52" height="6" fill="#C46010" />
      <path d="M80 60 Q 100 48 120 60" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
      {/* Hat logo */}
      <rect x="94" y="62" width="12" height="3" fill="#fff" />
      {/* Eyes */}
      <circle cx="92" cy="82" r="2.2" fill="#1a0a08" />
      <circle cx="108" cy="82" r="2.2" fill="#1a0a08" />
      {/* Confident mouth */}
      <path d="M92 90 L 108 90" stroke="#1a0a08" strokeWidth="2" strokeLinecap="round" />
      {/* Stubble/chin shadow */}
      <path d="M88 92 Q 100 96 112 92" stroke="#8a5a40" strokeWidth="1" fill="none" opacity=".5" />
      {/* Spark at shoulder where girder meets */}
      <g transform="translate(144 62)">
        <circle cx="0" cy="0" r="6" fill="#FFE890" opacity=".6" />
        <path d="M0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#FFE890" />
      </g>
    </svg>
  );
}

function AnchorBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("anchor")}
      {/* Safe-zone glow */}
      <defs>
        <radialGradient id="an-safe" cx=".5" cy=".55" r=".5">
          <stop offset="0%" stopColor="#A8F0C4" stopOpacity=".7" />
          <stop offset="100%" stopColor="#66BB6A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="112" r="70" fill="url(#an-safe)" />
      {/* Protective rings */}
      <circle cx="100" cy="112" r="62" fill="none" stroke="rgba(168,240,196,.6)" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="100" cy="112" r="44" fill="none" stroke="rgba(168,240,196,.75)" strokeWidth="1.5" strokeDasharray="2 4" />
      {/* Linked satellite districts around the ring */}
      {[
        [52, 80], [148, 80], [40, 134], [160, 134], [100, 52],
      ].map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2="100" y2="112" stroke="rgba(168,240,196,.55)" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x={(x as number) - 6} y={(y as number) - 5} width="12" height="10" rx="1.5" fill="#4a5a7a" stroke="rgba(255,255,255,.35)" strokeWidth=".8" />
          <rect x={(x as number) - 6} y={(y as number) - 5} width="12" height="3" fill="rgba(255,255,255,.4)" />
          <rect x={(x as number) - 5} y={(y as number) - 9} width="2.5" height="4" fill="#4a5a7a" />
          <rect x={(x as number) + 2.5} y={(y as number) - 9} width="2.5" height="4" fill="#4a5a7a" />
        </g>
      ))}
      {/* Central anchor figure */}
      {/* Legs */}
      <rect x="92" y="140" width="7" height="22" rx="1.5" fill="#2a3a58" />
      <rect x="101" y="140" width="7" height="22" rx="1.5" fill="#2a3a58" />
      <rect x="90" y="158" width="12" height="5" rx="1" fill="#1a1a28" />
      <rect x="100" y="158" width="12" height="5" rx="1" fill="#1a1a28" />
      {/* Torso */}
      <rect x="80" y="102" width="40" height="40" rx="6" fill="#3a9a58" />
      <rect x="80" y="102" width="40" height="8" fill="rgba(255,255,255,.3)" />
      <rect x="80" y="134" width="40" height="6" fill="rgba(0,0,0,.2)" />
      {/* Outstretched arms reaching the ring edges */}
      <rect x="40" y="100" width="44" height="14" rx="5" fill="#3a9a58" transform="rotate(-14 40 107)" />
      <rect x="116" y="100" width="44" height="14" rx="5" fill="#3a9a58" transform="rotate(14 160 107)" />
      {/* Hands */}
      <circle cx="46" cy="98" r="6" fill="#FFDAB0" />
      <circle cx="154" cy="98" r="6" fill="#FFDAB0" />
      {/* Head */}
      <circle cx="100" cy="82" r="18" fill="#FFDAB0" />
      <path d="M100 100 A 18 18 0 0 0 118 82 Q 112 92 100 94 Q 88 92 82 82 A 18 18 0 0 0 100 100 Z" fill="#E8B890" />
      {/* Hair */}
      <path d="M84 80 Q 86 60 100 58 Q 114 60 116 80 Q 112 66 100 66 Q 88 66 84 80 Z" fill="#3a2410" />
      {/* Eyes */}
      <circle cx="93" cy="82" r="2.2" fill="#1a0a08" />
      <circle cx="107" cy="82" r="2.2" fill="#1a0a08" />
      {/* Calm smile */}
      <path d="M93 90 Q 100 96 107 90" stroke="#1a0a08" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function DiplomatBadge({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 200 200" style={wrap(size)}>
      {disc("diplomat")}
      {/* Warm stage glow */}
      <defs>
        <radialGradient id="dp-stage" cx=".5" cy=".7" r=".5">
          <stop offset="0%" stopColor="#FFF2B0" stopOpacity=".5" />
          <stop offset="100%" stopColor="#FFD740" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="130" r="70" fill="url(#dp-stage)" />
      {/* Left figure */}
      <g>
        {/* Body */}
        <rect x="28" y="120" width="38" height="48" rx="6" fill="#B388FF" />
        <rect x="28" y="120" width="38" height="8" fill="rgba(255,255,255,.3)" />
        {/* Head */}
        <circle cx="47" cy="100" r="18" fill="#FFDAB0" />
        <path d="M47 118 A 18 18 0 0 0 65 100 Q 59 110 47 112 Q 35 110 29 100 A 18 18 0 0 0 47 118 Z" fill="#E8B890" />
        <path d="M32 98 Q 38 78 47 78 Q 58 78 62 98 Q 58 84 47 84 Q 36 84 32 98 Z" fill="#3a2410" />
        <circle cx="41" cy="100" r="2" fill="#1a0a08" />
        <circle cx="53" cy="100" r="2" fill="#1a0a08" />
        <path d="M42 108 Q 47 112 52 108" stroke="#1a0a08" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
      {/* Right figure */}
      <g>
        <rect x="134" y="120" width="38" height="48" rx="6" fill="#69F0AE" />
        <rect x="134" y="120" width="38" height="8" fill="rgba(255,255,255,.3)" />
        <circle cx="153" cy="100" r="18" fill="#FFDAB0" />
        <path d="M153 118 A 18 18 0 0 0 171 100 Q 165 110 153 112 Q 141 110 135 100 A 18 18 0 0 0 153 118 Z" fill="#E8B890" />
        <path d="M137 96 Q 142 80 153 80 Q 166 80 169 96 L 164 92 Q 153 86 142 92 Z" fill="#5a2810" />
        <circle cx="147" cy="100" r="2" fill="#1a0a08" />
        <circle cx="159" cy="100" r="2" fill="#1a0a08" />
        <path d="M148 108 Q 153 112 158 108" stroke="#1a0a08" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
      {/* Central speech bubble bridging them */}
      <g>
        <ellipse cx="100" cy="66" rx="32" ry="18" fill="#fff" />
        <ellipse cx="100" cy="66" rx="32" ry="18" fill="none" stroke="#8a6a10" strokeWidth="2" />
        <polygon points="88,80 88,94 98,82" fill="#fff" stroke="#8a6a10" strokeWidth="2" />
        <polygon points="112,80 112,94 102,82" fill="#fff" stroke="#8a6a10" strokeWidth="2" />
        {/* Three dots */}
        <circle cx="86" cy="66" r="3" fill="#5a4a10" />
        <circle cx="100" cy="66" r="3" fill="#5a4a10" />
        <circle cx="114" cy="66" r="3" fill="#5a4a10" />
      </g>
      {/* Handshake hint - linked hands in the middle */}
      <g transform="translate(100 146)">
        <rect x="-22" y="-5" width="44" height="10" rx="3" fill="#FFDAB0" />
        <rect x="-22" y="-5" width="44" height="3" fill="rgba(255,255,255,.3)" />
        <line x1="-2" y1="-5" x2="-2" y2="5" stroke="#D8A070" strokeWidth="1.2" />
        <line x1="2" y1="-5" x2="2" y2="5" stroke="#D8A070" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

const ABILITY_BADGES: Record<string, React.FC<Props>> = {
  citizen: CitizenBadge,
  mender: MenderBadge,
  scout: ScoutBadge,
  engineer: EngineerBadge,
  anchor: AnchorBadge,
  diplomat: DiplomatBadge,
};

export function getAbilityBadge(abilityId: string | undefined | null): React.FC<Props> {
  if (!abilityId) return CitizenBadge;
  return ABILITY_BADGES[abilityId] ?? CitizenBadge;
}
