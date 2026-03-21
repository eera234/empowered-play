import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    code: v.string(),
    phase: v.string(), // waiting | card_reveal | building | uploading | city_map | constraint_reveal | debrief | complete
    scenario: v.string(),
  }).index("by_code", ["code"]),

  players: defineTable({
    sessionId: v.id("sessions"),
    name: v.string(),
    cardIndex: v.optional(v.number()),
    cardSent: v.boolean(),
    uploaded: v.boolean(),
    districtName: v.optional(v.string()),
    photoDataUrl: v.optional(v.string()),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    isFacilitator: v.boolean(),
  }).index("by_session", ["sessionId"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    sender: v.string(),
    text: v.string(),
    isFacilitator: v.boolean(),
  }).index("by_session", ["sessionId"]),
});
