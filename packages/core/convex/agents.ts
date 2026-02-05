import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function buildHealthSummary(ctx: any, agent: any) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Get recent sessions — limit scan to 100, count active in-place
  const sessions = await ctx.db
    .query("sessions")
    .withIndex("by_agent", (q: any) => q.eq("agentId", agent._id))
    .order("desc")
    .take(100);

  let activeSessions = 0;
  for (const s of sessions) {
    if (s.isActive) activeSessions++;
  }

  const currentHourKey = Math.floor(Date.now() / 3600000) * 3600000;
  const prevHourKey = currentHourKey - 3600000;
  const agentPrefix = `agent:${agent._id}`;

  const thisHourCache = await ctx.db
    .query("statsCache")
    .withIndex("by_key", (q: any) => q.eq("key", `${agentPrefix}:hour:${currentHourKey}`))
    .first();
  const prevHourCache = await ctx.db
    .query("statsCache")
    .withIndex("by_key", (q: any) => q.eq("key", `${agentPrefix}:hour:${prevHourKey}`))
    .first();

  let costLastHour = 0;
  let tokensLastHour = 0;

  if (thisHourCache || prevHourCache) {
    costLastHour =
      (thisHourCache?.cost ?? 0) + (prevHourCache?.cost ?? 0);
    tokensLastHour =
      (thisHourCache?.inputTokens ?? 0) +
      (thisHourCache?.outputTokens ?? 0) +
      (prevHourCache?.inputTokens ?? 0) +
      (prevHourCache?.outputTokens ?? 0);
  } else {
    // Fallback to recent cost records if cache is empty (cold start).
    const recentCosts = await ctx.db
      .query("costRecords")
      .withIndex("by_agent_time", (q: any) =>
        q.eq("agentId", agent._id).gte("timestamp", oneHourAgo),
      )
      .take(500);

    costLastHour = recentCosts.reduce((sum: number, r: any) => sum + r.cost, 0);
    tokensLastHour = recentCosts.reduce(
      (sum: number, r: any) => sum + r.inputTokens + r.outputTokens,
      0,
    );
  }

  // Count recent errors — take 50 recent activities and filter by time + type
  const recentActivities = await ctx.db
    .query("activities")
    .withIndex("by_agent", (q: any) => q.eq("agentId", agent._id))
    .order("desc")
    .take(50);

  let errorCount = 0;
  for (const a of recentActivities) {
    const activityTime = a.timestamp ?? a._creationTime;
    if (a.type === "error" && activityTime > oneHourAgo) errorCount++;
  }

  return {
    agent,
    activeSessions,
    totalSessions: sessions.length,
    costLastHour: Math.round(costLastHour * 10000) / 10000,
    tokensLastHour,
    errorCount,
    isHealthy: agent.status === "online" && errorCount < 5,
  };
}

async function buildCostSummary(ctx: any, agentId: string, todayStr: string) {
  const todayCache = await ctx.db
    .query("statsCache")
    .withIndex("by_key", (q: any) => q.eq("key", `agent:${agentId}:today:${todayStr}`))
    .first();

  return {
    today: {
      cost: Math.round((todayCache?.cost ?? 0) * 10000) / 10000,
      requests: todayCache?.requests ?? 0,
    },
  };
}

// List all agents with their current status
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50; // Default reasonable limit
    const offset = args.offset ?? 0;

    const all = await ctx.db
      .query("agents")
      .order("desc")
      .take(offset + limit);
    const agents = all.slice(offset);

    return agents;
  },
});

export const listWithStats = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    const all = await ctx.db
      .query("agents")
      .order("desc")
      .take(offset + limit);
    const agents = all.slice(offset);

    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const activeMap = new Map<string, number>();
    for (const session of activeSessions) {
      activeMap.set(session.agentId, (activeMap.get(session.agentId) ?? 0) + 1);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const results = [];
    for (const agent of agents) {
      const todayCache = await ctx.db
        .query("statsCache")
        .withIndex("by_key", (q) => q.eq("key", `agent:${agent._id}:today:${todayStr}`))
        .first();

      results.push({
        ...agent,
        activeSessions: activeMap.get(agent._id) ?? 0,
        costToday: todayCache?.cost ?? 0,
      });
    }

    return results;
  },
});

