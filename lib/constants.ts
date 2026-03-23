// Shared constants — safe to import in both server (convex/) and client (app/) code

// ── Scenarios ──────────────────────────────────────────────

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  briefing: string;
  mapTheme: "water" | "space" | "ocean" | "forest";
  districtNames: Record<number, string>; // cardId → scenario-specific name
}

export const SCENARIOS: Scenario[] = [
  {
    id: "rising_tides",
    title: "Cityscape",
    tagline: "Rebuild the city from the ruins",
    icon: "\u{1F3D9}\uFE0F",
    color: "#4FC3F7",
    briefing:
      "The old city is gone. Swallowed by rising waters. Your team are the architects of what comes next. Each of you builds one district of the new city. But you each carry a sealed constraint that shapes how you build. Nobody knows anyone else's rule.",
    mapTheme: "water",
    districtNames: {
      0: "The Lighthouse",
      1: "The Lowlands",
      2: "The Seawall",
      3: "The Crossing",
      4: "The Signal Fire",
      5: "The Market Dock",
      6: "The Safe Room",
      7: "The Harbor Gate",
    },
  },
  {
    id: "last_orbit",
    title: "Deep Space",
    tagline: "First colony on Kepler-9",
    icon: "\u{1F680}",
    color: "#B388FF",
    briefing:
      "Earth is behind you. Your crew must construct the last orbital station before the window closes. Each module is designed by one architect under a sealed constraint. The station only works if every module connects.",
    mapTheme: "space",
    districtNames: {
      0: "The Signal Tower",
      1: "The Solar Array",
      2: "The Shield Bay",
      3: "The Docking Arm",
      4: "The Command Spire",
      5: "The Commons Deck",
      6: "The Core Module",
      7: "The Airlock",
    },
  },
  {
    id: "deep_current",
    title: "Ocean Depths",
    tagline: "Coral settlement under threat",
    icon: "\u{1F30A}",
    color: "#00BCD4",
    briefing:
      "Three kilometers below the surface, your team is building the first permanent settlement on the ocean floor. Each architect designs one sector under a sealed constraint. Pressure, currents, and darkness make every connection critical.",
    mapTheme: "ocean",
    districtNames: {
      0: "The Coral Spire",
      1: "The Reef Bed",
      2: "The Pressure Chamber",
      3: "The Current Channel",
      4: "The Biolume",
      5: "The Open Trench",
      6: "The Abyss Pod",
      7: "The Trench Gate",
    },
  },
  {
    id: "roothold",
    title: "Rainforest",
    tagline: "Build among the ancient trees",
    icon: "\u{1F333}",
    color: "#66BB6A",
    briefing:
      "The forest offered shelter when everything else fell. Now your team builds a permanent settlement woven into the canopy and roots. Each architect shapes one district under a sealed constraint. The forest connects everything. If you let it.",
    mapTheme: "forest",
    districtNames: {
      0: "The Canopy",
      1: "The Undergrowth",
      2: "The Hollow",
      3: "The Vine Bridge",
      4: "The Ancient Tree",
      5: "The Clearing",
      6: "The Seed Bank",
      7: "The Root Arch",
    },
  },
];

// ── Constraint Cards ───────────────────────────────────────

export interface Card {
  id: number;
  title: string;
  icon: string;
  color: string;
  shape: string;          // silhouette description for camera overlay
  shapeHint: string;      // short shape instruction for the player
  buildTime: number;      // minutes
  mapRule: string;        // placement rule — clear version for HR
  mapClue: string;        // placement hint — cryptic version for players
  hrNote: string;         // facilitator-only guidance
  empowermentLevel: "high" | "medium" | "low"; // helps HR assign strategically
}

