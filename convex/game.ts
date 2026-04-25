import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { CARDS, NEW_PHASES, PAIR_BUILD_ROUNDS, CONNECTION_BUILD_SECONDS_CH2, CH1_PLACEMENT_SECONDS, CH1_SLOT_POSITIONS, SCENARIOS, ROLE_POWER_PAIRINGS, ROLE_COUNTS_BY_PLAYER_COUNT, MAX_CRISES_PER_GAME, CH3_SHAPE_BY_COUNT, CH3_PATTERN_NAMES, generateCh3PatternSlots, ch3Seconds, MIN_PLAYERS, MAX_PLAYERS } from "../lib/constants";

// ── Helper: generate random 5-char code ──
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ══════════════════════════════
//  QUERIES
// ══════════════════════════════

export const getSession = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
  },
});

// Pass #17: presence constants. A player is "present" if their lastSeenAt
// is within the last PRESENCE_STALE_MS. The client writes lastSeenAt every
// PRESENCE_HEARTBEAT_MS while the tab is visible, and 0 on pagehide. Rows
// are never deleted while the session is active, so rejoin resumes state.
export const PRESENCE_HEARTBEAT_MS = 3_000;
export const PRESENCE_STALE_MS = 8_000;

export function isPresent(p: { lastSeenAt?: number; isFacilitator?: boolean }, now: number): boolean {
  // Facilitator presence is not enforced; see rejoin rule in plan Pass #17.
  if (p.isFacilitator) return true;
  if (p.lastSeenAt == null) return false;
  return now - p.lastSeenAt <= PRESENCE_STALE_MS;
}

export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const now = Date.now();
    // Stamp each row with a derived isPresent flag. Clients read this to
    // filter ghosts out of counters, assignment grids, and ready gates.
    return rows.map((p) => ({ ...p, isPresent: isPresent(p, now) }));
  },
});

export const getMessages = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getCards = query({
  args: {},
  handler: async () => CARDS,
});

export const getDebriefAnswers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("debrief_answers")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

// ══════════════════════════════
//  MUTATIONS
// ══════════════════════════════

export const createSession = mutation({
  args: { scenario: v.string() },
  handler: async (ctx, { scenario }) => {
    let code = makeCode();
    while (
      await ctx.db
        .query("sessions")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
    ) {
      code = makeCode();
    }
    const sessionId = await ctx.db.insert("sessions", {
      code,
      phase: "waiting",
      scenario,
    });
    return { sessionId, code };
  },
});

export const joinSession = mutation({
  args: { code: v.string(), name: v.string(), isFacilitator: v.boolean() },
  handler: async (ctx, { code, name, isFacilitator }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!session) return { success: false, error: "Session not found. Check your code." };

    const existing = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    if (!isFacilitator) {
      // Reject duplicate names outright. Same-device rejoin goes through the
      // localStorage-restored playerId path and never reaches this mutation,
      // so if somebody lands here with a taken name they're a second person
      // trying to use it. Silent hijack of the existing record is not OK.
      const sameNamePlayer = existing.find((p) => p.name.toLowerCase() === name.toLowerCase() && !p.isFacilitator);
      if (sameNamePlayer) {
        return { success: false, error: `"${name}" is already in this session. Pick a different name.` };
      }
      if (existing.filter((p) => !p.isFacilitator).length >= 10) {
        return { success: false, error: "Session is full (max 10 players)." };
      }
    } else {
      // Facilitator rejoin
      const existingFac = existing.find((p) => p.isFacilitator);
      if (existingFac) {
        return { success: true, sessionId: session._id, playerId: existingFac._id, phase: session.phase, rejoined: true };
      }
    }

    const playerId = await ctx.db.insert("players", {
      sessionId: session._id,
      name,
      cardSent: false,
      uploaded: false,
      isFacilitator,
      // Pass #17: seed lastSeenAt at join time so the new player appears
      // present immediately. Otherwise there is a ~1s window before the
      // usePresence hook's first heartbeat where they would flicker in the
      // fac grid as a ghost row.
      lastSeenAt: Date.now(),
    });

    return { success: true, sessionId: session._id, playerId, phase: session.phase, scenario: session.scenario };
  },
});

