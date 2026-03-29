import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByContract = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const contract = await ctx.db.get(args.contractId);
    if (!contract || contract.userId !== userId) return [];

    return await ctx.db
      .query("traps")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
  },
});

export const create = mutation({
  args: {
    contractId: v.id("contracts"),
    title: v.string(),
    severity: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    clause: v.string(),
    explanation: v.string(),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("traps", {
      contractId: args.contractId,
      userId,
      title: args.title,
      severity: args.severity,
      clause: args.clause,
      explanation: args.explanation,
      recommendation: args.recommendation,
      createdAt: Date.now(),
    });
  },
});
