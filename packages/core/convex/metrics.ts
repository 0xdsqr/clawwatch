import { v } from "convex/values";
import { query } from "./_generated/server";

// Get health check time series for metrics charts
export const healthTimeSeries = query({
  args: {
    hours: v.number(),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now() - args.hours * 3600000;

    let checks;
    if (args.agentId) {
      checks = await ctx.db
        .query("healthChecks")
        .withIndex("by_agent_time", (q) =>
          q.eq("agentId", args.agentId!).gte("timestamp", startTime),
        )
        .collect();
    } else {
      // Get all health checks in range — collect from all agents
      const agents = await ctx.db.query("agents").collect();
      checks = [];
      for (const agent of agents) {
        const agentChecks = await ctx.db
          .query("healthChecks")
          .withIndex("by_agent_time", (q) => q.eq("agentId", agent._id).gte("timestamp", startTime))
          .collect();
        checks.push(...agentChecks);
      }
    }

    // Sort by timestamp
    checks.sort((a, b) => a.timestamp - b.timestamp);

    // Return raw points — let the frontend bucket them
    return checks.map((c) => ({
      timestamp: c.timestamp,
      responseTimeMs: c.responseTimeMs ?? 0,
      activeSessionCount: c.activeSessionCount,
      errorCount: c.errorCount,
      isHealthy: c.isHealthy,
    }));
  },
});

// Get cost time series for token throughput
export const costTimeSeries = query({
  args: {
    hours: v.number(),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now() - args.hours * 3600000;

    let records;
    if (args.agentId) {
      records = await ctx.db
        .query("costRecords")
        .withIndex("by_agent_time", (q) =>
          q.eq("agentId", args.agentId!).gte("timestamp", startTime),
        )
        .collect();
    } else {
      records = await ctx.db
        .query("costRecords")
        .withIndex("by_period", (q) => q.eq("period", "hourly").gte("timestamp", startTime))
        .collect();
    }

    records.sort((a, b) => a.timestamp - b.timestamp);

    return records.map((r) => ({
      timestamp: r.timestamp,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: r.cost,
      model: r.model,
    }));
  },
});

// Get activity counts for request rate
export const activityTimeSeries = query({
  args: {
    hours: v.number(),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now() - args.hours * 3600000;

    let activities;
    if (args.agentId) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_agent_time", (q) => q.eq("agentId", args.agentId!).gte("timestamp", startTime))
        .collect();
    } else {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_time", (q) => q.gte("timestamp", startTime))
        .collect();
    }

    // Bucket into 15-min windows
    const bucketMs = 15 * 60 * 1000;
    const buckets = new Map<
      number,
      { total: number; errors: number; toolCalls: number; messages: number }
    >();

    for (const a of activities) {
      const ts = a.timestamp ?? a._creationTime;
      const key = Math.floor(ts / bucketMs) * bucketMs;
      const bucket = buckets.get(key) ?? {
        total: 0,
        errors: 0,
        toolCalls: 0,
        messages: 0,
      };
      bucket.total++;
      if (a.type === "error") bucket.errors++;
      if (a.type === "tool_call") bucket.toolCalls++;
      if (a.type === "message_sent" || a.type === "message_received") bucket.messages++;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({ timestamp, ...data }))
      .sort((a, b) => a.timestamp - b.timestamp);
  },
});
