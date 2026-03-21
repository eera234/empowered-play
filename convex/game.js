import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── The 8 Cityscape constraint cards ──
export const CARDS = [
  { id: 0, title: "The Bridge Keeper", icon: "🌉", color: "#006DB7", rule: "You hold the only bridge pieces in the city. Nothing can connect across the river without you. Your cooperation is not optional — it is structural.", hrNote: "Give to someone who tends to stay on the sidelines. This card makes them structurally unmissable." },
  { id: 1, title: "The Centre Node", icon: "⚡", color: "#F47B20", rule: "Your district must sit at the exact centre of the city grid. Every route passes through you, whether anyone planned it or not.", hrNote: "Good for someone who dominates — being fixed at the centre means others must design around them, not for them." },
  { id: 2, title: "The Last Builder", icon: "🏛️", color: "#E3000B", rule: "You build last. Before finishing your district, you must physically incorporate one visible element from every other person's build into yours. You complete the city.", hrNote: "Assign to the most junior or quietest person. They literally finish the city — a structural guarantee their contribution matters most." },
  { id: 3, title: "Double Resource", icon: "💎", color: "#00A650", rule: "Your LEGO kit has twice the pieces of everyone else. You may only use half of them. The rest must be distributed to other players before you start building.", hrNote: "Good for senior leaders. Forces generosity and active attention to what others need — not just what they want to build." },
  { id: 4, title: "Vertical Only", icon: "🏗️", color: "#FFD700", rule: "You can only build upward, never outward. Your district rises into the sky — it does not spread across the ground. Height is your entire contribution.", hrNote: "Good for someone who tends to take up a lot of space in discussions. Physically constrains their footprint." },
  { id: 5, title: "The Connector", icon: "🔗", color: "#9B59B6", rule: "Your district has no fixed position in the city. You go last in placement and fill whatever gap the city most needs. Your power is total flexibility — and total dependency on others going first.", hrNote: "Good for adaptable team members. Also useful for someone who always waits for others to decide before acting." },
  { id: 6, title: "The Gatekeeper", icon: "🚪", color: "#C0392B", rule: "Your district controls the only entry and exit point to the city. Before any other player places their district on the city map, they must describe their district to you and get your verbal approval. You may ask one question.", hrNote: "Give to someone quiet who has good judgment but rarely gets to exercise it formally. This card gives them structural authority." },
  { id: 7, title: "The Architect's Debt", icon: "📐", color: "#16A085", rule: "Before placing any LEGO piece, you must first ask two other players for one piece each. You cannot start until both have given you something. Your district is literally built from the team.", hrNote: "Good for someone who works very independently. Forces them to initiate contact and depend on others from the very first move." },
];

// ── Helper: generate random 5-char code ──
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ══════════════════════════════
//  QUERIES (read, live)
// ══════════════════════════════

// Get session by code
export const getSession = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db.query("sessions").withIndex("by_code", q => q.eq("code", code)).first();
  },
});

// Get all players in a session
export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.query("players").withIndex("by_session", q => q.eq("sessionId", sessionId)).collect();
  },
});

// Get all chat messages in a session
export const getMessages = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.query("messages").withIndex("by_session", q => q.eq("sessionId", sessionId)).collect();
  },
});

// Get all 8 cards (called once on load)
export const getCards = query({
  args: {},
  handler: async () => CARDS,
});

// ══════════════════════════════
//  MUTATIONS (write)
// ══════════════════════════════

// Facilitator creates a session
export const createSession = mutation({
  args: { scenario: v.string() },
  handler: async (ctx, { scenario }) => {
    const code = makeCode();
    const sessionId = await ctx.db.insert("sessions", {
      code,
      phase: "waiting",
      scenario,
    });
    return { sessionId, code };
  },
});

// Player joins a session
export const joinSession = mutation({
  args: { code: v.string(), name: v.string(), isFacilitator: v.boolean() },
  handler: async (ctx, { code, name, isFacilitator }) => {
    const session = await ctx.db.query("sessions").withIndex("by_code", q => q.eq("code", code)).first();
    if (!session) return { success: false, error: "Session not found. Check your code." };

    // Check name not taken
    const existing = await ctx.db.query("players").withIndex("by_session", q => q.eq("sessionId", session._id)).collect();
    if (existing.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "That name is already taken in this session." };
    }
    if (existing.length >= 10) {
      return { success: false, error: "Session is full (max 10 players)." };
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

// Facilitator assigns a card to a player
export const assignCard = mutation({
  args: { playerId: v.id("players"), cardIndex: v.number() },
  handler: async (ctx, { playerId, cardIndex }) => {
    await ctx.db.patch(playerId, { cardIndex, cardSent: true });
    return { success: true };
  },
});

// Facilitator advances the phase
export const advancePhase = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    const phases = ["waiting", "card_reveal", "building", "uploading", "city_map", "constraint_reveal", "debrief", "complete"];
    const idx = phases.indexOf(session.phase);
    if (idx < phases.length - 1) {
      await ctx.db.patch(sessionId, { phase: phases[idx + 1] });
    }
  },
});

// Player uploads district
export const uploadDistrict = mutation({
  args: {
    playerId: v.id("players"),
    districtName: v.string(),
    photoDataUrl: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      districtName: args.districtName,
      photoDataUrl: args.photoDataUrl,
      uploaded: true,
      x: args.x,
      y: args.y,
    });
  },
});

// Player moves district on map
export const moveDistrict = mutation({
  args: { playerId: v.id("players"), x: v.number(), y: v.number() },
  handler: async (ctx, { playerId, x, y }) => {
    await ctx.db.patch(playerId, { x, y });
  },
});

// Send chat message
export const sendMessage = mutation({
  args: { sessionId: v.id("sessions"), sender: v.string(), text: v.string(), isFacilitator: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", args);
  },
});

// Remove player (on leave)
export const removePlayer = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await ctx.db.delete(playerId);
  },
});
