import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  contracts: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileSize: v.number(),
    status: v.union(
      v.literal("uploading"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("error")
    ),
    extractedText: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  traps: defineTable({
    contractId: v.id("contracts"),
    userId: v.id("users"),
    title: v.string(),
    severity: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    clause: v.string(),
    explanation: v.string(),
    recommendation: v.string(),
    createdAt: v.number(),
  })
    .index("by_contract", ["contractId"])
    .index("by_user", ["userId"]),
});
