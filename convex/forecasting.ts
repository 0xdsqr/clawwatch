import { query } from "./_generated/server";
import { v } from "convex/values";

// Budget forecast — calculate burn rate and project end-of-period spend
export const budgetForecast = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db.query("budgets").collect();
    const now = Date.now();
    const forecasts = [];

    for (const budget of budgets.filter((b) => b.isActive)) {
      // Calculate period duration and elapsed time
      const periodMs = getPeriodMs(budget.period);
      const periodStart = budget.resetAt - periodMs;
      const elapsed = now - periodStart;
      const remaining = budget.resetAt - now;
      const elapsedDays = Math.max(elapsed / 86400000, 0.01); // avoid division by zero

      // Daily burn rate based on actual spend
      const dailyBurnRate = budget.currentSpend / elapsedDays;

      // Projected spend at end of period
      const remainingDays = remaining / 86400000;
      const projectedSpend = budget.currentSpend + dailyBurnRate * remainingDays;

      // Percentage of budget used
      const percentUsed =
        budget.limitDollars > 0
          ? (budget.currentSpend / budget.limitDollars) * 100
          : 0;

      // Projected percentage at end of period
      const projectedPercent =
        budget.limitDollars > 0
          ? (projectedSpend / budget.limitDollars) * 100
          : 0;

      // Days until budget exhausted (if burn rate continues)
      const daysUntilExhausted =
        dailyBurnRate > 0
          ? (budget.limitDollars - budget.currentSpend) / dailyBurnRate
          : Infinity;

      // Generate projection data points for chart
      const projectionPoints = [];
      const numPoints = 30;
      for (let i = 0; i <= numPoints; i++) {
        const t = periodStart + (periodMs * i) / numPoints;
        const daysFromStart = (t - periodStart) / 86400000;
        const projected = dailyBurnRate * daysFromStart;
        projectionPoints.push({
          timestamp: t,
          actual: t <= now ? Math.min(budget.currentSpend, dailyBurnRate * daysFromStart) : null,
          projected: projected,
          limit: budget.limitDollars,
        });
      }

      forecasts.push({
        budgetId: budget._id,
        name: budget.name,
        period: budget.period,
        limitDollars: budget.limitDollars,
        currentSpend: budget.currentSpend,
        dailyBurnRate: Math.round(dailyBurnRate * 10000) / 10000,
        projectedSpend: Math.round(projectedSpend * 100) / 100,
        percentUsed: Math.round(percentUsed * 10) / 10,
        projectedPercent: Math.round(projectedPercent * 10) / 10,
        daysUntilExhausted:
          daysUntilExhausted === Infinity
            ? null
            : Math.round(daysUntilExhausted * 10) / 10,
        resetAt: budget.resetAt,
        hardStop: budget.hardStop,
        projectionPoints,
        status: getStatus(percentUsed, projectedPercent),
      });
    }

    return forecasts;
  },
});

// Anomaly detection — find sessions that deviate significantly from the norm
export const anomalies = query({
  args: {
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowMs = (args.windowDays ?? 7) * 86400000;
    const now = Date.now();
    const since = now - windowMs;

    // Get recent sessions
    const sessions = await ctx.db.query("sessions").collect();
    const recentSessions = sessions.filter(
      (s) => s.startedAt > since && s.totalTokens > 0,
    );

    if (recentSessions.length < 3) {
      return { anomalies: [], stats: null };
    }

    // Calculate rolling averages
    const costs = recentSessions.map((s) => s.estimatedCost);
    const tokens = recentSessions.map((s) => s.totalTokens);
    const durations = recentSessions.map(
      (s) => s.lastActivity - s.startedAt,
    );

    const avgCost = mean(costs);
    const stdCost = stddev(costs);
    const avgTokens = mean(tokens);
    const stdTokens = stddev(tokens);
    const avgDuration = mean(durations);
    const stdDuration = stddev(durations);

    // Flag sessions that are >2 standard deviations from mean
    const anomalies = recentSessions
      .map((s) => {
        const costZ = stdCost > 0 ? (s.estimatedCost - avgCost) / stdCost : 0;
        const tokenZ =
          stdTokens > 0 ? (s.totalTokens - avgTokens) / stdTokens : 0;
        const duration = s.lastActivity - s.startedAt;
        const durationZ =
          stdDuration > 0 ? (duration - avgDuration) / stdDuration : 0;

        const maxZ = Math.max(Math.abs(costZ), Math.abs(tokenZ), Math.abs(durationZ));
        if (maxZ < 2) return null;

        const reasons: string[] = [];
        if (Math.abs(costZ) >= 2)
          reasons.push(
            `cost ${costZ > 0 ? "above" : "below"} average (${costZ.toFixed(1)}σ)`,
          );
        if (Math.abs(tokenZ) >= 2)
          reasons.push(
            `tokens ${tokenZ > 0 ? "above" : "below"} average (${tokenZ.toFixed(1)}σ)`,
          );
        if (Math.abs(durationZ) >= 2)
          reasons.push(
            `duration ${durationZ > 0 ? "above" : "below"} average (${durationZ.toFixed(1)}σ)`,
          );

        return {
          sessionKey: s.sessionKey,
          displayName: s.displayName ?? s.sessionKey,
          agentId: s.agentId,
          cost: s.estimatedCost,
          tokens: s.totalTokens,
          duration,
          severity: maxZ >= 3 ? ("critical" as const) : ("warning" as const),
          reasons,
          zScore: Math.round(maxZ * 10) / 10,
          timestamp: s.startedAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.zScore - a!.zScore);

    return {
      anomalies,
      stats: {
        avgCost: Math.round(avgCost * 10000) / 10000,
        stdCost: Math.round(stdCost * 10000) / 10000,
        avgTokens: Math.round(avgTokens),
        stdTokens: Math.round(stdTokens),
        avgDurationMs: Math.round(avgDuration),
        sessionCount: recentSessions.length,
      },
    };
  },
});

// Get recent spend data for the burn rate chart
export const spendTimeline = query({
  args: {
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.periodDays ?? 30;
    const now = Date.now();
    const since = now - days * 86400000;

    const records = await ctx.db
      .query("costRecords")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    // Bucket by day
    const buckets: Record<string, number> = {};
    for (const r of records) {
      const day = new Date(r.timestamp).toISOString().split("T")[0];
      buckets[day] = (buckets[day] ?? 0) + r.cost;
    }

    // Fill in missing days
    const result = [];
    const cursor = new Date(since);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(now);

    while (cursor <= end) {
      const day = cursor.toISOString().split("T")[0];
      result.push({
        date: day,
        cost: Math.round((buckets[day] ?? 0) * 10000) / 10000,
        timestamp: cursor.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  },
});

function getPeriodMs(period: string): number {
  switch (period) {
    case "hourly":
      return 3600000;
    case "daily":
      return 86400000;
    case "weekly":
      return 7 * 86400000;
    case "monthly":
      return 30 * 86400000;
    default:
      return 86400000;
  }
}

function getStatus(
  percentUsed: number,
  projectedPercent: number,
): "healthy" | "warning" | "critical" {
  if (percentUsed >= 90 || projectedPercent >= 120) return "critical";
  if (percentUsed >= 70 || projectedPercent >= 100) return "warning";
  return "healthy";
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}
