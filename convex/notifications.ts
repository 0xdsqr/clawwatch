import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    type: v.union(v.literal("discord"), v.literal("email"), v.literal("webhook")),
    name: v.string(),
    config: v.object({
      webhookUrl: v.optional(v.string()),
      email: v.optional(v.string()),
      channelId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notificationChannels", {
      ...args,
      isActive: true,
    });
  },
});

// Update a notification channel
export const update = mutation({
  args: {
    id: v.id("notificationChannels"),
    name: v.optional(v.string()),
    config: v.optional(v.object({
      webhookUrl: v.optional(v.string()),
      email: v.optional(v.string()),
      channelId: v.optional(v.string()),
    })),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

// Delete a notification channel
export const remove = mutation({
  args: { id: v.id("notificationChannels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