export const voteScenario = mutation({
  args: { playerId: v.id("players"), scenarioId: v.string() },
  handler: async (ctx, { playerId, scenarioId }) => {
    await ctx.db.patch(playerId, { scenarioVote: scenarioId });
  },
});

export const setScenario = mutation({
  args: { sessionId: v.id("sessions"), scenario: v.string() },
  handler: async (ctx, { sessionId, scenario }) => {
    await ctx.db.patch(sessionId, { scenario });
  },
});

export const assignCard = mutation({
  args: { playerId: v.id("players"), cardIndex: v.number() },
  handler: async (ctx, { playerId, cardIndex }) => {
    await ctx.db.patch(playerId, { cardIndex, cardSent: true });
  },
});

export const markCardRead = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.patch(playerId, { cardRead: true });
  },
});

// Player acknowledges the role reveal animation. Used by the facilitator's
// advance gate to know when every non-facilitator has seen their role card.
export const markRoleSeen = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.patch(playerId, { roleSeenAt: Date.now() });
  },
});

export const moveDistrict = mutation({
  args: { playerId: v.id("players"), x: v.number(), y: v.number(), slotId: v.optional(v.string()) },
  handler: async (ctx, { playerId, x, y, slotId }) => {
    await ctx.db.patch(playerId, { x, y, slotId });
  },
});

// Assign Ch1 target zones to every non-facilitator player who doesn't already
// have one. Called once by the frontend on entering map_ch1. Idempotent: if
// a player already has a targetZone, we keep it. Shuffles the zone pool so
// each player gets a distinct target when possible; after the pool is
// exhausted we cycle (> 9 players is not expected for this game).
export const seedCh1Targets = mutation({
  args: { sessionId: v.id("sessions"), zoneIds: v.array(v.string()) },
  handler: async (ctx, { sessionId, zoneIds }) => {
    if (zoneIds.length === 0) return;
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const pool = [...zoneIds];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let cursor = 0;
    for (const p of players) {
      if (p.isFacilitator) continue;
      if (p.targetZone) continue;
      await ctx.db.patch(p._id, { targetZone: pool[cursor % pool.length], ch1Placed: false });
      cursor += 1;
    }
  },
});

// Update a player's Ch1 placement flag. The client does the proximity math
// (it has the slot x/y tables) and tells us the boolean result. Cheap patch.
export const setCh1Placed = mutation({
  args: { playerId: v.id("players"), placed: v.boolean() },
  handler: async (ctx, { playerId, placed }) => {
    await ctx.db.patch(playerId, { ch1Placed: placed });
  },
});

export const sendMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    sender: v.string(),
    text: v.string(),
    isFacilitator: v.boolean(),
    audioDataUrl: v.optional(v.string()),
    senderPlayerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const trimmed = args.text.trim();
    if (!trimmed && !args.audioDataUrl) throw new Error("Empty message");
    if (trimmed.length > 500) throw new Error("Message too long");
    // Blackout crisis mutes the chat for 90s. Facilitator and Diplomat are
    // exempt so the table never fully loses a lifeline.
    const session = await ctx.db.get(args.sessionId);
    const muted = session?.chatMutedUntil && session.chatMutedUntil > Date.now();
    if (muted && !args.isFacilitator) {
      let isDiplomat = false;
      if (args.senderPlayerId) {
        const sender = await ctx.db.get(args.senderPlayerId);
        isDiplomat = sender?.ability === "diplomat";
      }
      if (!isDiplomat) {
        const secsLeft = Math.max(1, Math.ceil((session!.chatMutedUntil! - Date.now()) / 1000));
        throw new Error(`Signal lost. Chat returns in ${secsLeft}s.`);
      }
    }
    const { senderPlayerId: _skip, ...toInsert } = args;
    void _skip;
    await ctx.db.insert("messages", { ...toInsert, text: trimmed });
  },
});

export const submitDebrief = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.optional(v.id("players")),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("debrief_answers", args);
  },
});

export const removePlayer = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.delete(playerId);
  },
});

