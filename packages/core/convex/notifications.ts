import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const severityArg = v.union(v.literal("info"), v.literal("warning"), v.literal("critical"));

// List notification channels
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notificationChannels").collect();
  },
});

// Create a notification channel
export const create = mutation({
  args: {
    type: v.literal("discord"),
    name: v.string(),
    config: v.object({
      webhookUrl: v.string(),
      severities: v.optional(v.array(severityArg)),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notificationChannels", {
      type: "discord",
      name: args.name.trim(),
      config: {
        webhookUrl: args.config.webhookUrl.trim(),
        severities: args.config.severities ?? ["warning", "critical"],
      },
      isActive: true,
    });
  },
});

// Update a notification channel
export const update = mutation({
  args: {
    id: v.id("notificationChannels"),
    name: v.optional(v.string()),
    config: v.optional(
      v.object({
        webhookUrl: v.optional(v.string()),
        severities: v.optional(v.array(severityArg)),
      }),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const current = await ctx.db.get(id);
    if (!current) throw new Error("Notification channel not found");

    await ctx.db.patch(id, {
      ...patch,
      name: patch.name?.trim(),
      config: patch.config
        ? {
            ...current.config,
            ...patch.config,
            webhookUrl: patch.config.webhookUrl?.trim() ?? current.config.webhookUrl,
            severities: patch.config.severities ?? current.config.severities,
          }
        : undefined,
    });
  },
});

// Delete a notification channel
export const remove = mutation({
  args: { id: v.id("notificationChannels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
