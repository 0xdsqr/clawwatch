#!/usr/bin/env bun

/**
 * ClawWatch WebSocket Collector
 *
 * Real-time data collection via Clawdbot gateway WebSocket API.
 * Connects to the gateway WebSocket, handles events in real-time,
 * and feeds data into Convex.
 *
 * Run: bun run collector/ws.ts
 */

import { Glob } from "bun";
import { ConvexHttpClient } from "convex/browser";
import { join } from "path";
import { api } from "../convex/_generated/api.js";
import { dispatchDiscordNotifications } from "../lib/notifications.ts";

// Config - all values must be provided via environment variables
const GATEWAY_URL = Bun.env.GATEWAY_URL;
const GATEWAY_TOKEN = Bun.env.GATEWAY_TOKEN;
const CONVEX_URL = Bun.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const SESSION_POLL_INTERVAL_MS = parseInt(Bun.env.SESSION_POLL_INTERVAL ?? "60000"); // 60 seconds
const SESSIONS_DIR = Bun.env.SESSIONS_DIR ?? "/home/moltbot/.clawdbot/agents";

// Connection management
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 60000;
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
let connectionId = 1;

if (!GATEWAY_URL) {
  console.error("❌ GATEWAY_URL environment variable is required");
  process.exit(1);
}

if (!GATEWAY_TOKEN) {
  console.error("❌ GATEWAY_TOKEN environment variable is required");
  process.exit(1);
}