// Pass #17: silent heartbeat. Client writes this every 3s while the tab is
// visible. Cheap, idempotent, no-op if the row is gone (e.g. the fac kicked
// them between beats).
export const updateLastSeen = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const p = await ctx.db.get(playerId);
    if (!p) return;
    await ctx.db.patch(playerId, { lastSeenAt: Date.now() });
  },
});

// Pass #17: pagehide / beforeunload handler. Pins lastSeenAt to 0 so the
// server sees the player as left on the next query tick (instead of
// waiting out the 8s stale window). Faculty rows are never auto-removed so
// we exempt them here as a safety measure — their tab close must not nuke
// the session.
export const markLeaving = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const p = await ctx.db.get(playerId);
    if (!p) return;
    if (p.isFacilitator) return;
    await ctx.db.patch(playerId, { lastSeenAt: 0 });
  },
});

// ══════════════════════════════
//  NEW GAME MUTATIONS (redesigned flow)
// ══════════════════════════════

// Assign ability + district name to a player (facilitator action during setup)
export const assignRole = mutation({
  args: {
    playerId: v.id("players"),
    ability: v.optional(v.string()),
    districtName: v.string(),
  },
  handler: async (ctx, { playerId, ability, districtName }) => {
    await ctx.db.patch(playerId, { ability: ability ?? undefined, districtName });
  },
});

// Generate circular architect/builder pairings: A→B, B→C, ..., last→A
export const generatePairings = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const nonFac = allPlayers.filter((p) => !p.isFacilitator);
    if (nonFac.length < 2) return { success: false, error: "Need at least 2 players for pairings." };

    // Shuffle for randomness
    const shuffled = [...nonFac].sort(() => Math.random() - 0.5);

    // Circular chain: player[i] architects for player[(i+1) % n]
    for (let i = 0; i < shuffled.length; i++) {
      const architect = shuffled[i];
      const builder = shuffled[(i + 1) % shuffled.length];
      await ctx.db.patch(architect._id, { architectFor: builder._id });
      await ctx.db.patch(builder._id, { builderFor: architect._id });
    }

    return { success: true, pairCount: shuffled.length };
  },
});

