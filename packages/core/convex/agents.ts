import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all agents with their current status
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50; // Default reasonable limit
    const offset = args.offset ?? 0;

    const all = await ctx.db
      .query("agents")
      .order("desc")
      .take(offset + limit);
    const agents = all.slice(offset);

    return agents;
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
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("degraded"),
    ),
    config: v.optional(
      v.object({
        model: v.optional(v.string()),
        channel: v.optional(v.string()),
      }),
    ),
    workspacePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
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

// Update just the workspace path
export const updateWorkspacePath = mutation({
  args: { agentId: v.id("agents"), workspacePath: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { workspacePath: args.workspacePath });
  },
});

// Set default workspace paths for existing agents
export const setDefaultPaths = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const defaults: Record<string, string> = {
      mimizuku: "/home/moltbot/mimizuku",
      vanilla: "/home/moltbot/vanilla",
    };
    for (const agent of agents) {
      if (!agent.workspacePath) {
        const path =
          defaults[agent.name] ?? `/home/moltbot/${agent.name}`;
        await ctx.db.patch(agent._id, { workspacePath: path });
      }
    }
  },
});

// Record a heartbeat
export const heartbeat = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("degraded"),
    ),
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

// Get agent health summary (optimized — bounded scans)
export const healthSummary = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Get recent sessions — limit scan to 100, count active in-place
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(100);

    let activeSessions = 0;
    for (const s of sessions) {
      if (s.isActive) activeSessions++;
    }

    // Get recent cost records (last hour only, already indexed)
    const recentCosts = await ctx.db
      .query("costRecords")
      .withIndex("by_agent_time", (q) =>
        q.eq("agentId", args.agentId).gte("timestamp", oneHourAgo),
      )
      .take(500);

    const costLastHour = recentCosts.reduce((sum, r) => sum + r.cost, 0);
    const tokensLastHour = recentCosts.reduce(
      (sum, r) => sum + r.inputTokens + r.outputTokens,
      0,
    );

    // Count recent errors — take 50 recent activities and filter by time + type
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(50);

    let errorCount = 0;
    for (const a of recentActivities) {
      if (a.type === "error" && a._creationTime > oneHourAgo) errorCount++;
    }

    return {
      agent,
      activeSessions,
      totalSessions: sessions.length,
      costLastHour: Math.round(costLastHour * 10000) / 10000,
      tokensLastHour,
      errorCount,
      isHealthy: agent.status === "online" && errorCount < 5,
    };
  },
});
