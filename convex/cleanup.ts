import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Data retention cleanup — prevents database bloat by removing old records.
 *
 * Retention thresholds:
 *   - activities:    30 days
 *   - healthChecks:   7 days
 *   - costRecords:    1 year (365 days)
 *   - snitchEvents:  90 days
 *   - alerts:        90 days (resolved only)
 *
 * Each run deletes up to BATCH_SIZE rows per table to stay within
 * Convex mutation time limits. The cron runs daily, so large backlogs
 * drain over multiple cycles.
 */

const BATCH_SIZE = 500;

const RETENTION_MS = {
  activities: 30 * 24 * 60 * 60 * 1000, // 30 days
  healthChecks: 7 * 24 * 60 * 60 * 1000, // 7 days
  costRecords: 365 * 24 * 60 * 60 * 1000, // 1 year
  snitchEvents: 90 * 24 * 60 * 60 * 1000, // 90 days
  alerts: 90 * 24 * 60 * 60 * 1000, // 90 days (resolved only)
} as const;

// Internal mutation called by the cron scheduler
export const cleanupOldRecords = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const deleted: Record<string, number> = {};

    // --- Activities (30 days) ---
    const activityCutoff = now - RETENTION_MS.activities;
    const oldActivities = await ctx.db
      .query("activities")
      .order("asc")
      .filter((q) => q.lt(q.field("_creationTime"), activityCutoff))
      .take(BATCH_SIZE);

    for (const doc of oldActivities) {
      await ctx.db.delete(doc._id);
    }
    deleted.activities = oldActivities.length;

    // --- Health Checks (7 days) ---
    const healthCutoff = now - RETENTION_MS.healthChecks;
    const oldHealthChecks = await ctx.db
      .query("healthChecks")
      .order("asc")
      .filter((q) => q.lt(q.field("timestamp"), healthCutoff))
      .take(BATCH_SIZE);

    for (const doc of oldHealthChecks) {
      await ctx.db.delete(doc._id);
    }
    deleted.healthChecks = oldHealthChecks.length;

    // --- Cost Records (1 year) ---
    const costCutoff = now - RETENTION_MS.costRecords;
    const oldCostRecords = await ctx.db
      .query("costRecords")
      .order("asc")
      .filter((q) => q.lt(q.field("timestamp"), costCutoff))
      .take(BATCH_SIZE);

    for (const doc of oldCostRecords) {
      await ctx.db.delete(doc._id);
    }
    deleted.costRecords = oldCostRecords.length;

    // --- Snitch Events (90 days) ---
    const snitchCutoff = now - RETENTION_MS.snitchEvents;
    const oldSnitchEvents = await ctx.db
      .query("snitchEvents")
      .order("asc")
      .filter((q) => q.lt(q.field("timestamp"), snitchCutoff))
      .take(BATCH_SIZE);

    for (const doc of oldSnitchEvents) {
      await ctx.db.delete(doc._id);
    }
    deleted.snitchEvents = oldSnitchEvents.length;

    // --- Resolved Alerts (90 days) ---
    const alertCutoff = now - RETENTION_MS.alerts;
    const oldAlerts = await ctx.db
      .query("alerts")
      .order("asc")
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), alertCutoff),
          q.neq(q.field("resolvedAt"), undefined),
        ),
      )
      .take(BATCH_SIZE);

    for (const doc of oldAlerts) {
      await ctx.db.delete(doc._id);
    }
    deleted.alerts = oldAlerts.length;

    const total = Object.values(deleted).reduce((s, n) => s + n, 0);
    return { deleted, total };
  },
});

// Public mutation for manual cleanup via admin panel
export const manualCleanup = mutation({
  args: {
    table: v.union(
      v.literal("activities"),
      v.literal("healthChecks"),
      v.literal("costRecords"),
      v.literal("snitchEvents"),
      v.literal("alerts"),
    ),
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    if (args.table === "activities") {
      const docs = await ctx.db
        .query("activities")
        .order("asc")
        .filter((q) => q.lt(q.field("_creationTime"), cutoff))
        .take(BATCH_SIZE);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted = docs.length;
    } else if (args.table === "healthChecks") {
      const docs = await ctx.db
        .query("healthChecks")
        .order("asc")
        .filter((q) => q.lt(q.field("timestamp"), cutoff))
        .take(BATCH_SIZE);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted = docs.length;
    } else if (args.table === "costRecords") {
      const docs = await ctx.db
        .query("costRecords")
        .order("asc")
        .filter((q) => q.lt(q.field("timestamp"), cutoff))
        .take(BATCH_SIZE);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted = docs.length;
    } else if (args.table === "snitchEvents") {
      const docs = await ctx.db
        .query("snitchEvents")
        .order("asc")
        .filter((q) => q.lt(q.field("timestamp"), cutoff))
        .take(BATCH_SIZE);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted = docs.length;
    } else if (args.table === "alerts") {
      const docs = await ctx.db
        .query("alerts")
        .order("asc")
        .filter((q) =>
          q.and(
            q.lt(q.field("_creationTime"), cutoff),
            q.neq(q.field("resolvedAt"), undefined),
          ),
        )
        .take(BATCH_SIZE);
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted = docs.length;
    }

    return { deleted, table: args.table, olderThanDays: args.olderThanDays };
  },
});

// Query to check table sizes for monitoring
export const retentionStats = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "activities",
      "healthChecks",
      "costRecords",
      "snitchEvents",
      "alerts",
    ] as const;

    const stats: Record<string, { total: number; oldest: number | null }> = {};

    for (const table of tables) {
      const oldest = await ctx.db.query(table).order("asc").first();
      const total = (await ctx.db.query(table).collect()).length;

      stats[table] = {
        total,
        oldest: oldest?._creationTime ?? null,
      };
    }

    return stats;
  },
});
