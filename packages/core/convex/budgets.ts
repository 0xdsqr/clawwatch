import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all budgets
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("budgets").collect();
  },
});

// Create a budget
export const create = mutation({
  args: {
    agentId: v.optional(v.id("agents")),
    name: v.string(),
    period: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    limitDollars: v.number(),
    hardStop: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const resetAt = calculateNextReset(args.period, now);

    return await ctx.db.insert("budgets", {
      ...args,
      currentSpend: 0,
      resetAt,
      isActive: true,
    });
  },
});

// Update a budget
export const update = mutation({
  args: {
    id: v.id("budgets"),
    name: v.optional(v.string()),
    limitDollars: v.optional(v.number()),
    hardStop: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

// Add spend to a budget
export const addSpend = mutation({
  args: {
    budgetId: v.id("budgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");

    const now = Date.now();

    // Check if we need to reset
    if (now >= budget.resetAt) {
      await ctx.db.patch(args.budgetId, {
        currentSpend: args.amount,
        resetAt: calculateNextReset(budget.period, now),
      });
      return {
        exceeded: false,
        currentSpend: args.amount,
        limit: budget.limitDollars,
      };
    }

    const newSpend = budget.currentSpend + args.amount;
    await ctx.db.patch(args.budgetId, { currentSpend: newSpend });

    const exceeded = newSpend >= budget.limitDollars;
    return {
      exceeded,
      currentSpend: newSpend,
      limit: budget.limitDollars,
      hardStop: budget.hardStop,
    };
  },
});

// Delete a budget
export const remove = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

function calculateNextReset(period: string, now: number): number {
  const date = new Date(now);
  switch (period) {
    case "hourly":
      date.setHours(date.getHours() + 1, 0, 0, 0);
      break;
    case "daily":
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      date.setDate(date.getDate() + (7 - date.getDay()));
      date.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1, 1);
      date.setHours(0, 0, 0, 0);
      break;
  }
  return date.getTime();
}