export const CARDS: Card[] = [
  {
    id: 0,
    title: "The Tower",
    icon: "tower",
    color: "#4FC3F7",
    shape: "tall-narrow",
    shapeHint: "Build TALL. Your district must be taller than it is wide. Reach for the sky.",
    buildTime: 15,
    mapRule: "This card allows placement in any zone. Districts adjacent to yours gain a connectivity bonus.",
    mapClue: "You see further than most. Where you stand, others grow stronger.",
    hrNote: "Places anywhere and strengthens whoever is next to them. A supportive, high-impact role.",
    empowermentLevel: "high",
  },
  {
    id: 1,
    title: "The Sprawl",
    icon: "sprawl",
    color: "#FF7043",
    shape: "wide-flat",
    shapeHint: "Build WIDE. Your district must spread out and stay low. Cover ground, not sky.",
    buildTime: 10,
    mapRule: "This card restricts you to edge or perimeter zones only. The center is off limits.",
    mapClue: "The margins are yours. You belong where the city meets the horizon.",
    hrNote: "Restricted to the edges with less build time. This player has to fit around others, not lead.",
    empowermentLevel: "low",
  },
  {
    id: 2,
    title: "The Fortress",
    icon: "fortress",
    color: "#78909C",
    shape: "enclosed-square",
    shapeHint: "Build ENCLOSED. Your district must have walls on all four sides. What's inside matters.",
    buildTime: 13,
    mapRule: "Your district needs at least 2 neighboring districts. You cannot stand alone on the map.",
    mapClue: "Walls mean nothing without neighbours. You need at least two allies nearby.",
    hrNote: "Can't place alone. Needs two neighbours first, so this player has to talk to the team early.",
    empowermentLevel: "medium",
  },
  {
    id: 3,
    title: "The Bridge",
    icon: "bridge",
    color: "#FFA726",
    shape: "long-horizontal",
    shapeHint: "Build LONG. Your district stretches out to connect. It's a link, not a destination.",
    buildTime: 15,
    mapRule: "Your district must connect two groups that would otherwise be separated. The city needs your link.",
    mapClue: "Without you, the city splits in two. Find the gap and fill it.",
    hrNote: "Connects two separate groups on the map. Without this player, the city stays divided.",
    empowermentLevel: "high",
  },
  {
    id: 4,
    title: "The Beacon",
    icon: "beacon",
    color: "#FFD740",
    shape: "tapered-peak",
    shapeHint: "Build to a POINT. Your district must taper upward, narrowing to a peak or spire at the top.",
    buildTime: 13,
    mapRule: "This card requires the center zone. Everyone else will build around your position.",
    mapClue: "Everything radiates from you. Find the heart of the city.",
    hrNote: "Locked to the centre. Every other player has to position themselves around this person.",
    empowermentLevel: "high",
  },
  {
    id: 5,
    title: "The Commons",
    icon: "commons",
    color: "#66BB6A",
    shape: "open-organic",
    shapeHint: "Build OPEN. No walls, no enclosures. Everything in your district must be accessible from every side.",
    buildTime: 10,
    mapRule: "Your district needs at least 3 neighbors. You are the shared space everyone passes through.",
    mapClue: "Everyone passes through you. The more surrounded you are, the stronger you become.",
    hrNote: "Needs three neighbours before placing. This player can't go early and has to react to the group.",
    empowermentLevel: "low",
  },
  {
    id: 6,
    title: "The Vault",
    icon: "vault",
    color: "#AB47BC",
    shape: "compact-dense",
    shapeHint: "Build DENSE. Use the smallest footprint possible. Pack everything tight, every piece touching another.",
    buildTime: 13,
    mapRule: "You can only place your district after at least 4 others are already on the map. You fill the gap.",
    mapClue: "Patience is your power. The city must take shape before you reveal your place in it.",
    hrNote: "Locked out until four others have placed. This player watches, then fills whatever gap remains.",
    empowermentLevel: "medium",
  },
  {
    id: 7,
    title: "The Arch",
    icon: "arch",
    color: "#EC407A",
    shape: "gateway-opening",
    shapeHint: "Build a GATEWAY. Your district must feature a prominent opening or archway. An entrance, not a barrier.",
    buildTime: 15,
    mapRule: "This card requires a gateway zone. Your district controls access to the city.",
    mapClue: "Nothing enters without passing through you. Find where the city begins.",
    hrNote: "Only fits at a gateway. This player decides where the city's entrance is.",
    empowermentLevel: "high",
  },
];

// ── Map Win Conditions ─────────────────────────────────────

export const WIN_CONDITIONS = [
  {
    id: "connectivity",
    label: "Connected City",
    description: "Every district must connect to at least one neighbor via a road or path.",
    icon: "\u{1F517}",
  },
  {
    id: "services",
    label: "Essential Links",
    description: "Certain district types must be adjacent to function (e.g., The Beacon must connect to The Bridge).",
    icon: "\u26A1",
  },
  {
    id: "coverage",
    label: "Zone Coverage",
    description: "Danger zones on the map must be covered or bordered by a district.",
    icon: "\u{1F6E1}\uFE0F",
  },
  {
    id: "synergy",
    label: "Synergy Score",
    description: "Districts sharing a border earn synergy points. The team aims for maximum synergy.",
    icon: "\u2728",
  },
];

// ── LEGO Kit Definition ────────────────────────────────────

export const LEGO_KIT = [
  { piece: "8\u00D78 stud baseplate", qty: 1, color: "green" },
  { piece: "2\u00D74 brick", qty: 8, color: "mixed (red, blue, yellow, green, white)" },
  { piece: "2\u00D72 brick", qty: 6, color: "mixed" },
  { piece: "1\u00D72 brick", qty: 4, color: "mixed" },
  { piece: "2\u00D74 plate (thin)", qty: 4, color: "mixed" },
  { piece: "2\u00D72 slope", qty: 3, color: "mixed" },
  { piece: "1\u00D71 round stud", qty: 4, color: "mixed" },
  { piece: "1\u00D71 transparent", qty: 2, color: "clear/blue" },
  { piece: "1\u00D74 fence", qty: 1, color: "white" },
  { piece: "1\u00D74 arch", qty: 1, color: "grey" },
];

export const LEGO_KIT_TOTAL = LEGO_KIT.reduce((sum, p) => sum + p.qty, 0); // 34
