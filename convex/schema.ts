import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent instances being monitored
  agents: defineTable({
    name: v.string(),
    gatewayUrl: v.string(),
    status: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("degraded"),
    ),
    lastHeartbeat: v.number(),
    lastSeen: v.number(),
    config: v.optional(
      v.object({
        model: v.optional(v.string()),
        channel: v.optional(v.string()),
      }),
    ),
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // Session tracking
  sessions: defineTable({
    agentId: v.id("agents"),
    sessionKey: v.string(),
    kind: v.string(),
    displayName: v.optional(v.string()),
    channel: v.optional(v.string()),
    startedAt: v.number(),
    lastActivity: v.number(),
    totalTokens: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCost: v.number(),
    messageCount: v.number(),
    isActive: v.boolean(),
  })
    .index("by_agent", ["agentId"])
    .index("by_active", ["isActive", "lastActivity"]),

  // Cost records — granular token/dollar tracking
  costRecords: defineTable({
    agentId: v.id("agents"),
    sessionKey: v.optional(v.string()),
    timestamp: v.number(),
    provider: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cacheReadTokens: v.optional(v.number()),
    cacheWriteTokens: v.optional(v.number()),
    cost: v.number(),
    period: v.string(), // "hourly" | "daily"
  })
    .index("by_agent_time", ["agentId", "timestamp"])
    .index("by_period", ["period", "timestamp"])
    .index("by_provider_time", ["provider", "timestamp"])
    .index("by_model", ["model", "timestamp"]),

  // Budgets — spending limits
  budgets: defineTable({
    agentId: v.optional(v.id("agents")), // null = global budget
    name: v.string(),
    period: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    limitDollars: v.number(),
    currentSpend: v.number(),
    resetAt: v.number(),
    hardStop: v.boolean(), // if true, stop the agent when exceeded
    isActive: v.boolean(),
  }).index("by_agent", ["agentId"]),

  // Alert rules — configurable thresholds
  alertRules: defineTable({
    name: v.string(),
    agentId: v.optional(v.id("agents")), // null = applies to all agents
    type: v.union(
      v.literal("budget_exceeded"),
      v.literal("agent_offline"),
      v.literal("error_spike"),
      v.literal("session_loop"),
      v.literal("channel_disconnect"),
      v.literal("custom_threshold"),
    ),
    config: v.object({
      threshold: v.optional(v.number()),
      windowMinutes: v.optional(v.number()),
      comparison: v.optional(
        v.union(v.literal("gt"), v.literal("lt"), v.literal("eq")),
      ),
      metric: v.optional(v.string()),
    }),
    channels: v.array(
      v.union(v.literal("discord"), v.literal("email"), v.literal("webhook")),
    ),
    isActive: v.boolean(),
    cooldownMinutes: v.number(), // don't re-alert within this window
    lastTriggered: v.optional(v.number()),
  }).index("by_type", ["type"]),

  // Alert history — fired alerts
  alerts: defineTable({
    ruleId: v.id("alertRules"),
    agentId: v.optional(v.id("agents")),
    type: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical"),
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    channels: v.array(v.string()),
  }),

  // Activity feed — what the agent did
  activities: defineTable({
    agentId: v.id("agents"),
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
    details: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    sessionKey: v.optional(v.string()),
    channel: v.optional(v.string()),
  })
    .index("by_agent", ["agentId"]),

  // Health checks — periodic status snapshots
  healthChecks: defineTable({
    agentId: v.id("agents"),
    timestamp: v.number(),
    isHealthy: v.boolean(),
    responseTimeMs: v.optional(v.number()),
    activeSessionCount: v.number(),
    totalTokensLastHour: v.number(),
    costLastHour: v.number(),
    errorCount: v.number(),
  }).index("by_agent_time", ["agentId", "timestamp"]),

  // Snitch Score™ — how often your agent tattles
  snitchEvents: defineTable({
    agentId: v.id("agents"),
    type: v.union(
      v.literal("alert_fired"),
      v.literal("safety_refusal"),
      v.literal("content_flag"),
      v.literal("budget_warning"),
      v.literal("permission_ask"),
      v.literal("proactive_warning"),
      v.literal("compliance_report"),
      v.literal("tattled_on_user"),
    ),
    description: v.string(),
    severity: v.union(
      v.literal("snitch"),
      v.literal("hall_monitor"),
      v.literal("narc"),
    ),
    timestamp: v.number(),
  }).index("by_agent", ["agentId"]),

  // Notification channels config
  notificationChannels: defineTable({
    type: v.union(
      v.literal("discord"),
      v.literal("email"),
      v.literal("webhook"),
    ),
    name: v.string(),
    config: v.object({
      webhookUrl: v.optional(v.string()),
      email: v.optional(v.string()),
      channelId: v.optional(v.string()),
    }),
    isActive: v.boolean(),
  }),
});
