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
import { stat, open } from "fs/promises";
import { Glob } from "bun";
import { join } from "path";

// Config - all values must be provided via environment variables
const GATEWAY_URL = Bun.env.GATEWAY_URL;
const GATEWAY_TOKEN = Bun.env.GATEWAY_TOKEN;
const CONVEX_URL = Bun.env.CONVEX_URL ?? "http://127.0.0.1:3210";
const POLL_INTERVAL_MS = parseInt(Bun.env.POLL_INTERVAL ?? "30000"); // 30 seconds
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

// ── Incremental file state tracking ──────────────────────────────────────────
// Track per-file read positions so we only process new lines each cycle.
interface FileState {
  /** File size at last read (bytes) */
  size: number;
  /** File mtime at last read (ms epoch) */
  mtimeMs: number;
  /** Byte offset we've read up to */
  lastPosition: number;
  /** Trailing partial line from the previous read (no newline yet) */
  partial: string;
}

const fileStates = new Map<string, FileState>();

/**
 * Read only the *new* bytes appended to a file since our last read.
 * Returns the new complete lines (excluding any trailing partial line
 * which is saved for the next cycle).
 */
async function readNewLines(filePath: string): Promise<string[] | null> {
  let info;
  try {
    info = await stat(filePath);
  } catch {
    return null; // File gone — skip
  }

  const prev = fileStates.get(filePath);

  // Fast path — file hasn't changed since last read
  if (prev && info.size === prev.size && info.mtimeMs === prev.mtimeMs) {
    return null;
  }

  // File was truncated / rotated — reset and re-read from the start
  const startPos = prev && info.size >= prev.lastPosition ? prev.lastPosition : 0;
  const prevPartial = startPos === 0 ? "" : (prev?.partial ?? "");

  if (startPos >= info.size) {
    // Size unchanged (or file got smaller — already handled above)
    fileStates.set(filePath, {
      size: info.size,
      mtimeMs: info.mtimeMs,
      lastPosition: startPos,
      partial: prevPartial,
    });
    return null;
  }

  // Read only the new bytes
  const bytesToRead = info.size - startPos;
  const buf = Buffer.alloc(bytesToRead);
  const fh = await open(filePath, "r");
  try {
    await fh.read(buf, 0, bytesToRead, startPos);
  } finally {
    await fh.close();
  }

  const chunk = prevPartial + buf.toString("utf-8");
  const parts = chunk.split("\n");

  // Last element is either "" (line ended with \n) or a partial line
  const trailing = parts.pop() ?? "";

  fileStates.set(filePath, {
    size: info.size,
    mtimeMs: info.mtimeMs,
    lastPosition: info.size,
    partial: trailing,
  });

  // Return only non-empty complete lines
  return parts.filter(Boolean);
}

// ── Gateway interaction ──────────────────────────────────────────────────────
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

// ── Polling functions ────────────────────────────────────────────────────────

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
    const mapped = sessions.map((s: Record<string, unknown>) => ({
      key: String(s.key),
      kind: String(s.kind),
      channel: s.channel !== "unknown" ? String(s.channel) : undefined,
      displayName: s.displayName ? String(s.displayName) : undefined,
      model: s.model ? String(s.model) : undefined,
      totalTokens: Number(s.totalTokens ?? 0),
      updatedAt: Number(s.updatedAt ?? Date.now()),
      agentId: String(s.key).split(":")[1], // "agent:mimizuku:..." → "mimizuku"
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
  console.log("[poll] Scanning transcripts for new data...");

  try {
    const glob = new Glob("*/sessions/*.jsonl");

    for await (const match of glob.scan(SESSIONS_DIR)) {
      // match is e.g. "mimizuku/sessions/foo.jsonl"
      const parts = match.split("/");
      const agentDir = parts[0];
      const file = parts[parts.length - 1];
      const filePath = join(SESSIONS_DIR, match);

      {

        // ── Incremental: only read new lines ──
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

        for (const line of newLines) {
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
