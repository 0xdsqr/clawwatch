import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * The Snitch Score™ — How often does your agent tattle?
 *
 * Tracks: alert fires, compliance refusals, safety flags,
 * "I can't do that" moments, and proactive warnings.
 *
 * Higher score = your agent is a hall monitor.
 * Lower score = your agent is a ride-or-die.
 */

// Record a snitch event
export const recordSnitch = mutation({
  args: {
    agentId: v.id("agents"),
    type: v.union(
      v.literal("alert_fired"),         // Fired an alert (tattled to the owner)
      v.literal("safety_refusal"),       // Refused to do something "unsafe"
      v.literal("content_flag"),         // Flagged content as inappropriate
      v.literal("budget_warning"),       // Warned about spending
      v.literal("permission_ask"),       // Asked permission instead of just doing it
      v.literal("proactive_warning"),    // Unprompted "hey you should know..."
      v.literal("compliance_report"),    // Reported its own behavior
      v.literal("tattled_on_user"),      // Told someone about the user
    ),
    description: v.string(),
    severity: v.union(v.literal("snitch"), v.literal("hall_monitor"), v.literal("narc")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("snitchEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get the snitch score for an agent
export const getScore = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("snitchEvents")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    if (events.length === 0) {
      return {
        score: 0,
        label: "Ride or Die",
        emoji: "🤐",
        totalEvents: 0,
        breakdown: {},
        recentSnitches: [],
      };
    }

    // Weight different types
    const weights: Record<string, number> = {
      alert_fired: 1,
      safety_refusal: 3,
      content_flag: 2,
      budget_warning: 1,
      permission_ask: 0.5,
      proactive_warning: 1.5,
      compliance_report: 2,
      tattled_on_user: 5,
    };

    const totalWeight = events.reduce(
      (sum, e) => sum + (weights[e.type] ?? 1),
      0
    );

    // Normalize to 0-100
    // More events + higher weights = higher score
    const raw = Math.min(100, (totalWeight / Math.max(events.length, 1)) * 10 + events.length * 0.5);
    const score = Math.round(raw);

    // Breakdown by type
    const breakdown: Record<string, number> = {};
    for (const e of events) {
      breakdown[e.type] = (breakdown[e.type] ?? 0) + 1;
    }

    // Label based on score
    let label: string;
    let emoji: string;
    if (score < 10) {
      label = "Ride or Die";
      emoji = "🤐";
    } else if (score < 25) {
      label = "Cool About It";
      emoji = "😎";
    } else if (score < 50) {
      label = "Concerned Citizen";
      emoji = "🧐";
    } else if (score < 75) {
      label = "Hall Monitor";
      emoji = "👮";
    } else if (score < 90) {
      label = "Full Narc";
      emoji = "🚨";
    } else {
      label = "Internal Affairs";
      emoji = "🕵️";
    }

    // Recent snitches
    const recentSnitches = events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((e) => ({
        type: e.type,
        description: e.description,
        severity: e.severity,
        timestamp: e.timestamp,
      }));

    return {
      score,
      label,
      emoji,
      totalEvents: events.length,
      breakdown,
      recentSnitches,
    };
  },
});

// Get snitch leaderboard (all agents)
export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const results = [];

    for (const agent of agents) {
      const events = await ctx.db
        .query("snitchEvents")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .collect();

      const weights: Record<string, number> = {
        alert_fired: 1,
        safety_refusal: 3,
        content_flag: 2,
        budget_warning: 1,
        permission_ask: 0.5,
        proactive_warning: 1.5,
        compliance_report: 2,
        tattled_on_user: 5,
      };

      const totalWeight = events.reduce(
        (sum, e) => sum + (weights[e.type] ?? 1),
        0
      );

      const raw = events.length === 0
        ? 0
        : Math.min(100, (totalWeight / Math.max(events.length, 1)) * 10 + events.length * 0.5);

      results.push({
        agentId: agent._id,
        agentName: agent.name,
        score: Math.round(raw),
        totalSnitches: events.length,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  },
});
