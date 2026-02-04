import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Allowed alert rule types (union)
const alertRuleType = v.union(
  v.literal("budget_exceeded"),
  v.literal("agent_offline"),
  v.literal("error_spike"),
  v.literal("cost_spike"),
  v.literal("high_token_usage"),
  v.literal("session_loop"),
  v.literal("channel_disconnect"),
  v.literal("custom_threshold"),
);

// List all alert rules
export const listRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alertRules").collect();
  },
});

// Seed default alert rules (called once if no rules exist)
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("alertRules").collect();
    if (existing.length > 0) return; // Don't seed if rules exist

    // Daily Budget Warning
    await ctx.db.insert("alertRules", {
      name: "Daily Budget Warning",
      type: "budget_exceeded",
      config: { threshold: 100, metric: "daily_cost" },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 60,
    });

    // Agent Offline
    await ctx.db.insert("alertRules", {
      name: "Agent Offline",
      type: "agent_offline",
      config: { windowMinutes: 10 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 30,
    });

    // Error Spike
    await ctx.db.insert("alertRules", {
      name: "Error Spike",
      type: "error_spike",
      config: { threshold: 5, windowMinutes: 15 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 15,
    });
  },
});

// Create an alert rule
export const createRule = mutation({
  args: {
    name: v.string(),
    agentId: v.optional(v.id("agents")),
    type: alertRuleType,
    config: v.object({
      threshold: v.optional(v.number()),
      windowMinutes: v.optional(v.number()),
      comparison: v.optional(v.union(v.literal("gt"), v.literal("lt"), v.literal("eq"))),
      metric: v.optional(v.string()),
      hardStop: v.optional(v.boolean()),
      percentageThreshold: v.optional(v.number()),
    }),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("critical"))),
    channels: v.array(v.union(v.literal("discord"), v.literal("email"), v.literal("webhook"))),
    cooldownMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alertRules", {
      ...args,
      isActive: true,
    });
  },
});

// Update an alert rule
export const updateRule = mutation({
  args: {
    id: v.id("alertRules"),
    name: v.optional(v.string()),
    config: v.optional(
      v.object({
        threshold: v.optional(v.number()),
        windowMinutes: v.optional(v.number()),
        comparison: v.optional(v.union(v.literal("gt"), v.literal("lt"), v.literal("eq"))),
        metric: v.optional(v.string()),
      }),
    ),
    channels: v.optional(
      v.array(v.union(v.literal("discord"), v.literal("email"), v.literal("webhook"))),
    ),
    isActive: v.optional(v.boolean()),
    cooldownMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const rule = await ctx.db.get(id);
    if (!rule) throw new Error("Alert rule not found");

    await ctx.db.patch(id, patch);
  },
});

// Delete an alert rule
export const deleteRule = mutation({
  args: { id: v.id("alertRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Fire an alert
export const fire = mutation({
  args: {
    ruleId: v.id("alertRules"),
    agentId: v.optional(v.id("agents")),
    type: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Record the alert
    const alertId = await ctx.db.insert("alerts", {
      ...args,
    });

    // Update rule's last triggered time
    await ctx.db.patch(args.ruleId, { lastTriggered: Date.now() });

    // Also log as activity
    if (args.agentId) {
      await ctx.db.insert("activities", {
        agentId: args.agentId,
        type: "alert_fired",
        summary: `🚨 ${args.severity.toUpperCase()}: ${args.title}`,
        details: { alertId, message: args.message },
      });
    }

    return alertId;
  },
});

// List recent alerts
export const listAlerts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Acknowledge an alert
export const acknowledge = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { acknowledgedAt: Date.now() });
  },
});

// Resolve an alert
export const resolve = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { resolvedAt: Date.now() });
  },
});
