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

// ══════════════════════════════════════════════════════════════
//  NEW GAME CONSTANTS (redesigned flow)
// ══════════════════════════════════════════════════════════════

// ── New Phase Flow ───────────────────────────────────────────
// waiting → pair_build → guess → map_ch1 → map_ch2 → map_ch3 → vote → complete

export const NEW_PHASES = [
  "waiting",
  "pair_build",
  "guess",
  "map_ch1",
  "map_ch2",
  "map_ch3",
  "vote",
  "complete",
] as const;

export type NewPhase = (typeof NEW_PHASES)[number];

// ── Clue Cards ───────────────────────────────────────────────
// Architect picks 3 of 6 clue cards to guide their builder.
// Each clue is vague enough to be interpreted multiple ways.

export interface ClueCard {
  id: string;
  label: string;         // short name shown on the card face
  clueText: string;      // the actual hint the builder sees
  category: "shape" | "feel" | "story";  // helps architect think about variety
}

export const CLUE_CARDS: ClueCard[] = [
  // Shape clues — describe physical form
  { id: "cl_tall",    label: "Reach Up",       clueText: "Whatever you build, it should reach higher than it spreads.", category: "shape" },
  { id: "cl_wide",    label: "Spread Out",     clueText: "Think flat. Cover ground. Stay low to the earth.", category: "shape" },
  { id: "cl_enclosed", label: "Seal It In",    clueText: "What's inside matters more than what's outside. Close it off.", category: "shape" },
  { id: "cl_pointed", label: "Come to a Point", clueText: "Narrow as you go up. End with something sharp or focused.", category: "shape" },
  { id: "cl_opening", label: "Make a Way In",  clueText: "There must be a clear entrance. A way through, not a wall.", category: "shape" },
  { id: "cl_dense",   label: "Pack It Tight",  clueText: "Use the smallest space possible. Every piece touching another.", category: "shape" },

  // Feel clues — describe mood or function
  { id: "cl_safe",    label: "Safe Haven",     clueText: "Someone should feel protected here. Sheltered.", category: "feel" },
  { id: "cl_exposed", label: "Out in the Open", clueText: "Nothing hidden. Everything visible from every direction.", category: "feel" },
  { id: "cl_connected", label: "Link Things",  clueText: "This isn't a destination. It's a bridge between two places.", category: "feel" },
  { id: "cl_strong",  label: "Built to Last",  clueText: "This needs to survive. Make it heavy, sturdy, unmovable.", category: "feel" },
  { id: "cl_fragile", label: "Handle Gently",  clueText: "Delicate. Balanced. One wrong move and it topples.", category: "feel" },
  { id: "cl_busy",    label: "Full of Life",   clueText: "Imagine many people moving through this at once. Make room for them.", category: "feel" },

  // Story clues — describe narrative purpose
  { id: "cl_first",   label: "The Beginning",  clueText: "This is where everything starts. The origin point.", category: "story" },
  { id: "cl_last",    label: "The End",         clueText: "This is the final stop. Nothing comes after this.", category: "story" },
  { id: "cl_hidden",  label: "Secret Place",   clueText: "Not everyone knows about this. It's tucked away, hard to find.", category: "story" },
  { id: "cl_landmark", label: "You Can't Miss It", clueText: "Everyone sees this first. It's the thing you point to from far away.", category: "story" },
  { id: "cl_gather",  label: "Meeting Point",  clueText: "People come here to decide things together. A center of gravity.", category: "story" },
  { id: "cl_edge",    label: "On the Border",  clueText: "Right at the edge. Between what's known and what's beyond.", category: "story" },
];

// ── Abilities ────────────────────────────────────────────────
// Assigned by facilitator (HR). Some players get abilities, rest are "citizens".

export interface Ability {
  id: string;
  label: string;
  icon: string;          // emoji for badge display
  description: string;   // what the player sees
  hrNote: string;        // what the facilitator sees (why to assign this)
  mechanic: string;      // technical description of the game effect
}

export const ABILITIES: Ability[] = [
  {
    id: "pathfinder",
    label: "Pathfinder",
    icon: "\u{1F9ED}",
    description: "You can see the zone labels on the map. Others see only blank spaces. Guide your team.",
    hrNote: "Give to someone who needs to speak up more. The team literally cannot place districts without their input.",
    mechanic: "Zone labels visible only to this player during map_ch1. Others see unlabeled slots.",
  },
  {
    id: "scout",
    label: "Scout",
    icon: "\u{1F52D}",
    description: "You see the next crisis card one chapter before everyone else. Use this knowledge wisely.",
    hrNote: "Give to someone whose input gets overlooked. They will have information the team needs.",
    mechanic: "During map_ch1, sees the crisis card that drops in map_ch2. During map_ch2, sees ch3 pattern hint.",
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: "\u{1F527}",
    description: "Your connections can cross the river or hazard zones. Others cannot bridge those gaps.",
    hrNote: "Give to someone technical who stays quiet. Their ability is powerful but only if they volunteer it.",
    mechanic: "Connection placement ignores hazard/river restrictions. Others' connections cannot cross these zones.",
  },
  {
    id: "anchor",
    label: "Anchor",
    icon: "\u{1F6E1}\uFE0F",
    description: "Your district is a safe zone. Any district connected to yours is protected from crisis damage.",
    hrNote: "Give to someone who needs their value recognized. Their mere presence on the map protects others.",
    mechanic: "Districts adjacent to or connected to Anchor's district are immune to crisis card negative effects.",
  },
  {
    id: "diplomat",
    label: "Diplomat",
    icon: "\u{1F91D}",
    description: "Once per chapter, you can open a 60-second private chat with any one player.",
    hrNote: "Give to someone who builds relationships. They can broker deals and share info privately.",
    mechanic: "One-time per chapter: opens a private 60s chat channel with a selected player. Others cannot see it.",
  },
];

