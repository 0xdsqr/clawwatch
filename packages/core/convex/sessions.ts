import { v } from "convex/values";
import { query } from "./_generated/server";

// List sessions for a specific agent.
export const byAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});
