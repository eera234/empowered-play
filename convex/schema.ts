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
    scoutPreview: v.optional(v.string()),         // crisis id previewed privately to the Scout ability holder
    // Pass #21: HR-picked crisis awaiting Scout ack. Set by stagePendingCrisis,
    // cleared by confirmCrisisAnnounce. While set, only the Scout sees a
    // private preview banner with an OK button. Once cleared (Scout-OK or HR
    // fallback), crisisCardId is set and the existing pre-announce flow runs.
    pendingCrisisCardId: v.optional(v.string()),
    chatMutedUntil: v.optional(v.number()),       // unix ms until which the team chat is muted (Blackout crisis). Diplomat exempt
    hiddenPatternRevealed: v.optional(v.boolean()), // doubles as the map_ch3 "rebuilt" flag
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
    doubleLinkFor: v.optional(v.id("players")),    // set by Double Link power card: next connection this player places is marked bonus
    // Set momentarily by dealCrisisCard when an Anchor's linked connection
    // was shielded from removal. The client reads this to show a toast and
    // a short green pulse on the protected line, then calls clearAnchorProtected.
    anchorProtected: v.optional(v.object({
      fromSlotId: v.string(),
      toSlotId: v.string(),
      anchorPlayerId: v.id("players"),
    })),
    // Short-lived narration hook explaining why a specific connection was
    // hit by the active crisis. Cleared on clearCrisis. Shown as a subtitle
    // beneath the crisis banner so players can see the targeting logic.
    crisisTargetReason: v.optional(v.string()),
    // Private preview of the NEXT crisis card, shown only to the player who
    // tapped pw_reveal. Separate from scoutPreview so both can coexist.
    pwRevealPreview: v.optional(v.object({
      forPlayerId: v.id("players"),
      crisisCardId: v.string(),
    })),
    // Ch2 state machine: "CH2_INTRO" → "CH2_CRISIS_ACTIVE" → "CH2_COMPLETE".
    // Drives HR button gates and client copy.
    ch2State: v.optional(v.string()),
    // Ch3 generated pattern. Array of required connections by player _id pairs.
    // Each entry has a stable `key` (sorted-id pair) and optional `connectionType`.
    connectionPattern: v.optional(v.array(v.object({
      key: v.string(),               // "${minId}_${maxId}" canonical form
      aPlayerId: v.id("players"),
      bPlayerId: v.id("players"),
      connectionType: v.string(),    // "bridge" | "road" | "tunnel" | "cable" | scenario-themed
    }))),

    // ── Pass #13 Ch2/Ch3 redesign ─────────────────────────────
    crisisCap: v.optional(v.number()),             // Pass #23: max crises per game (always 2). Per-crisis damage scope is computed live by getCrisisCap(playerCount).
    crisesDealt: v.optional(v.number()),           // how many crises have landed so far (0, 1, or 2)
    crisisIndex: v.optional(v.number()),           // 1 for C1, 2 for C2
    patternShape: v.optional(v.string()),          // "triangle" | "square" | "pentagon" | "hexagon" | "heptagon"
    patternName: v.optional(v.string()),           // scenario-themed name like "Harbor Triangle"
    // Ch3 target-slot layout: array of positions players must drop into
    ch3TargetSlots: v.optional(v.array(v.object({
      slotId: v.string(),              // unique per slot
      x: v.number(),                   // percentage position
      y: v.number(),
      assignedTo: v.optional(v.id("players")), // which player is expected here
    }))),
    // Crisis role-action state (reset each crisis)
    scoutC1Choice: v.optional(v.string()),          // "dm" | "public" | null
    scoutC1Target: v.optional(v.id("players")),     // if scout chose DM
    scoutC2Choice: v.optional(v.string()),          // "reveal" | "protect" | null
    // Pass #30: Scout's "DM" choice now delivers the warning as a private
    // fullscreen modal to the target player only (no chat row). Cleared when
    // the recipient acknowledges or when the crisis clears.
    scoutWarning: v.optional(v.object({
      targetPlayerId: v.id("players"),
      text: v.string(),
      at: v.number(),
    })),
    engineerShieldTarget: v.optional(v.id("players")), // DEPRECATED: pre-shield mechanic removed; field kept so live sessions still load
    anchorImmuneTarget: v.optional(v.id("players")),   // the connected player whose district is immune this crisis
    menderHealed: v.optional(v.id("players")),         // the player whose connection was healed this crisis (one of the damaged)
    diplomatUnmuteStartedAt: v.optional(v.number()),   // timestamp when mini-game started
    diplomatUnmuteDone: v.optional(v.boolean()),       // set when all players unmuted
    // Destroyed connections this crisis (populated by resolveCrisisDamage)
    currentCrisisDamagedPairs: v.optional(v.array(v.object({
      aPlayerId: v.id("players"),
      bPlayerId: v.id("players"),
      originalType: v.string(),
      newType: v.optional(v.string()),  // engineer picks in C2
    }))),
    // Pass #14: split crisis into initiate + resolve phases.
    // false/undefined after dealCrisisV13 (pre-resolution actions open);
    // true after resolveCrisisDamage has committed the damage list.
    damageResolved: v.optional(v.boolean()),
    // Pre-resolution damage preview shown to Scout (system-random, ignoring
    // Anchor/Citizen inputs). Not the final damage list.
    damagePreview: v.optional(v.array(v.object({
      aPlayerId: v.id("players"),
      bPlayerId: v.id("players"),
      originalType: v.string(),
    }))),
    // Pass #16: public banner payload. Populated by runResolveDamage when one
    // or more players were shielded (Anchor, Scout C2 protect, etc.). Cleared
    // when the next crisis resolves. The `at` field
    // lets the client dismiss the banner after ~6s without needing a
    // dedicated clear mutation.
    lastProtectionEvents: v.optional(v.array(v.object({
      savedPlayerId: v.id("players"),
      protectorPlayerId: v.optional(v.id("players")),
      protectorRole: v.string(), // "anchor" | "engineer" | "scout" | ...
      at: v.number(),
    }))),

    // Pass #18: sticky collective-entry flags. Each flips true exactly once
    // (the instant every present non-fac player has readied for that chapter)
    // and never reverts, so a player flickering offline cannot yank the
    // facilitator or their teammates back to a wait screen mid-chapter.
    ch2MapOpened: v.optional(v.boolean()),
    ch3MapOpened: v.optional(v.boolean()),
    // Pass #18: set true by the server when all present non-fac players have
    // satisfied their per-role connection requirement (Anchor=2, others=1).
    // Drives the DEAL CRISIS CTA. Idempotent.
    ch2ConnectionsComplete: v.optional(v.boolean()),
    // Pass #18: crisis sub-phase. "pre" = pre-announcement window where role
    // actions happen; "announced" = map has damaged; "resolving" = post-damage
    // role actions; "rebuilding" = waiting on photos; "cleared" = ready for
    // next crisis. Undefined outside an active crisis.
    crisisSubPhase: v.optional(v.string()),
    // Pass #18: absolute ms deadline for the rebuild window. Server schedules
    // an internal mutation to force-complete rebuilds when this passes.
    rebuildDeadline: v.optional(v.number()),
    // Pass #18: absolute ms deadline for the pre-crisis window. Client reads
    // for the countdown overlay. Cleared when the server fires announceCrisis.
    // Pass #30: deprecated. Damage now blocks until every shielder commits;
    // we no longer write this field. Kept optional for backward compat.
    preCrisisDeadline: v.optional(v.number()),
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
    pairBuildReady: v.optional(v.boolean()),     // true once the player has dismissed the pair-build intro explainer
    ch1Ready: v.optional(v.boolean()),           // true once the player has dismissed the Ch1 briefing. When all non-fac players are ready, the placement timer (CH1_PLACEMENT_SECONDS) starts
    shielded: v.optional(v.boolean()),           // set by Shield power card, consumed by the next crisis affecting this player
    ch2Ready: v.optional(v.boolean()),           // true once the player dismisses the Ch2 onboarding card
    districtDamaged: v.optional(v.boolean()),    // set by a Ch2 crisis. Player must re-upload their district photo to clear.
    damageReason: v.optional(v.string()),        // narration of what damaged them (shown on their screen)
    // Pass #13 Ch2/Ch3 redesign additions
    connectionsBuiltHistory: v.optional(v.array(v.string())), // connection type ids this player has built at any point
    crisisContribution: v.optional(v.string()),  // "done" once this player's role action is complete for the current crisis; cleared on new crisis
    ch3TargetSlotId: v.optional(v.string()),     // the Ch3 pattern slot this player should drop into
    ch3InTargetSlot: v.optional(v.boolean()),    // true when their district x/y lands within the target slot
    originalAbility: v.optional(v.string()),     // the role HR assigned pre-rotation (so we can trace rotation history)
    // Pass #16: reset to false when rotateRolesForC2 runs. Flips true when the
    // player dismisses the RoleRotationOverlay on their new role. HR cannot
    // deal Crisis 2 until every non-fac player is ch2RotationReady.
    ch2RotationReady: v.optional(v.boolean()),
    // Pass #16: reset to false on Ch2→Ch3 transition. Flips true once the
    // player dismisses Ch3IntroOverlay. HR is locked out of the Ch3 map (sees
    // Ch3FacWaitScreen) until every non-fac player is ch3Ready.
    ch3Ready: v.optional(v.boolean()),
    // Pass #17: auto-presence. Client writes this every 3s while the tab is
    // visible and on pagehide. A player is "present" if (now - lastSeenAt) <= 8s.
    // Everywhere the game today gates on "all non-fac players did X", we filter
    // by presence so left players never block advancement. Row is preserved so
    // a dropped player can rejoin and pick up exactly where they were.
    lastSeenAt: v.optional(v.number()),
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

  // Connections built during map_ch3 via the two-player handshake. fromSlotId
  // and toSlotId hold player _ids (string). photoA / photoB are the two halves
  // of the bridge; the connection is "complete" only when both are present.
  connections: defineTable({
    sessionId: v.id("sessions"),
    fromSlotId: v.string(),            // player _id of side A
    toSlotId: v.string(),              // player _id of side B
    builtBy: v.id("players"),          // requester (A); kept for compatibility
    coBuiltBy: v.optional(v.id("players")), // accepter (B)
    connectionType: v.optional(v.string()), // "bridge" | "road" | "tunnel" | "cable"
    photoDataUrl: v.optional(v.string()), // legacy single-photo (kept for older data)
    photoA: v.optional(v.string()),    // A's half of the build
    photoB: v.optional(v.string()),    // B's half of the build
    bonus: v.optional(v.boolean()),    // Double Link
    shielded: v.optional(v.boolean()), // Engineer reinforcement
    // Pass #13 damage-rebuild additions
    destroyedByCrisisIndex: v.optional(v.number()),    // 1 or 2, which crisis broke it
    rebuildNewType: v.optional(v.string()),            // type for the rebuild (engineer-picked in C2, random in C1)
    rebuildPhotoA: v.optional(v.string()),             // fresh photo from player A after damage
    rebuildPhotoB: v.optional(v.string()),             // fresh photo from player B after damage
    rebuildValidatedByHR: v.optional(v.boolean()),     // HR thumbs-up on rebuild
    // Pass #20: which side was the picked victim. Set by runResolveDamage,
    // cleared on rebuild auto-complete. Only this player is prompted to
    // upload the connection rebuild photo; the partner does nothing.
    damagedSidePlayerId: v.optional(v.id("players")),
    // ── Pass #16 + #29: connection-build ready-gate + simultaneous timer ──
    // acceptConnection stamps typeRevealedAt so both players see the type
    // "now." Each side independently taps "I am ready to build" to flip
    // aReady/bReady. When both are true buildStartedAt is set; the
    // PER_CONNECTION_BUILD_SECONDS countdown begins on both devices.
    // Pass #29: timer-zero is a UI signal only (force-CTA banner); uploads
    // still go through past zero, so uploadConnectionPhotoSide is rejected
    // only until buildStartedAt is set. Once both photos land built flips
    // true. expiredAt is no longer set automatically (latent for HR force-skip).
    typeRevealedAt: v.optional(v.number()),
    aReady: v.optional(v.boolean()),
    bReady: v.optional(v.boolean()),
    buildStartedAt: v.optional(v.number()),
    built: v.optional(v.boolean()),
    expiredAt: v.optional(v.number()),
  }).index("by_session", ["sessionId"]),

  // Pending connection requests (30s expiry) driving the Ch3 handshake.
  connection_requests: defineTable({
    sessionId: v.id("sessions"),
    fromPlayerId: v.id("players"),
    toPlayerId: v.id("players"),
    // Pass #16: type is NOT chosen until the accept (or mutual) moment so it
    // can be revealed to both players simultaneously. Older rows may still
    // have a value, hence optional.
    connectionType: v.optional(v.string()), // "bridge" | "road" | "pier" | "dam" (theme-aware)
    expiresAt: v.number(),
    // Ready gate: both players must tap READY on the connection-type preview
    // before the camera opens on both devices.
    fromReady: v.optional(v.boolean()),
    toReady: v.optional(v.boolean()),
  }).index("by_session", ["sessionId"])
    .index("by_session_and_to", ["sessionId", "toPlayerId"]),

  // Power cards dealt to specific players during map_ch2
  power_cards: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    cardId: v.string(),                // references POWER_CARDS[].id
    used: v.boolean(),
    usedTarget: v.optional(v.string()), // describes what the card acted on (for audit + UI label)
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

  // Pass #13: Citizen destruction votes, 1-2 Citizens per session, per crisis
  citizen_votes: defineTable({
    sessionId: v.id("sessions"),
    crisisIndex: v.number(),           // 1 or 2
    voterId: v.id("players"),          // the Citizen casting the vote
    targetPlayerId: v.id("players"),   // whose district they want destroyed
  }).index("by_session_and_crisis", ["sessionId", "crisisIndex"]),

  // Pass #13: per-player mute state tracked by Diplomat's unmute mini-game.
  // Server populates on crisis deal; Diplomat taps each to flip muted=false;
  // a server-side scheduler re-mutes up to 3 times during 0-12s of the game.
  diplomat_mute_state: defineTable({
    sessionId: v.id("sessions"),
    crisisIndex: v.number(),
    playerId: v.id("players"),
    muted: v.boolean(),
    reMuteCount: v.number(),           // how many times game has re-muted this player (cap ~2)
  }).index("by_session_and_crisis", ["sessionId", "crisisIndex"]),
});
