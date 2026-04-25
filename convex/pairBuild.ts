import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { PAIR_BUILD_ROUNDS } from "../lib/constants";

// ══════════════════════════════
//  PAIR BUILD PHASE : Queries
// ══════════════════════════════

// Get all clues sent in a session (or filter by architect)
export const getSentClues = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("sent_clues")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

// Get pair messages for a specific architect/builder pair
export const getPairMessages = query({
  args: { sessionId: v.id("sessions"), pairKey: v.string() },
  handler: async (ctx, { sessionId, pairKey }) => {
    return await ctx.db
      .query("pair_messages")
      .withIndex("by_session_and_pair", (q) =>
        q.eq("sessionId", sessionId).eq("pairKey", pairKey)
      )
      .collect();
  },
});

// Get build photos for a session
export const getBuildPhotos = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("build_photos")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

// Get build photos for a specific player
export const getPlayerBuildPhotos = query({
  args: { playerId: v.id("players"), sessionId: v.id("sessions") },
  handler: async (ctx, { playerId, sessionId }) => {
    return await ctx.db
      .query("build_photos")
      .withIndex("by_player_and_session", (q) =>
        q.eq("playerId", playerId).eq("sessionId", sessionId)
      )
      .collect();
  },
});

// ══════════════════════════════
//  PAIR BUILD PHASE : Mutations
// ══════════════════════════════

// Architect selects a clue card to send to their builder
export const selectClue = mutation({
  args: {
    sessionId: v.id("sessions"),
    architectId: v.id("players"),
    builderId: v.id("players"),
    clueCardId: v.string(),
    round: v.number(),
  },
  handler: async (ctx, { sessionId, architectId, builderId, clueCardId, round }) => {
    // Check this architect hasn't already sent a clue for this round
    const existing = await ctx.db
      .query("sent_clues")
      .withIndex("by_architect_and_session", (q) =>
        q.eq("architectId", architectId).eq("sessionId", sessionId)
      )
      .collect();

    const alreadySent = existing.find((c) => c.round === round);
    if (alreadySent) return { success: false, error: "Clue already sent for this round." };

    await ctx.db.insert("sent_clues", {
      sessionId,
      architectId,
      builderId,
      clueCardId,
      round,
    });

    // If everyone has now sent a clue for this round, auto-advance clue→build.
    const session = await ctx.db.get(sessionId);
    if (session && session.phase === "pair_build" && session.buildStage === "clue" && session.buildSubPhase === round) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      // Pass #17: only present architects count. A ghost architect who never
      // sent a clue must not block auto-advance to the build stage.
      const nowMs = Date.now();
      const architects = allPlayers.filter((p) =>
        !p.isFacilitator
          && p.architectFor
          && p.lastSeenAt != null
          && nowMs - p.lastSeenAt <= 8_000
      );
      const sentThisRound = await ctx.db
        .query("sent_clues")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const sentForRoundArchitects = new Set(sentThisRound.filter((c) => c.round === round).map((c) => c.architectId));
      const allSent = architects.every((a) => sentForRoundArchitects.has(a._id));
      if (allSent) {
        const roundCfg = PAIR_BUILD_ROUNDS[round - 1];
        await ctx.db.patch(sessionId, {
          buildStage: "build",
          subPhaseDeadline: Date.now() + roundCfg.buildSeconds * 1000,
        });
      }
    }

    return { success: true };
  },
});

// Send anonymous text message between architect/builder pair
export const sendPairMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    pairKey: v.string(),
    senderId: v.id("players"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.text.trim();
    if (!trimmed) throw new Error("Empty message");
    if (trimmed.length > 500) throw new Error("Message too long");
    await ctx.db.insert("pair_messages", { ...args, text: trimmed });
  },
});

// Upload a build photo (progress or final, up to 3 per player)
export const uploadBuildPhoto = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    round: v.number(),
    photoDataUrl: v.string(),
  },
  handler: async (ctx, { sessionId, playerId, round, photoDataUrl }) => {
    // Check if photo already exists for this round, replace if so
    const existing = await ctx.db
      .query("build_photos")
      .withIndex("by_player_and_session", (q) =>
        q.eq("playerId", playerId).eq("sessionId", sessionId)
      )
      .collect();

    const existingForRound = existing.find((p) => p.round === round);
    if (existingForRound) {
      await ctx.db.patch(existingForRound._id, { photoDataUrl });
    } else {
      await ctx.db.insert("build_photos", { sessionId, playerId, round, photoDataUrl });
    }

    // Also update the player's photoDataUrl to the latest photo (for map display later)
    await ctx.db.patch(playerId, { photoDataUrl, uploaded: true });

    // If everyone has now uploaded for this round during the build stage, auto-advance.
    const session = await ctx.db.get(sessionId);
    if (session && session.phase === "pair_build" && session.buildStage === "build" && session.buildSubPhase === round) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      // Pass #17: only present builders count. A ghost builder who never
      // uploaded must not block auto-advance to the next round / guess phase.
      const nowMs = Date.now();
      const builders = allPlayers.filter((p) =>
        !p.isFacilitator
          && p.builderFor
          && p.lastSeenAt != null
          && nowMs - p.lastSeenAt <= 8_000
      );
      const uploadedThisRound = await ctx.db
        .query("build_photos")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const uploadedPlayerIds = new Set(uploadedThisRound.filter((p) => p.round === round).map((p) => p.playerId));
      const allUploaded = builders.every((b) => uploadedPlayerIds.has(b._id));
      if (allUploaded) {
        if (round < 3) {
          const nextCfg = PAIR_BUILD_ROUNDS[round];
          await ctx.db.patch(sessionId, {
            buildSubPhase: round + 1,
            buildStage: "clue",
            subPhaseDeadline: Date.now() + nextCfg.clueSeconds * 1000,
          });
        } else {
          await ctx.db.patch(sessionId, {
            phase: "guess",
            buildSubPhase: undefined,
            buildStage: undefined,
            subPhaseDeadline: undefined,
          });
        }
      }
    }

    return { success: true };
  },
});

