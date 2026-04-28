import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { PER_CONNECTION_BUILD_SECONDS } from "../lib/constants";

// ══════════════════════════════
//  MAP PHASE : Queries
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

export const getConnectionRequests = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const now = Date.now();
    const all = await ctx.db
      .query("connection_requests")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return all.filter((r) => r.expiresAt > now);
  },
});

// ══════════════════════════════
//  MAP PHASE : Handshake (Ch3)
// ══════════════════════════════

const REQUEST_EXPIRY_MS = 30_000;

async function pruneExpiredRequests(
  ctx: { db: { query: typeof import("./_generated/server").query extends (...args: unknown[]) => infer R ? R extends { _: unknown } ? never : unknown : unknown } & Record<string, unknown> },
  _sessionId: Id<"sessions">,
): Promise<void> {
  // Placeholder - pruning handled inline in each mutation below.
  void ctx;
  void _sessionId;
}

// Player A taps their own district, then player B's district. This sends a
// connection request. Player B sees a toast and can ACCEPT or DECLINE.
// Rejects: self, duplicate pair connection, already-pending request.
// Pass #34: a player can only be in one active connection at a time.
// "Active" = participating in a connections row that is not yet built and
// not crisis-destroyed, OR the sender/recipient of a non-expired pending
// request. excludeRequestId lets the caller skip a specific pending request
// row (used by acceptConnection so the request being accepted does not
// itself count as making the parties busy).
async function isPlayerBusy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  sessionId: Id<"sessions">,
  pid: Id<"players">,
  conns: Array<{
    fromSlotId: string;
    toSlotId: string;
    built?: boolean;
    destroyedByCrisisIndex?: number;
  }>,
  excludeRequestId?: Id<"connection_requests">,
): Promise<boolean> {
  const pidStr = pid as unknown as string;
  const inActiveConn = conns.some((c) =>
    (c.fromSlotId === pidStr || c.toSlotId === pidStr)
    && c.built !== true
    && !c.destroyedByCrisisIndex
  );
  if (inActiveConn) return true;
  const reqs = await ctx.db
    .query("connection_requests")
    .withIndex("by_session", (q: { eq: (k: string, v: Id<"sessions">) => unknown }) => q.eq("sessionId", sessionId))
    .collect();
  const now = Date.now();
  return reqs.some((r: {
    _id: Id<"connection_requests">;
    fromPlayerId: Id<"players">;
    toPlayerId: Id<"players">;
    expiresAt: number;
  }) =>
    r._id !== excludeRequestId
    && (r.fromPlayerId === pid || r.toPlayerId === pid)
    && r.expiresAt > now
  );
}

export const requestConnection = mutation({
  args: {
    sessionId: v.id("sessions"),
    fromPlayerId: v.id("players"),
    toPlayerId: v.id("players"),
  },
  handler: async (ctx, { sessionId, fromPlayerId, toPlayerId }) => {
    if (fromPlayerId === toPlayerId) {
      return { success: false as const, error: "You cannot connect to yourself." };
    }

    const now = Date.now();

    // Prune expired rows for this session.
    const allReqs = await ctx.db
      .query("connection_requests")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const r of allReqs) {
      if (r.expiresAt <= now) await ctx.db.delete(r._id);
    }

    // Existing connection between pair?
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const duplicate = connections.find(
      (c) =>
        (c.fromSlotId === fromPlayerId && c.toSlotId === toPlayerId) ||
        (c.fromSlotId === toPlayerId && c.toSlotId === fromPlayerId),
    );
    if (duplicate) return { success: false as const, error: "That bridge already exists." };

    // Pending incoming from target? Auto-accept into a connection (mutual).
    // The mutual reciprocate path bypasses the busy check below — the
    // counterpart pending request makes both parties "busy" with each
    // other, which is exactly the connection we're about to open.
    const mutual = allReqs.find(
      (r) => r.fromPlayerId === toPlayerId && r.toPlayerId === fromPlayerId && r.expiresAt > now,
    );
    if (mutual) {
      await ctx.db.delete(mutual._id);
      // Pass #16: pick the type NOW (mutual-accept moment) so both parties
      // see it revealed simultaneously, never earlier.
      const sessionDoc = await ctx.db.get(sessionId);
      const theme = resolveMapTheme(sessionDoc?.scenario);
      const types = CONNECTION_TYPES_BY_THEME[theme] ?? CONNECTION_TYPES_BY_THEME.water;
      const connectionType = types[Math.floor(Math.random() * types.length)];
      const connectionId = await ctx.db.insert("connections", {
        sessionId,
        fromSlotId: toPlayerId as unknown as string,
        toSlotId: fromPlayerId as unknown as string,
        builtBy: toPlayerId,
        coBuiltBy: fromPlayerId,
        connectionType,
        typeRevealedAt: Date.now(),
        aReady: false,
        bReady: false,
        built: false,
      });
      return { success: true as const, mutual: true as const, connectionId };
    }

    // Existing outgoing request from this player to same target?
    const existing = allReqs.find(
      (r) => r.fromPlayerId === fromPlayerId && r.toPlayerId === toPlayerId && r.expiresAt > now,
    );
    if (existing) {
      // Refresh expiry.
      await ctx.db.patch(existing._id, { expiresAt: now + REQUEST_EXPIRY_MS });
      return { success: true as const, requestId: existing._id };
    }

    // Pass #34: enforce one active connection per player. Reject if either
    // side already has an in-progress connection or a pending request with
    // someone else.
    if (await isPlayerBusy(ctx, sessionId, fromPlayerId, connections)) {
      return { success: false as const, error: "You're already in a connection. Finish it before starting another." };
    }
    if (await isPlayerBusy(ctx, sessionId, toPlayerId, connections)) {
      return { success: false as const, error: "That player is already in a connection. Try someone else." };
    }

    // Pass #16: do NOT assign a connection type here. The type is revealed to
    // both players simultaneously at the accept moment (see acceptConnection
    // and the mutual path above).
    const requestId = await ctx.db.insert("connection_requests", {
      sessionId,
      fromPlayerId,
      toPlayerId,
      expiresAt: now + REQUEST_EXPIRY_MS,
    });
    return { success: true as const, requestId };
  },
});

// Theme map has to be inlined here because Convex actions/mutations can't
// import the large constants file freely. Keep in sync with lib/constants.ts.
const CONNECTION_TYPES_BY_THEME: Record<string, string[]> = {
  water:  ["bridge", "road", "pier", "dam"],
  space:  ["bridge", "road", "pier", "dam"],
  ocean:  ["bridge", "road", "pier", "dam"],
  forest: ["bridge", "road", "pier", "dam"],
};

function resolveMapTheme(scenarioId: string | undefined): string {
  // Scenario ids: "rising_tides" | "last_orbit" | "deep_current" | "roothold"
  if (!scenarioId) return "water";
  if (scenarioId === "last_orbit") return "space";
  if (scenarioId === "deep_current") return "ocean";
  if (scenarioId === "roothold") return "forest";
  return "water";
}

// Target player accepts. Connection row is inserted. Camera opens on BOTH
// devices via photoA / photoB on the connection. Connection is "complete"
// only when both photos are present.
export const acceptConnection = mutation({
  args: {
    requestId: v.id("connection_requests"),
    acceptedBy: v.id("players"),
  },
  handler: async (ctx, { requestId, acceptedBy }) => {
    const req = await ctx.db.get(requestId);
    if (!req) return { success: false as const, error: "Request already gone." };
    if (req.expiresAt <= Date.now()) {
      await ctx.db.delete(requestId);
      return { success: false as const, error: "Request expired." };
    }
    if (req.toPlayerId !== acceptedBy) {
      return { success: false as const, error: "Only the target can accept." };
    }
    // Pass #34: enforce one active connection per player at accept time too.
    // Race scenario: requester sent another request after this one and got
    // it accepted by someone else. Exclude THIS request from the check so
    // it doesn't count itself as making either party busy.
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_session", (q) => q.eq("sessionId", req.sessionId))
      .collect();
    if (await isPlayerBusy(ctx, req.sessionId, acceptedBy, connections, requestId)) {
      return { success: false as const, error: "You're already in a connection. Finish it before starting another." };
    }
    if (await isPlayerBusy(ctx, req.sessionId, req.fromPlayerId, connections, requestId)) {
      return { success: false as const, error: "They're already in another connection now." };
    }
    await ctx.db.delete(requestId);
    // Pass #16: pick the type at accept time so it's revealed to both
    // players simultaneously, never before. Fallback to the request's type
    // if an older row still carries one.
    const sessionDoc = await ctx.db.get(req.sessionId);
    const theme = resolveMapTheme(sessionDoc?.scenario);
    const types = CONNECTION_TYPES_BY_THEME[theme] ?? CONNECTION_TYPES_BY_THEME.water;
    const connectionType = req.connectionType ?? types[Math.floor(Math.random() * types.length)];
    const connectionId = await ctx.db.insert("connections", {
      sessionId: req.sessionId,
      fromSlotId: req.fromPlayerId as unknown as string,
      toSlotId: req.toPlayerId as unknown as string,
      builtBy: req.fromPlayerId,
      coBuiltBy: req.toPlayerId,
      connectionType,
      typeRevealedAt: Date.now(),
      aReady: false,
      bReady: false,
      built: false,
    });
    return { success: true as const, connectionId };
  },
});

// Pass #16: each side of an accepted connection taps "I am ready to build".
// When both sides have readied, buildStartedAt is stamped; clients derive the
// 90s deadline from it. Idempotent per side.
export const markConnectionReady = mutation({
  args: {
    connectionId: v.id("connections"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { connectionId, playerId }) => {
    const conn = await ctx.db.get(connectionId);
    if (!conn) return { success: false as const, error: "Connection not found." };
    if (conn.expiredAt) return { success: false as const, error: "Connection expired." };
    if (conn.built) return { success: false as const, error: "Already built." };

    const pid = playerId as unknown as string;
    const patch: Record<string, unknown> = {};
    if (conn.fromSlotId === pid) {
      if (conn.aReady) return { success: true as const, alreadyReady: true as const };
      patch.aReady = true;
    } else if (conn.toSlotId === pid) {
      if (conn.bReady) return { success: true as const, alreadyReady: true as const };
      patch.bReady = true;
    } else {
      return { success: false as const, error: "You are not on this bridge." };
    }

    await ctx.db.patch(connectionId, patch);

    // Re-read to check whether BOTH sides are now ready. If so, start the
    // 90s window atomically so both clients see the same buildStartedAt.
    const updated = await ctx.db.get(connectionId);
    if (updated && updated.aReady && updated.bReady && !updated.buildStartedAt) {
      await ctx.db.patch(connectionId, { buildStartedAt: Date.now() });
    }
    return { success: true as const };
  },
});

// Pass #16 / Pass #29: latent HR/facilitator force-skip plumbing. Pass #29
// stopped firing this from the client on timer-zero; the per-connection
// timer is now a UI signal only and uploads still go through past zero.
// Kept for a future force-skip flow. Idempotent: repeat calls are no-ops.
export const expireUnbuiltConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, { connectionId }) => {
    const conn = await ctx.db.get(connectionId);
    if (!conn) return { success: false as const };
    if (conn.built) return { success: false as const, alreadyBuilt: true as const };
    if (conn.expiredAt) return { success: true as const, alreadyExpired: true as const };
    if (!conn.buildStartedAt) return { success: false as const, error: "Build not started." };
    if (Date.now() < conn.buildStartedAt + PER_CONNECTION_BUILD_SECONDS * 1000) {
      return { success: false as const, error: "Still within build window." };
    }
    if (conn.photoA || conn.photoB) {
      // One side uploaded. Do not expire; other side still has a chance once
      // the HR re-extends, or we can handle partial builds separately later.
      return { success: false as const, error: "One side already uploaded." };
    }
    await ctx.db.patch(connectionId, { expiredAt: Date.now() });
    return { success: true as const };
  },
});

