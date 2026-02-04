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
        .filter((q) => q.eq(q.field("name"), agentName))
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
      // Only update config.model from the "main" session (heartbeat/default)
      // to avoid other sessions (discord, cron) overwriting the configured model.
      const isMainSession = session.key.endsWith(":main");
      const newModel = isMainSession
        ? (session.model ?? agent.config?.model)
        : (agent.config?.model ?? session.model);

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

    for (const entry of args.entries) {
      // Find agent
      const agent = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("name"), entry.agentName))
        .first();

      if (!agent) continue;

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
        timestamp: entry.timestamp,
      });

      ingested++;
    }

    return { ingested };
  },
});

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
      }),
    ),
  },
  handler: async (ctx, args) => {
    let ingested = 0;

    for (const activity of args.activities) {
      const agent = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("name"), activity.agentName))
        .first();

      if (!agent) continue;

      await ctx.db.insert("activities", {
        agentId: agent._id,
        type: activity.type,
        summary: activity.summary,
        sessionKey: activity.sessionKey,
        channel: activity.channel,
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
    for (const update of args.updates) {
      const existing = await ctx.db
        .query("statsCache")
        .withIndex("by_key", (q) => q.eq("key", update.key))
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
  },
});

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
      .filter((q) => q.eq(q.field("name"), args.agentName))
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
