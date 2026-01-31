#!/usr/bin/env bun
/**
 * ClawWatch Gateway Collector
 *
 * Polls the Clawdbot gateway HTTP API and session transcripts,
 * then feeds data into Convex.
 *
 * Run: bun run collector/poll.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

// Config - all values must be provided via environment variables
const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
const CONVEX_URL = process.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL ?? "30000"); // 30 seconds
const SESSIONS_DIR =
  process.env.SESSIONS_DIR ?? "/home/moltbot/.clawdbot/agents";

if (!GATEWAY_URL) {
  console.error("❌ GATEWAY_URL environment variable is required");
  process.exit(1);
}

if (!GATEWAY_TOKEN) {
  console.error("❌ GATEWAY_TOKEN environment variable is required");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// Track what we've already ingested (cost entries by timestamp)
// Using Map to store both the key and when it was added for cleanup
const ingestedCosts = new Map<string, number>();
let lastPollTime = Date.now() - 86400000 * 3; // Start from 3 days ago for initial scan

// Clean up old entries from ingestedCosts to prevent memory leaks
function cleanupIngestedCosts(): void {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  let cleaned = 0;
  
  for (const [key, timestamp] of ingestedCosts.entries()) {
    if (timestamp < sevenDaysAgo) {
      ingestedCosts.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[cleanup] Removed ${cleaned} old cost entries from cache (${ingestedCosts.size} remaining)`);
  }
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
  console.log("[poll] Fetching sessions from gateway...");
  const startTime = Date.now();

  try {
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

    console.log(`[poll] Ingested ${ingested} sessions (${responseTimeMs}ms)`);

    // Count sessions per agent for health check
    const agentSessions: Record<string, { active: number; total: number }> = {};
    for (const s of mapped) {
      const agent = s.agentId ?? "unknown";
      if (!agentSessions[agent]) agentSessions[agent] = { active: 0, total: 0 };
      agentSessions[agent].total++;
      if (Date.now() - s.updatedAt < 300000) agentSessions[agent].active++;
    }

    // Record health checks per agent
    for (const [agentName, counts] of Object.entries(agentSessions)) {
      await convex.mutation(api.collector.recordHealthCheck, {
        agentName,
        responseTimeMs,
        activeSessionCount: counts.active,
        totalTokensLastHour: 0, // Will be calculated from costs
        costLastHour: 0,
        errorCount: 0,
      });
    }
  } catch (err) {
    console.error("[poll] Error fetching sessions:", err);
  }
}

async function pollTranscripts(): Promise<void> {
  console.log("[poll] Scanning transcripts for new cost data...");

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
            if (ts < lastPollTime) continue;

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

            ingestedCosts.set(costKey, Date.now());

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
            `[poll] Ingested ${ingested} cost entries from ${agentDir}/${file}`,
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
            `[poll] Ingested ${ingested} activities from ${agentDir}/${file}`,
          );
        }
      }
    }
  } catch (err) {
    console.error("[poll] Error scanning transcripts:", err);
  }
}

async function evaluateAlerts(): Promise<void> {
  console.log("[poll] Evaluating alert rules...");
  try {
    const result = await convex.mutation(api.evaluateAlerts.evaluate, {});
    if (result.fired > 0) {
      console.log(
        `[poll] ⚠️  Fired ${result.fired} alerts (evaluated ${result.evaluated} rules)`,
      );
    } else {
      console.log(`[poll] All clear (evaluated ${result.evaluated} rules)`);
    }
  } catch (err) {
    console.error("[poll] Error evaluating alerts:", err);
  }
}

async function runOnce(): Promise<void> {
  await pollSessions();
  await pollTranscripts();
  await evaluateAlerts();
  
  // Clean up old ingested cost entries every hour
  if (Date.now() % (60 * 60 * 1000) < 30000) {
    cleanupIngestedCosts();
  }
  
  lastPollTime = Date.now();
}

async function main(): Promise<void> {
  console.log("🔱 ClawWatch Collector starting");
  console.log(`  Gateway: ${GATEWAY_URL}`);
  console.log(`  Convex:  ${CONVEX_URL}`);
  console.log(`  Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`  Sessions dir: ${SESSIONS_DIR}`);
  console.log("");

  // Initial poll
  await runOnce();

  // Poll loop
  setInterval(async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error("[poll] Unhandled error:", err);
    }
  }, POLL_INTERVAL_MS);
}

main().catch(console.error);
