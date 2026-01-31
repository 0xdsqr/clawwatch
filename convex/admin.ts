import { mutation } from "./_generated/server";

// Clear all data (for switching from seed to real data)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "agents", "sessions", "costRecords", "budgets", "alertRules",
      "alerts", "activities", "healthChecks", "snitchEvents", "notificationChannels",
    ] as const;

    let total = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      total += docs.length;
    }

    return { deleted: total };
  },
});