// Advance through the new phase flow: waiting to pair_build to guess to map_ch1
// to map_ch2 to map_ch3 to vote to complete. The optional `fromPhase` arg makes
// this mutation per-transition idempotent: if two clients fire the same advance
// (double-tap, network retry, stale tab), only the first one that matches the
// current phase does the work. The rest no-op silently. This is what prevents
// accidentally skipping phases (e.g. Ch1 to Ch3).
export const advanceNewPhase = mutation({
  args: { sessionId: v.id("sessions"), fromPhase: v.optional(v.string()) },
  handler: async (ctx, { sessionId, fromPhase }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    // Idempotency gate: if the caller said "advance from X" and we're no longer
    // at X, somebody else already advanced. Bail without doing anything.
    if (fromPhase !== undefined && session.phase !== fromPhase) return;
    const idx = NEW_PHASES.indexOf(session.phase as typeof NEW_PHASES[number]);
    if (idx < 0 || idx >= NEW_PHASES.length - 1) return;

    const nextPhase = NEW_PHASES[idx + 1];
    const patch: Record<string, unknown> = { phase: nextPhase };

    // Entering pair_build: seed round 1, clue stage. Do NOT set subPhaseDeadline
    // yet. The clue timer is gated on every non-fac player marking themselves
    // ready (via markPairBuildReady); the last one to tap anchors the deadline.
    if (nextPhase === "pair_build") {
      patch.buildSubPhase = 1;
      patch.buildStage = "clue";
      patch.subPhaseDeadline = undefined;
      // Reset the ready flag on every non-fac player so this phase always
      // waits on a fresh round of confirmations.
      const players = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      for (const p of players) {
        if (!p.isFacilitator && p.pairBuildReady) {
          await ctx.db.patch(p._id, { pairBuildReady: false });
        }
      }
    } else if (nextPhase === "map_ch1") {
      // Entering Ch1: reset every non-fac ch1Ready flag so the briefing overlay
      // re-shows, and leave subPhaseDeadline undefined. The placement timer
      // (CH1_PLACEMENT_SECONDS) is gated on every non-fac player tapping ready
      // (markCh1Ready); the last tap anchors the deadline. Same pattern as
      // pair_build entry above.
      patch.buildSubPhase = undefined;
      patch.buildStage = undefined;
      patch.subPhaseDeadline = undefined;
      const players = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      for (const p of players) {
        if (!p.isFacilitator && p.ch1Ready) {
          await ctx.db.patch(p._id, { ch1Ready: false });
        }
      }
    } else if (nextPhase === "map_ch2") {
      // Ch2 is now crisis + rebuild, NOT connection building. Auto-deal one
      // power card to each non-fac player on entry so they're ready when the
      // first crisis lands.
      patch.buildSubPhase = undefined;
      patch.buildStage = undefined;
      patch.subPhaseDeadline = undefined;
      patch.ch2State = "CH2_INTRO";
      patch.crisisCardId = undefined;
      patch.crisisTargetReason = undefined;
      patch.lostConnection = undefined;
      patch.chatMutedUntil = undefined;

      // Coming from Ch1: snap every non-fac player to THEIR riddle-correct slot
      // (player.targetZone). Unplaced players get dropped in, wrongly-placed
      // players get moved to the right spot. ch1Placed is only marked true when
      // the final landing is actually the correct slot. Players without a
      // targetZone fall back to a free slot (and stay unplaced).
      if (session.phase === "map_ch1") {
        const sc = SCENARIOS.find((s) => s.id === session.scenario);
        const theme = sc?.mapTheme ?? "water";
        const slotPool = CH1_SLOT_POSITIONS[theme] ?? CH1_SLOT_POSITIONS.water;
        const slotById: Record<string, typeof slotPool[number]> = {};
        for (const s of slotPool) slotById[s.id] = s;
        const allPlayers = await ctx.db
          .query("players")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .collect();
        const nonFac = allPlayers.filter((p) => !p.isFacilitator);

        for (const p of nonFac) {
          const targetSlot = p.targetZone ? slotById[p.targetZone] : undefined;
          if (targetSlot) {
            await ctx.db.patch(p._id, {
              x: targetSlot.x,
              y: targetSlot.y,
              slotId: targetSlot.id,
              ch1Placed: true,
            });
          }
        }

        // Any player without a targetZone (shouldn't happen, but guard): drop
        // them in a random unoccupied slot and leave ch1Placed false.
        const placedSlotIds = new Set(
          nonFac
            .filter(p => p.targetZone && slotById[p.targetZone])
            .map(p => p.targetZone as string)
        );
        const orphans = nonFac.filter(p => !p.targetZone || !slotById[p.targetZone]);
        if (orphans.length > 0) {
          const freeSlots = slotPool.filter(s => !placedSlotIds.has(s.id));
          const pool = freeSlots.length > 0 ? freeSlots : slotPool;
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          for (let i = 0; i < orphans.length; i++) {
            const slot = shuffled[i % shuffled.length];
            await ctx.db.patch(orphans[i]._id, {
              x: slot.x,
              y: slot.y,
              slotId: slot.id,
              ch1Placed: false,
            });
          }
        }

        // Reset per-player Ch2 flags.
        for (const p of nonFac) {
          await ctx.db.patch(p._id, {
            ch2Ready: false,
            districtDamaged: false,
            damageReason: undefined,
            crisisContribution: undefined,
            connectionsBuiltHistory: p.connectionsBuiltHistory ?? [],
            originalAbility: p.ability,
          });
        }

        // Enforce min/max players.
        if (nonFac.length < MIN_PLAYERS || nonFac.length > MAX_PLAYERS) {
          throw new Error(`Need between ${MIN_PLAYERS} and ${MAX_PLAYERS} players to enter Ch2. Currently: ${nonFac.length}.`);
        }
        // Enforce role assignment: every non-fac player must have an ability.
        const unassigned = nonFac.filter(p => !p.ability);
        if (unassigned.length > 0) {
          throw new Error(`Assign a role to every player before Ch2. Unassigned: ${unassigned.map(p => p.name).join(", ")}.`);
        }

        // Pass #14: enforce strict role distribution per player count.
        const requiredRoles = ROLE_COUNTS_BY_PLAYER_COUNT[nonFac.length];
        if (requiredRoles) {
          const requiredCounts: Record<string, number> = {};
          for (const r of requiredRoles) requiredCounts[r] = (requiredCounts[r] ?? 0) + 1;
          const actualCounts: Record<string, number> = {};
          for (const p of nonFac) {
            const r = p.ability ?? "";
            actualCounts[r] = (actualCounts[r] ?? 0) + 1;
          }
          const mismatches: string[] = [];
          const allRoles = new Set([...Object.keys(requiredCounts), ...Object.keys(actualCounts)]);
          for (const r of allRoles) {
            const req = requiredCounts[r] ?? 0;
            const act = actualCounts[r] ?? 0;
            if (req !== act) mismatches.push(`${r}: need ${req}, have ${act}`);
          }
          if (mismatches.length > 0) {
            const requiredStr = Object.entries(requiredCounts)
              .map(([r, c]) => `${c}× ${r}`).join(", ");
            throw new Error(
              `Role distribution for ${nonFac.length} players must be: ${requiredStr}. Mismatches: ${mismatches.join("; ")}.`,
            );
          }
        }

        // Pass #13: fixed role → power pairings. Clear any prior power cards
        // for each player, then issue exactly the one card their role maps to.
        for (const p of nonFac) {
          const existing = await ctx.db
            .query("power_cards")
            .withIndex("by_player_and_session", (q) =>
              q.eq("playerId", p._id).eq("sessionId", sessionId)
            )
            .collect();
          for (const card of existing) {
            await ctx.db.delete(card._id);
          }
          const role = p.ability ?? "";
          const powerId = ROLE_POWER_PAIRINGS[role];
          if (powerId) {
            await ctx.db.insert("power_cards", {
              sessionId,
              playerId: p._id,
              cardId: powerId,
              used: false,
            });
          }
        }

        // Initialize crisis counters. Pass #23: crisisCap is the MAX NUMBER
        // of crises per game (always 2), not the per-crisis damage scope
        // (which is computed live by getCrisisCap(playerCount) inside
        // runResolveDamage). The two were previously conflated, locking out
        // Crisis 2 in 3-player games where getCrisisCap(3) === 1.
        patch.crisisCap = MAX_CRISES_PER_GAME;
        patch.crisesDealt = 0;
        patch.crisisIndex = undefined;
        patch.currentCrisisDamagedPairs = [];
      }
    } else if (nextPhase === "map_ch3") {
      patch.buildSubPhase = undefined;
      patch.buildStage = undefined;
      patch.crisisCardId = undefined;
      patch.crisisTargetReason = undefined;
      patch.chatMutedUntil = undefined;

      // Pass #13: geometric-shape pattern. Generate polar-coord target slots,
      // assign one per non-fac player by _id order.
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const nonFac = allPlayers
        .filter((p) => !p.isFacilitator)
        .sort((a, b) => (a._id as string).localeCompare(b._id as string));
      // Pass #19: timer scales with player count so 3-person games don't
      // idle for 3 minutes while 6-person games have enough room to place.
      patch.subPhaseDeadline = Date.now() + ch3Seconds(nonFac.length) * 1000;
      const sc = SCENARIOS.find((s) => s.id === session.scenario);
      const theme = sc?.mapTheme ?? "water";
      const n = nonFac.length;
      const shape = CH3_SHAPE_BY_COUNT[n] ?? "polygon";
      const patternName = CH3_PATTERN_NAMES[theme]?.[n] ?? shape;
      const slots = generateCh3PatternSlots(n);
      const targetSlots = slots.map((s, i) => ({
        slotId: s.slotId,
        x: s.x,
        y: s.y,
        assignedTo: nonFac[i]?._id,
      }));
      for (let i = 0; i < nonFac.length; i++) {
        await ctx.db.patch(nonFac[i]._id, {
          ch3TargetSlotId: slots[i].slotId,
          ch3InTargetSlot: false,
          // Pass #16: Ch3 intro gate. Each player must dismiss Ch3IntroOverlay
          // before HR can interact with the Ch3 map.
          ch3Ready: false,
        });
      }
      patch.patternShape = shape;
      patch.patternName = patternName;
      patch.ch3TargetSlots = targetSlots;

      // Keep legacy ring pattern for any readers that still reference it.
      type PatternEntry = {
        key: string;
        aPlayerId: Id<"players">;
        bPlayerId: Id<"players">;
        connectionType: string;
      };
      const pattern: PatternEntry[] = [];
      const canonKey = (a: Id<"players">, b: Id<"players">) => {
        const sa = a as unknown as string;
        const sb = b as unknown as string;
        return sa < sb ? `${sa}_${sb}` : `${sb}_${sa}`;
      };
      const typeIds = ["bridge", "road", "pier", "dam"];
      if (n >= 2) {
        const count = n === 2 ? 1 : n;
        for (let i = 0; i < count; i++) {
          pattern.push({
            key: canonKey(nonFac[i]._id, nonFac[(i + 1) % n]._id),
            aPlayerId: nonFac[i]._id,
            bPlayerId: nonFac[(i + 1) % n]._id,
            connectionType: typeIds[i % typeIds.length],
          });
        }
      }
      patch.connectionPattern = pattern;
    } else {
      patch.buildSubPhase = undefined;
      patch.buildStage = undefined;
      patch.subPhaseDeadline = undefined;
    }

    await ctx.db.patch(sessionId, patch);
  },
});

