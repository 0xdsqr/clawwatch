import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Record an activity
export const record = mutation({
  args: {
    agentId: v.id("agents"),
    type: v.union(
      v.literal("message_sent"),
      v.literal("message_received"),
      v.literal("tool_call"),
      v.literal("session_started"),
      v.literal("session_ended"),
      v.literal("error"),
      v.literal("heartbeat"),
      v.literal("alert_fired"),
    ),
    summary: v.string(),
    details: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    sessionKey: v.optional(v.string()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});

// Get recent activities for an agent
export const byAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Get all recent activities across agents
export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(args.limit ?? 100);

    // Enrich with agent names
    const agentIds = [...new Set(activities.map((a) => a.agentId))];
    const agents = await Promise.all(agentIds.map((id) => ctx.db.get(id)));
    const agentMap = new Map(
      agents.filter(Boolean).map((a) => [a!._id, a!.name]),
    );

    return activities.map((activity) => ({
      ...activity,
      agentName: agentMap.get(activity.agentId) ?? "Unknown",
    }));
  },
});
