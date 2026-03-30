// Shared constants — safe to import in both server (convex/) and client (app/) code

// ── Scenarios ──────────────────────────────────────────────

export interface CardOverride {
  title: string;
  icon?: string;       // themed icon ID for CardIcon (falls back to base if not set)
  shapeHint: string;
  mapClue: string;
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  briefing: string;
  mapTheme: "water" | "space" | "ocean" | "forest";
  districtNames: Record<number, string>; // cardId → scenario-specific name
  cardOverrides?: Record<number, CardOverride>; // cardId → themed card text
  terminology: {
    district: string;   // what a player's build is called
    zone: string;       // what a map area is called
    map: string;        // what the map is called
  };
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
    terminology: { district: "district", zone: "zone", map: "city map" },
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
      "Earth is behind you. Your crew must construct the last orbital station before the window closes. Each module is designed by one engineer under a sealed constraint. The station only works if every module connects.",
    mapTheme: "space",
    terminology: { district: "module", zone: "bay", map: "station" },
    districtNames: {
      0: "Observation Tower",
      1: "Solar Array",
      2: "Shield Module",
      3: "Docking Arm",
      4: "Command Spire",
      5: "Commons Deck",
      6: "Core Reactor",
      7: "Main Airlock",
    },
    cardOverrides: {
      0: { title: "The Antenna", icon: "antenna", shapeHint: "Build TALL. Your module must reach upward. Signal range depends on height.", mapClue: "Your signal reaches further than anyone. Where you transmit from, others lock on." },
      1: { title: "The Array", icon: "solar-array", shapeHint: "Build WIDE. Your module must spread flat across the hull. Cover surface, not depth.", mapClue: "The outer hull is yours. You belong where the station meets the void." },
      2: { title: "The Bulkhead", icon: "bulkhead", shapeHint: "Build ENCLOSED. Your module must seal on all sides. Pressure integrity is everything.", mapClue: "Sealed tight, you need two adjacent modules to maintain pressure." },
      3: { title: "The Connector", icon: "connector", shapeHint: "Build LONG. Your module is a corridor linking two sections. A passage, not a room.", mapClue: "Without you, the station splits in half. Find the gap between sections." },
      4: { title: "The Beacon", icon: "nav-beacon", shapeHint: "Build to a POINT. Your module tapers to a spire. Navigation depends on you.", mapClue: "All coordinates originate from you. Find the heart of the station." },
      5: { title: "The Hub", icon: "hub", shapeHint: "Build OPEN. No sealed walls. Your module is the shared space where crew gathers.", mapClue: "Everyone drifts through you. The more modules around you, the stronger the station." },
      6: { title: "The Capsule", icon: "capsule", shapeHint: "Build DENSE. Smallest footprint possible. Every component packed tight.", mapClue: "The station must take shape before you slot in. Patience, then precision." },
      7: { title: "The Hatch", icon: "hatch", shapeHint: "Build a GATEWAY. Your module must have a clear opening. It is the way in and out.", mapClue: "Nothing enters without passing through you. Find where the station opens to space." },
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
    terminology: { district: "sector", zone: "zone", map: "seafloor" },
    districtNames: {
      0: "Coral Spire",
      1: "Reef Shelf",
      2: "Pressure Vault",
      3: "Current Bridge",
      4: "Biolume Beacon",
      5: "Tidal Commons",
      6: "Abyss Pod",
      7: "Trench Gate",
    },
    cardOverrides: {
      0: { title: "The Spire", icon: "spire", shapeHint: "Build TALL. Your sector must rise from the seafloor. Height means visibility in the dark.", mapClue: "In the deep, height is how others find you. Rise above the silt." },
      1: { title: "The Shelf", icon: "shelf", shapeHint: "Build WIDE. Your sector must spread along the ocean floor. Cover ground, stay anchored.", mapClue: "The seabed edge is yours. You belong where the settlement meets the open water." },
      2: { title: "The Chamber", icon: "chamber", shapeHint: "Build ENCLOSED. Your sector must seal on all sides. Pressure integrity is survival.", mapClue: "Sealed against the deep, you need at least two sectors nearby to hold." },
      3: { title: "The Current", icon: "current", shapeHint: "Build LONG. Your sector stretches to connect. A passage through the dark water.", mapClue: "Without you, the settlement splits. Find the gap between the two halves." },
      4: { title: "The Biolume", icon: "biolume", shapeHint: "Build to a POINT. Your sector tapers upward, glowing. A landmark in the abyss.", mapClue: "All navigation starts from your light. Find the heart of the seafloor." },
      5: { title: "The Vent", icon: "vent", shapeHint: "Build OPEN. No sealed walls. Your sector is where everyone passes through.", mapClue: "The currents flow through you. The more sectors around you, the warmer you stay." },
      6: { title: "The Pod", icon: "pod", shapeHint: "Build DENSE. Smallest footprint. Pack everything tight against the pressure.", mapClue: "The settlement must take shape before you descend to your place in it." },
      7: { title: "The Airlock", icon: "airlock", shapeHint: "Build a GATEWAY. Your sector must have a clear opening. The way in from the open ocean.", mapClue: "Nothing enters without passing through you. Find where the settlement meets the deep." },
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
    terminology: { district: "outpost", zone: "clearing", map: "canopy" },
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

// Helper: get themed card for a scenario (applies cardOverrides if present)
export function getThemedCard(card: Card, scenario: Scenario): Card {
  const override = scenario.cardOverrides?.[card.id];
  if (!override) return card;
  return { ...card, title: override.title, icon: override.icon || card.icon, shapeHint: override.shapeHint, mapClue: override.mapClue };
}

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
  minPlayers: number;     // minimum players needed for this card to work
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
    minPlayers: 1,
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
    minPlayers: 1,
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
    minPlayers: 3,
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
    minPlayers: 3,
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
    minPlayers: 1,
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
    minPlayers: 4,
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
    minPlayers: 5,
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
    minPlayers: 1,
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