// Player marks themselves ready after reading the pair-build intro explainer.
// Once every non-fac player is ready the session's clue-stage deadline gets
// anchored. Idempotent: safe to call more than once per player.
export const markPairBuildReady = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) return;
    if (!player.pairBuildReady) {
      await ctx.db.patch(playerId, { pairBuildReady: true });
    }
    const session = await ctx.db.get(player.sessionId);
    if (!session || session.phase !== "pair_build") return;
    if (session.subPhaseDeadline !== undefined) return;
    const others = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", player.sessionId))
      .collect();
    const nonFac = others.filter((p) => !p.isFacilitator);
    // Pass #17: only present players count. A ghost who never tapped ready
    // on the pair-build intro must not block the clue timer from starting.
    const now = Date.now();
    const presentNonFac = nonFac.filter((p) => isPresent(p, now));
    const allReady = presentNonFac.every((p) => p._id === playerId || p.pairBuildReady);
    if (!allReady) return;
    const round = (session.buildSubPhase ?? 1) - 1;
    const roundCfg = PAIR_BUILD_ROUNDS[round] ?? PAIR_BUILD_ROUNDS[0];
    await ctx.db.patch(player.sessionId, {
      subPhaseDeadline: Date.now() + roundCfg.clueSeconds * 1000,
    });
  },
});

