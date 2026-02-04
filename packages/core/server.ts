#!/usr/bin/env bun

/**
 * ClawWatch Unified Server
 *
 * Single Bun.serve() entry point that:
 * - Serves the frontend (static dist/ in production, HTML import in dev)
 * - Provides API endpoints (health check, etc.)
 * - Runs the WebSocket collector for real-time gateway events
 * - Polls sessions and scans transcripts on a timer
 *
 * Run: bun run server.ts
 */

import { Glob } from "bun";
import { ConvexHttpClient } from "convex/browser";
import { join, resolve } from "path";
import { api } from "./convex/_generated/api.js";
import { dispatchDiscordNotifications } from "./lib/notifications.ts";

// ── Config ───────────────────────────────────────────────────────────────────

const PORT = parseInt(Bun.env.PORT ?? "5173");
const GATEWAY_URL = Bun.env.GATEWAY_URL;
const GATEWAY_TOKEN = Bun.env.GATEWAY_TOKEN;
const CONVEX_URL = Bun.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const SESSION_POLL_INTERVAL_MS = parseInt(Bun.env.SESSION_POLL_INTERVAL ?? "60000");
const SESSIONS_DIR = Bun.env.SESSIONS_DIR ?? "/home/moltbot/.clawdbot/agents";

if (!GATEWAY_URL) {
  console.error("❌ GATEWAY_URL environment variable is required");
  process.exit(1);
}

