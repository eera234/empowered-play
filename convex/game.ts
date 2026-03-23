import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { CARDS } from "../lib/constants";

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
      if (existing.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, error: "That name is already taken in this session." };
      }
      if (existing.filter((p) => !p.isFacilitator).length >= 10) {
        return { success: false, error: "Session is full (max 10 players)." };
      }
    }

    const playerId = await ctx.db.insert("players", {
      sessionId: session._id,
      name,
      cardSent: false,
      uploaded: false,
      isFacilitator,
    });

    return { success: true, sessionId: session._id, playerId, phase: session.phase };
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

    await ctx.db.patch(playerId, {
      districtName,
      photoDataUrl,
      uploaded: true,
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