export const declineConnection = mutation({
  args: { requestId: v.id("connection_requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) return { success: true as const };
    await ctx.db.delete(requestId);
    return { success: true as const };
  },
});

// Upload one side of the bridge photo. Connection becomes "complete" when
// both photoA and photoB are populated. Side is chosen by matching player
// id to fromSlotId / toSlotId on the connection.
export const uploadConnectionPhotoSide = mutation({
  args: {
    connectionId: v.id("connections"),
    playerId: v.id("players"),
    photoDataUrl: v.string(),
  },
  handler: async (ctx, { connectionId, playerId, photoDataUrl }) => {
    const conn = await ctx.db.get(connectionId);
    if (!conn) return { success: false as const, error: "Connection not found." };

    // Pass #29: deadline expiry is a UI signal, not a server hard-stop.
    // Late uploads must succeed — the only remaining gate is the ready
    // precondition (post-Pass #16 rows must have buildStartedAt before a
    // photo can land). Legacy rows without typeRevealedAt bypass the gate
    // so old sessions still work.
    if (conn.typeRevealedAt && !conn.buildStartedAt) {
      return { success: false as const, error: "Both partners must tap ready before building." };
    }

    const pid = playerId as unknown as string;
    if (conn.fromSlotId === pid) {
      await ctx.db.patch(connectionId, { photoA: photoDataUrl });
    } else if (conn.toSlotId === pid) {
      await ctx.db.patch(connectionId, { photoB: photoDataUrl });
    } else {
      return { success: false as const, error: "You are not on this bridge." };
    }
    // Pass #13 + #16: once BOTH halves are uploaded, add the connection type
    // to each side's connectionsBuiltHistory (so Engineer's C2 rebuild picker
    // can filter it out) and flip built=true so the UI can render solid gold.
    const updated = await ctx.db.get(connectionId);
    if (updated?.photoA && updated?.photoB) {
      await ctx.db.patch(connectionId, { built: true });
      if (updated.connectionType) {
        const a = await ctx.db.get(updated.fromSlotId as Id<"players">);
        const b = await ctx.db.get(updated.toSlotId as Id<"players">);
        if (a) {
          const hist = a.connectionsBuiltHistory ?? [];
          if (!hist.includes(updated.connectionType)) {
            await ctx.db.patch(a._id, { connectionsBuiltHistory: [...hist, updated.connectionType] });
          }
        }
        if (b) {
          const hist = b.connectionsBuiltHistory ?? [];
          if (!hist.includes(updated.connectionType)) {
            await ctx.db.patch(b._id, { connectionsBuiltHistory: [...hist, updated.connectionType] });
          }
        }
      }
      // Pass #18: if every present non-fac player has satisfied their per-role
      // connection quota (Anchor=2, others=1), flip the sticky completion flag.
      await maybeFlipCh2ConnectionsComplete(ctx, updated.sessionId);
    }
    return { success: true as const };
  },
});

// Pass #18: helper. Sets session.ch2ConnectionsComplete=true the first time
// every present non-fac player has built their required connections. Never
// reverts. Safe to call from any mutation that creates a built connection.
async function maybeFlipCh2ConnectionsComplete(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session || session.ch2ConnectionsComplete) return;
  const all = await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect();
  const nowMs = Date.now();
  const presentNonFac = all.filter(p =>
    !p.isFacilitator
      && p.lastSeenAt != null
      && nowMs - p.lastSeenAt <= 8_000,
  );
  if (presentNonFac.length === 0) return;
  const conns = await ctx.db
    .query("connections")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect();
  const built = conns.filter(c => c.built === true);
  const everyoneMet = presentNonFac.every((p) => {
    const required = p.ability === "anchor" ? 2 : 1;
    const pid = p._id as unknown as string;
    const count = built.filter(c => c.fromSlotId === pid || c.toSlotId === pid).length;
    return count >= required;
  });
  if (everyoneMet) {
    await ctx.db.patch(sessionId, { ch2ConnectionsComplete: true });
  }
}

// Legacy single-photo upload (kept for older data paths).
export const uploadConnectionPhoto = mutation({
  args: { connectionId: v.id("connections"), photoDataUrl: v.string() },
  handler: async (ctx, { connectionId, photoDataUrl }) => {
    await ctx.db.patch(connectionId, { photoDataUrl });
  },
});

// ══════════════════════════════
//  MAP PHASE : Ch3 pattern
// ══════════════════════════════

// Build a ring pattern: every player connects to their next neighbour. With
// n players this produces n edges (for n >= 3) or 1 edge (for n = 2). All
// players participate. Odd counts work identically.
export const generateCh3Pattern = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const nonFac = players.filter((p) => !p.isFacilitator).sort((a, b) => (a._id as string).localeCompare(b._id as string));
    if (nonFac.length < 2) {
      await ctx.db.patch(sessionId, { connectionPattern: [] });
      return { success: true, count: 0 };
    }

    const session = await ctx.db.get(sessionId);
    const theme = resolveMapTheme(session?.scenario);
    const types = CONNECTION_TYPES_BY_THEME[theme] ?? CONNECTION_TYPES_BY_THEME.water;

    const pattern: { key: string; aPlayerId: Id<"players">; bPlayerId: Id<"players">; connectionType: string }[] = [];
    const n = nonFac.length;
    if (n === 2) {
      const a = nonFac[0]._id;
      const b = nonFac[1]._id;
      pattern.push({
        key: canonicalKey(a, b),
        aPlayerId: a,
        bPlayerId: b,
        connectionType: types[0],
      });
    } else {
      for (let i = 0; i < n; i++) {
        const a = nonFac[i]._id;
        const b = nonFac[(i + 1) % n]._id;
        pattern.push({
          key: canonicalKey(a, b),
          aPlayerId: a,
          bPlayerId: b,
          connectionType: types[i % types.length],
        });
      }
    }
    await ctx.db.patch(sessionId, { connectionPattern: pattern });
    return { success: true, count: pattern.length };
  },
});

function canonicalKey(a: Id<"players">, b: Id<"players">): string {
  const sa = a as unknown as string;
  const sb = b as unknown as string;
  return sa < sb ? `${sa}_${sb}` : `${sb}_${sa}`;
}

// ══════════════════════════════
//  MAP PHASE : Ch2 (crisis + repair)
// ══════════════════════════════

export const markCh2Ready = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.patch(playerId, { ch2Ready: true });
  },
});

// New Ch2 crisis model: crisis DAMAGES player districts. The affected player
// must re-upload a new photo of their district (representing a physical
// rebuild). chatMutedUntil still fires; cr_blackout is the "only mute, no
// damage" crisis. damageCount from the crisis card decides how many.
export const dealCrisisCard = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    const patch: Record<string, unknown> = {
      crisisCardId,
      menderUsed: false,
      lostConnection: undefined,
      scoutPreview: undefined,
      anchorProtected: undefined,
      crisisTargetReason: undefined,
      ch2State: "CH2_CRISIS_ACTIVE",
    };

    // Crisis definitions mirror CRISIS_CARDS in lib/constants.ts. Keep the
    // mute durations here in sync.
    const crisisMeta: Record<string, { damageCount: number; muteMs: number }> = {
      cr_flood:    { damageCount: 1, muteMs: 15_000 },
      cr_quake:    { damageCount: 2, muteMs: 15_000 },
      cr_blackout: { damageCount: 0, muteMs: 25_000 },
      cr_split:    { damageCount: 1, muteMs: 15_000 },
    };
    const meta = crisisMeta[crisisCardId] ?? { damageCount: 1, muteMs: 15_000 };

    if (meta.muteMs > 0) {
      patch.chatMutedUntil = Date.now() + meta.muteMs;
    }

    if (meta.damageCount === 0) {
      patch.crisisTargetReason = "Signal Lost: comms silenced for 25 seconds. Diplomat and Relay Call still speak.";
      await ctx.db.patch(sessionId, patch);
      return { success: true, damaged: [] as string[] };
    }

    // Pick victims: any present non-fac player who is not already damaged and
    // who is not shielded. Pass #17: ghost players are excluded so damage is
    // never "wasted" on someone who isn't at the table to rebuild.
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const nowMs = Date.now();
    const nonFac = players.filter((p) =>
      !p.isFacilitator && p.lastSeenAt != null && nowMs - p.lastSeenAt <= 8_000
    );

    const eligible = nonFac.filter((p) => !p.districtDamaged);
    if (eligible.length === 0) {
      patch.crisisTargetReason = "No districts left to damage. Everyone already rebuilding.";
      await ctx.db.patch(sessionId, patch);
      return { success: true, damaged: [] };
    }

    // Shuffle, then take damageCount.
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const damaged: Id<"players">[] = [];
    let shieldsAbsorbed = 0;
    for (const p of shuffled) {
      if (damaged.length >= meta.damageCount) break;
      if (p.shielded) {
        await ctx.db.patch(p._id, { shielded: false });
        shieldsAbsorbed++;
        continue;
      }
      await ctx.db.patch(p._id, {
        districtDamaged: true,
        damageReason: crisisCardId,
      });
      damaged.push(p._id);
    }

    const parts: string[] = [];
    if (damaged.length > 0) parts.push(`${damaged.length} district${damaged.length > 1 ? "s" : ""} damaged.`);
    if (shieldsAbsorbed > 0) parts.push(`${shieldsAbsorbed} shield${shieldsAbsorbed > 1 ? "s" : ""} absorbed the hit.`);
    patch.crisisTargetReason = parts.join(" ") || "Crisis landed.";

    await ctx.db.patch(sessionId, patch);
    return { success: true, damaged: damaged.map((id) => id as unknown as string) };
  },
});

// The damaged player re-uploads a photo of their rebuilt district. Clears
// their districtDamaged flag. When no damaged players remain, HR can clear
// the crisis.
export const repairDamagedDistrict = mutation({
  args: {
    playerId: v.id("players"),
    photoDataUrl: v.string(),
  },
  handler: async (ctx, { playerId, photoDataUrl }) => {
    const player = await ctx.db.get(playerId);
    if (!player) return { success: false as const, error: "Player not found." };
    if (!player.districtDamaged) return { success: false as const, error: "You are not damaged." };
    await ctx.db.patch(playerId, {
      photoDataUrl,
      districtDamaged: false,
      damageReason: undefined,
    });
    return { success: true as const };
  },
});

export const clearAnchorProtected = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { anchorProtected: undefined });
  },
});

export const previewCrisisForScout = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    await ctx.db.patch(sessionId, { scoutPreview: crisisCardId });
  },
});