// ── Crisis Cards ─────────────────────────────────────────────
// Dropped during map_ch2. One per game. Creates tension and forces collaboration.

export interface CrisisCard {
  id: string;
  title: string;
  icon: string;
  description: string;   // what players see
  effect: string;        // mechanical game effect
  counterplay: string;   // how to mitigate (involves abilities)
}

export const CRISIS_CARDS: CrisisCard[] = [
  {
    id: "cr_flood",
    title: "Rising Waters",
    icon: "\u{1F30A}",
    description: "Floodwaters surge through the lower zones. Districts in edge zones without connections are swept away.",
    effect: "Edge-zone districts with fewer than 2 connections lose one connection.",
    counterplay: "Anchor protects adjacent districts. Engineer can build emergency bridges across water.",
  },
  {
    id: "cr_quake",
    title: "Ground Shift",
    icon: "\u{1F30B}",
    description: "The ground shakes. Isolated districts crack apart. Only connected clusters survive intact.",
    effect: "Any district with 0 connections is disabled (greyed out, cannot be voted on).",
    counterplay: "Anchor's safe zone holds. Diplomat can negotiate emergency connection swaps.",
  },
  {
    id: "cr_blackout",
    title: "Signal Lost",
    icon: "\u{1F4E1}",
    description: "Communications fail. For 90 seconds, the group chat is disabled. Only Diplomat can talk.",
    effect: "Group chat disabled for 90 seconds. Diplomat's private chat still works.",
    counterplay: "Diplomat becomes the only communication channel. Scout warned the team in advance.",
  },
  {
    id: "cr_split",
    title: "The Divide",
    icon: "\u26A1",
    description: "A rift opens across the map. Connections crossing the center line are severed.",
    effect: "All connections crossing the map centerline are removed.",
    counterplay: "Engineer can rebuild across the rift. Pathfinder can see safe crossing points.",
  },
];

// ── Power Cards ──────────────────────────────────────────────
// Dealt to 2 players privately during map_ch2. One-time use.

export interface PowerCard {
  id: string;
  title: string;
  icon: string;
  description: string;   // what the player sees
  effect: string;        // mechanical game effect
}

export const POWER_CARDS: PowerCard[] = [
  {
    id: "pw_swap",
    title: "Trade Places",
    icon: "\u{1F500}",
    description: "Swap the position of any two districts on the map.",
    effect: "Select two districts. Their map positions swap instantly.",
  },
  {
    id: "pw_shield",
    title: "Force Field",
    icon: "\u{1F6E1}\uFE0F",
    description: "Protect one district from the next crisis effect.",
    effect: "Selected district is immune to the current/next crisis card.",
  },
  {
    id: "pw_double",
    title: "Double Link",
    icon: "\u{1F517}",
    description: "Place two connections at once instead of one.",
    effect: "Player places two connections in a single turn.",
  },
  {
    id: "pw_reveal",
    title: "Insider Info",
    icon: "\u{1F441}\uFE0F",
    description: "See the hidden pattern before anyone else. You have 30 seconds to prepare.",
    effect: "Reveals the ch3 hidden pattern 30 seconds before the team sees it.",
  },
  {
    id: "pw_move",
    title: "Relocate",
    icon: "\u{1F4CD}",
    description: "Move your own district to any empty zone on the map.",
    effect: "Player's district is lifted and placed in a new empty slot.",
  },
];

// ── Vote Categories ──────────────────────────────────────────
// Players vote in 4 categories during the vote phase.

export interface VoteCategory {
  id: string;
  label: string;
  icon: string;
  question: string;  // what players see
}

export const VOTE_CATEGORIES: VoteCategory[] = [
  {
    id: "vc_mvp",
    label: "Team MVP",
    icon: "\u{1F3C6}",
    question: "Who made the biggest impact on the team's success?",
  },
  {
    id: "vc_creative",
    label: "Most Creative",
    icon: "\u{1F3A8}",
    question: "Whose build or strategy surprised you the most?",
  },
  {
    id: "vc_clutch",
    label: "Clutch Player",
    icon: "\u26A1",
    question: "Who stepped up at the most critical moment?",
  },
  {
    id: "vc_communicator",
    label: "Best Communicator",
    icon: "\u{1F4AC}",
    question: "Who kept the team informed and aligned?",
  },
];

