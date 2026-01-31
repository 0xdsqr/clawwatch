import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all agents with their current status
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// Get a single agent by ID
export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Register or update an agent
export const upsert = mutation({
  args: {
    name: v.string(),
    gatewayUrl: v.string(),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("degraded")),
    config: v.optional(v.object({
      model: v.optional(v.string()),
      channel: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastSeen: now,
        lastHeartbeat: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      ...args,
      lastHeartbeat: now,
      lastSeen: now,
    });
  },
});

// Record a heartbeat
export const heartbeat = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("degraded")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.agentId, {
      status: args.status,
      lastHeartbeat: now,
      lastSeen: now,
    });
  },
});

// Mark an agent offline
export const markOffline = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { status: "offline" });
  },
});

// Get agent health summary
export const healthSummary = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Get recent sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const activeSessions = sessions.filter((s) => s.isActive);

    // Get recent cost records
    const recentCosts = await ctx.db
      .query("costRecords")
      .withIndex("by_agent_time", (q) =>
        q.eq("agentId", args.agentId).gte("timestamp", oneHourAgo)
      )
      .collect();

    const costLastHour = recentCosts.reduce((sum, r) => sum + r.cost, 0);
    const tokensLastHour = recentCosts.reduce(
      (sum, r) => sum + r.inputTokens + r.outputTokens,
      0
    );

    // Get recent errors
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(100);

    const recentErrors = recentActivities.filter(
      (a) => a.type === "error" && a._creationTime > oneHourAgo
    );

    return {
      agent,
      activeSessions: activeSessions.length,
      totalSessions: sessions.length,
      costLastHour: Math.round(costLastHour * 10000) / 10000,
      tokensLastHour,
      errorCount: recentErrors.length,
      isHealthy: agent.status === "online" && recentErrors.length < 5,
    };
  },
});