// Player marks themselves ready after reading the Ch1 briefing overlay. When
// the last non-fac player taps ready, the placement timer
// (CH1_PLACEMENT_SECONDS) starts for the whole session. Idempotent: safe to
// call more than once per player.
export const markCh1Ready = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) return;
    if (!player.ch1Ready) {
      await ctx.db.patch(playerId, { ch1Ready: true });
    }
    const session = await ctx.db.get(player.sessionId);
    if (!session || session.phase !== "map_ch1") return;
    if (session.subPhaseDeadline !== undefined) return;
    const others = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", player.sessionId))
      .collect();
    const nonFac = others.filter((p) => !p.isFacilitator);
    // Pass #17: "all ready" only considers present players, so a ghost who
    // never got to tap ready does not block the timer start.
    const now = Date.now();
    const presentNonFac = nonFac.filter((p) => isPresent(p, now));
    const allReady = presentNonFac.every((p) => p._id === playerId || p.ch1Ready);
    if (!allReady) return;
    await ctx.db.patch(player.sessionId, {
      subPhaseDeadline: Date.now() + CH1_PLACEMENT_SECONDS * 1000,
    });
    // Pass #17: schedule server-side auto-place at the exact deadline so any
    // player whose district never reached the correct slot gets snapped there
    // automatically. Client gate already unblocks when ch1Expired, but this
    // guarantees ch1Placed=true for everyone so the fac's advance is unblocked
    // with no extra action from anyone.
    await ctx.scheduler.runAfter(
      CH1_PLACEMENT_SECONDS * 1000,
      internal.game.autoPlaceCh1StragglersOnTimeout,
      { sessionId: player.sessionId },
    );
  },
});