// Mender ability (carries over from the old Ch2/Ch3 flow). In the new model
// it repairs ONE damaged district instead of a broken connection.
export const repairConnection = mutation({
  args: { sessionId: v.id("sessions"), playerId: v.id("players") },
  handler: async (ctx, { sessionId, playerId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return { success: false, error: "Session not found." };
    if (session.menderUsed) return { success: false, error: "Mender repair already used." };

    const player = await ctx.db.get(playerId);
    if (!player) return { success: false, error: "Player not found." };

    const isMender = player.ability === "mender";
    if (!isMender && player.isFacilitator) {
      const all = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const hasMender = all.some((p) => p.ability === "mender");
      if (hasMender) {
        return { success: false, error: "A Mender is in play. Let them repair." };
      }
    } else if (!isMender) {
      return { success: false, error: "Only the Mender can repair." };
    }

    // Find one damaged player and clear their damage without requiring a photo.
    const all = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const damaged = all.find((p) => p.districtDamaged);
    if (!damaged) return { success: false, error: "No damage to repair." };

    await ctx.db.patch(damaged._id, { districtDamaged: false, damageReason: undefined });
    await ctx.db.patch(sessionId, { menderUsed: true });
    return { success: true };
  },
});

const MIN_PLAYER_CARDS: Record<string, number> = {
  pw_double: 3,
};

export const dealPowerCard = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    cardId: v.string(),
  },
  handler: async (ctx, { sessionId, playerId, cardId }) => {
    const minNeeded = MIN_PLAYER_CARDS[cardId];
    if (minNeeded) {
      const all = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const nonFacCount = all.filter((p) => !p.isFacilitator).length;
      if (nonFacCount < minNeeded) {
        return { success: false, error: `Needs at least ${minNeeded} players.` };
      }
    }
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

// Auto-deal one power card to every non-fac player on Ch2 entry. Balanced
// distribution: shuffles the roster and takes first n. Called from
// advanceChapter when entering map_ch2.
export const autoDealCh2PowerCards = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const nonFac = players.filter((p) => !p.isFacilitator);
    const nonFacCount = nonFac.length;

    const roster: string[] = ["pw_shield", "pw_reveal", "pw_relay", "pw_foresight"];
    if (nonFacCount >= 3) roster.push("pw_double");

    // Shuffle roster for variety
    const shuffled = [...roster].sort(() => Math.random() - 0.5);

    for (let i = 0; i < nonFac.length; i++) {
      const p = nonFac[i];
      // Skip if they already hold an unused card
      const existing = await ctx.db
        .query("power_cards")
        .withIndex("by_player_and_session", (q) =>
          q.eq("playerId", p._id).eq("sessionId", sessionId)
        )
        .collect();
      if (existing.some((c) => !c.used)) continue;

      const cardId = shuffled[i % shuffled.length];
      await ctx.db.insert("power_cards", {
        sessionId,
        playerId: p._id,
        cardId,
        used: false,
      });
    }
    return { success: true as const };
  },
});

export const clearCrisis = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, {
      crisisCardId: undefined,
      crisisTargetReason: undefined,
      ch2State: "CH2_COMPLETE",
    });
  },
});

// ── Power card effects ────────────────────────────────────────

async function consumeCard(
  ctx: { db: { get: (id: Id<"power_cards">) => Promise<Doc<"power_cards"> | null>; patch: (id: Id<"power_cards">, patch: Partial<Doc<"power_cards">>) => Promise<void> } },
  powerCardId: Id<"power_cards">,
  expectedCardId: string,
  usedTarget: string | undefined,
): Promise<{ ok: true; card: Doc<"power_cards"> } | { ok: false; error: string }> {
  const card = await ctx.db.get(powerCardId);
  if (!card) return { ok: false, error: "Card not found." };
  if (card.used) return { ok: false, error: "Card already used." };
  if (card.cardId !== expectedCardId) return { ok: false, error: "Wrong card type." };
  await ctx.db.patch(powerCardId, { used: true, usedTarget });
  return { ok: true, card };
}

export const useShieldPower = mutation({
  args: {
    powerCardId: v.id("power_cards"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, { powerCardId, targetPlayerId }) => {
    const target = await ctx.db.get(targetPlayerId);
    if (!target) return { success: false, error: "Player not found." };
    const consumed = await consumeCard(ctx, powerCardId, "pw_shield", target.name);
    if (!consumed.ok) return { success: false, error: consumed.error };
    await ctx.db.patch(targetPlayerId, { shielded: true });
    return { success: true };
  },
});

// Crisis Override (redesigned): only playable during an active crisis.
// Cancels the crisis banner AND clears district damage. Does NOT unmute chat
// (mute still has to tick down naturally).
export const useRevealPower = mutation({
  args: { powerCardId: v.id("power_cards") },
  handler: async (ctx, { powerCardId }) => {
    const card = await ctx.db.get(powerCardId);
    if (!card) return { success: false, error: "Card not found." };
    const session = await ctx.db.get(card.sessionId);
    if (!session) return { success: false, error: "Session not found." };
    if (!session.crisisCardId) {
      return { success: false, error: "No active crisis. Save it for when one hits." };
    }
    const consumed = await consumeCard(ctx, powerCardId, "pw_reveal", "crisis-override");
    if (!consumed.ok) return { success: false, error: consumed.error };

    // Undo damage from this crisis.
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", card.sessionId))
      .collect();
    for (const p of players) {
      if (p.districtDamaged && p.damageReason === session.crisisCardId) {
        await ctx.db.patch(p._id, { districtDamaged: false, damageReason: undefined });
      }
    }
    // Legacy: if an old session has a lostConnection, restore it.
    if (session.lostConnection) {
      await ctx.db.insert("connections", {
        sessionId: card.sessionId,
        fromSlotId: session.lostConnection.fromSlotId,
        toSlotId: session.lostConnection.toSlotId,
        builtBy: session.lostConnection.builtBy,
        photoDataUrl: session.lostConnection.photoDataUrl,
      });
    }
    await ctx.db.patch(card.sessionId, {
      crisisCardId: undefined,
      lostConnection: undefined,
      crisisTargetReason: undefined,
      ch2State: "CH2_COMPLETE",
    });
    return { success: true };
  },
});

// Double Link: next connection this player joins (as A or B) is marked bonus.
export const useDoubleLinkPower = mutation({
  args: { powerCardId: v.id("power_cards") },
  handler: async (ctx, { powerCardId }) => {
    const card = await ctx.db.get(powerCardId);
    if (!card) return { success: false, error: "Card not found." };
    const consumed = await consumeCard(ctx, powerCardId, "pw_double", "next-connection");
    if (!consumed.ok) return { success: false, error: consumed.error };
    await ctx.db.patch(card.sessionId, { doubleLinkFor: card.playerId });
    return { success: true };
  },
});

// Relay Call: post one message to team chat even during mute.
export const useRelayPower = mutation({
  args: {
    powerCardId: v.id("power_cards"),
    text: v.string(),
  },
  handler: async (ctx, { powerCardId, text }) => {
    const card = await ctx.db.get(powerCardId);
    if (!card) return { success: false, error: "Card not found." };
    const player = await ctx.db.get(card.playerId);
    if (!player) return { success: false, error: "Player not found." };
    const consumed = await consumeCard(ctx, powerCardId, "pw_relay", text.slice(0, 40));
    if (!consumed.ok) return { success: false, error: consumed.error };
    await ctx.db.insert("messages", {
      sessionId: card.sessionId,
      sender: `${player.name} (RELAY)`,
      text,
      isFacilitator: false,
    });
    return { success: true };
  },
});

// Foresight: privately see the next crisis before it fires. Sets
// pwRevealPreview so the client can gate a private card on it.
export const useForesightPower = mutation({
  args: { powerCardId: v.id("power_cards") },
  handler: async (ctx, { powerCardId }) => {
    const card = await ctx.db.get(powerCardId);
    if (!card) return { success: false, error: "Card not found." };
    const session = await ctx.db.get(card.sessionId);
    if (!session) return { success: false, error: "Session not found." };

    const consumed = await consumeCard(ctx, powerCardId, "pw_foresight", "foresight");
    if (!consumed.ok) return { success: false, error: consumed.error };

    // If a crisis is already active, reveal it. Otherwise pick a random one
    // from the roster as the "next" preview.
    const crisisId = session.crisisCardId ?? ["cr_flood", "cr_quake", "cr_blackout", "cr_split"][Math.floor(Math.random() * 4)];
    await ctx.db.patch(card.sessionId, {
      pwRevealPreview: { forPlayerId: card.playerId, crisisCardId: crisisId },
    });
    return { success: true };
  },
});

// Legacy fallthroughs — kept so old code paths don't throw during migration.
// pw_swap and pw_move are removed from the roster but mutations stay as no-ops.
export const useSwapPower = mutation({
  args: {
    powerCardId: v.id("power_cards"),
    playerAId: v.id("players"),
    playerBId: v.id("players"),
  },
  handler: async () => {
    return { success: false, error: "Trade Places has been removed from the deck." };
  },
});
export const useMovePower = mutation({
  args: {
    powerCardId: v.id("power_cards"),
    x: v.number(),
    y: v.number(),
  },
  handler: async () => {
    return { success: false, error: "Relocate has been removed from the deck." };
  },
});

// ══════════════════════════════
//  Chapter advancement
// ══════════════════════════════

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
    if (!nextPhase) return;

    await ctx.db.patch(sessionId, { phase: nextPhase });

    // Entry hooks per chapter.
    if (nextPhase === "map_ch2") {
      // Reset per-player ch2Ready, deal power cards, set state.
      const players = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      for (const p of players) {
        if (!p.isFacilitator) {
          await ctx.db.patch(p._id, { ch2Ready: false, districtDamaged: false, damageReason: undefined });
        }
      }
      await ctx.db.patch(sessionId, { ch2State: "CH2_INTRO", crisisCardId: undefined });
    } else if (nextPhase === "map_ch3") {
      // Clear any residual Ch2 state and auto-generate the pattern.
      await ctx.db.patch(sessionId, {
        crisisCardId: undefined,
        crisisTargetReason: undefined,
        chatMutedUntil: undefined,
      });
      // Inline pattern generation (mirrors generateCh3Pattern).
      const players = await ctx.db
        .query("players")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect();
      const nonFac = players.filter((p) => !p.isFacilitator).sort((a, b) => (a._id as string).localeCompare(b._id as string));
      const theme = resolveMapTheme(session.scenario);
      const types = CONNECTION_TYPES_BY_THEME[theme] ?? CONNECTION_TYPES_BY_THEME.water;
      const pattern: { key: string; aPlayerId: Id<"players">; bPlayerId: Id<"players">; connectionType: string }[] = [];
      const n = nonFac.length;
      if (n === 2) {
        pattern.push({
          key: canonicalKey(nonFac[0]._id, nonFac[1]._id),
          aPlayerId: nonFac[0]._id,
          bPlayerId: nonFac[1]._id,
          connectionType: types[0],
        });
      } else if (n >= 3) {
        for (let i = 0; i < n; i++) {
          const a = nonFac[i]._id;
          const b = nonFac[(i + 1) % n]._id;
          pattern.push({
            key: canonicalKey(a, b),
            aPlayerId: a,
            bPlayerId: b,
            connectionType: types[i % types.length],
          });
        }
      }
      await ctx.db.patch(sessionId, { connectionPattern: pattern });
    }
  },
});

// Reveal hidden pattern in map_ch3 (kept for visual reveal animation).
export const revealPattern = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { hiddenPatternRevealed: true });
  },
});