// Get a single agent by ID
export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Register or update an agent
export const upsert = mutation({
  args: {
    name: v.string(),
    gatewayUrl: v.string(),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("degraded")),
    config: v.optional(
      v.object({
        model: v.optional(v.string()),
        channel: v.optional(v.string()),
      }),
    ),
    workspacePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastSeen: now,
        lastHeartbeat: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      ...args,
      lastHeartbeat: now,
      lastSeen: now,
    });
  },
});

// Update just the workspace path
export const updateWorkspacePath = mutation({
  args: { agentId: v.id("agents"), workspacePath: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { workspacePath: args.workspacePath });
  },
});

// Set default workspace paths for existing agents
export const setDefaultPaths = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const defaults: Record<string, string> = {
      mimizuku: "/home/moltbot/mimizuku",
      vanilla: "/home/moltbot/vanilla",
    };
    for (const agent of agents) {
      if (!agent.workspacePath) {
        const path = defaults[agent.name] ?? `/home/moltbot/${agent.name}`;
        await ctx.db.patch(agent._id, { workspacePath: path });
      }
    }
  },
});

// Record a heartbeat
export const heartbeat = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("degraded")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.agentId, {
      status: args.status,
      lastHeartbeat: now,
      lastSeen: now,
    });
  },
});

// Mark an agent offline
export const markOffline = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, { status: "offline" });
  },
});

// Get agent health summary (optimized — bounded scans)
export const healthSummary = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    return buildHealthSummary(ctx, agent);
  },
});

// Batch health + cost summaries for graph view
export const graphSummaries = query({
  args: { agentIds: v.array(v.id("agents")) },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const results = [];
    const agentIds = args.agentIds.slice(0, 20);

    for (const agentId of agentIds) {
      const agent = await ctx.db.get(agentId);
      if (!agent) continue;

      const health = await buildHealthSummary(ctx, agent);
      const cost = await buildCostSummary(ctx, agentId, todayStr);

      results.push({
        agentId,
        health,
        cost,
      });
    }

    return results;
  },
});

function extractToolName(summary: string): string | null {
  const match = summary.match(/^Called\s+([^:]+)(?::|$)/i);
  if (!match) return null;
  const name = match[1]?.trim();
  return name ? name : null;
}

// Core tools that get grouped rather than shown individually
const CORE_TOOLS = new Set(["exec", "read", "write", "edit", "process"]);

type IntegrationCategory = "service" | "channel" | "memory" | "internal" | "ai";

interface IntegrationDef {
  name: string;
  category: IntegrationCategory;
  icon: string;
}

// Pattern-match tool calls to meaningful integrations
function classifyToolCall(
  toolName: string,
  summary: string,
): IntegrationDef | "core" | null {
  // exec-based integrations: check summary for CLI patterns
  if (toolName === "exec") {
    if (/\bgh\s/.test(summary))
      return { name: "GitHub", category: "service", icon: "🐙" };
    if (/\bbird\s/.test(summary))
      return { name: "Twitter/X", category: "service", icon: "🐦" };
    // Remaining exec → core tool
    return "core";
  }

  // Direct tool → integration mapping
  const directMap: Record<string, IntegrationDef> = {
    tts: { name: "ElevenLabs", category: "service", icon: "🔊" },
    web_search: { name: "Brave Search", category: "service", icon: "🔍" },
    web_fetch: { name: "Web Fetch", category: "service", icon: "🌐" },
    browser: { name: "Browser", category: "service", icon: "🖥️" },
    memory_search: { name: "Memory", category: "memory", icon: "🧠" },
    memory_get: { name: "Memory", category: "memory", icon: "🧠" },
    sessions_spawn: { name: "Sub-Agents", category: "internal", icon: "🤖" },
    sessions_send: { name: "Sub-Agents", category: "internal", icon: "🤖" },
    cron: { name: "Cron/Scheduler", category: "internal", icon: "⏰" },
    message: { name: "Messaging", category: "channel", icon: "💬" },
    image: { name: "Vision", category: "service", icon: "👁️" },
    nodes: { name: "Nodes/Devices", category: "service", icon: "📱" },
    canvas: { name: "Canvas", category: "service", icon: "🎨" },
  };

  if (directMap[toolName]) return directMap[toolName];

  // Core tools (read, write, edit, process)
  if (CORE_TOOLS.has(toolName)) return "core";

  // Unknown tools — skip (don't pollute the graph)
  return null;
}

