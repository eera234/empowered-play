import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ══════════════════════════════
//  MAP PHASE — Queries
// ══════════════════════════════

export const getConnections = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getPowerCards = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("power_cards")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getPlayerPowerCards = query({
  args: { playerId: v.id("players"), sessionId: v.id("sessions") },
  handler: async (ctx, { playerId, sessionId }) => {
    return await ctx.db
      .query("power_cards")
      .withIndex("by_player_and_session", (q) =>
        q.eq("playerId", playerId).eq("sessionId", sessionId)
      )
      .collect();
  },
});

// ══════════════════════════════
//  MAP PHASE — Mutations
// ══════════════════════════════

// Place a connection between two districts. With free movement, `fromSlotId`
// and `toSlotId` now hold player _ids (stored as strings) instead of map-slot
// names — same column, new meaning. Returns the inserted connection id so the
// caller can immediately attach a LEGO bridge photo.
export const placeConnection = mutation({
  args: {
    sessionId: v.id("sessions"),
    fromSlotId: v.string(),
    toSlotId: v.string(),
    builtBy: v.id("players"),
  },
  handler: async (ctx, { sessionId, fromSlotId, toSlotId, builtBy }) => {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const duplicate = existing.find(
      (c) =>
        (c.fromSlotId === fromSlotId && c.toSlotId === toSlotId) ||
        (c.fromSlotId === toSlotId && c.toSlotId === fromSlotId)
    );
    if (duplicate) return { success: false as const, error: "Connection already exists." };

    const connectionId = await ctx.db.insert("connections", {
      sessionId,
      fromSlotId,
      toSlotId,
      builtBy,
    });

    return { success: true as const, connectionId };
  },
});

// Remove a connection (for rearranging during map_ch3)
export const removeConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, { connectionId }) => {
    await ctx.db.delete(connectionId);
  },
});

// Upload a photo of the physical connection piece
export const uploadConnectionPhoto = mutation({
  args: { connectionId: v.id("connections"), photoDataUrl: v.string() },
  handler: async (ctx, { connectionId, photoDataUrl }) => {
    await ctx.db.patch(connectionId, { photoDataUrl });
  },
});

// Deal a crisis card to the session (facilitator action during map_ch2).
// Also picks one random existing connection, saves its data on the session
// (so the Mender can restore it later), and deletes it from connections.
// If there are no connections yet, the crisis lands but nothing is removed.
export const dealCrisisCard = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const patch: Record<string, unknown> = {
      crisisCardId,
      menderUsed: false,
      lostConnection: undefined,
    };
    if (existing.length > 0) {
      const target = existing[Math.floor(Math.random() * existing.length)];
      patch.lostConnection = {
        fromSlotId: target.fromSlotId,
        toSlotId: target.toSlotId,
        builtBy: target.builtBy,
        photoDataUrl: target.photoDataUrl,
      };
      await ctx.db.delete(target._id);
    }
    await ctx.db.patch(sessionId, patch);
  },
});

// Mender ability: during map_ch3, the player with ability "mender" can tap
// REPAIR to reinstate the connection that the Ch2 crisis removed. One-time.
export const repairConnection = mutation({
  args: { sessionId: v.id("sessions"), playerId: v.id("players") },
  handler: async (ctx, { sessionId, playerId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return { success: false, error: "Session not found." };
    if (session.menderUsed) return { success: false, error: "Mender repair already used." };
    if (!session.lostConnection) return { success: false, error: "No connection to repair." };

    const player = await ctx.db.get(playerId);
    if (!player || player.ability !== "mender") {
      return { success: false, error: "Only the Mender can repair." };
    }

    await ctx.db.insert("connections", {
      sessionId,
      fromSlotId: session.lostConnection.fromSlotId,
      toSlotId: session.lostConnection.toSlotId,
      builtBy: session.lostConnection.builtBy,
      photoDataUrl: session.lostConnection.photoDataUrl,
    });
    await ctx.db.patch(sessionId, { menderUsed: true, lostConnection: undefined });
    return { success: true };
  },
});

// Deal a power card to a specific player. Refuses if the player already
// holds an unused card — each player gets at most one in play at a time.
export const dealPowerCard = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    cardId: v.string(),
  },
  handler: async (ctx, { sessionId, playerId, cardId }) => {
    const existing = await ctx.db
      .query("power_cards")
      .withIndex("by_player_and_session", (q) =>
        q.eq("playerId", playerId).eq("sessionId", sessionId)
      )
      .collect();
    if (existing.some((c) => !c.used)) {
      return { success: false, error: "Player already holds a power card." };
    }
    await ctx.db.insert("power_cards", {
      sessionId,
      playerId,
      cardId,
      used: false,
    });
    return { success: true };
  },
});

// Facilitator clears the active crisis banner for the whole session.
// Players can no longer dismiss it locally; this is the only way to hide it.
export const clearCrisis = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { crisisCardId: undefined });
  },
});

// Use a power card (one-time)
export const usePowerCard = mutation({
  args: { powerCardId: v.id("power_cards") },
  handler: async (ctx, { powerCardId }) => {
    const card = await ctx.db.get(powerCardId);
    if (!card || card.used) return { success: false, error: "Card already used or not found." };
    await ctx.db.patch(powerCardId, { used: true });
    return { success: true, cardId: card.cardId };
  },
});

// Advance from one map chapter to the next
export const advanceChapter = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;

    const chapterFlow: Record<string, string> = {
      map_ch1: "map_ch2",
      map_ch2: "map_ch3",
      map_ch3: "vote",
    };

    const nextPhase = chapterFlow[session.phase];
    if (nextPhase) {
      await ctx.db.patch(sessionId, { phase: nextPhase });
    }
  },
});

// Reveal hidden pattern in map_ch3
export const revealPattern = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { hiddenPatternRevealed: true });
  },
});
