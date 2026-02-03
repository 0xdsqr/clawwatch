import { mutation } from "./_generated/server";

// Seed demo data for testing
export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("agents").first();
    if (existing) return "Already seeded!";

    const now = Date.now();

    // Create agents
    const mimizukuId = await ctx.db.insert("agents", {
      name: "Mimizuku",
      gatewayUrl: "ws://127.0.0.1:18789",
      status: "online",
      lastHeartbeat: now,
      lastSeen: now,
      config: { model: "claude-opus-4-5", channel: "discord" },
    });

    const vanillaId = await ctx.db.insert("agents", {
      name: "Vanilla",
      gatewayUrl: "ws://127.0.0.1:18789",
      status: "online",
      lastHeartbeat: now - 300000,
      lastSeen: now - 300000,
      config: { model: "claude-sonnet-4-20250514", channel: "discord" },
    });

    // Seed cost records (simulated last 24 hours)
    const models = [
      {
        provider: "anthropic",
        model: "claude-opus-4-5",
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075,
      },
      {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
      },
    ];

    for (let h = 23; h >= 0; h--) {
      const timestamp = now - h * 3600000 + Math.random() * 3600000;
      const m = h % 2 === 0 ? models[0] : models[1];
      const agentId = h % 3 === 0 ? vanillaId : mimizukuId;
      const inputTokens = Math.floor(5000 + Math.random() * 20000);
      const outputTokens = Math.floor(1000 + Math.random() * 5000);
      const cost =
        (inputTokens / 1000) * m.inputCostPer1k +
        (outputTokens / 1000) * m.outputCostPer1k;

      await ctx.db.insert("costRecords", {
        agentId,
        provider: m.provider,
        model: m.model,
        inputTokens,
        outputTokens,
        cost: Math.round(cost * 10000) / 10000,
        period: "hourly",
        timestamp,
      });
    }

    // Seed activities
    const activityTypes = [
      {
        type: "message_received" as const,
        summary: "Received message from Dave in #mimizuku",
      },
      {
        type: "tool_call" as const,
        summary: "Called web_search: 'Convex self-hosting guide'",
      },
      {
        type: "message_sent" as const,
        summary: "Sent reply in #mimizuku (342 tokens)",
      },
      {
        type: "heartbeat" as const,
        summary: "Heartbeat OK — all systems nominal",
      },
      {
        type: "session_started" as const,
        summary: "New session: discord:channel:1466206335329894494",
      },
      { type: "tool_call" as const, summary: "Called exec: 'git status'" },
      {
        type: "message_sent" as const,
        summary: "Sent message to #the-parlament",
      },
      {
        type: "error" as const,
        summary: "Rate limit hit on Anthropic API (429)",
      },
    ];

    for (let i = 0; i < 15; i++) {
      const activity = activityTypes[i % activityTypes.length];
      await ctx.db.insert("activities", {
        agentId: i % 3 === 0 ? vanillaId : mimizukuId,
        type: activity.type,
        summary: activity.summary,
        channel: "discord",
      });
    }

    // Seed a budget
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await ctx.db.insert("budgets", {
      name: "Daily Global Limit",
      period: "daily",
      limitDollars: 10,
      currentSpend: 3.42,
      resetAt: tomorrow.getTime(),
      hardStop: false,
      isActive: true,
    });

    await ctx.db.insert("budgets", {
      agentId: mimizukuId,
      name: "Mimizuku Hourly Cap",
      period: "hourly",
      limitDollars: 2,
      currentSpend: 0.87,
      resetAt: now + 3600000,
      hardStop: true,
      isActive: true,
    });

    // Seed alert rules
    await ctx.db.insert("alertRules", {
      name: "Budget Exceeded",
      type: "budget_exceeded",
      config: { threshold: 10 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 30,
    });

    await ctx.db.insert("alertRules", {
      name: "Agent Offline > 5min",
      type: "agent_offline",
      config: { windowMinutes: 5 },
      channels: ["discord", "email"],
      isActive: true,
      cooldownMinutes: 15,
    });

    await ctx.db.insert("alertRules", {
      name: "Error Spike",
      type: "error_spike",
      config: { threshold: 5, windowMinutes: 10 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 30,
    });

    // Seed snitch events
    const snitchTypes = [
      {
        type: "alert_fired" as const,
        desc: "Fired cost alert: daily spend hit $8.50",
        sev: "snitch" as const,
      },
      {
        type: "permission_ask" as const,
        desc: "Asked Dave before sending email to external contact",
        sev: "snitch" as const,
      },
      {
        type: "budget_warning" as const,
        desc: "Warned about hourly token burn rate",
        sev: "hall_monitor" as const,
      },
      {
        type: "proactive_warning" as const,
        desc: "Notified Dave that API key expires in 48h",
        sev: "snitch" as const,
      },
      {
        type: "safety_refusal" as const,
        desc: "Refused to share private credentials in group chat",
        sev: "hall_monitor" as const,
      },
    ];

    for (let i = 0; i < snitchTypes.length; i++) {
      const s = snitchTypes[i];
      await ctx.db.insert("snitchEvents", {
        agentId: i < 3 ? mimizukuId : vanillaId,
        type: s.type,
        description: s.desc,
        severity: s.sev,
        timestamp: now - i * 3600000,
      });
    }

    // Seed a notification channel
    await ctx.db.insert("notificationChannels", {
      type: "discord",
      name: "#mimizuku-alerts",
      config: { channelId: "1466206335329894494" },
      isActive: true,
    });

    return "Demo data seeded!";
  },
});
