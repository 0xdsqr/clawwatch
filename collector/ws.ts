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

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

// Config - all values must be provided via environment variables
const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
const CONVEX_URL = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const SESSION_POLL_INTERVAL_MS = parseInt(process.env.SESSION_POLL_INTERVAL ?? "60000"); // 60 seconds
const SESSIONS_DIR = process.env.SESSIONS_DIR ?? "/home/moltbot/.clawdbot/agents";

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
let isConnected = false;
let sessionPollTimer: Timer | null = null;

interface GatewayEvent {
  type: "event" | "res" | "req";
  event?: string;
  id?: string;
  ok?: boolean;
  payload?: any;
  error?: any;
  method?: string;
  params?: any;
}

async function invokeGatewayTool(
  tool: string,
  args: Record<string, unknown> = {},
): Promise<any> {
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
    const sessions = result.details?.sessions ?? [];
    const responseTimeMs = Date.now() - startTime;

    // Map sessions to our format
    const mapped = sessions.map((s: any) => ({
      key: s.key,
      kind: s.kind,
      channel: s.channel !== "unknown" ? s.channel : undefined,
      displayName: s.displayName,
      model: s.model,
      totalTokens: s.totalTokens ?? 0,
      updatedAt: s.updatedAt ?? Date.now(),
      agentId: s.key.split(":")[1], // "agent:mimizuku:..." → "mimizuku"
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
    const agentDirs = await readdir(SESSIONS_DIR);

    for (const agentDir of agentDirs) {
      const sessionsPath = join(SESSIONS_DIR, agentDir, "sessions");
      let files: string[];
      try {
        files = await readdir(sessionsPath);
      } catch {
        continue;
      }

      const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

      for (const file of jsonlFiles) {
        const filePath = join(sessionsPath, file);
        const content = await readFile(filePath, "utf-8");
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
          type:
            | "message_sent"
            | "message_received"
            | "tool_call"
            | "error"
            | "heartbeat";
          summary: string;
          sessionKey: string | undefined;
          channel: string | undefined;
        }> = [];

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type !== "message" || !entry.message?.usage?.cost)
              continue;

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
              for (const block of Array.isArray(msg.content)
                ? msg.content
                : []) {
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

        // Batch ingest
        if (costEntries.length > 0) {
          const { ingested } = await convex.mutation(
            api.collector.ingestCosts,
            {
              entries: costEntries,
            },
          );
          console.log(
            `[ws] Historical backfill: ingested ${ingested} cost entries from ${agentDir}/${file}`,
          );
        }

        // Limit activities to prevent flooding
        if (activities.length > 0) {
          const recentActivities = activities.slice(-20);
          const { ingested } = await convex.mutation(
            api.collector.ingestActivities,
            {
              activities: recentActivities,
            },
          );
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

async function handleAgentEvent(payload: any): Promise<void> {
  // Extract agent info from payload and ingest as activity
  const agentName = payload.agent?.name || payload.agentName || "unknown";
  const activityType = payload.type || "message_sent";
  
  let summary = "Agent activity";
  
  if (payload.message?.content) {
    const content = Array.isArray(payload.message.content) 
      ? payload.message.content.map((c: any) => c.text || c.type || "").join(" ")
      : String(payload.message.content);
    summary = content.slice(0, 80) + (content.length > 80 ? "..." : "");
  } else if (payload.tool) {
    summary = `Tool call: ${payload.tool}`;
  } else if (payload.activity) {
    summary = String(payload.activity).slice(0, 80);
  }

  // Ingest cost if available
  if (payload.message?.usage?.cost) {
    const usage = payload.message.usage;
    const costEntry = {
      agentName,
      sessionKey: payload.sessionKey,
      provider: payload.message.provider || "unknown",
      model: payload.message.model || "unknown",
      inputTokens: usage.input || 0,
      outputTokens: usage.output || 0,
      cacheReadTokens: usage.cacheRead,
      cacheWriteTokens: usage.cacheWrite,
      totalCost: usage.cost.total || 0,
      timestamp: payload.timestamp || Date.now(),
    };

    await convex.mutation(api.collector.ingestCosts, {
      entries: [costEntry],
    });
  }

  // Ingest activity
  await convex.mutation(api.collector.ingestActivities, {
    activities: [{
      agentName,
      type: activityType,
      summary,
      sessionKey: payload.sessionKey,
      channel: payload.channel,
    }],
  });
}

async function handleHealthEvent(payload: any): Promise<void> {
  const agentName = payload.agent?.name || payload.agentName || "unknown";
  
  await convex.mutation(api.collector.recordHealthCheck, {
    agentName,
    responseTimeMs: payload.responseTimeMs || payload.latency,
    activeSessionCount: payload.activeSessionCount || 0,
    totalTokensLastHour: payload.totalTokensLastHour || 0,
    costLastHour: payload.costLastHour || 0,
    errorCount: payload.errorCount || 0,
  });
}

async function handleHeartbeatEvent(payload: any): Promise<void> {
  const agentName = payload.agent?.name || payload.agentName || "unknown";
  
  // Record as activity
  await convex.mutation(api.collector.ingestActivities, {
    activities: [{
      agentName,
      type: "heartbeat",
      summary: "Agent heartbeat",
      sessionKey: payload.sessionKey,
      channel: payload.channel,
    }],
  });
}

async function handlePresenceEvent(payload: any): Promise<void> {
  const agentName = payload.agent?.name || payload.agentName || "unknown";
  const status = payload.status || payload.presence || "unknown";
  
  // Record as activity
  await convex.mutation(api.collector.ingestActivities, {
    activities: [{
      agentName,
      type: status === "online" ? "session_started" : "session_ended",
      summary: `Agent ${status}`,
      sessionKey: payload.sessionKey,
      channel: payload.channel,
    }],
  });
}

async function handleChatEvent(payload: any): Promise<void> {
  const agentName = payload.agent?.name || payload.agentName || "unknown";
  
  let summary = "Chat message";
  if (payload.message?.content) {
    const content = String(payload.message.content);
    summary = content.slice(0, 80) + (content.length > 80 ? "..." : "");
  }

  // Record as activity
  await convex.mutation(api.collector.ingestActivities, {
    activities: [{
      agentName,
      type: payload.direction === "outbound" ? "message_sent" : "message_received",
      summary,
      sessionKey: payload.sessionKey,
      channel: payload.channel,
    }],
  });
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
                id: "clawwatch-collector",
                version: "0.1.0",
                platform: "linux",
                mode: "operator"
              },
              role: "operator",
              scopes: ["operator.read"],
              caps: [],
              commands: [],
              permissions: {},
              auth: { token: GATEWAY_TOKEN },
              locale: "en-US",
              userAgent: "clawwatch-collector/0.1.0"
            }
          };
          
          ws!.send(JSON.stringify(connectRequest));
          console.log("[ws] Sent connect request in response to challenge");
        } else if (frame.type === "res" && frame.id === "clawwatch-1") {
          // Connection response
          if (frame.ok) {
            console.log("[ws] Authenticated successfully, receiving events...");
            isConnected = true;
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
      console.log(`[ws] Connection closed (connection ${currentConnectionId}): code=${event.code}, reason=${event.reason}`);
      isConnected = false;
      
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
    console.error(`[ws] Failed to create WebSocket connection (connection ${currentConnectionId}):`, err);
    
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
      console.log(
        `[ws] ⚠️  Fired ${result.fired} alerts (evaluated ${result.evaluated} rules)`,
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

  // Historical backfill on startup
  await scanHistoricalTranscripts();
  
  // Start WebSocket connection
  await connect();
  
  // Run alert evaluation every minute
  setInterval(evaluateAlerts, 60000);
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('[ws] Shutting down...');
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