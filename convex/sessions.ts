import { query } from "./_generated/server";
import { v } from "convex/values";

// List sessions with filters and pagination
export const list = query({
  args: {
    agentId: v.optional(v.id("agents")),
    isActive: v.optional(v.boolean()),
    sinceMs: v.optional(v.number()),
    untilMs: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // lastActivity cursor for pagination
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let sessions;
    if (args.agentId) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId!))
        .order("desc")
        .collect();
    } else if (args.isActive !== undefined) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .order("desc")
        .collect();
    } else {
      sessions = await ctx.db.query("sessions").order("desc").collect();
    }

    // Apply filters client-side (Convex doesn't support compound filters on different indexes)
    let filtered = sessions;

    if (args.agentId && args.isActive !== undefined) {
      filtered = filtered.filter((s) => s.isActive === args.isActive);
    }
    if (args.sinceMs) {
      filtered = filtered.filter((s) => s.startedAt >= args.sinceMs!);
    }
    if (args.untilMs) {
      filtered = filtered.filter((s) => s.startedAt <= args.untilMs!);
    }
    if (args.cursor) {
      filtered = filtered.filter((s) => s.lastActivity < args.cursor!);
    }

    const page = filtered.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = hasMore ? page.slice(0, limit) : page;

    // Enrich with agent names
    const agentIds = [...new Set(items.map((s) => s.agentId))];
    const agents = await Promise.all(agentIds.map((id) => ctx.db.get(id)));
    const agentMap = new Map<string, string>();
    for (const a of agents) {
      if (a && "_id" in a && "name" in a) {
        agentMap.set(a._id as string, a.name);
      }
    }

    return {
      items: items.map((s) => ({
        ...s,
        agentName: agentMap.get(s.agentId as string) ?? "Unknown",
        duration: s.isActive
          ? Date.now() - s.startedAt
          : s.lastActivity - s.startedAt,
      })),
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.lastActivity : undefined,
    };
  },
});

// Get session detail by sessionKey
export const detail = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("sessionKey"), args.sessionKey))
      .first();

    if (!session) return null;

    // Get agent name
    const agent = await ctx.db.get(session.agentId);
    const agentName = agent ? agent.name : "Unknown";

    // Get cost records for this session
    const costRecords = await ctx.db
      .query("costRecords")
      .filter((q) => q.eq(q.field("sessionKey"), args.sessionKey))
      .collect();

    // Get activities for this session
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", session.agentId))
      .order("desc")
      .collect();

    const sessionActivities = activities.filter(
      (a) => a.sessionKey === args.sessionKey,
    );

    const toolCalls = sessionActivities.filter(
      (a) => a.type === "tool_call",
    ).length;
    const messages =
      sessionActivities.filter(
        (a) => a.type === "message_sent" || a.type === "message_received",
      ).length;
    const errors = sessionActivities.filter(
      (a) => a.type === "error",
    ).length;

    // Build cost timeline (bucket by 5-min intervals)
    const bucketMs = 5 * 60 * 1000;
    const costTimeline: Array<{
      timestamp: number;
      cost: number;
      tokens: number;
    }> = [];
    const bucketMap = new Map<
      number,
      { cost: number; tokens: number }
    >();

    for (const r of costRecords) {
      const key = Math.floor(r.timestamp / bucketMs) * bucketMs;
      const bucket = bucketMap.get(key) ?? { cost: 0, tokens: 0 };
      bucket.cost += r.cost;
      bucket.tokens += r.inputTokens + r.outputTokens;
      bucketMap.set(key, bucket);
    }

    for (const [timestamp, data] of bucketMap) {
      costTimeline.push({
        timestamp,
        cost: Math.round(data.cost * 10000) / 10000,
        tokens: data.tokens,
      });
    }
    costTimeline.sort((a, b) => a.timestamp - b.timestamp);

    return {
      ...session,
      agentName,
      duration: session.isActive
        ? Date.now() - session.startedAt
        : session.lastActivity - session.startedAt,
      toolCalls,
      messages,
      errors,
      costTimeline,
      costRecords: costRecords.length,
    };
  },
});

// Aggregation stats across all sessions
export const stats = query({
  args: {
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db.query("sessions").collect();

    if (args.sinceMs) {
      sessions = sessions.filter((s) => s.startedAt >= args.sinceMs!);
    }

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.isActive).length;
    const totalCost = sessions.reduce((s, r) => s + r.estimatedCost, 0);
    const totalTokens = sessions.reduce((s, r) => s + r.totalTokens, 0);

    // Cost distribution buckets for histogram
    const costBuckets: Array<{ range: string; count: number; min: number; max: number }> = [];
    const costs = sessions.map((s) => s.estimatedCost).sort((a, b) => a - b);

    if (costs.length > 0) {
      const ranges = [
        { label: "$0", min: 0, max: 0.001 },
        { label: "$0-0.01", min: 0.001, max: 0.01 },
        { label: "$0.01-0.05", min: 0.01, max: 0.05 },
        { label: "$0.05-0.10", min: 0.05, max: 0.1 },
        { label: "$0.10-0.50", min: 0.1, max: 0.5 },
        { label: "$0.50-1.00", min: 0.5, max: 1.0 },
        { label: "$1.00-5.00", min: 1.0, max: 5.0 },
        { label: "$5.00+", min: 5.0, max: Infinity },
      ];

      for (const range of ranges) {
        const count = costs.filter(
          (c) => c >= range.min && c < range.max,
        ).length;
        if (count > 0) {
          costBuckets.push({
            range: range.label,
            count,
            min: range.min,
            max: range.max,
          });
        }
      }
    }

    // Top sessions by cost
    const topByCost = [...sessions]
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 10);

    // Top sessions by duration
    const withDuration = sessions.map((s) => ({
      ...s,
      duration: s.isActive
        ? Date.now() - s.startedAt
        : s.lastActivity - s.startedAt,
    }));
    const topByDuration = [...withDuration]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Top sessions by tokens
    const topByTokens = [...sessions]
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10);

    // Enrich all top lists with agent names
    const allTopIds = new Set<string>();
    for (const s of [...topByCost, ...topByDuration, ...topByTokens]) {
      allTopIds.add(s.agentId as string);
    }
    const agents = await Promise.all(
      [...allTopIds].map((id) => ctx.db.get(id as any)),
    );
    const agentMap = new Map<string, string>();
    for (const a of agents) {
      if (a && "_id" in a && "name" in a) {
        agentMap.set(a._id as string, a.name);
      }
    }

    const enrich = <T extends { agentId: any }>(items: T[]) =>
      items.map((s) => ({
        ...s,
        agentName: agentMap.get(s.agentId as string) ?? "Unknown",
      }));

    return {
      totalSessions,
      activeSessions,
      totalCost: Math.round(totalCost * 10000) / 10000,
      totalTokens,
      avgCostPerSession:
        totalSessions > 0
          ? Math.round((totalCost / totalSessions) * 10000) / 10000
          : 0,
      costDistribution: costBuckets,
      topByCost: enrich(topByCost),
      topByDuration: enrich(
        topByDuration.map((s) => ({
          ...s,
          duration: s.duration,
        })),
      ),
      topByTokens: enrich(topByTokens),
    };
  },
});
