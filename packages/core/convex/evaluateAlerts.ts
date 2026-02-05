import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

type AlertSeverity = "info" | "warning" | "critical";

interface PendingAlert {
  agentId?: Id<"agents">;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, string | number | boolean | null>;
}

function normalizeAlertData(
  raw: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else if (value !== undefined) {
      out[key] = String(value);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// Evaluate all active alert rules and fire if thresholds are breached
export const evaluate = mutation({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("alertRules").collect();
    const activeRules = rules.filter((r) => r.isActive);
    const now = Date.now();
    let firedCount = 0;

    for (const rule of activeRules) {
      const pendingAlerts: PendingAlert[] = [];

      switch (rule.type) {
        case "budget_exceeded": {
          const budgets = await ctx.db.query("budgets").collect();
          for (const budget of budgets.filter(
            (b) => b.isActive && (!rule.agentId || b.agentId === rule.agentId),
          )) {
            const threshold = rule.config.threshold ?? budget.limitDollars;
            if (budget.currentSpend >= threshold) {
              pendingAlerts.push({
                agentId: budget.agentId ?? undefined,
                severity: rule.severity ?? (budget.hardStop ? "critical" : "warning"),
                title: `Budget "${budget.name}" exceeded`,
                message: `Spend $${budget.currentSpend.toFixed(2)} >= limit $${threshold.toFixed(2)} (${budget.period})`,
                data: normalizeAlertData({
                  budgetName: budget.name,
                  spend: budget.currentSpend,
                  limit: threshold,
                  period: budget.period,
                  hardStop: budget.hardStop,
                }),
              });
            }
          }
          break;
        }

        case "agent_offline": {
          const agents = await ctx.db.query("agents").collect();
          const windowMs = (rule.config.windowMinutes ?? 5) * 60000;
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
          const recentAlerts = await ctx.db.query("alerts").order("desc").take(200);

          for (const agent of scopedAgents) {
            if (now - agent.lastHeartbeat > windowMs) {
              const minsOffline = Math.round((now - agent.lastHeartbeat) / 60000);
              pendingAlerts.push({
                agentId: agent._id,
                severity: rule.severity ?? "critical",
                title: `Agent "${agent.name}" is offline`,
                message: `No heartbeat for ${minsOffline} minutes`,
                data: normalizeAlertData({
                  agentName: agent.name,
                  minutesOffline: minsOffline,
                  windowMinutes: rule.config.windowMinutes ?? 5,
                }),
              });
              // Mark agent offline
              await ctx.db.patch(agent._id, { status: "offline" });
            } else {
              // Agent is online — auto-resolve any outstanding offline alerts
              for (const alert of recentAlerts) {
                if (
                  alert.type === "agent_offline" &&
                  alert.agentId === agent._id &&
                  !alert.resolvedAt
                ) {
                  await ctx.db.patch(alert._id, { resolvedAt: now });
                }
              }
              // Ensure agent is marked online
              if (agent.status === "offline") {
                await ctx.db.patch(agent._id, { status: "online" });
              }
            }
          }
          break;
        }

        case "error_spike": {
          const windowMs = (rule.config.windowMinutes ?? 10) * 60000;
          const threshold = rule.config.threshold ?? 5;
          const agents = await ctx.db.query("agents").collect();
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);

          for (const agent of scopedAgents) {
            const recentActivities = await ctx.db
              .query("activities")
              .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
              .order("desc")
              .take(200);

            const recentErrors = recentActivities.filter((a) => {
              const activityTime = a.timestamp ?? a._creationTime;
              return a.type === "error" && activityTime > now - windowMs;
            });

            if (recentErrors.length >= threshold) {
              pendingAlerts.push({
                agentId: agent._id,
                severity: rule.severity ?? "warning",
                title: `Error spike on "${agent.name}"`,
                message: `${recentErrors.length} errors in last ${rule.config.windowMinutes ?? 10} minutes`,
                data: normalizeAlertData({
                  agentName: agent.name,
                  errorCount: recentErrors.length,
                  threshold,
                  windowMinutes: rule.config.windowMinutes ?? 10,
                }),
              });
            }
          }
          break;
        }

        case "cost_spike": {
          const agents = await ctx.db.query("agents").collect();
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
          const windowMs = (rule.config.windowMinutes ?? 15) * 60000;
          const percentageThreshold = rule.config.percentageThreshold ?? 50;
          const lookbackMs = 24 * 60 * 60000;

          for (const agent of scopedAgents) {
            const records = await ctx.db
              .query("costRecords")
              .withIndex("by_agent_time", (q) =>
                q.eq("agentId", agent._id).gte("timestamp", now - lookbackMs),
              )
              .collect();
            if (records.length === 0) continue;

            const windowStart = now - windowMs;
            const recentCost = records
              .filter((r) => r.timestamp >= windowStart)
              .reduce((sum, r) => sum + r.cost, 0);
            const baselineCost = records
              .filter((r) => r.timestamp < windowStart)
              .reduce((sum, r) => sum + r.cost, 0);

            const baselineHours = Math.max((lookbackMs - windowMs) / 3600000, 1);
            const baselineHourly = baselineCost / baselineHours;
            const currentHourly = recentCost / (windowMs / 3600000);
            if (baselineHourly <= 0) continue;

            const increasePct = ((currentHourly - baselineHourly) / baselineHourly) * 100;
            if (increasePct >= percentageThreshold) {
              pendingAlerts.push({
                agentId: agent._id,
                severity: rule.severity ?? "warning",
                title: `Cost spike on "${agent.name}"`,
                message: `${increasePct.toFixed(0)}% above baseline (${windowMs / 60000}m window)`,
                data: normalizeAlertData({
                  agentName: agent.name,
                  increasePct: Math.round(increasePct),
                  baselineHourly: Number(baselineHourly.toFixed(4)),
                  currentHourly: Number(currentHourly.toFixed(4)),
                  windowMinutes: windowMs / 60000,
                }),
              });
            }
          }
          break;
        }

        case "high_token_usage": {
          const agents = await ctx.db.query("agents").collect();
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
          const threshold = rule.config.threshold ?? 100000;
          const windowMs = (rule.config.windowMinutes ?? 15) * 60000;

          for (const agent of scopedAgents) {
            const records = await ctx.db
              .query("costRecords")
              .withIndex("by_agent_time", (q) =>
                q.eq("agentId", agent._id).gte("timestamp", now - windowMs),
              )
              .collect();
            const tokens = records.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);

            if (tokens >= threshold) {
              pendingAlerts.push({
                agentId: agent._id,
                severity: rule.severity ?? "warning",
                title: `High token usage on "${agent.name}"`,
                message: `${tokens.toLocaleString()} tokens in last ${windowMs / 60000} minutes`,
                data: normalizeAlertData({
                  agentName: agent.name,
                  tokens,
                  threshold,
                  windowMinutes: windowMs / 60000,
                }),
              });
            }
          }
          break;
        }

        case "session_loop": {
          const agents = await ctx.db.query("agents").collect();
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
          for (const agent of scopedAgents) {
            const sessions = await ctx.db
              .query("sessions")
              .withIndex("by_agent_active", (q) =>
                q.eq("agentId", agent._id).eq("isActive", true),
              )
              .order("desc")
              .take(50);

            for (const session of sessions) {
              // Detect high message count in short time as potential loop
              if (session.messageCount > 100 && session.totalTokens > 500000) {
                pendingAlerts.push({
                  agentId: agent._id,
                  severity: rule.severity ?? "critical",
                  title: `Possible loop on "${agent.name}"`,
                  message: `Session ${session.displayName ?? session.sessionKey} has ${session.messageCount} messages and ${session.totalTokens} tokens`,
                  data: normalizeAlertData({
                    agentName: agent.name,
                    sessionKey: session.sessionKey,
                    messageCount: session.messageCount,
                    totalTokens: session.totalTokens,
                  }),
                });
              }
            }
          }
          break;
        }

        case "channel_disconnect": {
          // Check if any agent's channel has gone silent
          const agents = await ctx.db.query("agents").collect();
          const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
          const _windowMs = (rule.config.windowMinutes ?? 30) * 60000;

          for (const agent of scopedAgents) {
            const activeDiscordSessions = await ctx.db
              .query("sessions")
              .withIndex("by_agent_channel_active", (q) =>
                q.eq("agentId", agent._id).eq("channel", "discord").eq("isActive", true),
              )
              .order("desc")
              .take(1);

            if (activeDiscordSessions.length > 0) continue;

            const inactiveDiscordSessions = await ctx.db
              .query("sessions")
              .withIndex("by_agent_channel_active", (q) =>
                q.eq("agentId", agent._id).eq("channel", "discord").eq("isActive", false),
              )
              .order("desc")
              .take(1);

            if (inactiveDiscordSessions.length > 0) {
              pendingAlerts.push({
                agentId: agent._id,
                severity: rule.severity ?? "warning",
                title: `Channel disconnect on "${agent.name}"`,
                message: `No active Discord sessions`,
                data: normalizeAlertData({
                  agentName: agent.name,
                  channel: "discord",
                }),
              });
            }
          }
          break;
        }

        case "custom_threshold": {
          // Generic metric threshold checking
          if (rule.config.metric === "cost_per_hour") {
            const agents = await ctx.db.query("agents").collect();
            const scopedAgents = agents.filter((a) => !rule.agentId || a._id === rule.agentId);
            for (const agent of scopedAgents) {
              const oneHourAgo = now - 3600000;
              const recentCosts = await ctx.db
                .query("costRecords")
                .withIndex("by_agent_time", (q) =>
                  q.eq("agentId", agent._id).gte("timestamp", oneHourAgo),
                )
                .collect();

              const hourCost = recentCosts.reduce((sum, r) => sum + r.cost, 0);
              const threshold = rule.config.threshold ?? 5;

              if (hourCost > threshold) {
                pendingAlerts.push({
                  agentId: agent._id,
                  severity: rule.severity ?? "warning",
                  title: `High hourly cost on "${agent.name}"`,
                  message: `$${hourCost.toFixed(2)}/hr exceeds $${threshold.toFixed(2)} threshold`,
                  data: normalizeAlertData({
                    agentName: agent.name,
                    hourCost: Number(hourCost.toFixed(4)),
                    threshold,
                  }),
                });
              }
            }
          }
          break;
        }
      }

      const recentAlerts = await ctx.db.query("alerts").order("desc").take(500);
      let ruleFired = false;
      for (const pending of pendingAlerts) {
        const onCooldown = recentAlerts.some(
          (a) =>
            a.ruleId === rule._id &&
            a.agentId === pending.agentId &&
            now - a._creationTime < rule.cooldownMinutes * 60000,
        );
        if (onCooldown) continue;

        await ctx.db.insert("alerts", {
          ruleId: rule._id,
          agentId: pending.agentId,
          type: rule.type,
          severity: pending.severity,
          title: pending.title,
          message: pending.message,
          data: pending.data,
          channels: rule.channels,
        });

        // Log as activity
        if (pending.agentId) {
          await ctx.db.insert("activities", {
            agentId: pending.agentId,
            type: "alert_fired",
            summary: `🚨 ${pending.severity.toUpperCase()}: ${pending.title}`,
            details: { message: pending.message },
            timestamp: now,
          });
        }

        firedCount++;
        ruleFired = true;
        console.log(`[alert] Fired: ${pending.title} (${pending.severity})`);
      }

      if (ruleFired) {
        await ctx.db.patch(rule._id, { lastTriggered: now });
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
