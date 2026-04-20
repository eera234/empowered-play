import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Existing tables (unchanged) ────────────────────────────

  sessions: defineTable({
    code: v.string(),
    phase: v.string(),
    // Old phases: waiting | card_reveal | building | uploading | city_map | constraint_reveal | debrief | complete
    // New phases: waiting | pair_build | guess | map_ch1 | map_ch2 | map_ch3 | vote | complete
    scenario: v.string(),
    // New optional fields for the redesigned game
    buildSubPhase: v.optional(v.number()),       // 1-3 during pair_build (which clue round)
    buildStage: v.optional(v.string()),           // "clue" | "build" within a round
    subPhaseDeadline: v.optional(v.number()),     // unix ms timestamp for current sub-phase end
    crisisCardId: v.optional(v.string()),         // active crisis card ID during map_ch2
    hiddenPatternRevealed: v.optional(v.boolean()), // true once pattern shown in map_ch3
    // Snapshot of the connection the Ch2 crisis removed. Mender ability
    // reads this to know what to restore in Ch3. Cleared when repaired or
    // when the next crisis fires.
    lostConnection: v.optional(v.object({
      fromSlotId: v.string(),
      toSlotId: v.string(),
      builtBy: v.id("players"),
      photoDataUrl: v.optional(v.string()),
    })),
    menderUsed: v.optional(v.boolean()),           // true once the Mender has repaired
  }).index("by_code", ["code"]),

  players: defineTable({
    sessionId: v.id("sessions"),
    name: v.string(),
    cardIndex: v.optional(v.number()),
    cardSent: v.boolean(),
    cardRead: v.optional(v.boolean()),
    scenarioVote: v.optional(v.string()),
    uploaded: v.boolean(),
    districtName: v.optional(v.string()),
    photoDataUrl: v.optional(v.string()),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    slotId: v.optional(v.string()),
    isFacilitator: v.boolean(),
    // New optional fields for the redesigned game
    ability: v.optional(v.string()),             // "mender" | "scout" | "engineer" | "anchor" | "diplomat" | null (citizen)
    architectFor: v.optional(v.id("players")),   // who this player gives clues to
    builderFor: v.optional(v.id("players")),     // who gives clues to this player (reverse of architectFor)
    roleSeenAt: v.optional(v.number()),          // ms timestamp when player acknowledged the role reveal
    targetZone: v.optional(v.string()),          // Ch1 target-zone slot id the player should place their district near
    ch1Placed: v.optional(v.boolean()),          // true once the player's x/y is within tolerance of targetZone
  }).index("by_session", ["sessionId"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    sender: v.string(),
    text: v.string(),
    isFacilitator: v.boolean(),
    audioDataUrl: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  debrief_answers: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.optional(v.id("players")),
    question: v.string(),
    answer: v.string(),
  }).index("by_session", ["sessionId"]),

  // ── New tables for redesigned game ─────────────────────────

  // Clues sent from architect to builder during pair_build phase
  sent_clues: defineTable({
    sessionId: v.id("sessions"),
    architectId: v.id("players"),      // who sent the clue
    builderId: v.id("players"),        // who receives it
    clueCardId: v.string(),            // references CLUE_CARDS[].id
    round: v.number(),                 // 1, 2, or 3
  }).index("by_session", ["sessionId"])
    .index("by_architect_and_session", ["architectId", "sessionId"]),

  // Anonymous text chat between architect/builder pairs
  pair_messages: defineTable({
    sessionId: v.id("sessions"),
    pairKey: v.string(),               // "{architectId}_{builderId}" for filtering
    senderId: v.id("players"),
    text: v.string(),
  }).index("by_session_and_pair", ["sessionId", "pairKey"]),

  // Progress + final build photos (up to 3 per player during pair_build)
  build_photos: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    round: v.number(),                 // 1, 2, or 3
    photoDataUrl: v.string(),
  }).index("by_session", ["sessionId"])
    .index("by_player_and_session", ["playerId", "sessionId"]),

  // Guesses: each player drags district names onto anonymous photos
  guesses: defineTable({
    sessionId: v.id("sessions"),
    guesserId: v.id("players"),
    targetPlayerId: v.id("players"),   // whose build they're guessing about
    guessedName: v.string(),           // the district name they assigned
  }).index("by_session", ["sessionId"])
    .index("by_guesser_and_session", ["guesserId", "sessionId"]),

  // Connections built with leftover LEGO during map_ch2
  connections: defineTable({
    sessionId: v.id("sessions"),
    fromSlotId: v.string(),            // map slot ID
    toSlotId: v.string(),              // map slot ID
    builtBy: v.id("players"),
    photoDataUrl: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  // Power cards dealt to specific players during map_ch2
  power_cards: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    cardId: v.string(),                // references POWER_CARDS[].id
    used: v.boolean(),
  }).index("by_session", ["sessionId"])
    .index("by_player_and_session", ["playerId", "sessionId"]),

  // Final votes (4 categories) during vote phase
  votes: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    category: v.string(),              // references VOTE_CATEGORIES[].id
    targetPlayerId: v.id("players"),   // who they voted for
  }).index("by_session", ["sessionId"])
    .index("by_session_and_category", ["sessionId", "category"]),
});
