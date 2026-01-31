import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Evaluate all active alert rules and fire if thresholds are breached
export const evaluate = mutation({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("alertRules").collect();
    const activeRules = rules.filter((r) => r.isActive);
    const now = Date.now();
    let firedCount = 0;

    for (const rule of activeRules) {
      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldownMinutes * 60000) {
        continue;
      }

      let shouldFire = false;
      let severity: "info" | "warning" | "critical" = "warning";
      let title = "";
      let message = "";
      let targetAgentId = rule.agentId;

      switch (rule.type) {
        case "budget_exceeded": {
          const budgets = await ctx.db.query("budgets").collect();
          for (const budget of budgets.filter((b) => b.isActive)) {
            if (budget.currentSpend >= budget.limitDollars) {
              shouldFire = true;
              severity = budget.hardStop ? "critical" : "warning";
              title = `Budget "${budget.name}" exceeded`;
              message = `Spend $${budget.currentSpend.toFixed(2)} >= limit $${budget.limitDollars.toFixed(2)} (${budget.period})`;
              targetAgentId = budget.agentId ?? undefined;
            }
          }
          break;
        }

        case "agent_offline": {
          const agents = await ctx.db.query("agents").collect();
          const windowMs = (rule.config.windowMinutes ?? 5) * 60000;
          for (const agent of agents) {
            if (now - agent.lastHeartbeat > windowMs) {
              shouldFire = true;
              severity = "critical";
              title = `Agent "${agent.name}" is offline`;
              const minsOffline = Math.round((now - agent.lastHeartbeat) / 60000);
              message = `No heartbeat for ${minsOffline} minutes`;
              targetAgentId = agent._id;
              // Mark agent offline
              await ctx.db.patch(agent._id, { status: "offline" });
            }
          }
          break;
        }

        case "error_spike": {
          const windowMs = (rule.config.windowMinutes ?? 10) * 60000;
          const threshold = rule.config.threshold ?? 5;
          const agents = await ctx.db.query("agents").collect();

          for (const agent of agents) {
            const recentActivities = await ctx.db
              .query("activities")
              .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
              .order("desc")
              .take(200);

            const recentErrors = recentActivities.filter(
              (a) => a.type === "error" && a._creationTime > now - windowMs
            );

            if (recentErrors.length >= threshold) {
              shouldFire = true;
              severity = "warning";
              title = `Error spike on "${agent.name}"`;
              message = `${recentErrors.length} errors in last ${rule.config.windowMinutes ?? 10} minutes`;
              targetAgentId = agent._id;
            }
          }
          break;
        }

        case "session_loop": {
          const agents = await ctx.db.query("agents").collect();
          for (const agent of agents) {
            const sessions = await ctx.db
              .query("sessions")
              .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
              .collect();

            for (const session of sessions.filter((s) => s.isActive)) {
              // Detect high message count in short time as potential loop
              if (session.messageCount > 100 && session.totalTokens > 500000) {
                shouldFire = true;
                severity = "critical";
                title = `Possible loop on "${agent.name}"`;
                message = `Session ${session.displayName ?? session.sessionKey} has ${session.messageCount} messages and ${session.totalTokens} tokens`;
                targetAgentId = agent._id;
              }
            }
          }
          break;
        }

        case "channel_disconnect": {
          // Check if any agent's channel has gone silent
          const agents = await ctx.db.query("agents").collect();
          const windowMs = (rule.config.windowMinutes ?? 30) * 60000;

          for (const agent of agents) {
            const channelSessions = await ctx.db
              .query("sessions")
              .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
              .collect();

            const discordSessions = channelSessions.filter(
              (s) => s.channel === "discord" && s.isActive
            );

            if (discordSessions.length === 0 && channelSessions.some((s) => s.channel === "discord")) {
              shouldFire = true;
              severity = "warning";
              title = `Channel disconnect on "${agent.name}"`;
              message = `No active Discord sessions`;
              targetAgentId = agent._id;
            }
          }
          break;
        }

        case "custom_threshold": {
          // Generic metric threshold checking
          if (rule.config.metric === "cost_per_hour") {
            const agents = await ctx.db.query("agents").collect();
            for (const agent of agents) {
              const oneHourAgo = now - 3600000;
              const recentCosts = await ctx.db
                .query("costRecords")
                .withIndex("by_agent_time", (q) =>
                  q.eq("agentId", agent._id).gte("timestamp", oneHourAgo)
                )
                .collect();

              const hourCost = recentCosts.reduce((sum, r) => sum + r.cost, 0);
              const threshold = rule.config.threshold ?? 5;

              if (hourCost > threshold) {
                shouldFire = true;
                severity = "warning";
                title = `High hourly cost on "${agent.name}"`;
                message = `$${hourCost.toFixed(2)}/hr exceeds $${threshold.toFixed(2)} threshold`;
                targetAgentId = agent._id;
              }
            }
          }
          break;
        }
      }

      if (shouldFire) {
        await ctx.db.insert("alerts", {
          ruleId: rule._id,
          agentId: targetAgentId,
          type: rule.type,
          severity,
          title,
          message,
          channels: rule.channels,
        });

        await ctx.db.patch(rule._id, { lastTriggered: now });

        // Log as activity
        if (targetAgentId) {
          await ctx.db.insert("activities", {
            agentId: targetAgentId,
            type: "alert_fired",
            summary: `🚨 ${severity.toUpperCase()}: ${title}`,
            details: { message },
          });
        }

        firedCount++;
        console.log(`[alert] Fired: ${title} (${severity})`);
      }
    }

    return { evaluated: activeRules.length, fired: firedCount };
  },
});

// Create default alert rules if none exist
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("alertRules").first();
    if (existing) return "Rules already exist";

    await ctx.db.insert("alertRules", {
      name: "Daily Budget Exceeded",
      type: "budget_exceeded",
      config: { threshold: 10 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 60,
    });

    await ctx.db.insert("alertRules", {
      name: "Agent Offline > 5min",
      type: "agent_offline",
      config: { windowMinutes: 5 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 15,
    });

    await ctx.db.insert("alertRules", {
      name: "Error Spike (>5 in 10min)",
      type: "error_spike",
      config: { threshold: 5, windowMinutes: 10 },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 30,
    });

    await ctx.db.insert("alertRules", {
      name: "Session Loop Detected",
      type: "session_loop",
      config: {},
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 60,
    });

    await ctx.db.insert("alertRules", {
      name: "Hourly Cost > $5",
      type: "custom_threshold",
      config: { threshold: 5, metric: "cost_per_hour" },
      channels: ["discord"],
      isActive: true,
      cooldownMinutes: 60,
    });

    // Also create a default budget
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await ctx.db.insert("budgets", {
      name: "Daily Global Limit",
      period: "daily",
      limitDollars: 25,
      currentSpend: 0,
      resetAt: tomorrow.getTime(),
      hardStop: false,
      isActive: true,
    });

    return "Default rules + budget created";
  },
});
