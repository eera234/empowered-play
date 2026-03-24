"use client";

// Each card icon has its own distinct fill color that contrasts against its card background
// Tower (bg: #4FC3F7 cyan) → yellow icon
// Sprawl (bg: #FF7043 orange) → white-blue icon
// Fortress (bg: #78909C grey) → gold icon
// Bridge (bg: #FFA726 amber) → dark teal icon
// Beacon (bg: #FFD740 yellow) → deep red icon
// Commons (bg: #66BB6A green) → cream/sand icon
// Vault (bg: #AB47BC purple) → gold icon
// Arch (bg: #EC407A pink) → pale yellow icon

const ICON_COLORS: Record<string, { main: string; shade: string; hi: string }> = {
  tower:   { main: "#1A237E", shade: "#0D1442", hi: "#5C6BC0" },  // dark navy on cyan bg
  sprawl:  { main: "#1B5E20", shade: "#0A3A10", hi: "#4CAF50" },  // forest green on orange bg
  fortress:{ main: "#F57C00", shade: "#BF360C", hi: "#FFB74D" },  // warm orange on grey bg
  bridge:  { main: "#C62828", shade: "#8E0000", hi: "#EF5350" },  // red on amber bg
  beacon:  { main: "#C62828", shade: "#8E0000", hi: "#FF6659" },  // deep red on yellow bg
  commons: { main: "#4A148C", shade: "#2A0054", hi: "#9C27B0" },  // deep purple on green bg
  vault:   { main: "#00BFA5", shade: "#00897B", hi: "#64FFDA" },  // teal on purple bg
  arch:    { main: "#1565C0", shade: "#0D47A1", hi: "#42A5F5" },  // bright blue on pink bg
  // Space theme icons
  "antenna":     { main: "#1A237E", shade: "#0D1442", hi: "#5C6BC0" },
  "solar-array": { main: "#1B5E20", shade: "#0A3A10", hi: "#4CAF50" },
  "bulkhead":    { main: "#F57C00", shade: "#BF360C", hi: "#FFB74D" },
  "connector":   { main: "#C62828", shade: "#8E0000", hi: "#EF5350" },
  "nav-beacon":  { main: "#C62828", shade: "#8E0000", hi: "#FF6659" },
  "hub":         { main: "#4A148C", shade: "#2A0054", hi: "#9C27B0" },
  "capsule":     { main: "#00BFA5", shade: "#00897B", hi: "#64FFDA" },
  "hatch":       { main: "#1565C0", shade: "#0D47A1", hi: "#42A5F5" },
};

