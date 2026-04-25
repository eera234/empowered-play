import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ══════════════════════════════
//  GUESS + VOTE PHASE : Queries
// ══════════════════════════════

export const getGuesses = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getPlayerGuesses = query({
  args: { guesserId: v.id("players"), sessionId: v.id("sessions") },
  handler: async (ctx, { guesserId, sessionId }) => {
    return await ctx.db
      .query("guesses")
      .withIndex("by_guesser_and_session", (q) =>
        q.eq("guesserId", guesserId).eq("sessionId", sessionId)
      )
      .collect();
  },
});

export const getVotes = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getVotesByCategory = query({
  args: { sessionId: v.id("sessions"), category: v.string() },
  handler: async (ctx, { sessionId, category }) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_session_and_category", (q) =>
        q.eq("sessionId", sessionId).eq("category", category)
      )
      .collect();
  },
});

// ══════════════════════════════
//  GUESS PHASE : Mutations
// ══════════════════════════════

// Submit a guess: player assigns a district name to an anonymous build photo
export const submitGuess = mutation({
  args: {
    sessionId: v.id("sessions"),
    guesserId: v.id("players"),
    targetPlayerId: v.id("players"),
    guessedName: v.string(),
  },
  handler: async (ctx, { sessionId, guesserId, targetPlayerId, guessedName }) => {
    // Check if this guesser already guessed for this target
    const existing = await ctx.db
      .query("guesses")
      .withIndex("by_guesser_and_session", (q) =>
        q.eq("guesserId", guesserId).eq("sessionId", sessionId)
      )
      .collect();

    const alreadyGuessed = existing.find((g) => g.targetPlayerId === targetPlayerId);
    if (alreadyGuessed) {
      // Update the guess
      await ctx.db.patch(alreadyGuessed._id, { guessedName });
      return { success: true, updated: true };
    }

    await ctx.db.insert("guesses", {
      sessionId,
      guesserId,
      targetPlayerId,
      guessedName,
    });

    return { success: true, updated: false };
  },
});

// ══════════════════════════════
//  VOTE PHASE : Mutations
// ══════════════════════════════

// Submit a vote in one category
export const submitVote = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    category: v.string(),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, { sessionId, playerId, category, targetPlayerId }) => {
    // Check if this player already voted in this category
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_session_and_category", (q) =>
        q.eq("sessionId", sessionId).eq("category", category)
      )
      .collect();

    const myVote = existing.find((v) => v.playerId === playerId);
    if (myVote) {
      // Update the vote
      await ctx.db.patch(myVote._id, { targetPlayerId });
      return { success: true, updated: true };
    }

    await ctx.db.insert("votes", {
      sessionId,
      playerId,
      category,
      targetPlayerId,
    });

    return { success: true, updated: false };
  },
});
