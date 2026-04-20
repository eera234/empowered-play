import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { CARDS, NEW_PHASES, PAIR_BUILD_ROUNDS } from "../lib/constants";

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

export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
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
      // If a player with same name exists, rejoin as them
      const sameNamePlayer = existing.find((p) => p.name.toLowerCase() === name.toLowerCase() && !p.isFacilitator);
      if (sameNamePlayer) {
        return { success: true, sessionId: session._id, playerId: sameNamePlayer._id, phase: session.phase, rejoined: true };
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

export const advancePhase = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    const phases = [
      "waiting",
      "card_reveal",
      "building",
      "uploading",
      "city_map",
      "debrief",
      "constraint_reveal",
      "complete",
    ];
    const idx = phases.indexOf(session.phase);
    if (idx < phases.length - 1) {
      await ctx.db.patch(sessionId, { phase: phases[idx + 1] });
    }
  },
});

export const uploadDistrict = mutation({
  args: {
    playerId: v.id("players"),
    districtName: v.string(),
    photoDataUrl: v.string(),
  },
  handler: async (ctx, { playerId, districtName, photoDataUrl }) => {
    const player = await ctx.db.get(playerId);
    if (!player) return;

    // Give a spread starting position (percentage) so cards don't stack
    const startX = 15 + Math.random() * 60; // 15-75%
    const startY = 15 + Math.random() * 55; // 15-70%

    await ctx.db.patch(playerId, {
      districtName,
      photoDataUrl,
      uploaded: true,
      x: Math.round(startX),
      y: Math.round(startY),
    });

    // Auto-advance phase: if all non-facilitator players have uploaded, move to city_map
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", player.sessionId))
      .collect();
    const nonFac = allPlayers.filter((p) => !p.isFacilitator);
    const allUploaded = nonFac.every((p) => p._id === playerId ? true : p.uploaded);

    if (allUploaded) {
      const session = await ctx.db.get(player.sessionId);
      if (session && (session.phase === "building" || session.phase === "uploading")) {
        await ctx.db.patch(player.sessionId, { phase: "city_map" });
      }
    } else {
      // At least one person uploaded — move from building to uploading if still in building
      const session = await ctx.db.get(player.sessionId);
      if (session && session.phase === "building") {
        await ctx.db.patch(player.sessionId, { phase: "uploading" });
      }
    }
  },
});

export const moveDistrict = mutation({
  args: { playerId: v.id("players"), x: v.number(), y: v.number(), slotId: v.optional(v.string()) },
  handler: async (ctx, { playerId, x, y, slotId }) => {
    await ctx.db.patch(playerId, { x, y, slotId });
  },
});

// Assign Ch1 target zones to every non-facilitator player who doesn't already
// have one. Called once by the frontend on entering map_ch1. Idempotent — if
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", args);
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

// Advance through the new phase flow: waiting → pair_build → guess → map_ch1 → map_ch2 → map_ch3 → vote → complete
export const advanceNewPhase = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    const idx = NEW_PHASES.indexOf(session.phase as typeof NEW_PHASES[number]);
    if (idx < 0 || idx >= NEW_PHASES.length - 1) return;

    const nextPhase = NEW_PHASES[idx + 1];
    const patch: Record<string, unknown> = { phase: nextPhase };

    // Entering pair_build: seed round 1, clue stage
    if (nextPhase === "pair_build") {
      patch.buildSubPhase = 1;
      patch.buildStage = "clue";
      patch.subPhaseDeadline = Date.now() + PAIR_BUILD_ROUNDS[0].clueSeconds * 1000;
    } else {
      // Clear any lingering pair-build state on exit
      patch.buildSubPhase = undefined;
      patch.buildStage = undefined;
      patch.subPhaseDeadline = undefined;
    }

    await ctx.db.patch(sessionId, patch);
  },
});

// Set phase directly (useful for facilitator jumping to specific phase)
export const setPhase = mutation({
  args: { sessionId: v.id("sessions"), phase: v.string() },
  handler: async (ctx, { sessionId, phase }) => {
    await ctx.db.patch(sessionId, { phase });
  },
});
