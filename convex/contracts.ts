import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("contracts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const contract = await ctx.db.get(args.id);
    if (!contract || contract.userId !== userId) return null;
    return contract;
  },
});

export const create = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("contracts", {
      userId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      status: "uploading",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("contracts"),
    status: v.union(
      v.literal("uploading"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("error")
    ),
    extractedText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contract = await ctx.db.get(args.id);
    if (!contract || contract.userId !== userId) {
      throw new Error("Contract not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      extractedText: args.extractedText,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("contracts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contract = await ctx.db.get(args.id);
    if (!contract || contract.userId !== userId) {
      throw new Error("Contract not found");
    }

    // Delete associated traps
    const traps = await ctx.db
      .query("traps")
      .withIndex("by_contract", (q) => q.eq("contractId", args.id))
      .collect();

    for (const trap of traps) {
      await ctx.db.delete(trap._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const analyzeContract = action({
  args: {
    contractId: v.id("contracts"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Update status to analyzing
    await ctx.runMutation(api.contracts.updateStatus, {
      id: args.contractId,
      status: "analyzing",
      extractedText: args.text,
    });

    // Simulate AI analysis with realistic contract traps
    const contractTraps = analyzeContractText(args.text);

    // Add traps to database
    for (const trap of contractTraps) {
      await ctx.runMutation(api.traps.create, {
        contractId: args.contractId,
        title: trap.title,
        severity: trap.severity,
        clause: trap.clause,
        explanation: trap.explanation,
        recommendation: trap.recommendation,
      });
    }

    // Update status to completed
    await ctx.runMutation(api.contracts.updateStatus, {
      id: args.contractId,
      status: "completed",
    });
  },
});

interface TrapResult {
  title: string;
  severity: "high" | "medium" | "low";
  clause: string;
  explanation: string;
  recommendation: string;
}

function analyzeContractText(text: string): TrapResult[] {
  const traps: TrapResult[] = [];
  const lowerText = text.toLowerCase();

  // Auto-renewal clauses
  if (lowerText.includes("auto") && (lowerText.includes("renew") || lowerText.includes("renewal"))) {
    traps.push({
      title: "Automatic Renewal Clause",
      severity: "high",
      clause: "Contract automatically renews unless cancelled within specified notice period",
      explanation: "This contract will automatically renew for another term unless you actively cancel it. Many people forget to cancel and end up locked in for another year.",
      recommendation: "Set a calendar reminder 60 days before the renewal date. Consider negotiating to remove auto-renewal or shorten the notice period.",
    });
  }

  // Termination penalties
  if (lowerText.includes("terminat") && (lowerText.includes("fee") || lowerText.includes("penalty") || lowerText.includes("charge"))) {
    traps.push({
      title: "Early Termination Penalty",
      severity: "high",
      clause: "Early termination results in financial penalties",
      explanation: "Breaking this contract early could cost you significant money. Termination fees can sometimes equal the remaining contract value.",
      recommendation: "Negotiate a cap on termination fees or include specific conditions under which you can terminate without penalty.",
    });
  }

  // Arbitration clauses
  if (lowerText.includes("arbitrat") || lowerText.includes("dispute resolution")) {
    traps.push({
      title: "Mandatory Arbitration",
      severity: "medium",
      clause: "All disputes must be resolved through binding arbitration",
      explanation: "You're giving up your right to sue in court. Arbitration can be expensive and often favors the company that included this clause.",
      recommendation: "Try to negotiate for the option of small claims court for smaller disputes, or ensure arbitration costs are shared fairly.",
    });
  }

  // Non-compete clauses
  if (lowerText.includes("non-compete") || lowerText.includes("noncompete") || (lowerText.includes("compete") && lowerText.includes("restrict"))) {
    traps.push({
      title: "Non-Compete Agreement",
      severity: "high",
      clause: "Restrictions on working for competitors after contract ends",
      explanation: "This could limit your career options after leaving. Non-competes can prevent you from working in your field for months or years.",
      recommendation: "Negotiate the scope (geographic area, time period, definition of 'competitor') to be as narrow as possible.",
    });
  }

  // Liability limitations
  if (lowerText.includes("liabil") && (lowerText.includes("limit") || lowerText.includes("cap") || lowerText.includes("waiv"))) {
    traps.push({
      title: "Limited Liability Cap",
      severity: "medium",
      clause: "Company's liability is capped at a specific amount",
      explanation: "If something goes wrong, the company's financial responsibility to you is limited. This could leave you without adequate compensation for damages.",
      recommendation: "Ensure the liability cap is reasonable relative to the contract value and potential damages you could suffer.",
    });
  }

  // Indemnification
  if (lowerText.includes("indemnif") || lowerText.includes("hold harmless")) {
    traps.push({
      title: "Broad Indemnification Clause",
      severity: "medium",
      clause: "You agree to indemnify and hold the other party harmless",
      explanation: "You might be responsible for legal costs even when the other party is at fault. This is essentially agreeing to pay for their mistakes.",
      recommendation: "Limit indemnification to your own negligence or willful misconduct, not the other party's actions.",
    });
  }

  // Intellectual property assignment
  if (lowerText.includes("intellectual property") || (lowerText.includes("work") && lowerText.includes("hire")) || lowerText.includes("assign") && lowerText.includes("rights")) {
    traps.push({
      title: "IP Assignment Clause",
      severity: "medium",
      clause: "All intellectual property created belongs to the company",
      explanation: "Anything you create during the contract—even outside work hours—might belong to them. This can affect side projects and future opportunities.",
      recommendation: "Carve out exceptions for work done outside business hours, using personal resources, and unrelated to company business.",
    });
  }

  // Confidentiality/NDA
  if (lowerText.includes("confidential") || lowerText.includes("non-disclosure") || lowerText.includes("nda")) {
    traps.push({
      title: "Broad Confidentiality Terms",
      severity: "low",
      clause: "Strict confidentiality requirements on all information",
      explanation: "Overly broad NDAs can restrict your ability to discuss your work experience or even share publicly available information.",
      recommendation: "Ensure the definition of 'confidential information' is specific and excludes publicly available information.",
    });
  }

  // Payment terms
  if ((lowerText.includes("payment") || lowerText.includes("invoice")) && (lowerText.includes("30") || lowerText.includes("60") || lowerText.includes("90"))) {
    traps.push({
      title: "Extended Payment Terms",
      severity: "low",
      clause: "Payment due 30-90 days after invoice",
      explanation: "Long payment terms mean you're essentially providing interest-free financing to the other party.",
      recommendation: "Negotiate for Net 15 or Net 30 payment terms, and consider adding late payment penalties.",
    });
  }

  // Force majeure
  if (lowerText.includes("force majeure") || (lowerText.includes("act of god") || lowerText.includes("circumstances beyond"))) {
    traps.push({
      title: "Broad Force Majeure Clause",
      severity: "low",
      clause: "Contract can be suspended for events beyond control",
      explanation: "While standard, overly broad force majeure clauses can be abused to avoid contractual obligations.",
      recommendation: "Ensure force majeure has a time limit and both parties have termination rights if it extends too long.",
    });
  }

  // Unilateral amendment
  if (lowerText.includes("modify") && (lowerText.includes("sole discretion") || lowerText.includes("at any time"))) {
    traps.push({
      title: "Unilateral Amendment Rights",
      severity: "high",
      clause: "Company can change terms at their sole discretion",
      explanation: "The other party can change the contract terms without your consent. This means what you signed might not be what you're bound to.",
      recommendation: "Require mutual consent for any amendments, or at minimum, proper notice and the right to terminate if terms change.",
    });
  }

  // If no specific traps found, provide general analysis
  if (traps.length === 0) {
    traps.push({
      title: "Contract Review Complete",
      severity: "low",
      clause: "No critical issues automatically detected",
      explanation: "Our automated scan didn't detect common contract traps, but this doesn't mean the contract is perfect. Legal documents often contain subtle issues.",
      recommendation: "Consider having a lawyer review the contract, especially for high-value agreements or if anything seems unclear.",
    });
  }

  return traps;
}