// Legacy single-shot placeConnection (kept for compatibility with existing UI
// that still calls it directly). Will be superseded by the handshake flow in
// Ch3 but leaving active so no existing code path 500s.
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
        (c.fromSlotId === toSlotId && c.toSlotId === fromSlotId),
    );
    if (duplicate) return { success: false as const, error: "Connection already exists." };

    const session = await ctx.db.get(sessionId);
    const bonus = session?.doubleLinkFor === builtBy ? true : undefined;
    const builder = await ctx.db.get(builtBy);
    const shielded = builder?.ability === "engineer" ? true : undefined;

    const connectionId = await ctx.db.insert("connections", {
      sessionId,
      fromSlotId,
      toSlotId,
      builtBy,
      ...(bonus ? { bonus: true } : {}),
      ...(shielded ? { shielded: true } : {}),
    });
    if (bonus) await ctx.db.patch(sessionId, { doubleLinkFor: undefined });

    return { success: true as const, connectionId };
  },
});

export const removeConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, { connectionId }) => {
    await ctx.db.delete(connectionId);
  },
});

// ═════════════════════════════════════════════════════════════
// Pass #13: Ch2/Ch3 redesign
// ═════════════════════════════════════════════════════════════
// This block adds the new role-action and crisis-allocation logic.
// Older mutations above are retained for compatibility; Pass #13 UI
// calls only the mutations below.

import {
  ROLE_POWER_PAIRINGS,
  ROLE_COUNTS_BY_PLAYER_COUNT,
  getCrisisCap as getCrisisCapV13,
  SCENARIO_CRISES,
  getScenarioCrises,
  CH3_SHAPE_BY_COUNT,
  CH3_PATTERN_NAMES,
  generateCh3PatternSlots,
  CONNECTION_TYPES,
  DIPLOMAT_UNMUTE_TOTAL_MS,
  DIPLOMAT_UNMUTE_CHAOS_END_MS,
  DIPLOMAT_UNMUTE_MAX_REMUTES_PER_PLAYER,
  CRISIS_CARDS,
} from "../lib/constants";

function pickRandomFromArray<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Canonical undirected pair key.
function pairKey(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

// Scenario → theme (same mapping used for connection types).
function themeForScenario(scenarioId: string): string {
  if (scenarioId === "rising_tides") return "water";
  if (scenarioId === "last_orbit")   return "space";
  if (scenarioId === "deep_current") return "ocean";
  if (scenarioId === "roothold")     return "forest";
  return "water";
}

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

export const getCitizenVotes = query({
  args: { sessionId: v.id("sessions"), crisisIndex: v.number() },
  handler: async (ctx, { sessionId, crisisIndex }) => {
    return await ctx.db
      .query("citizen_votes")
      .withIndex("by_session_and_crisis", (q) =>
        q.eq("sessionId", sessionId).eq("crisisIndex", crisisIndex))
      .collect();
  },
});

export const getDiplomatMuteState = query({
  args: { sessionId: v.id("sessions"), crisisIndex: v.number() },
  handler: async (ctx, { sessionId, crisisIndex }) => {
    return await ctx.db
      .query("diplomat_mute_state")
      .withIndex("by_session_and_crisis", (q) =>
        q.eq("sessionId", sessionId).eq("crisisIndex", crisisIndex))
      .collect();
  },
});

// ──────────────────────────────────────────────────────────────
// Scout actions
// ──────────────────────────────────────────────────────────────

// Crisis 1: Scout picks DM-one-player vs public-count-post.
export const scoutChooseC1 = mutation({
  args: {
    sessionId: v.id("sessions"),
    scoutId: v.id("players"),
    mode: v.string(),                // "dm" | "public"
    targetPlayerId: v.optional(v.id("players")),  // required if mode === "dm"
  },
  handler: async (ctx, { sessionId, scoutId, mode, targetPlayerId }) => {
    const scout = await ctx.db.get(scoutId);
    if (!scout || scout.ability !== "scout") throw new Error("Not the Scout.");
    const session = await ctx.db.get(sessionId);
    if (!session || session.crisisIndex !== 1) throw new Error("Not in Crisis 1.");
    if (mode !== "dm" && mode !== "public") throw new Error("Invalid mode.");
    if (mode === "dm" && !targetPlayerId) throw new Error("DM mode needs a target.");

    await ctx.db.patch(sessionId, {
      scoutC1Choice: mode,
      scoutC1Target: mode === "dm" ? targetPlayerId : undefined,
    });

    // Post message: either DM-like team chat ping or public count.
    if (mode === "public") {
      const damagedCount = (session.damagePreview?.length ?? session.currentCrisisDamagedPairs?.length ?? 0);
      await ctx.db.insert("messages", {
        sessionId,
        sender: "SCOUT",
        text: `${damagedCount} connection${damagedCount === 1 ? "" : "s"} will break this crisis. Prepare.`,
        isFacilitator: false,
      });
    } else if (targetPlayerId) {
      // Pass #30: private warning. Set a session field that drives a
      // fullscreen modal for the target only, instead of inserting into
      // global chat (which every player can read).
      const crisisCard = CRISIS_CARDS.find(c => c.id === (session.crisisCardId ?? ""));
      await ctx.db.patch(sessionId, {
        scoutWarning: {
          targetPlayerId,
          text: `Your district is targeted by ${crisisCard?.title ?? "the next crisis"}. Brace.`,
          at: Date.now(),
        },
      });
    }

    // Mark scout's contribution done
    await ctx.db.patch(scoutId, { crisisContribution: "done" });

    // Pass #14: try to lock in damage if all pre-resolution actions are done.
    await maybeResolveCrisis(ctx, sessionId);
  },
});

// Pass #30: target of a Scout DM acknowledges the private warning, clearing
// the modal. No-op if the warning is for a different player or already cleared.
export const acknowledgeScoutWarning = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { sessionId, playerId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.scoutWarning) return;
    if (session.scoutWarning.targetPlayerId !== playerId) return;
    await ctx.db.patch(sessionId, { scoutWarning: undefined });
  },
});

// Crisis 2: Scout picks REVEAL (post Ch3 pattern, district breaks) or PROTECT
// (district safe, no reveal).
export const scoutChooseC2 = mutation({
  args: {
    sessionId: v.id("sessions"),
    scoutId: v.id("players"),
    choice: v.string(),  // "reveal" | "protect"
  },
  handler: async (ctx, { sessionId, scoutId, choice }) => {
    const scout = await ctx.db.get(scoutId);
    if (!scout || scout.ability !== "scout") throw new Error("Not the Scout.");
    const session = await ctx.db.get(sessionId);
    if (!session || session.crisisIndex !== 2) throw new Error("Not in Crisis 2.");
    if (choice !== "reveal" && choice !== "protect") throw new Error("Invalid choice.");

    await ctx.db.patch(sessionId, { scoutC2Choice: choice });

    if (choice === "reveal") {
      const n = (await ctx.db
        .query("players")
        .withIndex("by_session", q => q.eq("sessionId", sessionId))
        .collect()).filter(p => !p.isFacilitator).length;
      const shape = CH3_SHAPE_BY_COUNT[n] ?? "polygon";
      const theme = themeForScenario(session.scenario);
      const name = CH3_PATTERN_NAMES[theme]?.[n] ?? shape;
      await ctx.db.insert("messages", {
        sessionId,
        sender: "SCOUT",
        text: `Chapter 3 pattern revealed: ${name} (${shape} shape).`,
        isFacilitator: false,
      });
    }

    await ctx.db.patch(scoutId, { crisisContribution: "done" });

    // Pass #14: trigger resolution if ready.
    await maybeResolveCrisis(ctx, sessionId);
  },
});

// ──────────────────────────────────────────────────────────────
// Diplomat unmute mini-game
// ──────────────────────────────────────────────────────────────

// (initDiplomatMute is inlined in dealCrisisV13 below to satisfy Convex's
// per-mutation ctx typing, which isn't compatible with a factored helper.)

// Diplomat taps an individual muted player to unmute them.
export const diplomatTapUnmute = mutation({
  args: {
    sessionId: v.id("sessions"),
    diplomatId: v.id("players"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, { sessionId, diplomatId, targetPlayerId }) => {
    const diplo = await ctx.db.get(diplomatId);
    if (!diplo || diplo.ability !== "diplomat") throw new Error("Not the Diplomat.");
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex) throw new Error("No crisis active.");

    const row = (await ctx.db
      .query("diplomat_mute_state")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
      .collect())
      .find(r => r.playerId === targetPlayerId);
    if (!row) throw new Error("Target not in mute state.");
    if (!row.muted) return; // already unmuted

    await ctx.db.patch(row._id, { muted: false });

    // If all unmuted, mark Diplomat's action done.
    const all = await ctx.db
      .query("diplomat_mute_state")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
      .collect();
    if (all.every(r => !r.muted)) {
      await ctx.db.patch(sessionId, { diplomatUnmuteDone: true });
      await ctx.db.patch(diplomatId, { crisisContribution: "done" });
      // Pass #18: late contribution — check if crisis can auto-clear now.
      await autoClearCrisisIfDone(ctx, sessionId);
    }
  },
});

// Called by client ticking every ~2s to simulate chaos re-mutes during 0-12s.
// Server-side: checks timer, may re-mute one random unmuted player if within
// chaos window and under per-player re-mute cap. Also enforces the 15s
// hard-stop: after DIPLOMAT_UNMUTE_TOTAL_MS the mini-game ends regardless.
export const diplomatChaosTick = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex || !session.diplomatUnmuteStartedAt) return;
    if (session.diplomatUnmuteDone) return;
    const elapsed = Date.now() - session.diplomatUnmuteStartedAt;

    // Pass #14: hard 15s stop. Mark diplomat's contribution done so crisis
    // clearance isn't blocked by a stalled Diplomat. Remaining muted players
    // are auto-unmuted so chat can resume.
    if (elapsed >= DIPLOMAT_UNMUTE_TOTAL_MS) {
      const rows = await ctx.db
        .query("diplomat_mute_state")
        .withIndex("by_session_and_crisis", q =>
          q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
        .collect();
      for (const r of rows) {
        if (r.muted) await ctx.db.patch(r._id, { muted: false });
      }
      const players = (await ctx.db
        .query("players")
        .withIndex("by_session", q => q.eq("sessionId", sessionId))
        .collect()).filter(p => !p.isFacilitator);
      const diplomat = players.find(p => p.ability === "diplomat");
      if (diplomat && diplomat.crisisContribution !== "done") {
        await ctx.db.patch(diplomat._id, { crisisContribution: "done" });
      }
      await ctx.db.patch(sessionId, { diplomatUnmuteDone: true });
      return;
    }

    if (elapsed > DIPLOMAT_UNMUTE_CHAOS_END_MS) return;
    // random 40% chance to re-mute per tick
    if (Math.random() > 0.4) return;
    const rows = await ctx.db
      .query("diplomat_mute_state")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
      .collect();
    const eligible = rows.filter(r => !r.muted && r.reMuteCount < DIPLOMAT_UNMUTE_MAX_REMUTES_PER_PLAYER);
    if (!eligible.length) return;
    const pick = pickRandomFromArray(eligible);
    if (!pick) return;
    await ctx.db.patch(pick._id, { muted: true, reMuteCount: pick.reMuteCount + 1 });
  },
});

// ──────────────────────────────────────────────────────────────
// Engineer actions
// ──────────────────────────────────────────────────────────────