if (!GATEWAY_TOKEN) {
  console.error("❌ GATEWAY_TOKEN environment variable is required");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// ── Frontend Detection ───────────────────────────────────────────────────────

const distDir = resolve(import.meta.dirname, "dist");
const hasDistBuild = await Bun.file(join(distDir, "index.html")).exists();

// In dev mode, use Bun's HTML import for automatic bundling
// In production, serve from dist/
let htmlImport: Response | undefined;
if (!hasDistBuild) {
  try {
    // Bun HTML import — bundles the entire frontend on the fly
    htmlImport = await import("./index.html");
  } catch {
    console.warn(
      "⚠️  No dist/ build found and HTML import unavailable. Frontend will not be served.",
    );
  }
}

// ── Collector State ──────────────────────────────────────────────────────────

const wsUrl = GATEWAY_URL.replace(/^https?:\/\//, "ws://");
const ingestedCosts = new Set<string>();
let lastHistoricalScan = Date.now() - 86400000 * 3;

// WebSocket connection management
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 60000;
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
let connectionId = 1;
let ws: WebSocket | null = null;
let isConnected = false;
let sessionPollTimer: Timer | null = null;
const startedAt = Date.now();

// Incremental file state tracking for transcript scanning
interface FileState {
  size: number;
  mtimeMs: number;
  lastPosition: number;
  partial: string;
}
const fileStates = new Map<string, FileState>();

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Gateway Interaction ──────────────────────────────────────────────────────

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

// ── Session Polling ──────────────────────────────────────────────────────────

async function pollSessions(): Promise<void> {
  console.log("[collector] Polling sessions...");

  try {
    const startTime = Date.now();
    const result = await invokeGatewayTool("sessions_list", {
      messageLimit: 0,
    });
    const sessions = result.details?.sessions ?? [];
    const responseTimeMs = Date.now() - startTime;

    const mapped = sessions.map((s: Record<string, unknown>) => ({
      key: String(s.key),
      kind: String(s.kind),
      channel: s.channel !== "unknown" ? String(s.channel) : undefined,
      displayName: s.displayName ? String(s.displayName) : undefined,
      model: s.model ? String(s.model) : undefined,
      totalTokens: Number(s.totalTokens ?? 0),
      updatedAt: Number(s.updatedAt ?? Date.now()),
      agentId: String(s.key).split(":")[1],
    }));

    const { ingested } = await convex.mutation(api.collector.ingestSessions, {
      gatewayUrl: GATEWAY_URL,
      sessions: mapped,
    });

    console.log(`[collector] Session poll: ingested ${ingested} sessions (${responseTimeMs}ms)`);
  } catch (err) {
    console.error("[collector] Error in session polling:", err);
  }
}

// ── Transcript Scanning ─────────────────────────────────────────────────────

async function readNewLines(filePath: string): Promise<string[] | null> {
  const file = Bun.file(filePath);

  // Bun.file().size is 0 for non-existent files
  if (file.size === 0) {
    return null;
  }

  const size = file.size;
  const mtimeMs = file.lastModified;
  const prev = fileStates.get(filePath);

  if (prev && size === prev.size && mtimeMs === prev.mtimeMs) {
    return null;
  }

  const startPos = prev && size >= prev.lastPosition ? prev.lastPosition : 0;
  const prevPartial = startPos === 0 ? "" : (prev?.partial ?? "");

  if (startPos >= size) {
    fileStates.set(filePath, {
      size,
      mtimeMs,
      lastPosition: startPos,
      partial: prevPartial,
    });
    return null;
  }

  const newData = await file.slice(startPos, size).text();
  const chunk = prevPartial + newData;
  const parts = chunk.split("\n");
  const trailing = parts.pop() ?? "";

  fileStates.set(filePath, {
    size,
    mtimeMs,
    lastPosition: size,
    partial: trailing,
  });

  return parts.filter(Boolean);
}

async function scanTranscripts(): Promise<void> {
  console.log("[collector] Scanning transcripts...");

  try {
    const glob = new Glob("*/sessions/*.jsonl");

    for await (const match of glob.scan(SESSIONS_DIR)) {
      const parts = match.split("/");
      const agentDir = parts[0];
      const file = parts[parts.length - 1];
      const filePath = join(SESSIONS_DIR, match);

      const newLines = await readNewLines(filePath);
      if (newLines === null || newLines.length === 0) continue;

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

      for (const line of newLines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type !== "message" || !entry.message?.usage?.cost) continue;

          const msg = entry.message;
          const ts = msg.timestamp ?? new Date(entry.timestamp).getTime();

          const costKey = `${file}:${ts}:${msg.usage.cost.total}`;
          if (ingestedCosts.has(costKey)) continue;
          if (ts < lastHistoricalScan) continue;

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

      if (costEntries.length > 0) {
        const { ingested } = await convex.mutation(api.collector.ingestCosts, {
          entries: costEntries,
        });
        console.log(`[collector] Ingested ${ingested} cost entries from ${agentDir}/${file}`);
      }

      if (activities.length > 0) {
        const recentActivities = activities.slice(-20);
        const { ingested } = await convex.mutation(api.collector.ingestActivities, {
          activities: recentActivities,
        });
        console.log(`[collector] Ingested ${ingested} activities from ${agentDir}/${file}`);
      }
    }

    lastHistoricalScan = Date.now();
  } catch (err) {
    console.error("[collector] Error scanning transcripts:", err);
  }
}

// ── Alert Evaluation ─────────────────────────────────────────────────────────

async function evaluateAlerts(): Promise<void> {
  try {
    const result = await convex.mutation(api.evaluateAlerts.evaluate, {});
    if (result.fired > 0) {
      console.log(
        `[collector] ⚠️  Fired ${result.fired} alerts (evaluated ${result.evaluated} rules)`,
      );
    }
    const delivery = await dispatchDiscordNotifications(convex, "collector");
    if (delivery.delivered > 0 || delivery.retried > 0) {
      console.log(
        `[collector] Notifications: checked=${delivery.checked}, delivered=${delivery.delivered}, retried=${delivery.retried}`,
      );
    }
  } catch (err) {
    console.error("[collector] Error evaluating alerts:", err);
  }
}

// ── WebSocket Event Handlers ─────────────────────────────────────────────────

async function handleEvent(event: GatewayEvent): Promise<void> {
  if (event.type !== "event" || !event.event || !event.payload) return;

  console.log(`[ws] Received event: ${event.event}`);

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
        console.log(`[ws] Unhandled event type: ${event.event}`, event.payload);
    }
  } catch (err) {
    console.error(`[ws] Error handling ${event.event} event:`, err);
  }
}