// ── Story Text ───────────────────────────────────────────────
// Narration shown at each chapter transition. Keyed by scenario + chapter.

export const STORY_TEXT: Record<string, Record<string, { title: string; narration: string }>> = {
  rising_tides: {
    map_ch1: {
      title: "Chapter 1: Foundation",
      narration: "The floodwaters have receded, but the ground is unstable. Place your districts carefully. Not every zone is safe, and not everyone can see what you see.",
    },
    map_ch2: {
      title: "Chapter 2: Connections",
      narration: "The districts stand alone. Now build the roads, bridges, and paths that bind them together. But resources are limited, and a storm is coming.",
    },
    map_ch3: {
      title: "Chapter 3: Rally",
      narration: "The crisis hit hard, but your city still stands. A hidden pattern has emerged in the ruins. Rearrange your connections to match it, and the city will be reborn.",
    },
  },
  last_orbit: {
    map_ch1: {
      title: "Chapter 1: Foundation",
      narration: "The station hull is exposed to the void. Place your modules where they can survive. Not every bay is pressurized, and not everyone can read the schematics.",
    },
    map_ch2: {
      title: "Chapter 2: Connections",
      narration: "Modules float in isolation. Build the corridors and conduits that make this a station, not a graveyard. Power is limited, and something is approaching.",
    },
    map_ch3: {
      title: "Chapter 3: Rally",
      narration: "The impact shook the station to its core, but you held. A signal pattern has appeared on scanners. Realign your corridors to match it, and the station powers up.",
    },
  },
  deep_current: {
    map_ch1: {
      title: "Chapter 1: Foundation",
      narration: "Three kilometers down, the pressure is crushing. Place your sectors on stable ground. Not every zone can hold, and not everyone can see through the dark.",
    },
    map_ch2: {
      title: "Chapter 2: Connections",
      narration: "Sectors sit in silence on the seafloor. Build the tunnels and current channels that connect them. Resources are thin, and the deep is restless.",
    },
    map_ch3: {
      title: "Chapter 3: Rally",
      narration: "The tremor cracked the seabed, but your settlement held. A bioluminescent pattern has appeared below. Reroute your channels to follow it, and the seafloor lights up.",
    },
  },
  roothold: {
    map_ch1: {
      title: "Chapter 1: Foundation",
      narration: "The canopy is dense and the forest floor is tangled. Place your outposts where the roots will hold. Not every clearing is stable, and not everyone knows the forest's paths.",
    },
    map_ch2: {
      title: "Chapter 2: Connections",
      narration: "Outposts dot the forest but stand alone. Build the vine bridges and root paths that connect them. Materials are scarce, and something stirs in the undergrowth.",
    },
    map_ch3: {
      title: "Chapter 3: Rally",
      narration: "The storm tore through the canopy, but the roots held. An ancient growth pattern has surfaced in the bark. Reroute your paths to follow it, and the forest awakens.",
    },
  },
};

// ── Hidden Patterns ──────────────────────────────────────────
// Revealed in map_ch3. Players rearrange connections to match.
// Each pattern is a set of required connection pairs (slot IDs).

export interface HiddenPattern {
  id: string;
  label: string;
  description: string;
  // Required connections expressed as pairs of slot indices (0-8 for 9-slot grid)
  connections: [number, number][];
}

export const HIDDEN_PATTERNS: HiddenPattern[] = [
  {
    id: "hp_star",
    label: "The Star",
    description: "All outer zones connect to the center. A star emerges.",
    connections: [[0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [8, 4]],
  },
  {
    id: "hp_ring",
    label: "The Ring",
    description: "The outer zones form an unbroken ring around the center.",
    connections: [[0, 1], [1, 2], [2, 5], [5, 8], [8, 7], [7, 6], [6, 3], [3, 0]],
  },
  {
    id: "hp_bridge",
    label: "The Bridge",
    description: "Two clusters on opposite sides, linked by a single chain through the middle.",
    connections: [[0, 1], [1, 4], [4, 7], [7, 8], [2, 5], [3, 6]],
  },
  {
    id: "hp_tree",
    label: "The Tree",
    description: "Roots at the bottom spread upward through a trunk to branches at the top.",
    connections: [[6, 7], [7, 8], [7, 4], [4, 1], [4, 3], [4, 5], [1, 0], [1, 2]],
  },
];

// ── Pair Build Timing ────────────────────────────────────────
// Synced timing for the 3 clue rounds during pair_build phase.

export const PAIR_BUILD_ROUNDS = [
  { round: 1, clueSeconds: 45, buildSeconds: 180, reviewSeconds: 30, label: "First Clue" },
  { round: 2, clueSeconds: 30, buildSeconds: 120, reviewSeconds: 30, label: "Second Clue" },
  { round: 3, clueSeconds: 30, buildSeconds: 120, reviewSeconds: 0,  label: "Final Clue" },
] as const;