// Advance the sub-phase within pair_build.
// Each round has two stages: "clue" (architects pick a clue) → "build" (builders build + upload).
// Flow: R1 clue → R1 build → R2 clue → R2 build → R3 clue → R3 build → guess phase.
// Pass fromRound+fromStage to guard against races.
// Gate: unless force=true OR the deadline has already passed, the stage only
// advances if every expected architect/builder has submitted for this round.
// Timer-expiry auto-advance calls with force:true; HR manual skip calls without.
export const advanceSubPhase = mutation({
  args: {
    sessionId: v.id("sessions"),
    fromRound: v.optional(v.number()),
    fromStage: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionId, fromRound, fromStage, force }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.phase !== "pair_build") return { advanced: false };

    const currentRound = session.buildSubPhase ?? 1;
    const currentStage = session.buildStage ?? "clue";

    if (fromRound !== undefined && fromRound !== currentRound) return { advanced: false };
    if (fromStage !== undefined && fromStage !== currentStage) return { advanced: false };

    // Readiness gate: deadline expired or force-flag bypasses; otherwise every
    // expected architect clue / builder photo must be in for this round.
    // Undefined deadline means the ready-gate window hasn't ended yet; treat
    // as not-passed so the gate still applies. A real, past deadline is the
    // only reason to bypass the clue/photo count check.
    const deadlinePassed = session.subPhaseDeadline !== undefined
      && session.subPhaseDeadline <= Date.now();
    if (!force && !deadlinePassed) {
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const nonFac = allPlayers.filter(p => !p.isFacilitator);
      if (currentStage === "clue") {
        const architects = nonFac.filter(p => p.architectFor);
        const sent = await ctx.db
          .query("sent_clues")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .collect();
        const sentIds = new Set(sent.filter(c => c.round === currentRound).map(c => c.architectId));
        const missing = architects.filter(a => !sentIds.has(a._id));
        if (missing.length > 0) {
          return { advanced: false, reason: "CLUES_PENDING", missing: missing.map(m => m.name) };
        }
      } else if (currentStage === "build") {
        const builders = nonFac.filter(p => p.builderFor);
        const photos = await ctx.db
          .query("build_photos")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .collect();
        const photoIds = new Set(photos.filter(p => p.round === currentRound).map(p => p.playerId));
        const missing = builders.filter(b => !photoIds.has(b._id));
        if (missing.length > 0) {
          return { advanced: false, reason: "PHOTOS_PENDING", missing: missing.map(m => m.name) };
        }
      }
    }

    const roundCfg = PAIR_BUILD_ROUNDS[currentRound - 1];

    // clue → build (same round)
    if (currentStage === "clue") {
      await ctx.db.patch(sessionId, {
        buildStage: "build",
        subPhaseDeadline: Date.now() + roundCfg.buildSeconds * 1000,
      });
      return { advanced: true, nextRound: currentRound, nextStage: "build" };
    }

    // build → next round's clue, or → guess phase after round 3
    if (currentRound < 3) {
      const nextRound = currentRound + 1;
      const nextCfg = PAIR_BUILD_ROUNDS[nextRound - 1];
      await ctx.db.patch(sessionId, {
        buildSubPhase: nextRound,
        buildStage: "clue",
        subPhaseDeadline: Date.now() + nextCfg.clueSeconds * 1000,
      });
      return { advanced: true, nextRound, nextStage: "clue" };
    }

    // Round 3 build done → guess phase
    await ctx.db.patch(sessionId, {
      phase: "guess",
      buildSubPhase: undefined,
      buildStage: undefined,
      subPhaseDeadline: undefined,
    });
    return { advanced: true, nextPhase: "guess" };
  },
});

// Set the deadline for the current sub-phase (called when timer starts)
export const setSubPhaseDeadline = mutation({
  args: { sessionId: v.id("sessions"), deadline: v.number() },
  handler: async (ctx, { sessionId, deadline }) => {
    await ctx.db.patch(sessionId, { subPhaseDeadline: deadline });
  },
});
