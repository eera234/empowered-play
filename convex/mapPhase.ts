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

// Place a connection between two map slots
export const placeConnection = mutation({
  args: {
    sessionId: v.id("sessions"),
    fromSlotId: v.string(),
    toSlotId: v.string(),
    builtBy: v.id("players"),
  },
  handler: async (ctx, { sessionId, fromSlotId, toSlotId, builtBy }) => {
    // Check for duplicate connection (either direction)
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const duplicate = existing.find(
      (c) =>
        (c.fromSlotId === fromSlotId && c.toSlotId === toSlotId) ||
        (c.fromSlotId === toSlotId && c.toSlotId === fromSlotId)
    );
    if (duplicate) return { success: false, error: "Connection already exists." };

    await ctx.db.insert("connections", {
      sessionId,
      fromSlotId,
      toSlotId,
      builtBy,
    });

    return { success: true };
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

// Deal a crisis card to the session (facilitator action during map_ch2)
export const dealCrisisCard = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    await ctx.db.patch(sessionId, { crisisCardId });
  },
});

// Deal a power card to a specific player
export const dealPowerCard = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    cardId: v.string(),
  },
  handler: async (ctx, { sessionId, playerId, cardId }) => {
    await ctx.db.insert("power_cards", {
      sessionId,
      playerId,
      cardId,
      used: false,
    });
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