// Each crisis: pick new connection type for each destroyed dyad. Fires
// post-resolution. Options filtered to types neither player has built.
export const engineerPickRebuildType = mutation({
  args: {
    sessionId: v.id("sessions"),
    engineerId: v.id("players"),
    dyadIndex: v.number(),   // index into currentCrisisDamagedPairs
    newType: v.string(),
  },
  handler: async (ctx, { sessionId, engineerId, dyadIndex, newType }) => {
    const eng = await ctx.db.get(engineerId);
    if (!eng || eng.ability !== "engineer") throw new Error("Not the Engineer.");
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex) throw new Error("No crisis active.");
    if (!session.damageResolved) throw new Error("Damage has not been resolved yet.");
    const pairs = session.currentCrisisDamagedPairs ?? [];
    if (dyadIndex < 0 || dyadIndex >= pairs.length) throw new Error("Bad dyad index.");

    // Validate newType is in scenario's type list and neither player has built it.
    const theme = themeForScenario(session.scenario);
    const types = (CONNECTION_TYPES[theme] ?? []).map(t => t.id);
    if (!types.includes(newType)) throw new Error("Invalid connection type.");

    const pair = pairs[dyadIndex];
    const a = await ctx.db.get(pair.aPlayerId);
    const b = await ctx.db.get(pair.bPlayerId);
    const aBuilt = a?.connectionsBuiltHistory ?? [];
    const bBuilt = b?.connectionsBuiltHistory ?? [];
    if (aBuilt.includes(newType) || bBuilt.includes(newType)) {
      throw new Error("Target already built that type.");
    }
    if (pair.originalType === newType) {
      throw new Error("Must differ from original.");
    }

    // Patch the pair with newType.
    const updated = pairs.map((p, i) => i === dyadIndex ? { ...p, newType } : p);
    await ctx.db.patch(sessionId, { currentCrisisDamagedPairs: updated });

    // If all dyads have newType picked, Engineer's action is done.
    if (updated.every(p => p.newType)) {
      await ctx.db.patch(engineerId, { crisisContribution: "done" });
      await autoClearCrisisIfDone(ctx, sessionId);
    }
  },
});

// ──────────────────────────────────────────────────────────────
// Mender action
// ──────────────────────────────────────────────────────────────

export const menderRestore = mutation({
  args: {
    sessionId: v.id("sessions"),
    menderId: v.id("players"),
    pairIndex: v.number(),
  },
  handler: async (ctx, { sessionId, menderId, pairIndex }) => {
    const mender = await ctx.db.get(menderId);
    if (!mender || mender.ability !== "mender") throw new Error("Not the Mender.");
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex) throw new Error("No crisis active.");
    if (!session.damageResolved) throw new Error("Damage has not been resolved yet. Wait for pre-resolution actions.");
    const pairs = session.currentCrisisDamagedPairs ?? [];
    if (pairIndex < 0 || pairIndex >= pairs.length) throw new Error("Bad index.");
    const pair = pairs[pairIndex];
    if (pair.aPlayerId === menderId || pair.bPlayerId === menderId) {
      throw new Error("Mender cannot heal self.");
    }

    // Restore: remove from damaged pairs and clear districtDamaged on both.
    const remaining = pairs.filter((_, i) => i !== pairIndex);
    await ctx.db.patch(sessionId, {
      currentCrisisDamagedPairs: remaining,
      menderHealed: pair.aPlayerId, // record one of the healed for audit
    });
    await ctx.db.patch(pair.aPlayerId, { districtDamaged: false, damageReason: undefined });
    await ctx.db.patch(pair.bPlayerId, { districtDamaged: false, damageReason: undefined });

    // Clear the destroyed flag on the matching connection row so the pair's
    // rebuild prompt disappears and clearance detection stops waiting.
    const conns = await ctx.db
      .query("connections")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect();
    const healedConn = conns.find(c =>
      c.destroyedByCrisisIndex === session.crisisIndex &&
      !c.rebuildValidatedByHR &&
      ((c.fromSlotId === pair.aPlayerId && c.toSlotId === pair.bPlayerId) ||
       (c.fromSlotId === pair.bPlayerId && c.toSlotId === pair.aPlayerId))
    );
    if (healedConn) {
      await ctx.db.patch(healedConn._id, {
        destroyedByCrisisIndex: 0,
        rebuildValidatedByHR: true,
        rebuildPhotoA: undefined,
        rebuildPhotoB: undefined,
        damagedSidePlayerId: undefined,
      });
    }

    await ctx.db.patch(menderId, { crisisContribution: "done" });
    // Pass #18: mender heal may have cleared all rebuild requirements.
    await autoClearCrisisIfDone(ctx, sessionId);
  },
});

// ──────────────────────────────────────────────────────────────
// Anchor action
// ──────────────────────────────────────────────────────────────

export const anchorPickImmune = mutation({
  args: {
    sessionId: v.id("sessions"),
    anchorId: v.id("players"),
    targetPlayerId: v.id("players"),  // one of anchor's connected players
  },
  handler: async (ctx, { sessionId, anchorId, targetPlayerId }) => {
    const anchor = await ctx.db.get(anchorId);
    if (!anchor || anchor.ability !== "anchor") throw new Error("Not the Anchor.");

    // Verify target is actually connected to anchor.
    const conns = (await ctx.db
      .query("connections")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect())
      .filter(c =>
        (c.fromSlotId === anchorId && c.toSlotId === targetPlayerId) ||
        (c.toSlotId === anchorId && c.fromSlotId === targetPlayerId));
    if (!conns.length) throw new Error("Target is not connected to Anchor.");

    await ctx.db.patch(sessionId, { anchorImmuneTarget: targetPlayerId });
    await ctx.db.patch(anchorId, { crisisContribution: "done" });

    // Pass #14: try to lock in damage.
    await maybeResolveCrisis(ctx, sessionId);
  },
});

// ──────────────────────────────────────────────────────────────
// Citizen action
// ──────────────────────────────────────────────────────────────

export const citizenVote = mutation({
  args: {
    sessionId: v.id("sessions"),
    citizenId: v.id("players"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, { sessionId, citizenId, targetPlayerId }) => {
    const citizen = await ctx.db.get(citizenId);
    if (!citizen || citizen.ability !== "citizen") throw new Error("Not a Citizen.");
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex) throw new Error("No crisis active.");

    // Can't vote Scout in C2 if Scout is mandatory.
    const target = await ctx.db.get(targetPlayerId);
    if (session.crisisIndex === 2 && target?.ability === "scout" && session.scoutC2Choice !== "protect") {
      throw new Error("Scout is already the mandatory target this crisis.");
    }

    // Remove any prior vote from this citizen for this crisis.
    const prior = (await ctx.db
      .query("citizen_votes")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
      .collect())
      .find(r => r.voterId === citizenId);
    if (prior) await ctx.db.delete(prior._id);

    await ctx.db.insert("citizen_votes", {
      sessionId,
      crisisIndex: session.crisisIndex,
      voterId: citizenId,
      targetPlayerId,
    });

    await ctx.db.patch(citizenId, { crisisContribution: "done" });

    // Pass #14: try to lock in damage.
    await maybeResolveCrisis(ctx, sessionId);
  },
});

// ──────────────────────────────────────────────────────────────
// Damage allocation + crisis dealing (Pass #13)
// ──────────────────────────────────────────────────────────────

// Pass #14: HR deals a crisis. This ONLY sets state + computes a PREVIEW of
// likely victims (shown to Scout). It does NOT apply damage. Players then take
// their pre-resolution role actions (Scout, Anchor, Citizen, Engineer C1).
// Once all required pre-resolution inputs are in, resolveCrisisDamage fires
// via maybeResolveCrisis and commits the real damage.
// Pass #21: shared rotation-gate check used by both stagePendingCrisis and
// dealCrisisV13. Crisis 2 cannot fire until all present non-fac players have
// acknowledged their rotated role.
async function checkRotationGate(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<{ ok: true } | { ok: false; missing: string[] }> {
  const session = await ctx.db.get(sessionId);
  if (!session) return { ok: true };
  const players = (await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect())
    .filter(p => !p.isFacilitator);
  const crisisIndex = (session.crisesDealt ?? 0) + 1;
  if (crisisIndex !== 2) return { ok: true };
  const nowMs = Date.now();
  const presentPlayers = players.filter((p) =>
    p.lastSeenAt != null && nowMs - p.lastSeenAt <= 8_000
  );
  const notReady = presentPlayers.filter(p => p.ch2RotationReady !== true);
  if (notReady.length > 0) {
    return { ok: false, missing: notReady.map(p => p.name) };
  }
  return { ok: true };
}

// Pass #21: stage a Scout-only preview of an HR-picked crisis. Does NOT set
// crisisCardId — that happens in confirmCrisisAnnounce after the Scout (or
// HR fallback) acknowledges. Other players see no UI change while pending.
export const stagePendingCrisis = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session missing.");
    if (session.crisisCardId) {
      return { staged: false as const, reason: "CRISIS_ACTIVE" as const };
    }
    if (session.pendingCrisisCardId) {
      return { staged: false as const, reason: "ALREADY_PENDING" as const };
    }
    const gate = await checkRotationGate(ctx, sessionId);
    if (!gate.ok) {
      return {
        staged: false as const,
        reason: "ROTATION_PENDING" as const,
        missing: gate.missing,
      };
    }
    await ctx.db.patch(sessionId, {
      pendingCrisisCardId: crisisCardId,
      // Mirror to scoutPreview so any legacy reader still works during this pass.
      scoutPreview: crisisCardId,
    });
    return { staged: true as const };
  },
});

// Pass #21: advance from staged-pending into the existing pre-announce flow.
// Callable by Scout (after tapping OK) or HR (fallback button). Idempotent —
// a second call after pendingCrisisCardId is cleared is a no-op.
export const confirmCrisisAnnounce = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session missing.");
    const cardId = session.pendingCrisisCardId;
    if (!cardId) return { confirmed: false as const, reason: "NO_PENDING" as const };
    if (session.crisisCardId) {
      // Already advanced past pending; clear the pending field as a safety net.
      await ctx.db.patch(sessionId, { pendingCrisisCardId: undefined });
      return { confirmed: false as const, reason: "ALREADY_ACTIVE" as const };
    }
    await commitCrisisDeal(ctx, sessionId, cardId);
    await ctx.db.patch(sessionId, {
      pendingCrisisCardId: undefined,
      scoutPreview: undefined,
    });
    return { confirmed: true as const };
  },
});

