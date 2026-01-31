import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// List all alert rules
export const listRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alertRules").collect();
  },
});

// Create an alert rule
export const createRule = mutation({
  args: {
    name: v.string(),
    agentId: v.optional(v.id("agents")),
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
      comparison: v.optional(v.union(v.literal("gt"), v.literal("lt"), v.literal("eq"))),
      metric: v.optional(v.string()),
    }),
    channels: v.array(v.union(
      v.literal("discord"),
      v.literal("email"),
      v.literal("webhook"),
    )),
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
    config: v.optional(v.object({
      threshold: v.optional(v.number()),
      windowMinutes: v.optional(v.number()),
      comparison: v.optional(v.union(v.literal("gt"), v.literal("lt"), v.literal("eq"))),
      metric: v.optional(v.string()),
    })),
    channels: v.optional(v.array(v.union(
      v.literal("discord"),
      v.literal("email"),
      v.literal("webhook"),
    ))),
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
    data: v.optional(v.any()),
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
