import { query } from "./_generated/server";
import { v } from "convex/values";

// Detailed per-provider breakdown with model-level stats
export const providerBreakdown = query({
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
        earliestRecord: number;
        latestRecord: number;
        models: Record<
          string,
          {
            model: string;
            cost: number;
            input: number;
            output: number;
            cacheRead: number;
            requests: number;
          }
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
          earliestRecord: r.timestamp,
          latestRecord: r.timestamp,
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
      if (r.timestamp < p.earliestRecord) p.earliestRecord = r.timestamp;
      if (r.timestamp > p.latestRecord) p.latestRecord = r.timestamp;

      if (!p.models[r.model]) {
        p.models[r.model] = {
          model: r.model,
          cost: 0,
          input: 0,
          output: 0,
          cacheRead: 0,
          requests: 0,
        };
      }
      p.models[r.model].cost += r.cost;
      p.models[r.model].input += r.inputTokens;
      p.models[r.model].output += r.outputTokens;
      p.models[r.model].cacheRead += r.cacheReadTokens ?? 0;
      p.models[r.model].requests++;
    }

    return Object.values(byProvider).sort((a, b) => b.totalCost - a.totalCost);
  },
});

// Model comparison table — all models with cost/token metrics
export const modelComparison = query({
  args: {
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    const byModel: Record<
      string,
      {
        model: string;
        provider: string;
        totalCost: number;
        totalInput: number;
        totalOutput: number;
        totalCacheRead: number;
        requestCount: number;
      }
    > = {};

    for (const r of records) {
      if (!byModel[r.model]) {
        byModel[r.model] = {
          model: r.model,
          provider: r.provider,
          totalCost: 0,
          totalInput: 0,
          totalOutput: 0,
          totalCacheRead: 0,
          requestCount: 0,
        };
      }
      const m = byModel[r.model];
      m.totalCost += r.cost;
      m.totalInput += r.inputTokens;
      m.totalOutput += r.outputTokens;
      m.totalCacheRead += r.cacheReadTokens ?? 0;
      m.requestCount++;
    }

    return Object.values(byModel)
      .map((m) => ({
        ...m,
        totalTokens: m.totalInput + m.totalOutput,
        costPerRequest:
          m.requestCount > 0
            ? Math.round((m.totalCost / m.requestCount) * 10000) / 10000
            : 0,
        costPer1kTokens:
          m.totalInput + m.totalOutput > 0
            ? Math.round(
                (m.totalCost / ((m.totalInput + m.totalOutput) / 1000)) * 10000,
              ) / 10000
            : 0,
        cacheHitRate:
          m.totalInput > 0
            ? Math.round(
                (m.totalCacheRead / (m.totalInput + m.totalCacheRead)) * 1000,
              ) / 10
            : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  },
});

// Cache hit rate over time by provider (for chart)
export const cacheHitRateByProvider = query({
  args: {
    sinceMs: v.number(),
    bucketMs: v.number(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    const buckets: Record<
      string,
      Record<string, { cacheRead: number; input: number; requests: number }>
    > = {};
    const providers = new Set<string>();

    for (const r of records) {
      const bucketKey = String(
        Math.floor(r.timestamp / args.bucketMs) * args.bucketMs,
      );
      providers.add(r.provider);

      if (!buckets[bucketKey]) buckets[bucketKey] = {};
      if (!buckets[bucketKey][r.provider]) {
        buckets[bucketKey][r.provider] = {
          cacheRead: 0,
          input: 0,
          requests: 0,
        };
      }
      buckets[bucketKey][r.provider].cacheRead += r.cacheReadTokens ?? 0;
      buckets[bucketKey][r.provider].input += r.inputTokens;
      buckets[bucketKey][r.provider].requests++;
    }

    // Convert to chart-friendly format with percentages
    const result = Object.entries(buckets)
      .map(([ts, providerData]) => {
        const point: Record<string, number> = { timestamp: Number(ts) };
        for (const p of providers) {
          const d = providerData[p];
          if (d && d.input + d.cacheRead > 0) {
            point[p] = Math.round((d.cacheRead / (d.input + d.cacheRead)) * 1000) / 10;
          } else {
            point[p] = 0;
          }
        }
        return point;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return { buckets: result, providers: [...providers].sort() };
  },
});

// Provider health summary — error rates, latency patterns
export const providerHealth = query({
  args: {
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Pull from activities for error data
    const activities = await ctx.db
      .query("activities")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "error"),
          q.gte(q.field("_creationTime"), args.sinceMs),
        ),
      )
      .collect();

    // Pull cost records for volume
    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceMs))
      .collect();

    const providerVolume: Record<string, number> = {};
    for (const r of records) {
      providerVolume[r.provider] = (providerVolume[r.provider] ?? 0) + 1;
    }

    // Count errors that mention providers
    const providerErrors: Record<string, number> = {};
    for (const a of activities) {
      const summary = a.summary.toLowerCase();
      for (const provider of Object.keys(providerVolume)) {
        if (summary.includes(provider.toLowerCase())) {
          providerErrors[provider] = (providerErrors[provider] ?? 0) + 1;
        }
      }
    }

    return Object.keys(providerVolume).map((provider) => ({
      provider,
      requestCount: providerVolume[provider],
      errorCount: providerErrors[provider] ?? 0,
      errorRate:
        providerVolume[provider] > 0
          ? Math.round(
              ((providerErrors[provider] ?? 0) / providerVolume[provider]) *
                1000,
            ) / 10
          : 0,
      status:
        (providerErrors[provider] ?? 0) === 0
          ? ("healthy" as const)
          : (providerErrors[provider] ?? 0) / providerVolume[provider] > 0.1
            ? ("degraded" as const)
            : ("warning" as const),
    }));
  },
});
