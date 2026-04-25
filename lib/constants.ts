// Shared constants:safe to import in both server (convex/) and client (app/) code

// ── Scenarios ──────────────────────────────────────────────

export interface CardOverride {
  title: string;
  icon?: string;       // themed icon ID for CardIcon (falls back to base if not set)
  shapeHint: string;
  mapClue: string;
}

export interface AbilityOverride {
  label?: string;         // in-world name for the ability
  icon?: string;          // optional themed icon (emoji)
  description?: string;   // identity line (theme-flavored) shown before a crisis is relevant
  descriptionC1?: string; // crisis-1 action text (shown Ch1 reveal, WaitScreen, Ch2 intro)
  descriptionC2?: string; // crisis-2 action text (shown only at role rotation, before C2)
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
  abilityOverrides?: Record<string, AbilityOverride>; // ABILITIES.id → themed label/icon/desc
  terminology: {
    district: string;   // what a player's build is called
    zone: string;       // what a map area is called
    map: string;        // what the map is called
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: "rising_tides",
    title: "Harborside",
    tagline: "Rebuild the village after the storm",
    icon: "\u{1F3D9}\uFE0F",
    color: "#4FC3F7",
    briefing:
      "The harbor is half-drowned. The seawall is breached. Your team are the architects of what comes next. Each of you shapes one district of the new village. But you each carry a sealed constraint that shapes how you build. Nobody knows anyone else's rule.",
    mapTheme: "water",
    terminology: { district: "district", zone: "zone", map: "harbor" },
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
    abilityOverrides: {
      mender: {
        label: "Seawall Mender", icon: "\u{1F9F0}",
        description: "You are the Seawall Mender. When the docks break, you decide whose line gets relit.",
        descriptionC1: "After the storm hits, pick one broken pair of docks and relight their link. They skip the rebuild. You cannot save your own line.",
        descriptionC2: "After the storm hits, pick one broken pair of docks and relight their link. They skip the rebuild. You cannot save your own line.",
      },
      scout: {
        label: "Lookout", icon: "\u{1F52D}",
        description: "You are the Lookout. From the lighthouse tower you see what the tide is bringing.",
        descriptionC1: "Just before the storm, you spot which docks will fall. Warn one deckhand privately, or tell the whole harbor the count.",
        descriptionC2: "Just before the storm, you face a call. Stay visible and your own dock goes under, but the harbor sees what comes next. Stay hidden and your dock holds, but the harbor walks blind.",
      },
      engineer: {
        label: "Dockmaster", icon: "\u{1F528}",
        description: "You are the Dockmaster. You decide how the harbor is braced and how it is rebuilt.",
        descriptionC1: "Before the storm hits, reinforce one dock so the next storm cannot touch it.",
        descriptionC2: "After the storm hits, choose the kind of bridge each broken pair must lay back down. Options are filtered to kinds that pair has not built before.",
      },
      anchor: {
        label: "Keeper", icon: "\u{1F3EE}",
        description: "You are the Keeper. You moor two lines instead of one, and decide which one holds.",
        descriptionC1: "When the storm hits, pick which of your two linked docks rides it out untouched. The other stays in the tide.",
        descriptionC2: "When the storm hits, pick which of your two linked docks rides it out untouched. The other stays in the tide.",
      },
      diplomat: {
        label: "Envoy", icon: "\u{1F4E6}",
        description: "You are the Envoy. When the gale drowns out every voice, only yours carries.",
        descriptionC1: "When the storm hits, the harbor goes silent. You have 15 seconds to tap each boat and relight their lamp. The gale may snuff some out again in the first 12 seconds.",
        descriptionC2: "When the storm hits, the harbor goes silent. You have 15 seconds to tap each boat and relight their lamp. The gale may snuff some out again in the first 12 seconds.",
      },
      citizen: {
        label: "Tidebreaker", icon: "\u{1F30A}",
        description: "You are the Tidebreaker. Your call decides which dock the harbor gives up to save the rest.",
        descriptionC1: "When the storm hits, name one dock to give to the tide. If there are two Tidebreakers, the call must match, or the tide takes no one.",
        descriptionC2: "When the storm hits, name one dock to give to the tide. If there are two Tidebreakers, the call must match, or the tide takes no one.",
      },
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
    abilityOverrides: {
      mender: {
        label: "Hull Mender", icon: "\u{1F9F0}",
        description: "You are the Hull Mender. When the breach comes, you decide whose corridor gets patched.",
        descriptionC1: "After the surge hits, pick one severed pair and re-fuse their corridor. They skip the rebuild. You cannot patch your own.",
        descriptionC2: "After the surge hits, pick one severed pair and re-fuse their corridor. They skip the rebuild. You cannot patch your own.",
      },
      scout: {
        label: "Radar Op", icon: "\u{1F4E1}",
        description: "You are the Radar Op. Your scanner reads the void before anyone else feels it.",
        descriptionC1: "Just before the surge, your scanner reads which corridors will snap. Warn one crew member privately, or broadcast the breach count.",
        descriptionC2: "Just before the surge, you face a choice. Stay on channel and your module takes the hit, but the station sees what is next. Stay dark and your module holds, but the crew flies blind.",
      },
      engineer: {
        label: "Engineer", icon: "\u{1F527}",
        description: "You are the Engineer. You decide how the station is armored and how it is rewired.",
        descriptionC1: "Before the surge hits, armor one module so the next surge cannot touch it.",
        descriptionC2: "After the surge hits, specify what kind of corridor each broken pair must reinstall. Options are filtered to kinds that pair has not built before.",
      },
      anchor: {
        label: "Chief of Ops", icon: "\u{1F6E1}\uFE0F",
        description: "You are the Chief of Ops. You hold two module links instead of one, and decide which one stays sealed.",
        descriptionC1: "When the surge hits, pick which of your two linked modules stays pressurised. The other takes the hit.",
        descriptionC2: "When the surge hits, pick which of your two linked modules stays pressurised. The other takes the hit.",
      },
      diplomat: {
        label: "Comms Officer", icon: "\u{1F4E8}",
        description: "You are the Comms Officer. When the station goes dark, your channel is the one that survives.",
        descriptionC1: "When the surge hits, the station's comms go dark. You have 15 seconds to ping each crew member back online. The static may knock some of them off again in the first 12 seconds.",
        descriptionC2: "When the surge hits, the station's comms go dark. You have 15 seconds to ping each crew member back online. The static may knock some of them off again in the first 12 seconds.",
      },
      citizen: {
        label: "Council Vote", icon: "\u{1F5F3}\uFE0F",
        description: "You are the Council Vote. Your choice decides which module is sacrificed for station integrity.",
        descriptionC1: "When the surge hits, vote on one module to sacrifice for station integrity. With two Councilors, the votes must line up, or the station spares everyone.",
        descriptionC2: "When the surge hits, vote on one module to sacrifice for station integrity. With two Councilors, the votes must line up, or the station spares everyone.",
      },
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
    abilityOverrides: {
      mender: {
        label: "Reef Mender", icon: "\u{1F9F0}",
        description: "You are the Reef Mender. When the tunnels tear, you decide whose line gets knit back.",
        descriptionC1: "After the tremor hits, pick one broken pair and knit their tunnel whole again. They skip the rebuild. You cannot save your own.",
        descriptionC2: "After the tremor hits, pick one broken pair and knit their tunnel whole again. They skip the rebuild. You cannot save your own.",
      },
      scout: {
        label: "Sonar", icon: "\u{1F3B5}",
        description: "You are the Sonar. You hear the deep moving before anyone else feels it.",
        descriptionC1: "Just before the tremor, you hear which links will snap. Warn one diver privately, or announce the breach count.",
        descriptionC2: "Just before the tremor, you face a call. Stay audible and your sector goes under, but the team sees what comes next. Stay silent and your sector holds, but the team dives blind.",
      },
      engineer: {
        label: "Hydro-Engineer", icon: "\u{1F527}",
        description: "You are the Hydro-Engineer. You decide how the settlement is braced and how the water is routed.",
        descriptionC1: "Before the tremor hits, reinforce one sector so the next current cannot reach it.",
        descriptionC2: "After the tremor hits, pick the type of tunnel each broken pair must redraw. Options are filtered to kinds that pair has not built before.",
      },
      anchor: {
        label: "Deep Keeper", icon: "\u{1F41A}",
        description: "You are the Deep Keeper. Your sector carries two tunnels instead of one, and you decide which stays in the glow.",
        descriptionC1: "When the tremor hits, pick which of your two linked divers stays in the glow. The other stays in the crush.",
        descriptionC2: "When the tremor hits, pick which of your two linked divers stays in the glow. The other stays in the crush.",
      },
      diplomat: {
        label: "Signaler", icon: "\u{1F41F}",
        description: "You are the Signaler. When the sonar net drowns, only your light keeps the team connected.",
        descriptionC1: "When the tremor hits, the sonar net goes dead. You have 15 seconds to tap each sector back online. The current may cut some of them out again in the first 12 seconds.",
        descriptionC2: "When the tremor hits, the sonar net goes dead. You have 15 seconds to tap each sector back online. The current may cut some of them out again in the first 12 seconds.",
      },
      citizen: {
        label: "Current Vote", icon: "\u{1F30A}",
        description: "You are the Current Vote. Your word decides which sector the current takes.",
        descriptionC1: "When the tremor hits, cast a vote to collapse one sector. With two voters, the pair must agree, or the current takes no one.",
        descriptionC2: "When the tremor hits, cast a vote to collapse one sector. With two voters, the pair must agree, or the current takes no one.",
      },
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
      1: "Undergrowth Hollow",
      2: "The Hollow",
      3: "The Vine Bridge",
      4: "The Ancient Tree",
      5: "The Clearing",
      6: "The Seed Bank",
      7: "The Root Arch",
    },
    abilityOverrides: {
      mender: {
        label: "Root Mender", icon: "\u{1F9F0}",
        description: "You are the Root Mender. When bridges fall, you decide whose vines grow back.",
        descriptionC1: "After the storm hits, pick one fallen pair and regrow their bridge. They skip the reweave. You cannot regrow your own.",
        descriptionC2: "After the storm hits, pick one fallen pair and regrow their bridge. They skip the reweave. You cannot regrow your own.",
      },
      scout: {
        label: "Canopy Watcher", icon: "\u{1F985}",
        description: "You are the Canopy Watcher. From the high branches you see what the grove cannot.",
        descriptionC1: "Just before the storm, you see from the branches which bridges will snap. Warn one outpost privately, or tell the grove the count.",
        descriptionC2: "Just before the storm, you face a call. Stay in the light and your outpost goes down, but the grove sees what comes next. Stay hidden and your outpost holds, but the grove searches blind.",
      },
      engineer: {
        label: "Weaver", icon: "\u{1FAA2}",
        description: "You are the Weaver. You decide which outpost is braced and how the grove reweaves what falls.",
        descriptionC1: "Before the storm hits, lash one outpost with your strongest vines so the next wind cannot reach it.",
        descriptionC2: "After the storm hits, specify what kind of bridge each downed pair must reweave. Options are filtered to kinds that pair has not built before.",
      },
      anchor: {
        label: "Root Keeper", icon: "\u{1F333}",
        description: "You are the Root Keeper. You anchor two vine bridges instead of one, and decide which hold endures.",
        descriptionC1: "When the storm hits, pick which of your two joined outposts keeps its hold. The other gives.",
        descriptionC2: "When the storm hits, pick which of your two joined outposts keeps its hold. The other gives.",
      },
      diplomat: {
        label: "Griot", icon: "\u{1F941}",
        description: "You are the Griot. When the forest goes silent, only your drum carries the song.",
        descriptionC1: "When the storm hits, the forest signals fail. You have 15 seconds to drum each outpost back into the song. The howl may drop some of them out again in the first 12 seconds.",
        descriptionC2: "When the storm hits, the forest signals fail. You have 15 seconds to drum each outpost back into the song. The howl may drop some of them out again in the first 12 seconds.",
      },
      citizen: {
        label: "Council Elder", icon: "\u{1F333}",
        description: "You are the Council Elder. Your word decides which outpost the forest releases.",
        descriptionC1: "When the storm hits, call which outpost the forest must release. With two Elders, the voice must be one, or the forest chooses no one.",
        descriptionC2: "When the storm hits, call which outpost the forest must release. With two Elders, the voice must be one, or the forest chooses no one.",
      },
    },
  },
];

// Taboo words per district. Words the architect cannot say in chat because
// they would directly give away the district name (or an obvious synonym)
// to the builder. Keyed by the exact districtName string the player holds.
// 4-8 words per district, derived from the name itself.
export const DISTRICT_BANNED_WORDS: Record<string, string[]> = {
  // Cityscape (water)
  "The Lighthouse":      ["light", "house", "lighthouse", "beacon", "lamp", "lantern", "tower"],
  "The Lowlands":        ["low", "lowlands", "land", "flat", "valley", "bottom", "ground"],
  "The Seawall":         ["sea", "wall", "seawall", "barrier", "ocean", "shield"],
  "The Crossing":        ["cross", "crossing", "bridge", "over", "through", "pass"],
  "The Signal Fire":     ["signal", "fire", "smoke", "flame", "flag", "burn"],
  "The Market Dock":     ["market", "dock", "trade", "port", "shop", "pier"],
  "The Safe Room":       ["safe", "room", "shelter", "hide", "vault", "bunker"],
  "The Harbor Gate":     ["harbor", "harbour", "gate", "entrance", "door", "port"],

  // Deep Space
  "Observation Tower":   ["observation", "tower", "observe", "watch", "see", "lookout"],
  "Solar Array":         ["solar", "array", "sun", "panel", "power", "grid"],
  "Shield Module":       ["shield", "module", "armor", "defense", "protect"],
  "Docking Arm":         ["dock", "docking", "arm", "attach", "extend", "clamp"],
  "Command Spire":       ["command", "spire", "control", "peak", "lead", "order"],
  "Commons Deck":        ["commons", "deck", "gather", "meet", "shared", "floor"],
  "Core Reactor":        ["core", "reactor", "center", "heart", "engine", "power"],
  "Main Airlock":        ["main", "airlock", "air", "lock", "seal", "hatch", "entry"],

  // Ocean Depths
  "Coral Spire":         ["coral", "spire", "reef", "peak", "tower", "rise"],
  "Reef Shelf":          ["reef", "shelf", "flat", "ledge", "platform", "wide"],
  "Pressure Vault":      ["pressure", "vault", "seal", "chamber", "safe", "closed"],
  "Current Bridge":      ["current", "bridge", "flow", "stream", "cross", "span"],
  "Biolume Beacon":      ["biolume", "bioluminescent", "beacon", "glow", "light", "shine"],
  "Tidal Commons":       ["tidal", "tide", "commons", "gather", "meet", "wave"],
  "Abyss Pod":           ["abyss", "pod", "deep", "dense", "pack", "capsule"],
  "Trench Gate":         ["trench", "gate", "deep", "opening", "entry", "pass"],

  // Rainforest
  "The Canopy":          ["canopy", "top", "high", "leaves", "cover", "overhead"],
  "Undergrowth Hollow":  ["undergrowth", "hollow", "below", "brush", "low", "roots"],
  "The Hollow":          ["hollow", "empty", "inside", "cave", "shell", "open"],
  "The Vine Bridge":     ["vine", "bridge", "swing", "cross", "span", "link"],
  "The Ancient Tree":    ["ancient", "tree", "old", "trunk", "elder", "wood"],
  "The Clearing":        ["clearing", "open", "meadow", "gather", "space", "field"],
  "The Seed Bank":       ["seed", "bank", "store", "grow", "save", "keep"],
  "The Root Arch":       ["root", "arch", "base", "curve", "tunnel", "gateway"],
};

// Helper: get themed card for a scenario (applies cardOverrides if present)
export function getThemedCard(card: Card, scenario: Scenario): Card {
  const override = scenario.cardOverrides?.[card.id];
  if (!override) return card;
  return { ...card, title: override.title, icon: override.icon || card.icon, shapeHint: override.shapeHint, mapClue: override.mapClue };
}

// Helper: get themed ability for a scenario. Label, icon, and description can
// each be overridden; anything not overridden falls back to the base ability
// definition. Returns a new object so callers never mutate ABILITIES.
export function getThemedAbility(ability: Ability, scenario: Scenario): Ability {
  const override = scenario.abilityOverrides?.[ability.id];
  if (!override) return ability;
  return {
    ...ability,
    label: override.label ?? ability.label,
    icon: override.icon ?? ability.icon,
    description: override.description ?? ability.description,
    descriptionC1: override.descriptionC1 ?? ability.descriptionC1,
    descriptionC2: override.descriptionC2 ?? ability.descriptionC2,
  };
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
  mapRule: string;        // placement rule:clear version for HR
  mapClue: string;        // placement hint:cryptic version for players
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
    hrNote: "The Tower player has placement freedom and a radius bonus: wherever they land, their neighbours get stronger. Watch who they choose to stand near and who approaches them. High impact without needing to lead, so it reveals how someone wields influence when they are not expected to be the focal point.",
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
    hrNote: "The Sprawl is boxed into the perimeter with a shorter build clock. They cannot take centre space and they cannot take their time. Good for seeing how someone operates under two simultaneous constraints and whether they still find a way to contribute visibly from the margins.",
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
    hrNote: "The Fortress cannot land until two neighbours are already placed, forcing this player to initiate early conversations to know where the walls will sit. Watch how they negotiate: do they wait passively, lobby a specific pairing, or push the team to move faster so they can commit? Reveals how someone reacts when their plan depends on others going first.",
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
    hrNote: "The Bridge is structurally indispensable: without them the map splits in two. The team is forced to organise around this player whether they realise it or not. Useful for a session where you want to see how the group treats someone whose contribution is essential but easy to overlook in the moment.",
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
    hrNote: "The Beacon is locked to the exact centre of the map: every teammate has to orbit around this position. Whether they welcome that gravitational pull or quietly disown it is the observation. Assign to surface how someone handles a role the game itself marks as central, without giving them a title.",
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
    hrNote: "The Commons needs three neighbours on the board before it can land at all, and a shorter build clock on top. The team sets the shape of the map before this player can act, so their whole game is reactive. Reveals how someone builds value when they arrive late and the best positions are already taken.",
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
    hrNote: "The Vault cannot place until four other districts are already on the map. This player spends most of the round watching the others commit, then fills the last available space with a build no one else could have made fit. Reveals how a person uses imposed patience: whether they spectate, coach, or strategise in the meantime.",
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
    hrNote: "The Arch is locked to a gateway zone, which means this player is the first thing anyone approaching the city passes through. They become a kind of welcoming committee by structure alone. Useful when you want to see whether someone leans into a boundary-keeping role or tries to redistribute it among the team.",
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

// ── Complete Screen Copy ─────────────────────────────────────
// Scenario-themed end-of-game messaging. Falls back to rising_tides copy if a
// scenario id isn't listed.
export const COMPLETE_COPY: Record<string, { title: string; subtitle: string }> = {
  rising_tides: {
    title: "THE HARBOR STANDS",
    subtitle: "The seawall holds. The lighthouse burns again. Your team rebuilt a village no single person could have saved alone.",
  },
  last_orbit: {
    title: "THE STATION HOLDS",
    subtitle: "Every module connected. Every corridor sealed. Your crew held the station together when the void tried to pry it apart.",
  },
  deep_current: {
    title: "THE DEEP GLOWS",
    subtitle: "The coral sings again. The settlement is lit from within. Your team brought light back to a place that forgets the sun.",
  },
  roothold: {
    title: "THE CANOPY WAKES",
    subtitle: "The roots held. The vines are rewoven. Your team rebuilt something the forest will carry long after you're gone.",
  },
};

// ── Clue Cards ───────────────────────────────────────────────
// Architect picks 3 of 6 clue cards to guide their builder.
// Each clue is vague enough to be interpreted multiple ways.

export interface ClueCard {
  id: string;
  label: string;         // short name shown on the card face
  clueText: string;      // the actual hint the builder sees
  category: "shape" | "feel" | "story";  // helps architect think about variety
  icon: string;          // emoji glyph shown on the card face + detail modal
  bannedWords: string[]; // words the architect shouldn't say in chat (Taboo-style)
}

export const CLUE_CARDS: ClueCard[] = [
  // Shape clues: the PHYSICAL form the build takes. Each card names exactly one
  // geometric signature, nothing else. No overlap: tall ≠ pointed ≠ enclosed ≠ dense.
  { id: "cl_tall",     label: "Reach Up",        clueText: "It climbs. The build should stand clearly taller than it is wide. Narrow footprint, lots of vertical.",                      category: "shape", icon: "\u{1F5FC}",       bannedWords: ["tall", "high", "tower", "spire", "up", "height", "skyscraper", "climb", "vertical", "sky"] },
  { id: "cl_wide",     label: "Spread Out",      clueText: "It lays down. The footprint is wider than the build is tall. Think floor plan, not profile.",                               category: "shape", icon: "\u{1F9F1}",       bannedWords: ["wide", "flat", "spread", "low", "ground", "sprawl", "horizontal", "floor", "foundation"] },
  { id: "cl_enclosed", label: "Four Walls",      clueText: "Hollow inside. Walls on every side around an empty interior. You should be able to drop a loose brick into the middle of it.", category: "shape", icon: "\u{1F4E6}",       bannedWords: ["box", "walls", "enclosed", "four", "container", "closed", "room", "roof", "hollow", "interior", "inside"] },
  { id: "cl_pointed",  label: "Come to a Point", clueText: "The silhouette narrows. Wider at the base, tapering to a single tip at the top. No flat roof.",                              category: "shape", icon: "\u{1F53C}",       bannedWords: ["point", "peak", "sharp", "narrow", "pointed", "pyramid", "tip", "cone", "taper", "apex"] },
  { id: "cl_opening",  label: "A Way Through",   clueText: "A channel runs clean through the middle of the build. You can see daylight on the far side through the gap.",                 category: "shape", icon: "\u{1F6AA}",       bannedWords: ["door", "opening", "entrance", "arch", "gateway", "gate", "through", "passage", "tunnel", "hole", "channel"] },
  { id: "cl_dense",    label: "No Gaps",         clueText: "A solid chunk. Every stud built up, all the way through. No hollow, no holes, no skeleton. Weighty in your hand.",           category: "shape", icon: "\u{1F9CA}",       bannedWords: ["cube", "dense", "solid", "block", "packed", "compact", "filled", "brick", "boulder", "chunk", "massive"] },

  // Feel clues: the EMOTIONAL CHARACTER a person would read off the build. Lead
  // with mood. The shape instructions stay vague on purpose so the architect
  // has to describe a feeling, not copy out a checklist.
  { id: "cl_safe",       label: "Shelter",         clueText: "The feeling of a hideaway. Something about it should make a tired person want to sit down next to it. Soft lines, nothing sharp, tucked-in.",    category: "feel",  icon: "\u{1F6E1}\uFE0F", bannedWords: ["safe", "protected", "shelter", "haven", "vault", "calm", "cozy", "refuge", "hide", "warm", "comfort"] },
  { id: "cl_exposed",    label: "Out in the Open", clueText: "The feeling of being watched. It should read as naked from every angle. Nothing to crouch behind, no surface that hides anything.",              category: "feel",  icon: "\u{1F441}\uFE0F", bannedWords: ["open", "exposed", "visible", "uncovered", "cover", "naked", "seen", "watched", "bare"] },
  { id: "cl_connected",  label: "A Link",          clueText: "The feeling of not being the point. Its whole meaning is that two other things need each other, and this is what makes that possible.",          category: "feel",  icon: "\u{1F309}",       bannedWords: ["bridge", "link", "connect", "between", "span", "join", "connector", "couple", "tie"] },
  { id: "cl_strong",     label: "Built to Last",   clueText: "The feeling of permanence. Like it has been there a hundred years and will outlast everyone who sees it. Weight. Gravity. Grounded.",            category: "feel",  icon: "\u{1F9F1}",       bannedWords: ["strong", "heavy", "sturdy", "fortress", "unmovable", "reinforce", "permanent", "forever", "ancient", "stone"] },
  { id: "cl_fragile",    label: "Handle Gently",   clueText: "The feeling that a breath could end it. Precarious. It should look like a careless elbow would be the end of it. Tension in the stance.",        category: "feel",  icon: "\u{1F39F}\uFE0F", bannedWords: ["fragile", "delicate", "balanced", "wobble", "tower", "break", "brittle", "precarious", "thin", "tip"] },
  { id: "cl_busy",       label: "Traffic",         clueText: "The feeling of never-quiet. Somewhere footsteps are always passing through, voices carrying, something always starting or ending here.",         category: "feel",  icon: "\u{1F3AA}",       bannedWords: ["busy", "commons", "plaza", "crowd", "traffic", "movement", "footsteps", "bustle", "lively", "flow"] },

  // Story clues: the NARRATIVE ROLE this place plays in the world. Not shape,
  // not mood. Position in the story.
  { id: "cl_first",    label: "The Start",         clueText: "The origin point. Everything else in this world grew outward from here. The first thing a visitor would see when they arrived.",                   category: "story", icon: "\u{1F331}",       bannedWords: ["first", "start", "origin", "beginning", "seed", "birth", "root", "dawn"] },
  { id: "cl_last",     label: "The End",           clueText: "The finish line of the world. Reach this and the journey is done. Nothing sits beyond it that matters anymore.",                                    category: "story", icon: "\u{1F3C1}",       bannedWords: ["last", "final", "end", "finish", "journey", "destination", "terminus", "conclusion"] },
  { id: "cl_hidden",   label: "Concealed",         clueText: "Not what it looks like from the outside. Something is tucked into this build that only someone up close and paying attention would find.",          category: "story", icon: "\u{1F50D}",       bannedWords: ["hidden", "hide", "bury", "secret", "inside", "tucked", "concealed", "mystery", "reveal"] },
  { id: "cl_landmark", label: "Can\u2019t Miss It", clueText: "The one your eyes go to first when you see the whole world. A silhouette that nothing else on the map repeats. Memorable.",                         category: "story", icon: "\u{1F38F}",       bannedWords: ["landmark", "beacon", "lighthouse", "spire", "stands", "out", "icon", "signature", "memorable", "distinctive"] },
  { id: "cl_gather",   label: "Common Ground",     clueText: "Where the group would stand still together to decide something. Approachable from every direction. A place of pause, not of passing through.",     category: "story", icon: "\u{1F465}",       bannedWords: ["meeting", "center", "hub", "gather", "commons", "plan", "assembly", "council", "together", "stand"] },
  { id: "cl_edge",     label: "The Far Rim",       clueText: "Belongs at the outer boundary. Where this world runs out and the unknown starts. The last built thing before the wilds.",                           category: "story", icon: "\u{1F30B}",       bannedWords: ["edge", "border", "perimeter", "outside", "boundary", "rim", "frontier", "wilderness", "outer", "beyond"] },
];

// ── Abilities ────────────────────────────────────────────────
// Assigned by facilitator (HR). Some players get abilities, rest are "citizens".

export interface Ability {
  id: string;
  label: string;
  icon: string;            // emoji for badge display
  description: string;     // identity line shown before a crisis is relevant
  descriptionC1: string;   // what the player does during Crisis 1 (shown pre-C1)
  descriptionC2: string;   // what the player does during Crisis 2 (shown only at role rotation)
  hrNote: string;          // what the facilitator sees (why to assign this)
  mechanic: string;        // technical description of the game effect
}

export const ABILITIES: Ability[] = [
  {
    id: "mender",
    label: "Mender",
    icon: "\u{1F9F0}",
    description: "You are the Mender. When the team breaks, you decide who gets put back together.",
    descriptionC1: "After the crisis hits, pick one damaged pair to fully restore. They skip the rebuild. You cannot pick yourself.",
    descriptionC2: "After the crisis hits, pick one damaged pair to fully restore. They skip the rebuild. You cannot pick yourself.",
    hrNote: "The Mender's choice is made after damage is visible, so it is unambiguously political: who they rescue, and who they leave to rebuild. Watch whether their pattern of rescues feels fair to the team across both crises.",
    mechanic: "After damage resolves each crisis, picks one damaged dyad to restore its original connection. Cannot target a dyad they are part of.",
  },
  {
    id: "scout",
    label: "Scout",
    icon: "\u{1F52D}",
    description: "You are the Scout. You see what is about to happen before anyone else does.",
    descriptionC1: "Just before the crisis lands you privately see which connections will break. Choose: DM one at-risk teammate a warning, or post the count to team chat.",
    descriptionC2: "Just before the crisis lands you face a binary call. REVEAL and your district breaks but you expose what the team needs to see next. PROTECT and your district is spared but the team goes in blind.",
    hrNote: "The Scout holds private information no one else has, and their first move reveals how they share or trade that advantage. Their Crisis 2 choice forces a visible values call under pressure: sacrifice themselves to help the team, or protect themselves and keep the Ch3 pattern hidden.",
    mechanic: "C1: sees damage preview. Can DM one at-risk player OR post the damage count to team chat. C2: binary choice, REVEAL the Ch3 pattern (own district breaks) OR PROTECT self (district spared, no pattern reveal).",
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: "\u{1F527}",
    description: "You are the Engineer. You decide how the team weathers what is coming.",
    descriptionC1: "Before the crisis hits, pick one teammate's district to pre-shield. Whatever they would lose next, they keep.",
    descriptionC2: "After the crisis hits, pick the new connection type each broken pair must rebuild with. Your choices are filtered to types that specific player has not built before.",
    hrNote: "The Engineer makes two decisions the team will remember: who deserves a shield for the harder crisis, and how each damaged pair must recover. Watch whether their choices follow strategy, favoritism, or a visible pattern.",
    mechanic: "C1: picks one player whose district is immune from C2 damage. C2: picks a new connection type for each destroyed dyad, filtered to types that player has not built before.",
  },
  {
    id: "anchor",
    label: "Anchor",
    icon: "\u{1F6E1}\uFE0F",
    description: "You are the Anchor. You hold two connections instead of one, and decide which to protect.",
    descriptionC1: "When the crisis hits, pick which of your two linked teammates gets immunity this round. The other stays in the damage pool.",
    descriptionC2: "When the crisis hits, pick which of your two linked teammates gets immunity this round. The other stays in the damage pool.",
    hrNote: "The Anchor shields one teammate each crisis and refuses another: a visible call that concentrates social capital. Observe who they protect and whether their pattern shifts between Crisis 1 and Crisis 2.",
    mechanic: "Must build 2 connections in the connection-phase. Each crisis picks one of their connected players to be excluded from that crisis's damage pool.",
  },
  {
    id: "diplomat",
    label: "Diplomat",
    icon: "\u{1F91D}",
    description: "You are the Diplomat. When the team goes silent, only you can bring the voices back.",
    descriptionC1: "When the crisis hits, team chat goes dark. You run a 15-second mini-game: tap each muted teammate to bring them back. In the first 12 seconds the game may re-mute people at random.",
    descriptionC2: "When the crisis hits, team chat goes dark. You run a 15-second mini-game: tap each muted teammate to bring them back. In the first 12 seconds the game may re-mute people at random.",
    hrNote: "The Diplomat owns the team's communication lifeline during every crisis, and their pace sets the team's ability to coordinate. Watch whether they prioritize speed, specific teammates, or methodical coverage as the mini-game re-mutes players at random.",
    mechanic: "Chat-immune during mute windows. Runs a 15-second unmute mini-game each crisis: must tap each muted teammate while the game randomly re-mutes them during the first 12 seconds.",
  },
  {
    id: "citizen",
    label: "Citizen",
    icon: "\u{1F464}",
    description: "You are the Citizen. Your voice is a vote the team cannot ignore.",
    descriptionC1: "When the crisis hits, cast a vote to destroy one teammate's district. If there are two of you, both votes must match the same target for it to count.",
    descriptionC2: "When the crisis hits, cast a vote to destroy one teammate's district. If there are two of you, both votes must match the same target for it to count.",
    hrNote: "The Citizen's only move is a destructive vote, which forces every teammate to justify why they should be spared. With two Citizens, the need to agree produces audible negotiation: watch both the vote and the talk that leads to it.",
    mechanic: "One vote per crisis to destroy a target's district. Cannot target Engineer-shielded or Anchor-immune players. With 2 Citizens, agreement required, else the vote is nullified.",
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

export interface CrisisCardV2 extends CrisisCard {
  shortWarning: string;         // 1-sentence Scout intel for team chat
  damageCount: number;          // how many districts this crisis damages
  muteMs: number;               // ms to silence team chat during this crisis (0 for none specific)
}

export const CRISIS_CARDS: CrisisCardV2[] = [
  {
    id: "cr_flood",
    title: "Rising Waters",
    icon: "\u{1F30A}",
    description: "Floodwaters surge through the low ground. One district is half-swept away and must be rebuilt.",
    effect: "Damages 1 random district. The owner must upload a new photo of their rebuilt district.",
    counterplay: "Shield protects the district ahead of time. Override cancels the damage and restores the district.",
    shortWarning: "Water is rising. One of us is about to lose their district.",
    damageCount: 1,
    muteMs: 15_000,
  },
  {
    id: "cr_quake",
    title: "Ground Shift",
    icon: "\u{1F30B}",
    description: "The ground shakes. Two districts crack apart and must be rebuilt from scratch.",
    effect: "Damages 2 random districts. Affected owners must upload new photos.",
    counterplay: "Shield protects in advance. Override cancels the damage.",
    shortWarning: "The ground is about to shake. Two of us will need to rebuild.",
    damageCount: 2,
    muteMs: 15_000,
  },
  {
    id: "cr_blackout",
    title: "Signal Lost",
    icon: "\u{1F4E1}",
    description: "Communications fail. The team chat goes dark for 25 seconds. Coordinate another way.",
    effect: "Group chat disabled for 25 seconds. Diplomat and Relay card are exempt.",
    counterplay: "Diplomat becomes the only voice. Relay card speaks once through the silence.",
    shortWarning: "Comms are going down. Get ready to coordinate in silence.",
    damageCount: 0,
    muteMs: 25_000,
  },
  {
    id: "cr_split",
    title: "The Divide",
    icon: "\u26A1",
    description: "A rift opens across the map. One district is stranded and half-destroyed.",
    effect: "Damages 1 random district near the map centerline. Owner rebuilds.",
    counterplay: "Shield, Override, or Mender's repair each resolve it.",
    shortWarning: "A rift is about to open. One of us will be stranded.",
    damageCount: 1,
    muteMs: 15_000,
  },
];

// Connection types per scenario theme. Used in Ch3 handshake preview so
// players know what they are physically building before they start.
export interface ConnectionType {
  id: string;
  label: string;
  hint: string;              // one-line physical build instruction
  icon: string;
}
export const CONNECTION_TYPES: Record<string, ConnectionType[]> = {
  water: [
    { id: "bridge", label: "BRIDGE", hint: "Two low LEGO walls span the gap, with studs on top.", icon: "\u{1F309}" },
    { id: "road",   label: "ROAD",   hint: "A flat plate or row of bricks laid end to end.",     icon: "\u{1F6E3}\uFE0F" },
    { id: "pier",   label: "PIER",   hint: "A narrow strip stretching out from the edge.",       icon: "\u26F5" },
    { id: "dam",    label: "DAM",    hint: "A thick wall of bricks two-to-three high.",          icon: "\u{1F6A7}" },
  ],
  space: [
    { id: "bridge", label: "DOCKING TUBE", hint: "A smooth tube of stacked bricks two studs wide.", icon: "\u{1F680}" },
    { id: "road",   label: "HULL PLATE",   hint: "A flat plate laid across the gap.",               icon: "\u{1F6F0}\uFE0F" },
    { id: "pier",   label: "SOLAR ARM",    hint: "A long thin strip extending outward.",            icon: "\u2600\uFE0F" },
    { id: "dam",    label: "SHIELD WALL",  hint: "A double-thick wall of bricks.",                  icon: "\u{1F6E1}\uFE0F" },
  ],
  ocean: [
    { id: "bridge", label: "CORAL ARCH",  hint: "An arched span of bricks over the seafloor.",    icon: "\u{1F41F}" },
    { id: "road",   label: "CURRENT",     hint: "A flat smooth path of plates.",                  icon: "\u{1F30A}" },
    { id: "pier",   label: "ANCHOR LINE", hint: "A narrow column stretching to the target.",      icon: "\u2693" },
    { id: "dam",    label: "REEF WALL",   hint: "A chunky solid wall of bricks.",                 icon: "\u{1F41A}" },
  ],
  forest: [
    { id: "bridge", label: "VINE BRIDGE",  hint: "A low arched span of green bricks.",            icon: "\u{1F33F}" },
    { id: "road",   label: "ROOT PATH",    hint: "A flat row of plates along the ground.",        icon: "\u{1F332}" },
    { id: "pier",   label: "BRANCH ARM",   hint: "A long thin arm stretched outward.",            icon: "\u{1F333}" },
    { id: "dam",    label: "LOG WALL",     hint: "A thick wall of bricks.",                       icon: "\u{1FAB5}" },
  ],
};

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
    id: "pw_rally",
    title: "Rally",
    icon: "\u{1F5F3}\uFE0F",
    description: "Cast a destruction vote on one teammate's district. With 2 Citizens in the game, both must vote for the same target for it to count.",
    effect: "Citizen-only. Fills one damage slot when crisis hits, provided the target is not protected by Engineer Shield or Anchor Immunity.",
  },
  {
    id: "pw_shield",
    title: "Force Field",
    icon: "\u{1F6E1}\uFE0F",
    description: "Protect one district from the next crisis. If damage lands on them, it is absorbed and nothing happens.",
    effect: "Selected player gains a one-shot shield. Consumed on the next crisis that targets them.",
  },
  {
    id: "pw_double",
    title: "Double Link",
    icon: "\u{1F517}",
    description: "Your next connection (in Ch3) is reinforced. It renders gold and counts as complete even if one photo is missing.",
    effect: "Next connection you join (as A or B) is marked bonus: gold line and relaxed photo gate.",
  },
  {
    id: "pw_reveal",
    title: "Crisis Override",
    icon: "\u{1F441}\uFE0F",
    description: "Only playable during an active crisis. Cancels the crisis and restores any district it damaged.",
    effect: "Clears the crisis banner and undoes any district damage from this crisis. Does NOT unmute chat.",
  },
  {
    id: "pw_relay",
    title: "Relay Call",
    icon: "\u{1F4E2}",
    description: "Send one team message even while chat is muted.",
    effect: "One-shot: post a single message to team chat that bypasses the mute.",
  },
  {
    id: "pw_foresight",
    title: "Foresight",
    icon: "\u{1F52E}",
    description: "Privately see the next crisis the facilitator picks, before it fires.",
    effect: "You see the next crisis preview card on your screen. Hidden from everyone else.",
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
  { round: 1, clueSeconds: 120, buildSeconds: 300, reviewSeconds: 30, label: "First Clue" },
  { round: 2, clueSeconds: 120, buildSeconds: 300, reviewSeconds: 30, label: "Second Clue" },
  { round: 3, clueSeconds: 120, buildSeconds: 300, reviewSeconds: 0,  label: "Final Clue" },
] as const;

// ── Map Connection Timing ────────────────────────────────────
// Budget for physically building the LEGO bridge that becomes a map
// connection. Timer is guidance, not a hard stop: the UI shows a countdown
// so teams know to pick up bricks and start assembling, but the camera
// remains usable after the timer runs out.
export const CONNECTION_BUILD_SECONDS_CH2 = 300; // 5 min: greenfield Ch2 bridges

// Pass #19: Ch3 timer now scales with player count. Three players finish
// fast (3 districts, pre-drawn connections); bigger groups need more room
// because the pattern has more slots and more moving pieces. Exported as a
// function so server-side (convex/game.ts) and client-side (if needed) both
// compute the same value from the same source.
export function ch3Seconds(playerCount: number): number {
  if (playerCount <= 3) return 30;
  if (playerCount === 4) return 45;
  if (playerCount === 5) return 60;
  if (playerCount === 6) return 80;
  return 100; // 7+ players
}

// Back-compat constant: some modules still import the old name; keep it as the
// 3-player value so references don't break while we migrate callers.
export const CONNECTION_BUILD_SECONDS_CH3 = ch3Seconds(3);
export const CH1_PLACEMENT_SECONDS = 120;        // Ch1 placement sprint: 120s after the last non-fac player taps ready

// ── Ch1 auto-place fallback data ───────────────────────────
// Shared by server (autoPlaceUnplaced) and client (StoryMapScreen). Just id
// plus x/y percentages. The full slot shape (labels, adjacency, zoneType) is
// still defined in StoryMapScreen.tsx for rendering purposes.
export interface SlotPos { id: string; x: number; y: number; }
export const CH1_SLOT_POSITIONS: Record<string, SlotPos[]> = {
  water: [
    { id: "west-commercial",   x: 15, y: 30 },
    { id: "north-residential", x: 33, y: 14 },
    { id: "center",            x: 45, y: 33 },
    { id: "east-district",     x: 62, y: 18 },
    { id: "park",              x: 83, y: 12 },
    { id: "south-bridge",      x: 28, y: 55 },
    { id: "construction",      x: 10, y: 68 },
    { id: "industrial",        x: 48, y: 72 },
    { id: "harbor",            x: 75, y: 62 },
  ],
  space: [
    { id: "west-commercial",   x: 8,  y: 20 },
    { id: "north-residential", x: 30, y: 8  },
    { id: "center",            x: 50, y: 38 },
    { id: "east-district",     x: 65, y: 15 },
    { id: "park",              x: 85, y: 8  },
    { id: "south-bridge",      x: 28, y: 55 },
    { id: "construction",      x: 10, y: 68 },
    { id: "industrial",        x: 48, y: 70 },
    { id: "harbor",            x: 78, y: 65 },
  ],
  ocean: [
    { id: "west-commercial",   x: 8,  y: 18 },
    { id: "north-residential", x: 28, y: 10 },
    { id: "center",            x: 48, y: 30 },
    { id: "east-district",     x: 65, y: 12 },
    { id: "park",              x: 88, y: 15 },
    { id: "south-bridge",      x: 28, y: 52 },
    { id: "construction",      x: 10, y: 68 },
    { id: "industrial",        x: 42, y: 72 },
    { id: "harbor",            x: 75, y: 65 },
  ],
  forest: [
    { id: "west-commercial",   x: 8,  y: 25 },
    { id: "north-residential", x: 30, y: 10 },
    { id: "center",            x: 45, y: 30 },
    { id: "east-district",     x: 62, y: 18 },
    { id: "park",              x: 82, y: 8  },
    { id: "south-bridge",      x: 35, y: 55 },
    { id: "construction",      x: 10, y: 65 },
    { id: "industrial",        x: 45, y: 72 },
    { id: "harbor",            x: 75, y: 65 },
  ],
};

// ── Ch1 riddles ────────────────────────────────────────────
// One per slot per scenario. Each riddle points at the zone without naming
// it; the player has 120 seconds to figure out which zone on the map fits.
// Voice follows the scenario: city = civic/architectural, space =
// orbital/mechanical, ocean = pressure/current, forest = canopy/root.
export const CH1_SLOT_RIDDLES: Record<string, Record<string, string>> = {
  water: {
    "west-commercial":   "Where merchants barter salt and cloth in the first light of day.",
    "north-residential": "Where sleep is cheaper than wages and dearer than view.",
    "center":            "Every road begins and ends here. The heart, not the edge.",
    "east-district":     "The first house to catch the morning, the last to lose it.",
    "park":              "The one place the city lets go of itself.",
    "south-bridge":      "The stitch that keeps the broken ground from drifting apart.",
    "construction":      "The half-built. Where tomorrow is still waiting its turn.",
    "industrial":        "Where the hammers never stop and the rebuild begins.",
    "harbor":            "Where the ocean lets the land drink.",
  },
  space: {
    "west-commercial":   "The first airlock open to any ship that docks. Coin passes before salutes do.",
    "north-residential": "Where the crew hangs their gravity boots after shift.",
    "center":            "The core everything else orbits. Pull the plug here and the station goes dark.",
    "east-district":     "Lenses that never blink. The station watches the stars back.",
    "park":              "A patch of real soil, nursed under grow lights. A ghost of a planet.",
    "south-bridge":      "Where visitors cross through. Suit checks and paperwork, no welcome mats.",
    "construction":      "Where half-finished hulls hang in the void, waiting for their last weld.",
    "industrial":        "The pistons that keep this metal island alive. Too loud for anything else.",
    "harbor":            "The mouth of the station. Last breath before deep dark.",
  },
  ocean: {
    "west-commercial":   "Ribbons of green tended like crops. The first harvest of the depths.",
    "north-residential": "Soft pods rocking near the surface, where the light still reaches.",
    "center":            "A vent that never cools. Everything down here warms its hands on this fire.",
    "east-district":     "Spires of calcium built by things smaller than a thought. Fragile. Beautiful.",
    "park":              "Cultivated wildness. A garden the current is asked not to touch.",
    "south-bridge":      "The channel the current chose before anyone built here.",
    "construction":      "Where the hull is tested against pressure that wants it broken.",
    "industrial":        "The deepest workshop. Where the sea's weight is a tool, not a threat.",
    "harbor":            "Where submarines sleep, tethered and breathing.",
  },
  forest: {
    "west-commercial":   "Traders of moss and bark gather here at first bell.",
    "north-residential": "Homes braided into the high branches, where wind is the only neighbour.",
    "center":            "The oldest tree. Everything in this forest took root from its shadow.",
    "east-district":     "The meadow where the canopy thins and lets the sun walk in.",
    "park":              "The grove the elders would not let anyone cut. Ask nothing of it.",
    "south-bridge":      "A vine thick enough to stand on. The way across, if you are brave.",
    "construction":      "The roots where new shelters are being woven underground.",
    "industrial":        "The clearing where timber is cured and resin is pressed.",
    "harbor":            "Where the river widens and the forest finally lets the boats through.",
  },
};

// ═════════════════════════════════════════════════════════════
// Pass #13: Ch2/Ch3 full redesign
// ═════════════════════════════════════════════════════════════

// Fixed role → power pairings. Every player gets one of each at Ch2 start.
export const ROLE_POWER_PAIRINGS: Record<string, string> = {
  scout:    "pw_foresight",
  diplomat: "pw_relay",
  engineer: "pw_shield",
  mender:   "pw_reveal",
  anchor:   "pw_double",
  citizen:  "pw_rally",
};

// Role distribution by non-fac player count. HR must assign exactly these.
export const ROLE_COUNTS_BY_PLAYER_COUNT: Record<number, string[]> = {
  3: ["scout", "diplomat", "engineer"],
  4: ["scout", "diplomat", "engineer", "anchor"],
  5: ["scout", "diplomat", "engineer", "anchor", "mender"],
  6: ["scout", "diplomat", "engineer", "anchor", "mender", "citizen"],
  7: ["scout", "diplomat", "engineer", "anchor", "mender", "citizen", "citizen"],
};

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 7;

// Damage cap per crisis by non-fac player count.
// Pass #20: explicit per-count table. Aligns 1:1 with the protector-role count
// at each tier (engineer / +anchor / +mender) so cap never exceeds saver count.
export function getCrisisCap(playerCount: number): number {
  if (playerCount <= 3) return 1;
  if (playerCount === 4) return 2;
  if (playerCount === 5) return 2;
  if (playerCount === 6) return 3;
  return 3; // 7+
}

// Pass #23: number of crises per game. Distinct from getCrisisCap (which is
// the per-crisis damage scope). Always 2 (Crisis 1 + Crisis 2). Used by HR's
// DEAL CRISIS gate to lock the button after the second crisis is dealt.
export const MAX_CRISES_PER_GAME = 2;

// Ch3 pattern shape name per player count (shape geometry).
export const CH3_SHAPE_BY_COUNT: Record<number, string> = {
  3: "triangle",
  4: "square",
  5: "pentagon",
  6: "hexagon",
  7: "heptagon",
};

// Scenario-themed pattern names. Theme keys match Scenario.theme.
export const CH3_PATTERN_NAMES: Record<string, Record<number, string>> = {
  water:  { 3: "Harbor Triangle", 4: "Four Winds Square",  5: "Pentagon Pier",  6: "Hex Harbor",    7: "Seven Seas" },
  space:  { 3: "Tri-Module",      4: "Quad Dock",          5: "Pentadrive",     6: "Hex Station",   7: "Heptagon Array" },
  ocean:  { 3: "Trident Reef",    4: "Cardinal Reef",      5: "Pentacoral",     6: "Hexreef",       7: "Heptacurrent" },
  forest: { 3: "Trilog Glade",    4: "Quad Grove",         5: "Pentacanopy",    6: "Hex Thicket",   7: "Heptaroot" },
};

// Polar-generated target-slot positions for the Ch3 pattern. Center = (50,50),
// radius = 33% of map. Angles start at 12 o'clock (−90°) and distribute evenly.
export function generateCh3PatternSlots(playerCount: number): { slotId: string; x: number; y: number }[] {
  const n = playerCount;
  const cx = 50;
  const cy = 50;
  const r = 33;
  const out: { slotId: string; x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angleDeg = -90 + (360 / n) * i;
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    out.push({
      slotId: `pattern-${i}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  }
  return out;
}

// Scenario-specific crisis list. Exactly 2 per scenario. The action
// MECHANIC (scout/diplomat/engineer/mender/anchor/citizen actions) is
// scenario-invariant; only flavor copy differs here.
export interface ScenarioCrisis {
  id: string;                  // globally unique
  scenarioId: string;          // rising_tides | last_orbit | deep_current | roothold
  index: 1 | 2;                // 1 = first crisis, 2 = second
  title: string;               // "Flood", "Tremor", etc.
  shortWarning: string;        // private Scout intel text
  narration: string;           // damage-transition copy shown to players
  muteMs: number;              // chat mute duration (Diplomat runs unmute mini-game in this window)
  icon: string;
}

export const SCENARIO_CRISES: ScenarioCrisis[] = [
  // Water / Rising Tides
  {
    id: "cr_water_flood",
    scenarioId: "rising_tides",
    index: 1,
    title: "FLOOD",
    shortWarning: "Waters are rising. Connections will drown.",
    narration: "Floodwaters surge through the low ground. The sirens are screaming. Coordinate now.",
    muteMs: 15_000,
    icon: "\u{1F30A}",
  },
  {
    id: "cr_water_tremor",
    scenarioId: "rising_tides",
    index: 2,
    title: "TREMOR",
    shortWarning: "The ground is shifting. The earth wants pieces back.",
    narration: "The ground shudders. Districts are being torn from their footings.",
    muteMs: 15_000,
    icon: "\u{1F30B}",
  },
  // Space / Deep Space
  {
    id: "cr_space_radiation",
    scenarioId: "last_orbit",
    index: 1,
    title: "RADIATION LEAK",
    shortWarning: "Radiation is spiking. Modules will be sealed off.",
    narration: "A coolant breach vents radiation into the corridors. Modules are going dark.",
    muteMs: 15_000,
    icon: "\u2622\uFE0F",
  },
  {
    id: "cr_space_powersurge",
    scenarioId: "last_orbit",
    index: 2,
    title: "POWER SURGE",
    shortWarning: "Grid is about to blow. Conduits will fry.",
    narration: "The reactor overloads. Cables vaporize. Modules go dark one by one.",
    muteMs: 15_000,
    icon: "\u26A1",
  },
  // Ocean / Deep Current
  {
    id: "cr_ocean_breach",
    scenarioId: "deep_current",
    index: 1,
    title: "PRESSURE BREACH",
    shortWarning: "Hulls are cracking. Sectors will flood.",
    narration: "The pressure gives. Hairline cracks spider across the sector walls.",
    muteMs: 15_000,
    icon: "\u{1F30A}",
  },
  {
    id: "cr_ocean_current",
    scenarioId: "deep_current",
    index: 2,
    title: "CURRENT SHIFT",
    shortWarning: "The current is reversing. Moorings will snap.",
    narration: "An abyssal current surges through. Structures are ripped from their tethers.",
    muteMs: 15_000,
    icon: "\u{1F32A}\uFE0F",
  },
  // Forest / Roothold
  {
    id: "cr_forest_fire",
    scenarioId: "roothold",
    index: 1,
    title: "WILDFIRE",
    shortWarning: "Sparks are spreading. Outposts will burn.",
    narration: "Smoke thickens. Outposts are catching. The canopy cracks with heat.",
    muteMs: 15_000,
    icon: "\u{1F525}",
  },
  {
    id: "cr_forest_landslide",
    scenarioId: "roothold",
    index: 2,
    title: "LANDSLIDE",
    shortWarning: "The hillside is giving way. Paths are collapsing.",
    narration: "The ground slides. The canopy folds. Outposts tumble into the ravine.",
    muteMs: 15_000,
    icon: "\u{1F30B}",
  },
];

// Lookup helpers
export function getScenarioCrises(scenarioId: string): ScenarioCrisis[] {
  return SCENARIO_CRISES.filter(c => c.scenarioId === scenarioId).sort((a, b) => a.index - b.index);
}

// Fixed connection type list per scenario (for Engineer's C2 pick-new-type).
// Each scenario has 4 distinct types; Engineer shows the 3 not-yet-built for
// that player.
export function getConnectionTypesForTheme(theme: string): ConnectionType[] {
  return CONNECTION_TYPES[theme] ?? CONNECTION_TYPES.water;
}

// Per-connection build timer (seconds after both sides ready before the
// timer hits zero). Pass #29: bumped 90 to 120s. After zero, the card no
// longer locks: a force-upload CTA appears and uploads still go through.
// The connection becomes "built" only when both sides have uploaded.
export const PER_CONNECTION_BUILD_SECONDS = 120;

// Diplomat unmute mini-game timing.
export const DIPLOMAT_UNMUTE_TOTAL_MS = 15_000;
export const DIPLOMAT_UNMUTE_CHAOS_END_MS = 12_000;   // after this, no more re-mutes
export const DIPLOMAT_UNMUTE_MAX_REMUTES_PER_PLAYER = 2;
