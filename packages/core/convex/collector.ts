import type { GenericDatabaseWriter } from "convex/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Ingest session data from the Clawdbot gateway
export const ingestSessions = mutation({
  args: {
    gatewayUrl: v.string(),
    sessions: v.array(
      v.object({
        key: v.string(),
        kind: v.string(),
        channel: v.optional(v.string()),
        displayName: v.optional(v.string()),
        model: v.optional(v.string()),
        totalTokens: v.number(),
        updatedAt: v.number(),
        agentId: v.optional(v.string()), // extracted from key like "agent:mimizuku:..."
      }),
    ),
  },
  handler: async (ctx, args) => {
    let ingested = 0;

    for (const session of args.sessions) {
      // Extract agent name from session key
      const agentName = session.agentId ?? session.key.split(":")[1] ?? "unknown";

      // Find or create agent
      let agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", agentName))
        .first();

      if (!agent) {
        const agentId = await ctx.db.insert("agents", {
          name: agentName,
          gatewayUrl: args.gatewayUrl,
          status: "online",
          lastHeartbeat: Date.now(),
          lastSeen: Date.now(),
          config: {
            model: session.model,
            channel: session.channel,
          },
        });
        agent = await ctx.db.get(agentId);
      }

      if (!agent) continue;

      // Update agent status
      // The ":main" session is the heartbeat (runs on a cheaper model like Sonnet).
      // Interactive sessions (discord, etc.) use the real configured model (Opus).
      // Only update config.model from NON-main sessions to show the actual working model.
      const isMainSession = session.key.endsWith(":main");
      const newModel = isMainSession
        ? (agent.config?.model ?? session.model)
        : (session.model ?? agent.config?.model);

      await ctx.db.patch(agent._id, {
        status: "online",
        lastHeartbeat: Date.now(),
        lastSeen: Date.now(),
        config: {
          model: newModel,
          channel: session.channel ?? agent.config?.channel,
        },
      });

      // Upsert session
      const existingSession = await ctx.db
        .query("sessions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent!._id))
        .filter((q) => q.eq(q.field("sessionKey"), session.key))
        .first();

      if (existingSession) {
        await ctx.db.patch(existingSession._id, {
          totalTokens: session.totalTokens,
          lastActivity: session.updatedAt,
          isActive: Date.now() - session.updatedAt < 300000, // active if updated in last 5 min
        });
      } else {
        await ctx.db.insert("sessions", {
          agentId: agent._id,
          sessionKey: session.key,
          kind: session.kind,
          displayName: session.displayName,
          channel: session.channel,
          startedAt: session.updatedAt,
          lastActivity: session.updatedAt,
          totalTokens: session.totalTokens,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          messageCount: 0,
          isActive: Date.now() - session.updatedAt < 300000,
        });
      }

      ingested++;
    }

    return { ingested };
  },
});

// Ingest cost data from transcript entries
export const ingestCosts = mutation({
  args: {
    entries: v.array(
      v.object({
        agentName: v.string(),
        sessionKey: v.optional(v.string()),
        provider: v.string(),
        model: v.string(),
        inputTokens: v.number(),
        outputTokens: v.number(),
        cacheReadTokens: v.optional(v.number()),
        cacheWriteTokens: v.optional(v.number()),
        totalCost: v.number(),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let ingested = 0;
    const cacheDeltas = new Map<
      string,
      { cost: number; inputTokens: number; outputTokens: number; requests: number }
    >();
    const budgets = await ctx.db.query("budgets").collect();
    const budgetState = new Map(
      budgets.map((budget) => [
        budget._id,
        { currentSpend: budget.currentSpend, resetAt: budget.resetAt, period: budget.period },
      ]),
    );

    for (const entry of args.entries) {
      // Find agent
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", entry.agentName))
        .first();

      if (!agent) continue;

      const timestamp = entry.timestamp;
      const dateStr = new Date(timestamp).toISOString().slice(0, 10);
      const hourKey = Math.floor(timestamp / 3600000) * 3600000;

      await ctx.db.insert("costRecords", {
        agentId: agent._id,
        sessionKey: entry.sessionKey,
        provider: entry.provider,
        model: entry.model,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        cacheReadTokens: entry.cacheReadTokens,
        cacheWriteTokens: entry.cacheWriteTokens,
        cost: entry.totalCost,
        period: "hourly",
        timestamp,
      });

      const addDelta = (key: string) => {
        const existing = cacheDeltas.get(key) ?? {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          requests: 0,
        };
        existing.cost += entry.totalCost;
        existing.inputTokens += entry.inputTokens;
        existing.outputTokens += entry.outputTokens;
        existing.requests += 1;
        cacheDeltas.set(key, existing);
      };

      addDelta(`today:${dateStr}`);
      addDelta(`hour:${hourKey}`);
      addDelta(`model:${dateStr}:${entry.model}`);
      addDelta(`agent:${agent._id}:today:${dateStr}`);
      addDelta(`agent:${agent._id}:hour:${hourKey}`);

      const matchingBudgets = budgets.filter(
        (budget) =>
          budget.isActive && (budget.agentId === undefined || budget.agentId === agent._id),
      );

      for (const budget of matchingBudgets) {
        const state = budgetState.get(budget._id);
        if (!state) continue;

        let { currentSpend, resetAt } = state;
        if (entry.timestamp >= resetAt) {
          currentSpend = 0;
          resetAt = calculateNextReset(budget.period, entry.timestamp);
        }

        currentSpend += entry.totalCost;
        await ctx.db.patch(budget._id, { currentSpend, resetAt });
        budgetState.set(budget._id, { ...state, currentSpend, resetAt });
      }

      ingested++;
    }

    if (cacheDeltas.size > 0) {
      await applyStatsCacheUpdates(
        ctx,
        Array.from(cacheDeltas.entries()).map(([key, data]) => ({ key, ...data })),
      );
    }

    return { ingested };
  },
});

function calculateNextReset(
  period: "hourly" | "daily" | "weekly" | "monthly",
  now: number,
): number {
  const date = new Date(now);
  switch (period) {
    case "hourly":
      date.setHours(date.getHours() + 1, 0, 0, 0);
      break;
    case "daily":
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      date.setDate(date.getDate() + (7 - date.getDay()));
      date.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1, 1);
      date.setHours(0, 0, 0, 0);
      break;
  }
  return date.getTime();
}

// Ingest activities from transcript entries
export const ingestActivities = mutation({
  args: {
    activities: v.array(
      v.object({
        agentName: v.string(),
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
        sessionKey: v.optional(v.string()),
        channel: v.optional(v.string()),
        timestamp: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let ingested = 0;

    for (const activity of args.activities) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", activity.agentName))
        .first();

      if (!agent) continue;

      await ctx.db.insert("activities", {
        agentId: agent._id,
        type: activity.type,
        summary: activity.summary,
        sessionKey: activity.sessionKey,
        channel: activity.channel,
        timestamp: activity.timestamp ?? Date.now(),
      });

      ingested++;
    }

    return { ingested };
  },
});

// Update the pre-aggregated stats cache — accepts pre-aggregated deltas per cache key
// Caller should group entries by cache key and sum them before calling
export const updateStatsCache = mutation({
  args: {
    updates: v.array(
      v.object({
        key: v.string(),
        cost: v.number(),
        inputTokens: v.number(),
        outputTokens: v.number(),
        requests: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await applyStatsCacheUpdates(ctx, args.updates);
  },
});

async function applyStatsCacheUpdates(
  ctx: { db: GenericDatabaseWriter<any> },
  updates: Array<{
    key: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }>,
): Promise<void> {
  for (const update of updates) {
    const existing = await (ctx.db as any)
      .query("statsCache")
      .withIndex("by_key", (q: any) => q.eq("key", update.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cost: existing.cost + update.cost,
        inputTokens: existing.inputTokens + update.inputTokens,
        outputTokens: existing.outputTokens + update.outputTokens,
        requests: existing.requests + update.requests,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("statsCache", {
        key: update.key,
        cost: update.cost,
        inputTokens: update.inputTokens,
        outputTokens: update.outputTokens,
        requests: update.requests,
        updatedAt: Date.now(),
      });
    }
  }
}

// Record a health check
export const recordHealthCheck = mutation({
  args: {
    agentName: v.string(),
    responseTimeMs: v.optional(v.number()),
    activeSessionCount: v.number(),
    totalTokensLastHour: v.number(),
    costLastHour: v.number(),
    errorCount: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .first();

    if (!agent) return;

    await ctx.db.insert("healthChecks", {
      agentId: agent._id,
      timestamp: Date.now(),
      isHealthy: args.errorCount < 5,
      responseTimeMs: args.responseTimeMs,
      activeSessionCount: args.activeSessionCount,
      totalTokensLastHour: args.totalTokensLastHour,
      costLastHour: args.costLastHour,
      errorCount: args.errorCount,
    });
  },
});
