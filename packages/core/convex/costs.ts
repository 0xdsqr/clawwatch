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
        .order("desc").take(500);
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
      .order("desc").take(500);
  },
});

// Get cost summary — reads from pre-aggregated statsCache for instant response
export const summary = query({
  args: { agentId: v.optional(v.id("agents")) },
  handler: async (ctx) => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentHourKey = Math.floor(now / 3600000) * 3600000;
    const prevHourKey = currentHourKey - 3600000;

    const zero = { cost: 0, inputTokens: 0, outputTokens: 0, requests: 0 };

    // Read today's cache
    const todayCache = await ctx.db
      .query("statsCache")
      .withIndex("by_key", (q) => q.eq("key", `today:${todayStr}`))
      .first();

    // Read last 2 hour caches for "last hour" approximation
    const thisHourCache = await ctx.db
      .query("statsCache")
      .withIndex("by_key", (q) => q.eq("key", `hour:${currentHourKey}`))
      .first();
    const prevHourCache = await ctx.db
      .query("statsCache")
      .withIndex("by_key", (q) => q.eq("key", `hour:${prevHourKey}`))
      .first();

    // Sum recent days for week/month from statsCache
    const weekDays: (typeof todayCache)[] = [];
    const monthDays: (typeof todayCache)[] = [];
    for (let i = 0; i < 31; i++) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      const dayCache =
        i === 0
          ? todayCache
          : await ctx.db
              .query("statsCache")
              .withIndex("by_key", (q) => q.eq("key", `today:${d}`))
              .first();
      if (dayCache) {
        if (i < 7) weekDays.push(dayCache);
        monthDays.push(dayCache);
      }
    }

    const sumCaches = (caches: (typeof todayCache)[]) => {
      const result = { ...zero };
      for (const c of caches) {
        if (!c) continue;
        result.cost += c.cost;
        result.inputTokens += c.inputTokens;
        result.outputTokens += c.outputTokens;
        result.requests += c.requests;
      }
      result.cost = Math.round(result.cost * 10000) / 10000;
      return result;
    };

    return {
      today: todayCache
        ? {
            cost: Math.round(todayCache.cost * 10000) / 10000,
            inputTokens: todayCache.inputTokens,
            outputTokens: todayCache.outputTokens,
            requests: todayCache.requests,
          }
        : zero,
      lastHour: sumCaches([thisHourCache, prevHourCache]),
      week: sumCaches(weekDays),
      month: sumCaches(monthDays),
    };
  },
});

// Cost breakdown by agent
export const byAgent = query({
  args: { startTime: v.number(), endTime: v.number() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .withIndex("by_period", (q) =>
        q
          .eq("period", "hourly")
          .gte("timestamp", args.startTime)
          .lte("timestamp", args.endTime),
      )
      .order("desc").take(500);

    const agentTotals = new Map<
      string,
      { cost: number; tokens: number; requests: number }
    >();
    for (const r of records) {
      const existing = agentTotals.get(r.agentId) ?? {
        cost: 0,
        tokens: 0,
        requests: 0,
      };
      existing.cost += r.cost;
      existing.tokens += r.inputTokens + r.outputTokens;
      existing.requests += 1;
      agentTotals.set(r.agentId, existing);
    }

    // Enrich with agent names
    const results = [];
    for (const [agentId, data] of agentTotals) {
      const agent = await ctx.db.get(agentId as any);
      results.push({
        agentId,
        agentName: (agent as any)?.name ?? "Unknown",
        ...data,
      });
    }
    return results.sort((a, b) => b.cost - a.cost);
  },
});

// Detailed model breakdown
export const modelBreakdown = query({
  args: { startTime: v.number(), endTime: v.number() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .withIndex("by_period", (q) =>
        q
          .eq("period", "hourly")
          .gte("timestamp", args.startTime)
          .lte("timestamp", args.endTime),
      )
      .order("desc").take(500);

    const modelTotals = new Map<
      string,
      {
        cost: number;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
        requests: number;
      }
    >();
    for (const r of records) {
      const existing = modelTotals.get(r.model) ?? {
        cost: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        requests: 0,
      };
      existing.cost += r.cost;
      existing.inputTokens += r.inputTokens;
      existing.outputTokens += r.outputTokens;
      existing.cacheReadTokens += r.cacheReadTokens ?? 0;
      existing.cacheWriteTokens += r.cacheWriteTokens ?? 0;
      existing.requests += 1;
      modelTotals.set(r.model, existing);
    }

    return Array.from(modelTotals.entries())
      .map(([model, data]) => ({
        model,
        ...data,
        avgCostPerRequest: data.requests > 0 ? data.cost / data.requests : 0,
        costPer1KTokens:
          data.inputTokens + data.outputTokens > 0
            ? (data.cost / (data.inputTokens + data.outputTokens)) * 1000
            : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  },
});

// Top sessions by cost
export const topSessions = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .withIndex("by_period", (q) =>
        q
          .eq("period", "hourly")
          .gte("timestamp", args.startTime)
          .lte("timestamp", args.endTime),
      )
      .order("desc").take(500);

    const sessionTotals = new Map<
      string,
      {
        cost: number;
        tokens: number;
        requests: number;
        model: string;
        agentId: string;
        lastSeen: number;
      }
    >();
    for (const r of records) {
      const key = r.sessionKey ?? "unknown";
      const existing = sessionTotals.get(key) ?? {
        cost: 0,
        tokens: 0,
        requests: 0,
        model: r.model,
        agentId: r.agentId,
        lastSeen: 0,
      };
      existing.cost += r.cost;
      existing.tokens += r.inputTokens + r.outputTokens;
      existing.requests += 1;
      existing.lastSeen = Math.max(existing.lastSeen, r.timestamp);
      sessionTotals.set(key, existing);
    }

    const results = [];
    for (const [sessionKey, data] of sessionTotals) {
      const agent = await ctx.db.get(data.agentId as any);
      results.push({
        sessionKey,
        agentName: (agent as any)?.name ?? "Unknown",
        ...data,
      });
    }
    return results.sort((a, b) => b.cost - a.cost).slice(0, args.limit ?? 10);
  },
});

// Get cost over time for charts (hourly buckets) — reads from statsCache
export const timeSeries = query({
  args: {
    agentId: v.optional(v.id("agents")),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentHourKey = Math.floor(now / 3600000) * 3600000;
    const results = [];

    // Read hour cache entries for the requested range
    for (let i = 0; i < args.hours; i++) {
      const hourKey = currentHourKey - i * 3600000;
      const cached = await ctx.db
        .query("statsCache")
        .withIndex("by_key", (q) => q.eq("key", `hour:${hourKey}`))
        .first();

      if (cached) {
        results.push({
          timestamp: hourKey,
          cost: Math.round(cached.cost * 10000) / 10000,
          tokens: cached.inputTokens + cached.outputTokens,
          requests: cached.requests,
        });
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  },
});
