import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record a cost entry
export const record = mutation({
  args: {
    agentId: v.id("agents"),
    sessionKey: v.optional(v.string()),
    provider: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cacheReadTokens: v.optional(v.number()),
    cacheWriteTokens: v.optional(v.number()),
    cost: v.number(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("costRecords", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get cost breakdown by time range
export const byTimeRange = query({
  args: {
    agentId: v.optional(v.id("agents")),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.agentId) {
      return await ctx.db
        .query("costRecords")
        .withIndex("by_agent_time", (q) =>
          q
            .eq("agentId", args.agentId!)
            .gte("timestamp", args.startTime)
            .lte("timestamp", args.endTime),
        )
        .take(1000); // Add reasonable limit
    }

    // All agents
    return await ctx.db
      .query("costRecords")
      .withIndex("by_period", (q) =>
        q
          .eq("period", "hourly")
          .gte("timestamp", args.startTime)
          .lte("timestamp", args.endTime),
      )
      .take(1000); // Add reasonable limit
  },
});

// Get cost summary — today, this week, this month
export const summary = query({
  args: { agentId: v.optional(v.id("agents")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const allRecords = args.agentId
      ? await ctx.db
          .query("costRecords")
          .withIndex("by_agent_time", (q) =>
            q
              .eq("agentId", args.agentId!)
              .gte("timestamp", monthStart.getTime()),
          )
          .collect()
      : await ctx.db
          .query("costRecords")
          .withIndex("by_period", (q) =>
            q.eq("period", "hourly").gte("timestamp", monthStart.getTime()),
          )
          .collect();

    const today = allRecords.filter((r) => r.timestamp >= todayStart.getTime());
    const week = allRecords.filter((r) => r.timestamp >= weekStart.getTime());

    const sum = (records: typeof allRecords) => ({
      cost: Math.round(records.reduce((s, r) => s + r.cost, 0) * 10000) / 10000,
      inputTokens: records.reduce((s, r) => s + r.inputTokens, 0),
      outputTokens: records.reduce((s, r) => s + r.outputTokens, 0),
      requests: records.length,
    });

    return {
      today: sum(today),
      week: sum(week),
      month: sum(allRecords),
      lastHour: sum(allRecords.filter((r) => r.timestamp >= now - 3600000)),
    };
  },
});

// Get cost over time for charts (hourly buckets)
export const timeSeries = query({
  args: {
    agentId: v.optional(v.id("agents")),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startTime = now - args.hours * 3600000;

    const records = args.agentId
      ? await ctx.db
          .query("costRecords")
          .withIndex("by_agent_time", (q) =>
            q.eq("agentId", args.agentId!).gte("timestamp", startTime),
          )
          .collect()
      : await ctx.db
          .query("costRecords")
          .withIndex("by_period", (q) =>
            q.eq("period", "hourly").gte("timestamp", startTime),
          )
          .collect();

    // Bucket into hours
    const buckets = new Map<
      number,
      { cost: number; tokens: number; requests: number }
    >();
    for (const r of records) {
      const hourKey = Math.floor(r.timestamp / 3600000) * 3600000;
      const bucket = buckets.get(hourKey) ?? {
        cost: 0,
        tokens: 0,
        requests: 0,
      };
      bucket.cost += r.cost;
      bucket.tokens += r.inputTokens + r.outputTokens;
      bucket.requests += 1;
      buckets.set(hourKey, bucket);
    }

    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        ...data,
        cost: Math.round(data.cost * 10000) / 10000,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  },
});