// Facilitator escape hatch for Ch1: force-start the placement timer
// (CH1_PLACEMENT_SECONDS) even if a player hasn't tapped ready. No-op if the
// timer is already running.
export const skipCh1ReadyGate = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.phase !== "map_ch1") return;
    if (session.subPhaseDeadline !== undefined) return;
    await ctx.db.patch(sessionId, {
      subPhaseDeadline: Date.now() + CH1_PLACEMENT_SECONDS * 1000,
    });
    // Pass #17: same auto-place scheduler as markCh1Ready — fires at the deadline.
    await ctx.scheduler.runAfter(
      CH1_PLACEMENT_SECONDS * 1000,
      internal.game.autoPlaceCh1StragglersOnTimeout,
      { sessionId },
    );
  },
});

// Pass #17: shared helper that snaps every non-fac player without ch1Placed
// (or placed in the wrong spot) to their targetZone slot's coordinates and
// flips ch1Placed=true. Idempotent: safe to call from the scheduled timeout,
// from a manual dev skip, or repeatedly.
async function runCh1AutoPlace(ctx: MutationCtx, sessionId: Id<"sessions">): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session || session.phase !== "map_ch1") return;
  const sc = SCENARIOS.find((s) => s.id === session.scenario);
  const theme = sc?.mapTheme ?? "water";
  const slotPool = CH1_SLOT_POSITIONS[theme] ?? CH1_SLOT_POSITIONS.water;
  const slotById: Record<string, typeof slotPool[number]> = {};
  for (const s of slotPool) slotById[s.id] = s;

  const allPlayers = await ctx.db
    .query("players")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  const nonFac = allPlayers.filter((p) => !p.isFacilitator);

  for (const p of nonFac) {
    if (p.ch1Placed) continue;
    const targetSlot = p.targetZone ? slotById[p.targetZone] : undefined;
    if (!targetSlot) continue; // guard: shouldn't happen after seedCh1Targets
    await ctx.db.patch(p._id, {
      x: targetSlot.x,
      y: targetSlot.y,
      slotId: targetSlot.id,
      ch1Placed: true,
    });
  }
}

// Pass #17: scheduled internal mutation fired at the Ch1 timer deadline. Only
// does work if the session is still in map_ch1 AND the timer has truly expired
// (guards against double-fire if someone re-schedules via skipCh1ReadyGate).
export const autoPlaceCh1StragglersOnTimeout = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.phase !== "map_ch1") return;
    // Deadline must be in the past. If someone reset the timer, skip.
    if (!session.subPhaseDeadline || session.subPhaseDeadline > Date.now()) return;
    await runCh1AutoPlace(ctx, sessionId);
  },
});

// Pass #17: public mutation for the [DEV] Skip Chapter 1 button. Snaps every
// straggler into place immediately so the fac can advance without waiting
// for the timer. Safe to call at any time during map_ch1.
export const autoPlaceCh1Stragglers = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await runCh1AutoPlace(ctx, sessionId);
  },
});

// Facilitator escape hatch: force-start the clue timer even if a player is
// idle on the intro screen. No-op if the timer is already running.
export const skipPairBuildReadyGate = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.phase !== "pair_build") return;
    if (session.subPhaseDeadline !== undefined) return;
    const round = (session.buildSubPhase ?? 1) - 1;
    const roundCfg = PAIR_BUILD_ROUNDS[round] ?? PAIR_BUILD_ROUNDS[0];
    await ctx.db.patch(sessionId, {
      subPhaseDeadline: Date.now() + roundCfg.clueSeconds * 1000,
    });
  },
});

// Set phase directly (useful for facilitator jumping to specific phase)
export const setPhase = mutation({
  args: { sessionId: v.id("sessions"), phase: v.string() },
  handler: async (ctx, { sessionId, phase }) => {
    await ctx.db.patch(sessionId, { phase });
  },
});