export default function CardIcon({ icon, size = 32 }: { icon: string; size?: number }) {
  const c = ICON_COLORS[icon] || { main: "#FFD700", shade: "#C8A200", hi: "#FFF3B0" };
  const d = "rgba(0,0,0,.35)";

  switch (icon) {
    case "tower":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="12" y="6" width="16" height="30" rx="1.5" fill={c.main} />
          <rect x="12" y="6" width="16" height="2" fill={c.hi} opacity=".4" />
          <rect x="26" y="6" width="2" height="30" fill={c.shade} opacity=".5" />
          {[12,18,24,30].map(y => <rect key={y} x="15" y={y} width="4" height="3" rx=".5" fill={d} />)}
          {[12,18,24,30].map(y => <rect key={`r${y}`} x="21" y={y} width="4" height="3" rx=".5" fill={d} opacity=".7" />)}
          <circle cx="17" cy="4.5" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".5" />
          <circle cx="23" cy="4.5" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".5" />
          <line x1="20" y1="6" x2="20" y2="1" stroke={c.shade} strokeWidth="1" />
          <polygon points="20.5,1 27,3.5 20.5,5" fill={c.main} />
        </svg>
      );
    case "sprawl":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="2" y="20" width="36" height="14" rx="1.5" fill={c.main} />
          <rect x="2" y="20" width="36" height="2" fill={c.hi} opacity=".4" />
          <rect x="34" y="20" width="4" height="14" fill={c.shade} opacity=".4" />
          {[7,15,23,31].map(x => <rect key={x} x={x} y="24" width="4" height="3" rx=".5" fill={d} />)}
          {[7,15,23,31].map(x => <rect key={`r${x}`} x={x} y="29" width="4" height="3" rx=".5" fill={d} opacity=".7" />)}
          {[8,16,24,32].map(x => <circle key={x} cx={x} cy="18.5" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".5" />)}
        </svg>
      );
    case "fortress":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="6" y="10" width="28" height="24" rx="1.5" fill={c.main} />
          <rect x="6" y="10" width="28" height="2" fill={c.hi} opacity=".4" />
          <rect x="32" y="10" width="2" height="24" fill={c.shade} opacity=".4" />
          {[6,13,22,29].map(x => <rect key={x} x={x} y="7" width="5" height="5" rx=".5" fill={c.main} />)}
          {[8,15,24,31].map(x => <circle key={x} cx={x} cy="6" r="1.5" fill={c.shade} stroke={c.hi} strokeWidth=".3" />)}
          <path d="M16 34 L16 26 Q20 22 24 26 L24 34 Z" fill={d} />
          <rect x="10" y="16" width="4" height="4" rx=".5" fill={d} />
          <rect x="26" y="16" width="4" height="4" rx=".5" fill={d} opacity=".7" />
        </svg>
      );
    case "bridge":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="2" y="18" width="36" height="8" rx="1" fill={c.main} />
          <rect x="2" y="18" width="36" height="2" fill={c.hi} opacity=".3" />
          <line x1="4" y1="22" x2="36" y2="22" stroke={c.hi} strokeWidth="1" strokeDasharray="4 3" opacity=".4" />
          <line x1="2" y1="17" x2="38" y2="17" stroke={c.hi} strokeWidth="1" opacity=".5" />
          <line x1="2" y1="27" x2="38" y2="27" stroke={c.hi} strokeWidth="1" opacity=".5" />
          {[6,12,18,24,30].map(x => <line key={x} x1={x} y1="15" x2={x} y2="28" stroke={c.hi} strokeWidth=".8" opacity=".3" />)}
          <path d="M8 27 Q20 36 32 27" fill="none" stroke={c.hi} strokeWidth="1.5" opacity=".5" />
          {[12,20,28].map(cx => <circle key={cx} cx={cx} cy="16.5" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />)}
        </svg>
      );
    case "beacon":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points="14,34 12,16 20,4 28,16 26,34" fill={c.main} />
          <polygon points="14,34 12,16 20,4" fill={c.hi} opacity=".15" />
          <polygon points="26,34 28,16 20,4" fill={c.shade} opacity=".3" />
          <circle cx="20" cy="6" r="4" fill={c.hi} opacity=".4" />
          <circle cx="20" cy="6" r="2.5" fill={c.hi} opacity=".6" />
          <polygon points="20,6 8,2 10,8" fill={c.hi} opacity=".12" />
          <polygon points="20,6 32,2 30,8" fill={c.hi} opacity=".12" />
          <rect x="17" y="14" width="6" height="4" rx=".5" fill={d} />
          <rect x="16" y="22" width="8" height="4" rx=".5" fill={d} opacity=".7" />
          <rect x="12" y="32" width="16" height="4" rx="1" fill={c.shade} />
        </svg>
      );
    case "commons":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="4" y="22" width="32" height="12" rx="1.5" fill={c.main} />
          <rect x="4" y="22" width="32" height="2" fill={c.hi} opacity=".3" />
          <rect x="34" y="22" width="2" height="12" fill={c.shade} opacity=".3" />
          {[6,18.5,31].map(x => <rect key={x} x={x} y="14" width="3" height="20" rx=".5" fill={c.shade} />)}
          <rect x="4" y="12" width="32" height="3" rx="1" fill={c.shade} />
          {[10,16,24,30].map(x => <circle key={x} cx={x} cy="11" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" opacity=".6" />)}
          <path d="M9 34 Q12 28 15 34" fill="none" stroke={c.shade} strokeWidth=".8" opacity=".5" />
          <path d="M21 34 Q24 28 27 34" fill="none" stroke={c.shade} strokeWidth=".8" opacity=".5" />
        </svg>
      );
    case "vault":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="10" y="12" width="20" height="22" rx="2" fill={c.main} />
          <rect x="10" y="12" width="20" height="2" fill={c.hi} opacity=".4" />
          <rect x="28" y="12" width="2" height="22" fill={c.shade} opacity=".4" />
          <circle cx="20" cy="24" r="5" fill={d} stroke={c.hi} strokeWidth="1" opacity=".7" />
          <circle cx="20" cy="24" r="2" fill={c.hi} opacity=".4" />
          <line x1="20" y1="19" x2="20" y2="22" stroke={c.hi} strokeWidth="1" opacity=".3" />
          <circle cx="15" cy="10.5" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".5" />
          <circle cx="25" cy="10.5" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".5" />
          <line x1="10" y1="20" x2="30" y2="20" stroke={c.shade} strokeWidth=".5" opacity=".3" />
          <line x1="10" y1="28" x2="30" y2="28" stroke={c.shade} strokeWidth=".5" opacity=".3" />
        </svg>
      );
    case "arch":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="6" y="8" width="10" height="28" rx="1.5" fill={c.main} />
          <rect x="24" y="8" width="10" height="28" rx="1.5" fill={c.main} />
          <rect x="6" y="8" width="10" height="2" fill={c.hi} opacity=".3" />
          <rect x="24" y="8" width="10" height="2" fill={c.hi} opacity=".3" />
          <rect x="14" y="8" width="2" height="28" fill={c.shade} opacity=".4" />
          <rect x="32" y="8" width="2" height="28" fill={c.shade} opacity=".4" />
          <path d="M6 10 Q20 -2 34 10" fill="none" stroke={c.main} strokeWidth="4" />
          <path d="M10 12 Q20 2 30 12" fill="none" stroke={c.shade} strokeWidth="2" opacity=".5" />
          <rect x="17" y="2" width="6" height="5" rx="1" fill={c.shade} />
          <circle cx="20" cy="4" r="1.5" fill={c.hi} opacity=".4" />
          <path d="M16 36 L16 22 Q20 16 24 22 L24 36 Z" fill={d} />
          <circle cx="9" cy="6.5" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="31" cy="6.5" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    // ── Space theme icons ──
    case "antenna":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="18" y="14" width="4" height="22" rx="1" fill={c.main} />
          <rect x="18" y="14" width="4" height="2" fill={c.hi} opacity=".3" />
          <circle cx="20" cy="10" r="6" fill="none" stroke={c.main} strokeWidth="2" />
          <circle cx="20" cy="10" r="3" fill={c.shade} />
          <circle cx="20" cy="10" r="1.5" fill={c.hi} opacity=".5" />
          <path d="M12 8 Q16 4 20 4" fill="none" stroke={c.hi} strokeWidth="1" opacity=".4" />
          <path d="M8 12 Q12 6 20 4" fill="none" stroke={c.hi} strokeWidth=".8" opacity=".3" />
          <rect x="14" y="34" width="12" height="4" rx="1" fill={c.shade} />
          <circle cx="17" cy="33" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="23" cy="33" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    case "solar-array":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="4" y="16" width="14" height="20" rx="1" fill={c.main} />
          <rect x="22" y="16" width="14" height="20" rx="1" fill={c.main} />
          <rect x="18" y="18" width="4" height="16" rx="1" fill={c.shade} />
          {[0,1,2].map(r => [0,1].map(col => <rect key={`l${r}${col}`} x={6+col*6} y={18+r*6} width="4" height="4" rx=".5" fill={c.hi} opacity=".3" />))}
          {[0,1,2].map(r => [0,1].map(col => <rect key={`r${r}${col}`} x={24+col*6} y={18+r*6} width="4" height="4" rx=".5" fill={c.hi} opacity=".3" />))}
          <circle cx="20" cy="14" r="3" fill={c.shade} stroke={c.hi} strokeWidth=".5" />
        </svg>
      );
    case "bulkhead":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="6" y="8" width="28" height="26" rx="2" fill={c.main} />
          <rect x="6" y="8" width="28" height="2" fill={c.hi} opacity=".3" />
          <rect x="32" y="8" width="2" height="26" fill={c.shade} opacity=".3" />
          <rect x="10" y="12" width="20" height="18" rx="1" fill={d} />
          <line x1="10" y1="18" x2="30" y2="18" stroke={c.hi} strokeWidth=".5" opacity=".3" />
          <line x1="10" y1="24" x2="30" y2="24" stroke={c.hi} strokeWidth=".5" opacity=".3" />
          <line x1="20" y1="12" x2="20" y2="30" stroke={c.hi} strokeWidth=".5" opacity=".3" />
          <circle cx="15" cy="6" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="25" cy="6" r="2.5" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    case "connector":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="2" y="16" width="36" height="10" rx="3" fill={c.main} />
          <rect x="2" y="16" width="36" height="2" fill={c.hi} opacity=".3" />
          <circle cx="8" cy="21" r="3" fill={d} stroke={c.hi} strokeWidth=".5" opacity=".5" />
          <circle cx="20" cy="21" r="3" fill={d} stroke={c.hi} strokeWidth=".5" opacity=".5" />
          <circle cx="32" cy="21" r="3" fill={d} stroke={c.hi} strokeWidth=".5" opacity=".5" />
          <rect x="6" y="28" width="6" height="4" rx="1" fill={c.shade} />
          <rect x="28" y="28" width="6" height="4" rx="1" fill={c.shade} />
          <circle cx="10" cy="14" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="20" cy="14" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="30" cy="14" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    case "nav-beacon":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points="20,4 28,16 26,34 14,34 12,16" fill={c.main} />
          <polygon points="20,4 12,16 14,34" fill={c.hi} opacity=".1" />
          <circle cx="20" cy="8" r="4" fill={c.hi} opacity=".3" />
          <circle cx="20" cy="8" r="2" fill={c.hi} opacity=".6" />
          <line x1="20" y1="4" x2="20" y2="1" stroke={c.hi} strokeWidth="1" />
          <line x1="14" y1="6" x2="10" y2="3" stroke={c.hi} strokeWidth=".8" opacity=".4" />
          <line x1="26" y1="6" x2="30" y2="3" stroke={c.hi} strokeWidth=".8" opacity=".4" />
          <rect x="16" y="18" width="8" height="4" rx=".5" fill={d} />
          <rect x="15" y="26" width="10" height="4" rx=".5" fill={d} opacity=".7" />
          <rect x="12" y="32" width="16" height="4" rx="1" fill={c.shade} />
        </svg>
      );
    case "hub":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <circle cx="20" cy="20" r="14" fill={c.main} />
          <circle cx="20" cy="20" r="14" fill="none" stroke={c.shade} strokeWidth="1" />
          <circle cx="20" cy="20" r="8" fill={d} />
          <circle cx="20" cy="20" r="4" fill={c.hi} opacity=".3" />
          <line x1="20" y1="6" x2="20" y2="12" stroke={c.hi} strokeWidth="1.5" opacity=".4" />
          <line x1="20" y1="28" x2="20" y2="34" stroke={c.hi} strokeWidth="1.5" opacity=".4" />
          <line x1="6" y1="20" x2="12" y2="20" stroke={c.hi} strokeWidth="1.5" opacity=".4" />
          <line x1="28" y1="20" x2="34" y2="20" stroke={c.hi} strokeWidth="1.5" opacity=".4" />
          <circle cx="14" cy="5" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="26" cy="5" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    case "capsule":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="12" y="8" width="16" height="24" rx="8" fill={c.main} />
          <rect x="12" y="8" width="16" height="3" fill={c.hi} opacity=".2" />
          <rect x="26" y="8" width="2" height="24" fill={c.shade} opacity=".3" />
          <circle cx="20" cy="18" r="4" fill={d} stroke={c.hi} strokeWidth=".8" opacity=".6" />
          <circle cx="20" cy="18" r="1.5" fill={c.hi} opacity=".4" />
          <rect x="16" y="26" width="8" height="3" rx=".5" fill={d} opacity=".5" />
          <rect x="14" y="32" width="12" height="4" rx="1" fill={c.shade} />
          <circle cx="17" cy="6" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="23" cy="6" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    case "hatch":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x="6" y="8" width="28" height="28" rx="3" fill={c.main} />
          <rect x="6" y="8" width="28" height="2" fill={c.hi} opacity=".2" />
          <rect x="32" y="8" width="2" height="28" fill={c.shade} opacity=".3" />
          <circle cx="20" cy="22" r="8" fill={d} stroke={c.hi} strokeWidth="1.5" />
          <line x1="14" y1="22" x2="26" y2="22" stroke={c.hi} strokeWidth="1" opacity=".4" />
          <line x1="20" y1="14" x2="20" y2="30" stroke={c.hi} strokeWidth="1" opacity=".4" />
          <rect x="16" y="10" width="3" height="3" rx=".5" fill={c.hi} opacity=".2" />
          <rect x="22" y="10" width="3" height="3" rx=".5" fill={c.hi} opacity=".2" />
          <circle cx="13" cy="6" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="20" cy="6" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
          <circle cx="27" cy="6" r="2" fill={c.shade} stroke={c.hi} strokeWidth=".4" />
        </svg>
      );
    default:
      return <span style={{ fontSize: size * 0.75 }}>🧱</span>;
  }
}