async function handleAgentEvent(payload: Record<string, unknown>): Promise<void> {
  const agent = payload.agent as Record<string, unknown> | undefined;
  const agentName = String(agent?.name || payload.agentName || "unknown");
  const activityType = String(payload.type || "message_sent");

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

  const usage = (message?.usage as Record<string, unknown>) ?? undefined;
  const usageCost = (usage?.cost as Record<string, unknown>) ?? undefined;
  if (usage && usageCost) {
    await convex.mutation(api.collector.ingestCosts, {
      entries: [
        {
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
        },
      ],
    });
  }

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

  let summary = "Chat message";
  const message = payload.message as Record<string, unknown> | undefined;
  if (message?.content) {
    const content = String(message.content);
    summary = content.slice(0, 80) + (content.length > 80 ? "..." : "");
  }

  await convex.mutation(api.collector.ingestActivities, {
    activities: [
      {
        agentName,
        type:
          payload.direction === "outbound"
            ? ("message_sent" as const)
            : ("message_received" as const),
        summary,
        sessionKey: payload.sessionKey as string | undefined,
        channel: payload.channel as string | undefined,
      },
    ],
  });
}

// ── WebSocket Connection ─────────────────────────────────────────────────────

async function connectGateway(): Promise<void> {
  const currentConnectionId = connectionId++;

  console.log(`[ws] Connecting to ${wsUrl} (connection ${currentConnectionId})...`);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[ws] Connected to gateway WebSocket (connection ${currentConnectionId})`);
    };

    ws.onmessage = async (event) => {
      try {
        const frame: GatewayEvent = JSON.parse(event.data as string);

        if (frame.type === "event" && frame.event === "connect.challenge") {
          const connectRequest = {
            type: "req",
            id: "clawwatch-1",
            method: "connect",
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: "clawwatch-collector",
                version: "0.1.0",
                platform: "linux",
                mode: "operator",
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
          if (frame.ok) {
            console.log("[ws] Authenticated successfully, receiving events...");
            isConnected = true;
            reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

            if (sessionPollTimer) clearInterval(sessionPollTimer);
            sessionPollTimer = setInterval(pollSessions, SESSION_POLL_INTERVAL_MS);
          } else {
            console.error("[ws] Authentication failed:", frame.error);
            ws!.close();
          }
        } else {
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
      isConnected = false;

      if (sessionPollTimer) {
        clearInterval(sessionPollTimer);
        sessionPollTimer = null;
      }

      console.log(`[ws] Reconnecting in ${reconnectDelay}ms...`);
      setTimeout(connectGateway, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    };
  } catch (err) {
    console.error(
      `[ws] Failed to create WebSocket connection (connection ${currentConnectionId}):`,
      err,
    );
    console.log(`[ws] Retrying in ${reconnectDelay}ms...`);
    setTimeout(connectGateway, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  }
}

// ── HTTP Server ──────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API routes
    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        gateway: {
          connected: isConnected,
          url: GATEWAY_URL,
        },
        convex: CONVEX_URL,
        sessionsDir: SESSIONS_DIR,
      });
    }

    // Serve frontend
    if (hasDistBuild) {
      // Production: serve from dist/
      const filePath = join(distDir, url.pathname === "/" ? "index.html" : url.pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      }

      // SPA fallback — serve index.html for unmatched routes
      return new Response(Bun.file(join(distDir, "index.html")));
    }

    if (htmlImport) {
      // Dev mode: Bun HTML import handles bundling
      return htmlImport;
    }

    return new Response("ClawWatch API is running. No frontend build found.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

// ── Start ────────────────────────────────────────────────────────────────────

console.log("🔱 ClawWatch Server starting");
console.log(`  HTTP:    http://localhost:${server.port}`);
console.log(`  Gateway: ${wsUrl}`);
console.log(`  Convex:  ${CONVEX_URL}`);
console.log(
  `  Frontend: ${hasDistBuild ? "dist/ (production)" : htmlImport ? "HTML import (dev)" : "none"}`,
);
console.log(`  Session poll interval: ${SESSION_POLL_INTERVAL_MS}ms`);
console.log(`  Sessions dir: ${SESSIONS_DIR}`);
console.log("");

// Historical backfill on startup
await scanTranscripts();

// Start WebSocket connection to gateway
await connectGateway();

// Periodic alert evaluation
setInterval(evaluateAlerts, 60000);

// Periodic transcript scanning (supplements real-time WebSocket events)
setInterval(scanTranscripts, SESSION_POLL_INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[server] Shutting down...");
  if (ws) ws.close();
  if (sessionPollTimer) clearInterval(sessionPollTimer);
  server.stop();
  process.exit(0);
});