// Convert HTTP URL to WebSocket URL
const wsUrl = GATEWAY_URL.replace(/^https?:\/\//, "ws://");

const convex = new ConvexHttpClient(CONVEX_URL);

// Track what we've already ingested (cost entries by timestamp)
const ingestedCosts = new Set<string>();
let lastHistoricalScan = Date.now() - 86400000 * 3; // Start from 3 days ago

// Connection state
let ws: WebSocket | null = null;
let sessionPollTimer: Timer | null = null;

interface GatewayEvent {
  type: "event" | "res" | "req";
  event?: string;
  id?: string;
  ok?: boolean;
  payload?: Record<string, unknown>;
  error?: Record<string, unknown> | string;
  method?: string;
  params?: Record<string, unknown>;
}

async function invokeGatewayTool(
  tool: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, args }),
  });

  if (!res.ok) {
    throw new Error(`Gateway API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.ok) throw new Error(`Gateway tool error: ${JSON.stringify(data)}`);
  return data.result;
}

async function pollSessions(): Promise<void> {
  console.log("[ws] Polling sessions as periodic supplement...");

  try {
    const startTime = Date.now();
    const result = await invokeGatewayTool("sessions_list", {
      messageLimit: 0,
    });
    const details = result.details as { sessions?: Array<Record<string, unknown>> } | undefined;
    const sessions = details?.sessions ?? [];
    const responseTimeMs = Date.now() - startTime;

    // Map sessions to our format
    const mapped = sessions.map((s: Record<string, unknown>) => ({
      key: String(s.key),
      kind: String(s.kind),
      channel: s.channel !== "unknown" ? String(s.channel) : undefined,
      displayName: s.displayName ? String(s.displayName) : undefined,
      model: s.model ? String(s.model) : undefined,
      totalTokens: Number(s.totalTokens ?? 0),
      updatedAt: Number(s.updatedAt ?? Date.now()),
      agentId: String(s.key).split(":")[1] ?? "unknown", // "agent:mimizuku:..." → "mimizuku"
    }));

    // Ingest into Convex
    const { ingested } = await convex.mutation(api.collector.ingestSessions, {
      gatewayUrl: GATEWAY_URL,
      sessions: mapped,
    });

    console.log(`[ws] Session poll: ingested ${ingested} sessions (${responseTimeMs}ms)`);
  } catch (err) {
    console.error("[ws] Error in session polling:", err);
  }
}

async function scanHistoricalTranscripts(): Promise<void> {
  console.log("[ws] Scanning historical transcripts for backfill...");

  try {
    const glob = new Glob("*/sessions/*.jsonl");

    for await (const match of glob.scan(SESSIONS_DIR)) {
      // match is e.g. "mimizuku/sessions/foo.jsonl"
      const parts = match.split("/");
      const agentDir = parts[0] ?? "unknown";
      const file = parts[parts.length - 1] ?? match;
      const filePath = join(SESSIONS_DIR, match);

      {
        const content = await Bun.file(filePath).text();
        const lines = content.split("\n").filter(Boolean);

        const costEntries: Array<{
          agentName: string;
          sessionKey: string | undefined;
          provider: string;
          model: string;
          inputTokens: number;
          outputTokens: number;
          cacheReadTokens: number | undefined;
          cacheWriteTokens: number | undefined;
          totalCost: number;
          timestamp: number;
        }> = [];

        const activities: Array<{
          agentName: string;
          type: "message_sent" | "message_received" | "tool_call" | "error" | "heartbeat";
          summary: string;
          sessionKey: string | undefined;
          channel: string | undefined;
        }> = [];

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type !== "message" || !entry.message?.usage?.cost) continue;

            const msg = entry.message;
            const ts = msg.timestamp ?? new Date(entry.timestamp).getTime();

            // Skip if already ingested or too old
            const costKey = `${file}:${ts}:${msg.usage.cost.total}`;
            if (ingestedCosts.has(costKey)) continue;
            if (ts < lastHistoricalScan) continue;

            // Extract cost data
            costEntries.push({
              agentName: agentDir,
              sessionKey: undefined,
              provider: msg.provider ?? "unknown",
              model: msg.model ?? "unknown",
              inputTokens: msg.usage.input ?? 0,
              outputTokens: msg.usage.output ?? 0,
              cacheReadTokens: msg.usage.cacheRead ?? undefined,
              cacheWriteTokens: msg.usage.cacheWrite ?? undefined,
              totalCost: msg.usage.cost.total ?? 0,
              timestamp: ts,
            });

            ingestedCosts.add(costKey);

            // Extract activity
            if (msg.role === "assistant" && msg.content) {
              for (const block of Array.isArray(msg.content) ? msg.content : []) {
                if (block.type === "toolCall") {
                  activities.push({
                    agentName: agentDir,
                    type: "tool_call",
                    summary: `Called ${block.name}${block.arguments?.command ? `: ${String(block.arguments.command).slice(0, 60)}` : ""}`,
                    sessionKey: undefined,
                    channel: undefined,
                  });
                } else if (block.type === "text" && block.text) {
                  const preview = block.text.slice(0, 80);
                  activities.push({
                    agentName: agentDir,
                    type: "message_sent",
                    summary: `${preview}${block.text.length > 80 ? "..." : ""}`,
                    sessionKey: undefined,
                    channel: undefined,
                  });
                }
              }
            }
          } catch {
            // Skip malformed lines
          }
        }

        // Batch ingest in chunks to avoid mutation timeout
        if (costEntries.length > 0) {
          const CHUNK_SIZE = 25;
          let totalIngested = 0;

          for (let i = 0; i < costEntries.length; i += CHUNK_SIZE) {
            const chunk = costEntries.slice(i, i + CHUNK_SIZE);
            const { ingested } = await convex.mutation(api.collector.ingestCosts, {
              entries: chunk,
            });
            totalIngested += ingested;
          }

          // Update stats cache with aggregated deltas
          const cacheDeltas = new Map<
            string,
            {
              cost: number;
              inputTokens: number;
              outputTokens: number;
              requests: number;
            }
          >();
          for (const entry of costEntries) {
            const dateStr = new Date(entry.timestamp).toISOString().slice(0, 10);
            const hourKey = Math.floor(entry.timestamp / 3600000) * 3600000;

            // Aggregate by time bucket AND by model
            const modelKey = `model:${dateStr}:${entry.model}`;
            for (const key of [`today:${dateStr}`, `hour:${hourKey}`, modelKey]) {
              const existing = cacheDeltas.get(key) ?? {
                cost: 0,
                inputTokens: 0,
                outputTokens: 0,
                requests: 0,
              };
              existing.cost += entry.totalCost;
              existing.inputTokens += entry.inputTokens;
              existing.outputTokens += entry.outputTokens;
              existing.requests += 1;
              cacheDeltas.set(key, existing);
            }
          }

          // Send aggregated cache updates in small batches
          const cacheUpdates = Array.from(cacheDeltas.entries()).map(([key, data]) => ({
            key,
            ...data,
          }));
          for (let i = 0; i < cacheUpdates.length; i += 10) {
            await convex.mutation(api.collector.updateStatsCache, {
              updates: cacheUpdates.slice(i, i + 10),
            });
          }

          console.log(
            `[ws] Historical backfill: ingested ${totalIngested} cost entries from ${agentDir}/${file}`,
          );
        }

        // Limit activities to prevent flooding
        if (activities.length > 0) {
          const recentActivities = activities.slice(-20);
          const { ingested } = await convex.mutation(api.collector.ingestActivities, {
            activities: recentActivities,
          });
          console.log(
            `[ws] Historical backfill: ingested ${ingested} activities from ${agentDir}/${file}`,
          );
        }
      }
    }
    lastHistoricalScan = Date.now();
  } catch (err) {
    console.error("[ws] Error scanning historical transcripts:", err);
  }
}

async function handleEvent(event: GatewayEvent): Promise<void> {
  if (event.type !== "event" || !event.event || !event.payload) {
    return;
  }

  // Only log non-streaming events to avoid spam
  if (event.event !== "agent" && event.event !== "chat" && event.event !== "tick") {
    console.log(`[ws] Received event: ${event.event}`);
  }

  try {
    switch (event.event) {
      case "agent":
        await handleAgentEvent(event.payload);
        break;
      case "health":
        await handleHealthEvent(event.payload);
        break;
      case "heartbeat":
        await handleHeartbeatEvent(event.payload);
        break;
      case "presence":
        await handlePresenceEvent(event.payload);
        break;
      case "chat":
        await handleChatEvent(event.payload);
        break;
      default:
        console.log(
          `[ws] Unhandled event type: ${event.event}`,
          JSON.stringify(event.payload).slice(0, 200),
        );
    }
  } catch (err) {
    console.error(`[ws] Error handling ${event.event} event:`, err);
  }
}

async function handleAgentEvent(payload: Record<string, unknown>): Promise<void> {
  // Extract agent info from payload and ingest as activity
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");
  let activityType = String(payload.type || "message_sent");
  const stream = payload.stream as string | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  let summary = "Agent activity";

  const message = payload.message as Record<string, unknown> | undefined;
  if (message?.content) {
    const contentBlocks = message.content as Array<Record<string, string>> | string;
    const content = Array.isArray(contentBlocks)
      ? contentBlocks.map((c) => c.text || c.type || "").join(" ")
      : String(contentBlocks);
    summary = content.slice(0, 80) + (content.length > 80 ? "..." : "");
  } else if (payload.tool) {
    summary = `Tool call: ${String(payload.tool)}`;
  } else if (payload.activity) {
    summary = String(payload.activity).slice(0, 80);
  }

  if (stream === "tool_call") {
    const toolName = data?.name ?? data?.tool ?? "unknown";
    activityType = "tool_call";
    summary = `Tool: ${String(toolName)}`;
  } else if (stream === "error") {
    activityType = "error";
    summary = String(data?.message ?? data?.error ?? "Unknown error").slice(0, 80);
  }

  if (activityType === "session_ended") {
    const cost = (message?.usage as Record<string, unknown> | undefined)?.cost as
      | Record<string, unknown>
      | undefined;
    summary = `Run ended${cost ? ` ($${Number(cost.total ?? 0).toFixed(4)})` : ""}`;
  }

  // Ingest cost if available
  const usage = (message?.usage as Record<string, unknown>) ?? undefined;
  const usageCost = (usage?.cost as Record<string, unknown>) ?? undefined;
  if (usage && usageCost) {
    const costEntry = {
      agentName,
      sessionKey: payload.sessionKey as string | undefined,
      provider: String(message?.provider || "unknown"),
      model: String(message?.model || "unknown"),
      inputTokens: Number(usage.input || 0),
      outputTokens: Number(usage.output || 0),
      cacheReadTokens: usage.cacheRead != null ? Number(usage.cacheRead) : undefined,
      cacheWriteTokens: usage.cacheWrite != null ? Number(usage.cacheWrite) : undefined,
      totalCost: Number(usageCost.total || 0),
      timestamp: Number(payload.timestamp || Date.now()),
    };

    await convex.mutation(api.collector.ingestCosts, {
      entries: [costEntry],
    });

    // Update stats cache for real-time data
    const ts = costEntry.timestamp;
    const dateStr = new Date(ts).toISOString().slice(0, 10);
    const hourKey = Math.floor(ts / 3600000) * 3600000;
    await convex.mutation(api.collector.updateStatsCache, {
      updates: [
        {
          key: `today:${dateStr}`,
          cost: costEntry.totalCost,
          inputTokens: costEntry.inputTokens,
          outputTokens: costEntry.outputTokens,
          requests: 1,
        },
        {
          key: `hour:${hourKey}`,
          cost: costEntry.totalCost,
          inputTokens: costEntry.inputTokens,
          outputTokens: costEntry.outputTokens,
          requests: 1,
        },
        {
          key: `model:${dateStr}:${costEntry.model}`,
          cost: costEntry.totalCost,
          inputTokens: costEntry.inputTokens,
          outputTokens: costEntry.outputTokens,
          requests: 1,
        },
      ],
    });
  }

  // Ingest activity
  await convex.mutation(api.collector.ingestActivities, {
    activities: [
      {
        agentName,
        type: activityType as
          | "message_sent"
          | "message_received"
          | "tool_call"
          | "error"
          | "heartbeat",
        summary,
        sessionKey: payload.sessionKey as string | undefined,
        channel: payload.channel as string | undefined,
      },
    ],
  });
}

async function handleHealthEvent(payload: Record<string, unknown>): Promise<void> {
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");
  await convex.mutation(api.collector.recordHealthCheck, {
    agentName,
    responseTimeMs: Number(payload.responseTimeMs || payload.latency || 0),
    activeSessionCount: Number(payload.activeSessionCount || 0),
    totalTokensLastHour: Number(payload.totalTokensLastHour || 0),
    costLastHour: Number(payload.costLastHour || 0),
    errorCount: Number(payload.errorCount || 0),
  });
}

async function handleHeartbeatEvent(payload: Record<string, unknown>): Promise<void> {
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");

  await convex.mutation(api.collector.ingestActivities, {
    activities: [
      {
        agentName,
        type: "heartbeat" as const,
        summary: "Agent heartbeat",
        sessionKey: payload.sessionKey as string | undefined,
        channel: payload.channel as string | undefined,
      },
    ],
  });
}

async function handlePresenceEvent(payload: Record<string, unknown>): Promise<void> {
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");
  const status = String(payload.status || payload.presence || "unknown");

  await convex.mutation(api.collector.ingestActivities, {
    activities: [
      {
        agentName,
        type: status === "online" ? ("session_started" as const) : ("session_ended" as const),
        summary: `Agent ${status}`,
        sessionKey: payload.sessionKey as string | undefined,
        channel: payload.channel as string | undefined,
      },
    ],
  });
}

async function handleChatEvent(payload: Record<string, unknown>): Promise<void> {
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");
  const message = payload.message as Record<string, unknown> | undefined;

  let summary = "Chat message";
  if (message?.content) {
    const contentBlocks = message.content as
      | Array<{ type?: string; text?: string }>
      | string
      | undefined;
    if (Array.isArray(contentBlocks)) {
      const textParts = contentBlocks
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join(" ")
        .trim();
      if (textParts) {
        summary = textParts.slice(0, 80) + (textParts.length > 80 ? "..." : "");
      }
    } else {
      const content = String(contentBlocks);
      summary = content.slice(0, 80) + (content.length > 80 ? "..." : "");
    }
  }

  const direction = String(payload.direction ?? "");
  const role = String(message?.role ?? "");
  const activityType: "message_sent" | "message_received" =
    direction === "outbound" || role === "assistant" ? "message_sent" : "message_received";

  await convex.mutation(api.collector.ingestActivities, {
    activities: [
      {
        agentName,
        type: activityType,
        summary,
        sessionKey: payload.sessionKey as string | undefined,
        channel: payload.channel as string | undefined,
      },
    ],
  });

  // Extract cost from complete messages if present
  const usage = message?.usage as Record<string, unknown> | undefined;
  const cost = (usage?.cost as Record<string, unknown>) ?? undefined;
  if (usage && cost) {
    const ts = Number(message?.timestamp || payload.timestamp || Date.now());
    const model = String(message?.model || "unknown");
    await convex.mutation(api.collector.ingestCosts, {
      entries: [
        {
          agentName,
          sessionKey: payload.sessionKey as string | undefined,
          provider: String(message?.provider || "unknown"),
          model,
          inputTokens: Number(usage.input ?? usage.inputTokens ?? 0),
          outputTokens: Number(usage.output ?? usage.outputTokens ?? 0),
          cacheReadTokens: usage.cacheRead != null ? Number(usage.cacheRead) : undefined,
          cacheWriteTokens: usage.cacheWrite != null ? Number(usage.cacheWrite) : undefined,
          totalCost: Number(cost.total ?? 0),
          timestamp: ts,
        },
      ],
    });

    // Keep stats cache in sync for dashboard reads.
    const dateStr = new Date(ts).toISOString().slice(0, 10);
    const hourKey = Math.floor(ts / 3600000) * 3600000;
    await convex.mutation(api.collector.updateStatsCache, {
      updates: [
        {
          key: `today:${dateStr}`,
          cost: Number(cost.total ?? 0),
          inputTokens: Number(usage.input ?? usage.inputTokens ?? 0),
          outputTokens: Number(usage.output ?? usage.outputTokens ?? 0),
          requests: 1,
        },
        {
          key: `hour:${hourKey}`,
          cost: Number(cost.total ?? 0),
          inputTokens: Number(usage.input ?? usage.inputTokens ?? 0),
          outputTokens: Number(usage.output ?? usage.outputTokens ?? 0),
          requests: 1,
        },
        {
          key: `model:${dateStr}:${model}`,
          cost: Number(cost.total ?? 0),
          inputTokens: Number(usage.input ?? usage.inputTokens ?? 0),
          outputTokens: Number(usage.output ?? usage.outputTokens ?? 0),
          requests: 1,
        },
      ],
    });
  }
}

async function connect(): Promise<void> {
  const currentConnectionId = connectionId++;

  console.log(`[ws] Connecting to ${wsUrl} (connection ${currentConnectionId})...`);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = async () => {
      console.log(`[ws] Connected to gateway WebSocket (connection ${currentConnectionId})`);
    };

    ws.onmessage = async (event) => {
      try {
        const frame: GatewayEvent = JSON.parse(event.data as string);

        if (frame.type === "event" && frame.event === "connect.challenge") {
          // Send connect request in response to challenge
          const connectRequest = {
            type: "req",
            id: "clawwatch-1",
            method: "connect",
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: "gateway-client",
                displayName: "ClawWatch Collector",
                version: "0.1.0",
                platform: "linux",
                mode: "backend",
              },
              role: "operator",
              scopes: ["operator.read"],
              caps: [],
              commands: [],
              permissions: {},
              auth: { token: GATEWAY_TOKEN },
              locale: "en-US",
              userAgent: "clawwatch-collector/0.1.0",
            },
          };

          ws!.send(JSON.stringify(connectRequest));
          console.log("[ws] Sent connect request in response to challenge");
        } else if (frame.type === "res" && frame.id === "clawwatch-1") {
          // Connection response
          if (frame.ok) {
            console.log("[ws] Authenticated successfully, receiving events...");
            reconnectDelay = INITIAL_RECONNECT_DELAY_MS; // Reset reconnect delay

            // Start session polling timer
            if (sessionPollTimer) clearInterval(sessionPollTimer);
            sessionPollTimer = setInterval(pollSessions, SESSION_POLL_INTERVAL_MS);
          } else {
            console.error("[ws] Authentication failed:", frame.error);
            ws!.close();
          }
        } else {
          // Handle regular events
          await handleEvent(frame);
        }
      } catch (err) {
        console.error("[ws] Error processing message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error(`[ws] WebSocket error (connection ${currentConnectionId}):`, error);
    };

    ws.onclose = (event) => {
      console.log(
        `[ws] Connection closed (connection ${currentConnectionId}): code=${event.code}, reason=${event.reason}`,
      );

      // Stop session polling
      if (sessionPollTimer) {
        clearInterval(sessionPollTimer);
        sessionPollTimer = null;
      }

      // Schedule reconnection
      console.log(`[ws] Reconnecting in ${reconnectDelay}ms...`);
      setTimeout(connect, reconnectDelay);

      // Exponential backoff
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    };
  } catch (err) {
    console.error(
      `[ws] Failed to create WebSocket connection (connection ${currentConnectionId}):`,
      err,
    );

    // Schedule reconnection
    console.log(`[ws] Retrying in ${reconnectDelay}ms...`);
    setTimeout(connect, reconnectDelay);

    // Exponential backoff
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  }
}

async function evaluateAlerts(): Promise<void> {
  try {
    const result = await convex.mutation(api.evaluateAlerts.evaluate, {});
    if (result.fired > 0) {
      console.log(`[ws] ⚠️  Fired ${result.fired} alerts (evaluated ${result.evaluated} rules)`);
    }
    const delivery = await dispatchDiscordNotifications(convex, "ws");
    if (delivery.delivered > 0 || delivery.retried > 0) {
      console.log(
        `[ws] Notifications: checked=${delivery.checked}, delivered=${delivery.delivered}, retried=${delivery.retried}`,
      );
    }
  } catch (err) {
    console.error("[ws] Error evaluating alerts:", err);
  }
}

async function main(): Promise<void> {
  console.log("🔱 ClawWatch WebSocket Collector starting");
  console.log(`  Gateway: ${wsUrl}`);
  console.log(`  Convex:  ${CONVEX_URL}`);
  console.log(`  Session poll interval: ${SESSION_POLL_INTERVAL_MS}ms`);
  console.log(`  Sessions dir: ${SESSIONS_DIR}`);
  console.log("");

  // Start WebSocket connection FIRST so heartbeats flow immediately
  await connect();

  // Historical backfill in background (don't block the event loop)
  scanHistoricalTranscripts().catch((err) => console.error("[ws] Background backfill error:", err));

  // Run alert evaluation every minute
  setInterval(evaluateAlerts, 60000);

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("[ws] Shutting down...");
    if (ws) {
      ws.close();
    }
    if (sessionPollTimer) {
      clearInterval(sessionPollTimer);
    }
    process.exit(0);
  });
}

main().catch(console.error);