export const dealCrisisV13 = mutation({
  args: { sessionId: v.id("sessions"), crisisCardId: v.string() },
  handler: async (ctx, { sessionId, crisisCardId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session missing.");

    const gate = await checkRotationGate(ctx, sessionId);
    if (!gate.ok) {
      return {
        dealt: false as const,
        reason: "ROTATION_PENDING" as const,
        missing: gate.missing,
      };
    }

    await commitCrisisDeal(ctx, sessionId, crisisCardId);
    return { dealt: true as const };
  },
});

// Pass #21: extracted commit body. Called by dealCrisisV13 (legacy direct path)
// and confirmCrisisAnnounce (Pass #21 staged path). Sets crisisCardId,
// crisisSubPhase: "pre", schedules announceCrisis, etc.
async function commitCrisisDeal(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  crisisCardId: string,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session) throw new Error("Session missing.");

  const players = (await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect())
    .filter(p => !p.isFacilitator);

  const cap = getCrisisCapV13(players.length);
  const crisisIndex = (session.crisesDealt ?? 0) + 1;

    // Compute damage preview (system-random pick, ignoring Citizen/Anchor
    // inputs that are not yet available). Used to show Scout advance intel.
    const conns = await ctx.db
      .query("connections")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect();
    const activeConns = conns.filter(c => !c.destroyedByCrisisIndex || c.destroyedByCrisisIndex === 0);
    const shuffledConns = [...activeConns].sort(() => Math.random() - 0.5);
    const previewPicks = shuffledConns.slice(0, Math.min(cap, shuffledConns.length));
    const damagePreview = previewPicks.map(c => ({
      aPlayerId: c.fromSlotId as Id<"players">,
      bPlayerId: c.toSlotId as Id<"players">,
      originalType: c.connectionType ?? "bridge",
    }));

    // Initialize per-player mute state (Diplomat exempt)
    for (const p of players) {
      if (p.ability === "diplomat") continue;
      await ctx.db.insert("diplomat_mute_state", {
        sessionId,
        crisisIndex,
        playerId: p._id,
        muted: true,
        reMuteCount: 0,
      });
    }

    // Reset role-action contributions
    for (const p of players) {
      await ctx.db.patch(p._id, { crisisContribution: undefined });
    }

    // Session state: crisis active, damage NOT yet resolved. Clear per-crisis
    // inputs so fresh Scout/Anchor/Citizen choices are captured cleanly.
    // Pass #18: crisis now has an explicit pre-announce window (10s) during
    // which role-holders take their pre-crisis actions. After that, damage
    // lands. crisisSubPhase transitions drive client UI: "pre" → pre-crisis
    // countdown; "announced" → damage shown + rebuild kicks off; "cleared"
    // → ready for next crisis. Diplomat unmute game starts on "announced",
    // not at deal time.
    await ctx.db.patch(sessionId, {
      crisisCardId,
      crisisIndex,
      crisesDealt: crisisIndex,
      currentCrisisDamagedPairs: [],
      damagePreview,
      damageResolved: false,
      ch2State: "CH2_CRISIS_ACTIVE",
      crisisSubPhase: "pre",
      // Pass #30: pre-crisis is now open-ended. Damage resolves only when
      // every shielder/pre-resolution role has committed (see
      // maybeResolveCrisis). No 10s auto-fire.
      preCrisisDeadline: undefined,
      // Chat mute + Diplomat timer do NOT start yet, both begin at announce.
      scoutC1Choice: undefined,
      scoutC1Target: undefined,
      scoutC2Choice: undefined,
      scoutWarning: undefined,
      anchorImmuneTarget: undefined,
      menderHealed: undefined,
      // Pass #16: clear stale protection-save banners from a previous crisis.
      lastProtectionEvents: [],
    });

    // Pass #30: damage no longer auto-fires on a 10s scheduler. It resolves
    // only via maybeResolveCrisis once all pre-resolution role-holders
    // (Scout, Anchor, Engineer C1, Citizens) have committed. Try once now in
    // case there are no shielder roles in this game.
    await maybeResolveCrisis(ctx, sessionId);
}

// Pass #30: announceCrisis and forceResolveOn15s removed. Damage no longer
// auto-fires on a scheduler. resolveCrisisDamage (defined below) remains as
// the manual HR force-resolve path.

// Pass #14: Runs the actual damage allocation using player inputs gathered
// during the pre-resolution window (Scout C2 choice, Anchor immunity, Citizen
// votes, Engineer C1 shield). Idempotent: safe to re-run if already resolved.
async function runResolveDamage(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session) return;
  if (session.damageResolved) return;
  if (!session.crisisIndex) return;

  // Pass #30: flip the announce state the instant we start resolving damage.
  // Now reached only via maybeResolveCrisis (every shielder/pre-resolution
  // role committed) or HR's manual resolveCrisisDamage. Sets chat mute +
  // Diplomat timer + rebuild deadline + subPhase together; without these the
  // pre-crisis overlay stays up forever and the Diplomat game never starts.
  if (session.crisisSubPhase === "pre") {
    const REBUILD_MS = 120_000; // Pass #30: was 90_000
    await ctx.db.patch(sessionId, {
      crisisSubPhase: "announced",
      chatMutedUntil: Date.now() + 15_000,
      diplomatUnmuteStartedAt: Date.now(),
      diplomatUnmuteDone: false,
      rebuildDeadline: Date.now() + REBUILD_MS,
      preCrisisDeadline: undefined,
    });
  }

  const crisisIndex = session.crisisIndex;
  const isC2 = crisisIndex === 2;
  const crisisCardId = session.crisisCardId ?? "";

  const players = (await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect())
    .filter(p => !p.isFacilitator);
  const cap = getCrisisCapV13(players.length);

  const conns = await ctx.db
    .query("connections")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect();

  // Eligible pool: players with at least one active connection.
  const connectedPlayerIds = new Set<string>();
  for (const c of conns) {
    const active = !c.destroyedByCrisisIndex || c.destroyedByCrisisIndex === 0;
    if (!active) continue;
    connectedPlayerIds.add(c.fromSlotId);
    connectedPlayerIds.add(c.toSlotId);
  }

  const excluded = new Set<string>();
  // Pass #16: track every protection that fired so the client can show a
  // public banner naming who was saved and by whom. Only recorded for saves
  // where the protected player was actually at risk (in eligible pool).
  const protectionEvents: Array<{
    savedPlayerId: Id<"players">;
    protectorPlayerId?: Id<"players">;
    protectorRole: string;
    at: number;
  }> = [];
  const nowTs = Date.now();

  const anchor = players.find(p => p.ability === "anchor");
  if (session.anchorImmuneTarget) {
    excluded.add(session.anchorImmuneTarget as string);
    // Only announce the save if the player was actually in the at-risk pool.
    // Otherwise the Anchor "shielded" someone who was never going to be hit.
    if (connectedPlayerIds.has(session.anchorImmuneTarget as string)) {
      protectionEvents.push({
        savedPlayerId: session.anchorImmuneTarget as Id<"players">,
        protectorPlayerId: anchor?._id,
        protectorRole: "anchor",
        at: nowTs,
      });
    }
  }
  let mandatoryScoutId: Id<"players"> | null = null;
  if (isC2) {
    const scout = players.find(p => p.ability === "scout");
    if (scout) {
      if (session.scoutC2Choice === "protect") {
        excluded.add(scout._id);
        if (connectedPlayerIds.has(scout._id)) {
          protectionEvents.push({
            savedPlayerId: scout._id,
            protectorPlayerId: scout._id,
            protectorRole: "scout",
            at: nowTs,
          });
        }
      }
      else if (session.scoutC2Choice === "reveal") mandatoryScoutId = scout._id;
    }
  }

  // Pass #24: Diplomat is exempt from district damage in EVERY crisis (C1 + C2).
  // Their crisis role IS running the 15s unmute mini-game (DiplomatUnmuteOverlay).
  // If they were a damage victim, DamageRepairOverlay (z-index 900) would cover
  // the mini-game (z-index 80) and the 15s timer would expire before they could
  // repair. We do NOT push a protectionEvents entry — the exemption is automatic
  // every crisis, so an HR banner would just be noise (unlike Anchor/Scout/Engineer
  // shields, which are deliberate per-crisis choices worth surfacing).
  const diplomat = players.find(p => p.ability === "diplomat");
  if (diplomat) {
    excluded.add(diplomat._id);
  }

  const eligibleList = players
    .filter(p => connectedPlayerIds.has(p._id))
    .filter(p => !excluded.has(p._id));

  const victims: Id<"players">[] = [];
  if (mandatoryScoutId) victims.push(mandatoryScoutId);

  // Citizen vote
  if (victims.length < cap) {
    const votes = await ctx.db
      .query("citizen_votes")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", crisisIndex))
      .collect();
    const citizens = players.filter(p => p.ability === "citizen");
    let agreedTarget: Id<"players"> | null = null;
    if (citizens.length === 1 && votes.length === 1) {
      agreedTarget = votes[0].targetPlayerId;
    } else if (citizens.length === 2 && votes.length === 2) {
      if (votes[0].targetPlayerId === votes[1].targetPlayerId) {
        agreedTarget = votes[0].targetPlayerId;
      }
    }
    if (agreedTarget && !excluded.has(agreedTarget) && !victims.includes(agreedTarget)) {
      victims.push(agreedTarget);
    }
  }

  // System random fill
  while (victims.length < cap) {
    const remaining = eligibleList.filter(p => !victims.includes(p._id));
    if (!remaining.length) break;
    const pick = pickRandomFromArray(remaining);
    if (!pick) break;
    victims.push(pick._id);
  }

  const damagedPairs: Array<{
    aPlayerId: Id<"players">;
    bPlayerId: Id<"players">;
    originalType: string;
    newType?: string;
  }> = [];

  for (const vId of victims) {
    const vConns = conns.filter(c => c.fromSlotId === vId || c.toSlotId === vId);
    const active = vConns.filter(c => !c.destroyedByCrisisIndex || c.destroyedByCrisisIndex === 0);
    if (!active.length) continue;
    const pick = pickRandomFromArray(active);
    if (!pick) continue;
    const a = pick.fromSlotId as Id<"players">;
    const b = pick.toSlotId as Id<"players">;
    const originalType = pick.connectionType ?? "bridge";

    // newType is left undefined; the Engineer picks it post-resolution in
    // both crises via engineerPickRebuildType.
    const newType: string | undefined = undefined;

    await ctx.db.patch(pick._id, {
      destroyedByCrisisIndex: crisisIndex,
      rebuildValidatedByHR: false,
      rebuildNewType: newType,
      damagedSidePlayerId: vId,
    });
    // Pass #20: damage ONLY the picked victim, not the partner endpoint.
    // The connection still breaks (above), but the partner's district stays
    // intact. Why: damage cap was being doubled (cap=1 → 2 districts hit) and
    // shielded partners were being collateral-damaged.
    await ctx.db.patch(vId, { districtDamaged: true, damageReason: crisisCardId });

    damagedPairs.push({
      aPlayerId: a,
      bPlayerId: b,
      originalType,
      newType,
    });
  }

  await ctx.db.patch(sessionId, {
    currentCrisisDamagedPairs: damagedPairs,
    damageResolved: true,
    damagePreview: undefined,
    // Pass #16: overwrite with this crisis's protection events. Empty array
    // clears any stale banner from the previous crisis.
    lastProtectionEvents: protectionEvents,
  });
}