// Map provider strings to display names
function normalizeProvider(provider: string): {
  name: string;
  icon: string;
} {
  const lower = provider.toLowerCase();
  if (lower.includes("anthropic") || lower.includes("claude"))
    return { name: "Anthropic", icon: "🟣" };
  if (lower.includes("openai") || lower.includes("gpt"))
    return { name: "OpenAI", icon: "🟢" };
  if (
    lower.includes("google") ||
    lower.includes("gemini") ||
    lower.includes("vertex")
  )
    return { name: "Google", icon: "🔵" };
  if (lower.includes("meta") || lower.includes("llama"))
    return { name: "Meta", icon: "🔷" };
  return { name: provider, icon: "🤖" };
}

export const xraySummary = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    // --- Channels from sessions ---
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(200);

    const channels = new Set<string>();
    for (const session of sessions) {
      if (!session.channel) continue;
      for (const entry of session.channel.split(",")) {
        const trimmed = entry.trim();
        if (trimmed) channels.add(trimmed);
      }
    }

    // --- Activities → integrations + core tools ---
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(500);

    const integrationMap = new Map<
      string,
      { category: IntegrationCategory; icon: string; count: number; lastSeen: number }
    >();
    const coreToolCounts = { exec: 0, read: 0, write: 0, edit: 0, process: 0 };
    const subAgentMap = new Map<string, { count: number; lastSeen: number }>();

    for (const activity of activities) {
      if (activity.type !== "tool_call") continue;
      const toolName = extractToolName(activity.summary);
      if (!toolName) continue;
      const activityTime = activity.timestamp ?? activity._creationTime;

      const classification = classifyToolCall(toolName, activity.summary);

      if (classification === "core") {
        // Count core tools
        if (toolName in coreToolCounts) {
          coreToolCounts[toolName as keyof typeof coreToolCounts] += 1;
        }
        continue;
      }

      if (classification === null) continue;

      // Track sub-agent spawns by name
      if (
        classification.name === "Sub-Agents" &&
        toolName === "sessions_spawn"
      ) {
        const nameMatch = activity.summary.match(
          /sessions_spawn:\s*(?:spawned|started)?\s*(\S+)/i,
        );
        if (nameMatch?.[1]) {
          const subName = nameMatch[1];
          const existing = subAgentMap.get(subName) ?? {
            count: 0,
            lastSeen: 0,
          };
          existing.count += 1;
          existing.lastSeen = Math.max(existing.lastSeen, activityTime);
          subAgentMap.set(subName, existing);
        }
      }

      // Accumulate integration stats
      const existing = integrationMap.get(classification.name) ?? {
        category: classification.category,
        icon: classification.icon,
        count: 0,
        lastSeen: 0,
      };
      existing.count += 1;
      existing.lastSeen = Math.max(existing.lastSeen, activityTime);
      integrationMap.set(classification.name, existing);
    }

    const integrations = Array.from(integrationMap.entries())
      .map(([name, data]) => ({
        name,
        category: data.category,
        icon: data.icon,
        callCount: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.callCount - a.callCount);

    const subAgents = Array.from(subAgentMap.entries())
      .map(([name, data]) => ({ name, count: data.count, lastSeen: data.lastSeen }))
      .sort((a, b) => b.count - a.count);

    // --- AI providers from cost records ---
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const costRecords = await ctx.db
      .query("costRecords")
      .withIndex("by_agent_time", (q) =>
        q.eq("agentId", args.agentId).gte("timestamp", weekAgo),
      )
      .take(1000);

    const providerMap = new Map<
      string,
      {
        icon: string;
        cost: number;
        inputTokens: number;
        outputTokens: number;
        requests: number;
        lastSeen: number;
      }
    >();

    for (const record of costRecords) {
      const { name, icon } = normalizeProvider(record.provider);
      const existing = providerMap.get(name) ?? {
        icon,
        cost: 0,
        inputTokens: 0,
        outputTokens: 0,
        requests: 0,
        lastSeen: 0,
      };
      existing.cost += record.cost;
      existing.inputTokens += record.inputTokens;
      existing.outputTokens += record.outputTokens;
      existing.requests += 1;
      existing.lastSeen = Math.max(existing.lastSeen, record.timestamp);
      providerMap.set(name, existing);
    }

    const aiProviders = Array.from(providerMap.entries())
      .map(([name, data]) => ({
        name,
        icon: data.icon,
        cost: Math.round(data.cost * 10000) / 10000,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        requests: data.requests,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      agent: {
        _id: agent._id,
        name: agent.name,
        gatewayUrl: agent.gatewayUrl,
        status: agent.status,
        config: agent.config,
      },
      channels: Array.from(channels).sort((a, b) => a.localeCompare(b)),
      integrations,
      coreToolCounts,
      subAgents,
      aiProviders,
    };
  },
});

// ─── X-Ray Drill-down ───
// Returns detailed data for a specific node in the X-Ray graph.

export const xrayDrilldown = query({
  args: {
    agentId: v.id("agents"),
    nodeType: v.string(), // "ai" | "service" | "channel" | "memory" | "internal" | "core"
    nodeId: v.string(), // "Anthropic", "GitHub", "discord", "Memory", "core-tools", etc.
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    // ═══ AI Provider drill-down ═══
    if (args.nodeType === "ai") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const costRecords = await ctx.db
        .query("costRecords")
        .withIndex("by_agent_time", (q) =>
          q.eq("agentId", args.agentId).gte("timestamp", weekAgo),
        )
        .order("desc")
        .take(1000);

      // Filter by provider name
      const providerRecords = costRecords.filter((r) => {
        const { name } = normalizeProvider(r.provider);
        return name === args.nodeId;
      });

      // Model breakdown
      const modelMap = new Map<
        string,
        {
          cost: number;
          inputTokens: number;
          outputTokens: number;
          requests: number;
          lastSeen: number;
        }
      >();
      for (const r of providerRecords) {
        const existing = modelMap.get(r.model) ?? {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          requests: 0,
          lastSeen: 0,
        };
        existing.cost += r.cost;
        existing.inputTokens += r.inputTokens;
        existing.outputTokens += r.outputTokens;
        existing.requests += 1;
        existing.lastSeen = Math.max(existing.lastSeen, r.timestamp);
        modelMap.set(r.model, existing);
      }

      const models = Array.from(modelMap.entries())
        .map(([model, data]) => ({
          model,
          cost: Math.round(data.cost * 10000) / 10000,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          requests: data.requests,
          lastSeen: data.lastSeen,
        }))
        .sort((a, b) => b.cost - a.cost);

      // Recent records (last 20)
      const recentRecords = providerRecords.slice(0, 20).map((r) => ({
        timestamp: r.timestamp,
        model: r.model,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        cost: Math.round(r.cost * 10000) / 10000,
        sessionKey: r.sessionKey ?? null,
      }));

      // Totals
      let totalCost = 0;
      let totalInput = 0;
      let totalOutput = 0;
      for (const r of providerRecords) {
        totalCost += r.cost;
        totalInput += r.inputTokens;
        totalOutput += r.outputTokens;
      }

      return {
        type: "ai" as const,
        provider: args.nodeId,
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        totalRequests: providerRecords.length,
        models,
        recentRecords,
      };
    }

    // ═══ Service drill-down ═══
    if (args.nodeType === "service") {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(500);

      const matchingActivities = activities.filter((a) => {
        if (a.type !== "tool_call") return false;
        const toolName = extractToolName(a.summary);
        if (!toolName) return false;
        const classification = classifyToolCall(toolName, a.summary);
        if (classification === "core" || classification === null) return false;
        return classification.name === args.nodeId;
      });

      const recentActivities = matchingActivities.slice(0, 20).map((a) => ({
        timestamp: a.timestamp ?? a._creationTime,
        summary: a.summary,
        sessionKey: a.sessionKey ?? null,
        channel: a.channel ?? null,
      }));

      return {
        type: "service" as const,
        service: args.nodeId,
        totalCalls: matchingActivities.length,
        recentActivities,
      };
    }

    // ═══ Channel drill-down ═══
    if (args.nodeType === "channel") {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(200);

      // Filter sessions by channel
      const channelSessions = sessions.filter((s) => {
        if (!s.channel) return false;
        const channels = s.channel.split(",").map((c) => c.trim());
        return channels.includes(args.nodeId);
      });

      const sessionList = channelSessions.slice(0, 20).map((s) => ({
        sessionKey: s.sessionKey,
        kind: s.kind,
        lastActivity: s.lastActivity,
        totalTokens: s.totalTokens,
        estimatedCost: Math.round(s.estimatedCost * 10000) / 10000,
        messageCount: s.messageCount,
        isActive: s.isActive,
        startedAt: s.startedAt,
      }));

      // Also get messaging activities for this channel
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(300);

      const channelActivities = activities
        .filter((a) => {
          if (a.type !== "tool_call") return false;
          const toolName = extractToolName(a.summary);
          if (toolName !== "message") return false;
          // Check if activity is related to this channel
          return (
            a.channel === args.nodeId ||
            a.summary.toLowerCase().includes(args.nodeId.toLowerCase())
          );
        })
        .slice(0, 20)
        .map((a) => ({
          timestamp: a.timestamp ?? a._creationTime,
          summary: a.summary,
          sessionKey: a.sessionKey ?? null,
        }));

      return {
        type: "channel" as const,
        channel: args.nodeId,
        totalSessions: channelSessions.length,
        sessions: sessionList,
        recentActivity: channelActivities,
      };
    }

    // ═══ Memory drill-down ═══
    if (args.nodeType === "memory") {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(500);

      const memoryActivities = activities.filter((a) => {
        if (a.type !== "tool_call") return false;
        const toolName = extractToolName(a.summary);
        return toolName === "memory_search" || toolName === "memory_get";
      });

      const recentCalls = memoryActivities.slice(0, 20).map((a) => ({
        timestamp: a.timestamp ?? a._creationTime,
        summary: a.summary,
        sessionKey: a.sessionKey ?? null,
        tool: extractToolName(a.summary) ?? "unknown",
      }));

      // Extract file paths from summaries
      const filePaths = new Set<string>();
      for (const a of memoryActivities) {
        // Common patterns: "memory_get: /path/to/file" or mentions of file paths
        const pathMatches = a.summary.match(/(?:\/[\w.-]+)+/g);
        if (pathMatches) {
          for (const p of pathMatches) filePaths.add(p);
        }
      }

      return {
        type: "memory" as const,
        totalCalls: memoryActivities.length,
        recentCalls,
        filesAccessed: Array.from(filePaths).slice(0, 30),
      };
    }

    // ═══ Internal (Sub-Agents, Cron) drill-down ═══
    if (args.nodeType === "internal") {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(500);

      // Sub-agents
      if (
        args.nodeId === "Sub-Agents" ||
        args.nodeId.startsWith("subagent-")
      ) {
        const subAgentActivities = activities.filter((a) => {
          if (a.type !== "tool_call") return false;
          const toolName = extractToolName(a.summary);
          return toolName === "sessions_spawn" || toolName === "sessions_send";
        });

        // Get sub-agent sessions
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
          .order("desc")
          .take(200);

        const subAgentSessions = sessions
          .filter((s) => s.kind === "subagent")
          .slice(0, 20)
          .map((s) => ({
            sessionKey: s.sessionKey,
            displayName: s.displayName ?? null,
            lastActivity: s.lastActivity,
            totalTokens: s.totalTokens,
            estimatedCost: Math.round(s.estimatedCost * 10000) / 10000,
            isActive: s.isActive,
            startedAt: s.startedAt,
            messageCount: s.messageCount,
          }));

        const recentSpawns = subAgentActivities.slice(0, 20).map((a) => ({
          timestamp: a.timestamp ?? a._creationTime,
          summary: a.summary,
          sessionKey: a.sessionKey ?? null,
        }));

        return {
          type: "internal" as const,
          subType: "subagents" as const,
          totalSpawns: subAgentActivities.filter(
            (a) => extractToolName(a.summary) === "sessions_spawn",
          ).length,
          sessions: subAgentSessions,
          recentActivity: recentSpawns,
        };
      }

      // Cron/Scheduler
      if (args.nodeId === "Cron/Scheduler") {
        const cronActivities = activities.filter((a) => {
          if (a.type !== "tool_call") return false;
          const toolName = extractToolName(a.summary);
          return toolName === "cron";
        });

        const recentCalls = cronActivities.slice(0, 20).map((a) => ({
          timestamp: a.timestamp ?? a._creationTime,
          summary: a.summary,
          sessionKey: a.sessionKey ?? null,
        }));

        return {
          type: "internal" as const,
          subType: "cron" as const,
          totalCalls: cronActivities.length,
          recentActivity: recentCalls,
        };
      }

      // Generic internal (Messaging, etc.)
      const matchingActivities = activities.filter((a) => {
        if (a.type !== "tool_call") return false;
        const toolName = extractToolName(a.summary);
        if (!toolName) return false;
        const classification = classifyToolCall(toolName, a.summary);
        if (classification === "core" || classification === null) return false;
        return classification.name === args.nodeId;
      });

      return {
        type: "internal" as const,
        subType: "generic" as const,
        name: args.nodeId,
        totalCalls: matchingActivities.length,
        recentActivity: matchingActivities.slice(0, 20).map((a) => ({
          timestamp: a.timestamp ?? a._creationTime,
          summary: a.summary,
          sessionKey: a.sessionKey ?? null,
        })),
      };
    }

    // ═══ Core Tools drill-down ═══
    if (args.nodeType === "core") {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .take(500);

      const coreToolActivities = activities.filter((a) => {
        if (a.type !== "tool_call") return false;
        const toolName = extractToolName(a.summary);
        return toolName !== null && CORE_TOOLS.has(toolName);
      });

      // Breakdown by tool
      const toolBreakdown = new Map<
        string,
        Array<{ timestamp: number; summary: string; sessionKey: string | null }>
      >();
      const toolCounts: Record<string, number> = {};

      for (const a of coreToolActivities) {
        const toolName = extractToolName(a.summary);
        if (!toolName) continue;
        toolCounts[toolName] = (toolCounts[toolName] ?? 0) + 1;

        const entries = toolBreakdown.get(toolName) ?? [];
        if (entries.length < 10) {
          entries.push({
            timestamp: a.timestamp ?? a._creationTime,
            summary: a.summary,
            sessionKey: a.sessionKey ?? null,
          });
        }
        toolBreakdown.set(toolName, entries);
      }

      const tools = Array.from(toolBreakdown.entries()).map(
        ([tool, recent]) => ({
          tool,
          count: toolCounts[tool] ?? 0,
          recentCalls: recent,
        }),
      );

      return {
        type: "core" as const,
        totalCalls: coreToolActivities.length,
        tools,
      };
    }

    return null;
  },
});
