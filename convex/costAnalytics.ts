import { query } from "./_generated/server";
import { v } from "convex/values";

// Get cost breakdown by provider for a time range
export const byProvider = query({
  args: {
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    const byProvider: Record<
      string,
      {
        provider: string;
        totalCost: number;
        totalInput: number;
        totalOutput: number;
        totalCacheRead: number;
        totalCacheWrite: number;
        requestCount: number;
        models: Record<
          string,
          { model: string; cost: number; input: number; output: number; requests: number }
        >;
      }
    > = {};

    for (const r of records) {
      if (!byProvider[r.provider]) {
        byProvider[r.provider] = {
          provider: r.provider,
          totalCost: 0,
          totalInput: 0,
          totalOutput: 0,
          totalCacheRead: 0,
          totalCacheWrite: 0,
          requestCount: 0,
          models: {},
        };
      }
      const p = byProvider[r.provider];
      p.totalCost += r.cost;
      p.totalInput += r.inputTokens;
      p.totalOutput += r.outputTokens;
      p.totalCacheRead += r.cacheReadTokens ?? 0;
      p.totalCacheWrite += r.cacheWriteTokens ?? 0;
      p.requestCount++;

      if (!p.models[r.model]) {
        p.models[r.model] = { model: r.model, cost: 0, input: 0, output: 0, requests: 0 };
      }
      p.models[r.model].cost += r.cost;
      p.models[r.model].input += r.inputTokens;
      p.models[r.model].output += r.outputTokens;
      p.models[r.model].requests++;
    }

    return Object.values(byProvider).sort((a, b) => b.totalCost - a.totalCost);
  },
});

// Get cost over time bucketed by provider (for stacked charts)
export const costOverTimeByProvider = query({
  args: {
    sinceMs: v.number(),
    bucketMs: v.number(), // e.g. 3600000 for hourly, 86400000 for daily
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    // Bucket by time + provider
    const buckets: Record<string, Record<string, { cost: number; tokens: number; requests: number }>> = {};
    const providers = new Set<string>();

    for (const r of records) {
      const bucketKey = String(Math.floor(r.timestamp / args.bucketMs) * args.bucketMs);
      providers.add(r.provider);

      if (!buckets[bucketKey]) buckets[bucketKey] = {};
      if (!buckets[bucketKey][r.provider]) {
        buckets[bucketKey][r.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      buckets[bucketKey][r.provider].cost += r.cost;
      buckets[bucketKey][r.provider].tokens += r.inputTokens + r.outputTokens;
      buckets[bucketKey][r.provider].requests++;
    }

    // Convert to sorted array
    const result = Object.entries(buckets)
      .map(([ts, providerData]) => ({
        timestamp: Number(ts),
        ...providerData,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { buckets: result, providers: [...providers].sort() };
  },
});

// Get token breakdown over time by model (for stacked charts)
export const tokensOverTimeByModel = query({
  args: {
    sinceMs: v.number(),
    bucketMs: v.number(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    const buckets: Record<string, Record<string, { input: number; output: number; total: number }>> = {};
    const models = new Set<string>();

    for (const r of records) {
      const bucketKey = String(Math.floor(r.timestamp / args.bucketMs) * args.bucketMs);
      models.add(r.model);

      if (!buckets[bucketKey]) buckets[bucketKey] = {};
      if (!buckets[bucketKey][r.model]) {
        buckets[bucketKey][r.model] = { input: 0, output: 0, total: 0 };
      }
      buckets[bucketKey][r.model].input += r.inputTokens;
      buckets[bucketKey][r.model].output += r.outputTokens;
      buckets[bucketKey][r.model].total += r.inputTokens + r.outputTokens;
    }

    const result = Object.entries(buckets)
      .map(([ts, modelData]) => ({
        timestamp: Number(ts),
        ...modelData,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { buckets: result, models: [...models].sort() };
  },
});

// Summary stats with period comparison
export const summary = query({
  args: {
    periodMs: v.number(), // e.g. 86400000 for "today"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const periodStart = now - args.periodMs;
    const prevPeriodStart = periodStart - args.periodMs;

    const currentRecords = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), periodStart))
      .collect();

    const prevRecords = await ctx.db
      .query("costRecords")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), prevPeriodStart),
          q.lt(q.field("timestamp"), periodStart),
        ),
      )
      .collect();

    const sumCost = (records: typeof currentRecords) =>
      records.reduce((s, r) => s + r.cost, 0);
    const sumTokens = (records: typeof currentRecords) =>
      records.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);

    const currentCost = sumCost(currentRecords);
    const prevCost = sumCost(prevRecords);
    const currentTokens = sumTokens(currentRecords);
    const prevTokens = sumTokens(prevRecords);

    const costChange = prevCost > 0 ? ((currentCost - prevCost) / prevCost) * 100 : 0;
    const tokenChange = prevTokens > 0 ? ((currentTokens - prevTokens) / prevTokens) * 100 : 0;
    const avgCostPerRequest = currentRecords.length > 0 ? currentCost / currentRecords.length : 0;

    return {
      currentCost: Math.round(currentCost * 10000) / 10000,
      prevCost: Math.round(prevCost * 10000) / 10000,
      costChangePercent: Math.round(costChange * 10) / 10,
      currentTokens,
      prevTokens,
      tokenChangePercent: Math.round(tokenChange * 10) / 10,
      requestCount: currentRecords.length,
      avgCostPerRequest: Math.round(avgCostPerRequest * 10000) / 10000,
      inputTokens: currentRecords.reduce((s, r) => s + r.inputTokens, 0),
      outputTokens: currentRecords.reduce((s, r) => s + r.outputTokens, 0),
    };
  },
});

// Cost records table (paginated, sortable)
export const table = query({
  args: {
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .order("desc")
      .take(args.limit ?? 200);

    // Enrich with agent names
    const agentIds = [...new Set(records.map((r) => r.agentId))];
    const agents = await Promise.all(agentIds.map((id) => ctx.db.get(id)));
    const agentMap = new Map<string, string>();
    for (const a of agents) {
      if (a && "_id" in a && "name" in a) {
        agentMap.set(a._id as string, (a as any).name);
      }
    }

    return records.map((r) => ({
      ...r,
      agentName: agentMap.get(r.agentId as string) ?? "Unknown",
    }));
  },
});