// Called from each pre-resolution role action mutation. Checks readiness;
// fires runResolveDamage if all required inputs are in. Pass #18: always
// calls autoClearCrisisIfDone at the end (even if damage already resolved),
// so late role actions that land after damage can still auto-clear the
// crisis when they flip the last "contribution=done" flag.
async function maybeResolveCrisis(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session) return;
  if (!session.crisisIndex) return;
  // Pass #18: if damage is already resolved, we only need to re-check clear.
  if (session.damageResolved) {
    await autoClearCrisisIfDone(ctx, sessionId);
    return;
  }

  const players = (await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect())
    .filter(p => !p.isFacilitator);

  const scout = players.find(p => p.ability === "scout");
  const anchor = players.find(p => p.ability === "anchor");
  const citizens = players.filter(p => p.ability === "citizen");
  const conns = await ctx.db
    .query("connections")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect();
  const activeConns = conns.filter(c => !c.destroyedByCrisisIndex || c.destroyedByCrisisIndex === 0);

  // Scout ready check
  if (scout) {
    const scoutReady = session.crisisIndex === 1
      ? !!session.scoutC1Choice
      : !!session.scoutC2Choice;
    if (!scoutReady) return;
  }

  // Anchor ready check (skip if Anchor has no connections anyway)
  if (anchor) {
    const anchorHasConn = activeConns.some(c => c.fromSlotId === anchor._id || c.toSlotId === anchor._id);
    if (anchorHasConn && !session.anchorImmuneTarget) return;
  }

  // Engineer is post-resolution in both crises (rebuild-type picker), so
  // does not gate damage. Their picks land via engineerPickRebuildType
  // after damage resolves.

  // Citizens ready check
  if (citizens.length > 0) {
    const votes = await ctx.db
      .query("citizen_votes")
      .withIndex("by_session_and_crisis", q =>
        q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
      .collect();
    if (votes.length < citizens.length) return;
  }

  await runResolveDamage(ctx, sessionId);
  // Pass #18: after damage resolves, check if every action + rebuild is done
  // and auto-clear. Mostly a no-op right after damage since rebuilds won't
  // land yet, but catches crises that had no damage (e.g. Signal Lost).
  await autoClearCrisisIfDone(ctx, sessionId);
}

// Public mutation: HR or clearance poller can force resolve if pre-resolution
// players have stalled. Safe to call multiple times.
export const resolveCrisisDamage = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await runResolveDamage(ctx, sessionId);
  },
});

// ──────────────────────────────────────────────────────────────
// Rebuild submission + HR validation
// ──────────────────────────────────────────────────────────────

export const submitRebuildPhoto = mutation({
  args: {
    sessionId: v.id("sessions"),
    connectionId: v.id("connections"),
    playerId: v.id("players"),
    photoDataUrl: v.string(),
  },
  handler: async (ctx, { sessionId, connectionId, playerId, photoDataUrl }) => {
    const conn = await ctx.db.get(connectionId);
    if (!conn) throw new Error("Connection missing.");
    const isA = conn.fromSlotId === playerId;
    const isB = conn.toSlotId === playerId;
    if (!isA && !isB) throw new Error("Not a party to this connection.");
    if (!conn.destroyedByCrisisIndex) throw new Error("Not destroyed; nothing to rebuild.");
    if (isA) {
      await ctx.db.patch(connectionId, { rebuildPhotoA: photoDataUrl });
    } else {
      await ctx.db.patch(connectionId, { rebuildPhotoB: photoDataUrl });
    }
    // Pass #20: rebuild auto-completes on a SINGLE photo (the damaged player's).
    // Partner is never damaged, never prompted to upload, so the connection is
    // ready as soon as the damaged player's photo lands. We copy that photo
    // into the appropriate side and leave the other side's existing photo
    // intact so the diptych still has both halves to render.
    const updated = await ctx.db.get(connectionId);
    if (updated?.rebuildPhotoA || updated?.rebuildPhotoB) {
      const finalA = updated.rebuildPhotoA ?? updated.photoA;
      const finalB = updated.rebuildPhotoB ?? updated.photoB;
      await ctx.db.patch(connectionId, {
        rebuildValidatedByHR: true,
        destroyedByCrisisIndex: 0,
        rebuildPhotoA: undefined,
        rebuildPhotoB: undefined,
        damagedSidePlayerId: undefined,
        photoA: finalA,
        photoB: finalB,
        connectionType: updated.rebuildNewType ?? updated.connectionType,
      });
      // Only the uploader (the damaged player) was damaged; clear their flag.
      // Partner was never damaged, so no patch needed for them.
      await ctx.db.patch(playerId, {
        districtDamaged: false,
        damageReason: undefined,
      });
      // History: only the player who physically rebuilt gets the new type
      // added to their built-types list, since only they actually built it.
      const typeForHist = updated.rebuildNewType ?? updated.connectionType ?? "bridge";
      const builder = await ctx.db.get(playerId);
      if (builder) {
        const hist = builder.connectionsBuiltHistory ?? [];
        if (!hist.includes(typeForHist)) {
          await ctx.db.patch(playerId, { connectionsBuiltHistory: [...hist, typeForHist] });
        }
      }
      await autoClearCrisisIfDone(ctx, sessionId);
    }
  },
});

// Pass #18: auto-dismissal helper. Replaces the facilitator's CLEAR CRISIS
// tap. Runs whenever a rebuild photo lands or a role action completes. If
// all present-player actions are done and all rebuilds are auto-validated,
// flips ch2State + crisisSubPhase and clears crisisCardId so the facilitator
// immediately sees the DEAL NEXT CRISIS (or ADVANCE) CTA.
async function autoClearCrisisIfDone(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session || !session.crisisIndex) return;
  if (!session.damageResolved) return;

  const nowMs = Date.now();
  const players = (await ctx.db
    .query("players")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect()).filter((p) =>
      !p.isFacilitator && p.lastSeenAt != null && nowMs - p.lastSeenAt <= 8_000,
    );

  const conns = await ctx.db
    .query("connections")
    .withIndex("by_session", q => q.eq("sessionId", sessionId))
    .collect();
  const presentIds = new Set(players.map((p) => p._id as unknown as string));
  // Pass #18: if BOTH endpoints of a damaged connection have left, the
  // connection can't be rebuilt by anyone. Skip it so the crisis can clear.
  // If even one endpoint is present, they still owe a rebuild.
  const pendingRebuilds = conns.filter((c) => {
    if (c.destroyedByCrisisIndex !== session.crisisIndex) return false;
    const aPresent = presentIds.has(c.fromSlotId as unknown as string);
    const bPresent = presentIds.has(c.toSlotId as unknown as string);
    return aPresent || bPresent;
  });
  const allRebuilt = pendingRebuilds.every((c) => c.rebuildValidatedByHR === true);
  const allActionsDone = players.every((p) => p.crisisContribution === "done");

  if (!allRebuilt || !allActionsDone) return;

  const nextState = session.crisisIndex === 1 ? "CH2_CRISIS1_CLEARED" : "CH2_COMPLETE";
  await ctx.db.patch(sessionId, {
    ch2State: nextState,
    chatMutedUntil: undefined,
    crisisCardId: undefined,
    crisisTargetReason: undefined,
    crisisSubPhase: "cleared",
    rebuildDeadline: undefined,
    currentCrisisDamagedPairs: [],
    // Pass #30: clear any unacknowledged Scout warning so it doesn't bleed
    // into the next crisis.
    scoutWarning: undefined,
  });
}

export const hrValidateRebuild = mutation({
  args: {
    connectionId: v.id("connections"),
    approved: v.boolean(),
  },
  handler: async (ctx, { connectionId, approved }) => {
    const conn = await ctx.db.get(connectionId);
    if (!conn) throw new Error("Connection missing.");
    if (approved) {
      // Promote the rebuild photos to the canonical photoA/photoB, update type.
      await ctx.db.patch(connectionId, {
        rebuildValidatedByHR: true,
        destroyedByCrisisIndex: 0,
        damagedSidePlayerId: undefined,
        photoA: conn.rebuildPhotoA ?? conn.photoA,
        photoB: conn.rebuildPhotoB ?? conn.photoB,
        connectionType: conn.rebuildNewType ?? conn.connectionType,
      });
      // Pass #20: only the damaged side has districtDamaged set; clear it on
      // that one player. Patch both endpoints is harmless (no-op if false).
      await ctx.db.patch(conn.fromSlotId as Id<"players">, { districtDamaged: false, damageReason: undefined });
      await ctx.db.patch(conn.toSlotId as Id<"players">, { districtDamaged: false, damageReason: undefined });
      // Pass #20: only the player who actually rebuilt gets the new type added
      // to their built-types history.
      const builderId = (conn.damagedSidePlayerId as Id<"players"> | undefined)
        ?? (conn.rebuildPhotoA ? (conn.fromSlotId as Id<"players">) : (conn.toSlotId as Id<"players">));
      const builder = await ctx.db.get(builderId);
      if (builder) {
        const hist = builder.connectionsBuiltHistory ?? [];
        const t = conn.rebuildNewType ?? conn.connectionType ?? "bridge";
        if (!hist.includes(t)) {
          await ctx.db.patch(builderId, { connectionsBuiltHistory: [...hist, t] });
        }
      }
    } else {
      // Clear the submitted rebuild photos so players can resubmit
      await ctx.db.patch(connectionId, {
        rebuildPhotoA: undefined,
        rebuildPhotoB: undefined,
      });
    }
  },
});

// ──────────────────────────────────────────────────────────────
// Crisis clearance check + role rotation + wildcard
// ──────────────────────────────────────────────────────────────

export const checkCrisisClearance = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || !session.crisisIndex) return { cleared: false };

    // Pass #14: Diplomat 15s hard-stop. Fires even if no Diplomat has the
    // modal open. Auto-unmutes remaining players and marks Diplomat done.
    if (session.diplomatUnmuteStartedAt && !session.diplomatUnmuteDone) {
      const elapsed = Date.now() - session.diplomatUnmuteStartedAt;
      if (elapsed >= DIPLOMAT_UNMUTE_TOTAL_MS) {
        const rows = await ctx.db
          .query("diplomat_mute_state")
          .withIndex("by_session_and_crisis", q =>
            q.eq("sessionId", sessionId).eq("crisisIndex", session.crisisIndex!))
          .collect();
        for (const r of rows) {
          if (r.muted) await ctx.db.patch(r._id, { muted: false });
        }
        const ps = (await ctx.db
          .query("players")
          .withIndex("by_session", q => q.eq("sessionId", sessionId))
          .collect()).filter(p => !p.isFacilitator);
        const diplomat = ps.find(p => p.ability === "diplomat");
        if (diplomat && diplomat.crisisContribution !== "done") {
          await ctx.db.patch(diplomat._id, { crisisContribution: "done" });
        }
        await ctx.db.patch(sessionId, { diplomatUnmuteDone: true });
      }
    }

    // Pass #14: if pre-resolution actions stalled, the crisis can't advance.
    // Try to resolve defensively here in case a mutation slipped through.
    if (!session.damageResolved) {
      await maybeResolveCrisis(ctx, sessionId);
      const refreshed = await ctx.db.get(sessionId);
      if (!refreshed?.damageResolved) return { cleared: false, stage: "awaiting_actions" as const };
    }
    // Pass #17: only present players must have contributed. A ghost player
    // whose crisisContribution is undefined must not keep the crisis "active"
    // forever.
    const nowMs = Date.now();
    const players = (await ctx.db
      .query("players")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect()).filter((p) =>
        !p.isFacilitator && p.lastSeenAt != null && nowMs - p.lastSeenAt <= 8_000
      );
    const allActionsDone = players.every(p => p.crisisContribution === "done");
    // Rebuilds validated
    const conns = await ctx.db
      .query("connections")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect();
    const pendingRebuilds = conns.filter(c => c.destroyedByCrisisIndex === session.crisisIndex);
    const allRebuiltOrHealed = pendingRebuilds.every(c => c.rebuildValidatedByHR === true);
    if (allActionsDone && allRebuiltOrHealed) {
      const nextState = session.crisisIndex === 1 ? "CH2_CRISIS1_CLEARED" : "CH2_COMPLETE";
      // Pass #18: clear the crisis card AND sub-phase AND rebuild deadline in
      // this code path too, so it is symmetric with autoClearCrisisIfDone.
      // Previously this path left crisisCardId set, which kept the crisis
      // banner up and blocked the next DEAL CRISIS button.
      await ctx.db.patch(sessionId, {
        ch2State: nextState,
        chatMutedUntil: undefined,
        currentCrisisDamagedPairs: [],
        crisisCardId: undefined,
        crisisTargetReason: undefined,
        crisisSubPhase: "cleared",
        rebuildDeadline: undefined,
        // Pass #30: clear any unacknowledged Scout warning here too.
        scoutWarning: undefined,
      });
      return { cleared: true, nextState };
    }
    return { cleared: false };
  },
});

// Pass #16: each player taps "Ready for Crisis 2" on the rotation overlay.
// HR's DEAL CRISIS for C2 won't enable until every non-fac player has flipped
// ch2RotationReady=true.
export const markRotationReady = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.patch(playerId, { ch2RotationReady: true });
    return { success: true as const };
  },
});

export const rotateRolesForC2 = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.ch2State !== "CH2_CRISIS1_CLEARED") throw new Error("Not ready for rotation.");
    const players = (await ctx.db
      .query("players")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect())
      .filter(p => !p.isFacilitator)
      .sort((a, b) => a._id.localeCompare(b._id));
    if (players.length < 3) throw new Error("Need >=3 players.");
    // shift-by-1: player[i] receives player[i-1]'s ability
    const oldAbilities = players.map(p => p.ability);
    for (let i = 0; i < players.length; i++) {
      const prevIdx = (i - 1 + players.length) % players.length;
      const newAbility = oldAbilities[prevIdx];
      const newPower = ROLE_POWER_PAIRINGS[newAbility ?? ""] ?? null;
      await ctx.db.patch(players[i]._id, {
        ability: newAbility,
        originalAbility: players[i].originalAbility ?? players[i].ability,
        crisisContribution: undefined,
        // Pass #16: reset rotation-ready on every non-fac player so HR has to
        // wait for each player to re-acknowledge their new role before Crisis 2.
        ch2RotationReady: false,
      });
      // Issue new power card, retire old one (mark used)
      const existingCards = await ctx.db
        .query("power_cards")
        .withIndex("by_player_and_session", q =>
          q.eq("playerId", players[i]._id).eq("sessionId", sessionId))
        .collect();
      for (const card of existingCards) {
        await ctx.db.delete(card._id);
      }
      if (newPower) {
        await ctx.db.insert("power_cards", {
          sessionId,
          playerId: players[i]._id,
          cardId: newPower,
          used: false,
        });
      }
    }
    await ctx.db.patch(sessionId, { ch2State: "CH2_READY_FOR_CRISIS2" });
  },
});

export const dealWildcardBlackout = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    // Server-side defense: blackout (and any Ch2 HR action) is a no-op until
    // every non-fac player has tapped ready on their Ch2 intro.
    const session = await ctx.db.get(sessionId);
    if (!session || session.phase !== "map_ch2") return { fired: false, reason: "WRONG_PHASE" };
    const players = await ctx.db
      .query("players")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect();
    // Pass #17: only present non-fac players count toward the ready gate. A
    // ghost who never tapped ready must not block the blackout from firing.
    const nowMs = Date.now();
    const presentNonFac = players.filter((p) =>
      !p.isFacilitator && p.lastSeenAt != null && nowMs - p.lastSeenAt <= 8_000
    );
    if (presentNonFac.length === 0 || !presentNonFac.every(p => p.ch2Ready)) {
      return { fired: false, reason: "NOT_ALL_READY" };
    }
    await ctx.db.patch(sessionId, {
      chatMutedUntil: Date.now() + 20_000,
    });
    await ctx.db.insert("messages", {
      sessionId,
      sender: "SYSTEM",
      text: "COMMS BLACKOUT. Chat muted 20s. Diplomat remains active.",
      isFacilitator: true,
    });
    return { fired: true };
  },
});

// ──────────────────────────────────────────────────────────────
// Ch2 ready-gate
// ──────────────────────────────────────────────────────────────

export const markCh2ReadyV13 = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player missing.");
    await ctx.db.patch(playerId, { ch2Ready: true });
    // Pass #18: flip sticky collective-entry flag the instant every present
    // non-fac player is ready. Once true, never reverts.
    const session = await ctx.db.get(player.sessionId);
    if (session && !session.ch2MapOpened) {
      const all = await ctx.db
        .query("players")
        .withIndex("by_session", q => q.eq("sessionId", player.sessionId))
        .collect();
      const nowMs = Date.now();
      const presentNonFac = all.filter(p =>
        !p.isFacilitator
          && p.lastSeenAt != null
          && nowMs - p.lastSeenAt <= 8_000,
      );
      const allReady = presentNonFac.length > 0
        && presentNonFac.every(p => p._id === playerId || p.ch2Ready === true);
      if (allReady) {
        await ctx.db.patch(player.sessionId, { ch2MapOpened: true });
      }
    }
  },
});

// ──────────────────────────────────────────────────────────────
// Ch3 pattern generation (Pass #13 geometric)
// ──────────────────────────────────────────────────────────────

export const generateCh3PatternV13 = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session missing.");
    const players = (await ctx.db
      .query("players")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect())
      .filter(p => !p.isFacilitator)
      .sort((a, b) => a._id.localeCompare(b._id));
    const n = players.length;
    const shape = CH3_SHAPE_BY_COUNT[n] ?? "polygon";
    const theme = themeForScenario(session.scenario);
    const patternName = CH3_PATTERN_NAMES[theme]?.[n] ?? shape;
    const slots = generateCh3PatternSlots(n);
    const assigned = slots.map((s, i) => ({
      slotId: s.slotId,
      x: s.x,
      y: s.y,
      assignedTo: players[i]._id,
    }));
    // Assign each player their target slot
    for (let i = 0; i < players.length; i++) {
      await ctx.db.patch(players[i]._id, { ch3TargetSlotId: slots[i].slotId, ch3InTargetSlot: false });
    }
    await ctx.db.patch(sessionId, {
      patternShape: shape,
      patternName,
      ch3TargetSlots: assigned,
    });
  },
});

// Player updates their district position; server marks ch3InTargetSlot if
// within tolerance of their assigned slot. Pass #16: when every assigned
// player is in their slot, hiddenPatternRevealed flips automatically so the
// facilitator no longer needs a separate "MAP REBUILT" tap.
export const updateCh3Position = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, { sessionId, playerId, x, y }) => {
    const session = await ctx.db.get(sessionId);
    const player = await ctx.db.get(playerId);
    if (!session || !player) throw new Error("Missing.");
    const targetSlots = session.ch3TargetSlots ?? [];
    const slot = targetSlots.find(s => s.slotId === player.ch3TargetSlotId);
    // Pass #31: 18% radius Euclidean tolerance in 0-100 percentage space.
    // Pass #33: re-evaluate every assigned player's in-slot status from their
    // current x,y on every drop, instead of trusting stored ch3InTargetSlot
    // flags. The prior logic only updated the dropper's flag; if any other
    // player carried over from Ch1 already on-target, or had their flag get
    // out of sync, the pattern could never auto-complete and HR had to use
    // FORCE COMPLETE every game.
    const TOLERANCE = 18;
    const computeInSlot = (px: number | undefined, py: number | undefined, slotX: number, slotY: number) => {
      if (px == null || py == null) return false;
      const ddx = slotX - px;
      const ddy = slotY - py;
      return Math.sqrt(ddx * ddx + ddy * ddy) <= TOLERANCE;
    };
    const dropperInSlot = slot ? computeInSlot(x, y, slot.x, slot.y) : false;
    await ctx.db.patch(playerId, { x, y, ch3InTargetSlot: dropperInSlot });

    if (!session.hiddenPatternRevealed) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_session", q => q.eq("sessionId", sessionId))
        .collect();
      const byId = new Map(players.map((p) => [p._id as unknown as string, p]));
      const nowMs = Date.now();
      const ABANDON_MS = 60_000;
      let allInSlot = targetSlots.length > 0;
      for (const ts of targetSlots) {
        const assigneeId = ts.assignedTo as unknown as string | undefined;
        if (!assigneeId) continue;
        const assignee = byId.get(assigneeId);
        if (!assignee) continue;
        const abandoned = assignee.lastSeenAt != null && nowMs - assignee.lastSeenAt > ABANDON_MS;
        if (abandoned) continue;
        // Recompute from live position. For the dropper use the in-flight
        // (x, y) we just received; for everyone else use their stored x, y.
        const isDropper = (assignee._id as unknown as string) === (playerId as unknown as string);
        const px = isDropper ? x : assignee.x;
        const py = isDropper ? y : assignee.y;
        const assigneeInSlot = computeInSlot(px, py, ts.x, ts.y);
        // Self-heal stored flag if it disagrees, so the client-side visual
        // (allComplete in StoryMapScreen) stays in sync with the server.
        if (!isDropper && assignee.ch3InTargetSlot !== assigneeInSlot) {
          await ctx.db.patch(assignee._id, { ch3InTargetSlot: assigneeInSlot });
        }
        if (!assigneeInSlot) { allInSlot = false; }
      }
      if (allInSlot) {
        await ctx.db.patch(sessionId, { hiddenPatternRevealed: true });
      }
    }
  },
});

// Pass #31: HR escape hatch when Ch3 placement is technically correct but
// validation refuses to flip (mobile drag imprecision, coordinate edge case,
// or one player AFK off-slot). Flips hiddenPatternRevealed unconditionally
// and stamps every assigned player ch3InTargetSlot=true so downstream
// consumers stay consistent. Idempotent.
export const forceCompleteCh3 = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    if (session.hiddenPatternRevealed) return;

    const slots = session.ch3TargetSlots ?? [];
    for (const s of slots) {
      if (!s.assignedTo) continue;
      const p = await ctx.db.get(s.assignedTo);
      if (p && !p.ch3InTargetSlot) {
        await ctx.db.patch(s.assignedTo, { ch3InTargetSlot: true });
      }
    }
    await ctx.db.patch(sessionId, { hiddenPatternRevealed: true });
  },
});

// Pass #16: Ch3 intro ready gate. Mirror of markCh2ReadyV13.
export const markCh3Ready = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const player = await ctx.db.get(playerId);
    if (!player) throw new Error("Player missing.");
    await ctx.db.patch(playerId, { ch3Ready: true });
    // Pass #18: sticky collective-entry for Ch3. Same shape as Ch2.
    const session = await ctx.db.get(player.sessionId);
    if (session && !session.ch3MapOpened) {
      const all = await ctx.db
        .query("players")
        .withIndex("by_session", q => q.eq("sessionId", player.sessionId))
        .collect();
      const nowMs = Date.now();
      const presentNonFac = all.filter(p =>
        !p.isFacilitator
          && p.lastSeenAt != null
          && nowMs - p.lastSeenAt <= 8_000,
      );
      const allReady = presentNonFac.length > 0
        && presentNonFac.every(p => p._id === playerId || p.ch3Ready === true);
      if (allReady) {
        await ctx.db.patch(player.sessionId, { ch3MapOpened: true });
      }
    }
    return { success: true as const };
  },
});
