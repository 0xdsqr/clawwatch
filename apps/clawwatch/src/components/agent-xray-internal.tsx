import { Badge } from "@clawwatch/ui/components/badge";
import { cn } from "@clawwatch/ui/lib/utils";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useQuery } from "convex/react";
import {
  Clock,
  Hash,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { formatCost, formatTokens, timeAgo } from "@/lib/utils";

// ─── Data types matching the backend xraySummary return ───

export interface AgentXrayData {
  agent: {
    _id: string;
    name: string;
    gatewayUrl: string;
    status: string;
    config?: { model?: string; channel?: string };
  };
  channels: string[];
  integrations: Array<{
    name: string;
    category: "service" | "channel" | "memory" | "internal" | "ai";
    icon: string;
    callCount: number;
    lastSeen: number;
  }>;
  coreToolCounts: {
    exec: number;
    read: number;
    write: number;
    edit: number;
    process: number;
  };
  subAgents: Array<{ name: string; count: number; lastSeen: number }>;
  aiProviders: Array<{
    name: string;
    icon: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
    lastSeen: number;
  }>;
}

export interface AgentXrayProps {
  data: AgentXrayData;
  agentId?: string;
}

// ─── Node variants and styling ───

type XrayNodeVariant =
  | "agent"
  | "gateway"
  | "channel"
  | "service"
  | "ai"
  | "memory"
  | "internal"
  | "core";

type XrayNodeData = {
  title: string;
  subtitle?: string;
  meta?: string;
  variant: XrayNodeVariant;
  icon?: string;
  // Drill-down metadata
  drillNodeType?: string;
  drillNodeId?: string;
};

const VARIANT_STYLES: Record<XrayNodeVariant, string> = {
  agent: "border-purple-500/50 bg-purple-500/10 shadow-purple-500/10",
  gateway: "border-emerald-500/30 bg-emerald-500/8",
  channel: "border-blue-400/30 bg-blue-500/8",
  service: "border-sky-400/30 bg-sky-500/8",
  ai: "border-rose-400/40 bg-rose-500/10 shadow-rose-500/10",
  memory: "border-emerald-400/30 bg-emerald-500/8",
  internal: "border-amber-400/30 bg-amber-500/8",
  core: "border-zinc-400/25 bg-zinc-500/8",
};

const VARIANT_HANDLE_COLOR: Record<XrayNodeVariant, string> = {
  agent: "!bg-purple-400",
  gateway: "!bg-emerald-400",
  channel: "!bg-blue-400",
  service: "!bg-sky-400",
  ai: "!bg-rose-400",
  memory: "!bg-emerald-400",
  internal: "!bg-amber-400",
  core: "!bg-zinc-400",
};

const XRAY_EDGE_COLOR = "hsl(270 85% 65%)";
const XRAY_EDGE_DASH = "3 6";

const MINIMAP_COLOR: Record<XrayNodeVariant, string> = {
  agent: "hsl(270 70% 60%)",
  gateway: "hsl(160 60% 50%)",
  channel: "hsl(210 80% 60%)",
  service: "hsl(200 80% 60%)",
  ai: "hsl(340 75% 60%)",
  memory: "hsl(160 60% 50%)",
  internal: "hsl(40 80% 55%)",
  core: "hsl(240 5% 50%)",
};

const VARIANT_ACCENT_TEXT: Record<XrayNodeVariant, string> = {
  agent: "text-purple-400",
  gateway: "text-emerald-400",
  channel: "text-blue-400",
  service: "text-sky-400",
  ai: "text-rose-400",
  memory: "text-emerald-400",
  internal: "text-amber-400",
  core: "text-zinc-400",
};

const VARIANT_ACCENT_BG: Record<XrayNodeVariant, string> = {
  agent: "bg-purple-500/10 border-purple-500/20",
  gateway: "bg-emerald-500/10 border-emerald-500/20",
  channel: "bg-blue-500/10 border-blue-500/20",
  service: "bg-sky-500/10 border-sky-500/20",
  ai: "bg-rose-500/10 border-rose-500/20",
  memory: "bg-emerald-500/10 border-emerald-500/20",
  internal: "bg-amber-500/10 border-amber-500/20",
  core: "bg-zinc-500/10 border-zinc-500/20",
};

// ─── Custom node component ───

const XrayNode = memo(function XrayNode({
  data,
}: NodeProps<Node<XrayNodeData>>) {
  const handleColor = VARIANT_HANDLE_COLOR[data.variant];
  const isAgent = data.variant === "agent";
  const isDrillable = !!data.drillNodeType;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs shadow-sm min-w-[150px] max-w-[200px] bg-card/80 backdrop-blur-sm transition-all",
        isAgent && "px-4 py-3 min-w-[180px] shadow-md",
        isDrillable && "cursor-pointer hover:shadow-md hover:brightness-110",
        VARIANT_STYLES[data.variant],
      )}
    >
      <div className="flex items-center gap-1.5">
        {data.icon && <span className="text-sm shrink-0">{data.icon}</span>}
        <span
          className={cn(
            "font-semibold truncate",
            isAgent && "text-sm",
          )}
        >
          {data.title}
        </span>
      </div>
      {data.subtitle && (
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {data.subtitle}
        </div>
      )}
      {data.meta && (
        <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
          {data.meta}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-2 !h-2 !border-2 !border-background",
          handleColor,
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-2 !h-2 !border-2 !border-background",
          handleColor,
        )}
      />
    </div>
  );
});

const nodeTypes = {
  xrayNode: XrayNode,
};

// ─── Helpers ───

function formatGatewayLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function isRecentlyActive(lastSeen: number): boolean {
  return Date.now() - lastSeen < 60 * 60 * 1000; // within 1 hour
}

function isStale(lastSeen: number): boolean {
  return Date.now() - lastSeen > 24 * 60 * 60 * 1000; // older than 1 day
}

function edgeThickness(count: number): number {
  if (count > 50) return 3;
  if (count > 20) return 2.5;
  if (count > 5) return 2;
  return 1.5;
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  variant: XrayNodeVariant,
  lastSeen: number,
  count: number,
): Edge {
  const active = isRecentlyActive(lastSeen);
  const stale = isStale(lastSeen);

  return {
    id,
    source,
    target,
    style: {
      stroke: XRAY_EDGE_COLOR,
      strokeWidth: edgeThickness(count),
      strokeDasharray: XRAY_EDGE_DASH,
      ...(stale ? { opacity: 0.4 } : {}),
    },
    animated: active,
  };
}

// Channel icon mapping
function channelIcon(ch: string): string {
  const lower = ch.toLowerCase();
  if (lower.includes("discord")) return "💜";
  if (lower.includes("slack")) return "💬";
  if (lower.includes("telegram")) return "✈️";
  if (lower.includes("whatsapp")) return "📱";
  if (lower.includes("irc")) return "📡";
  return "📨";
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Layout builder ───

function buildLayout(data: AgentXrayData): {
  nodes: Node<XrayNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<XrayNodeData>[] = [];
  const edges: Edge[] = [];

  const cx = 0;
  const cy = 0;
  const yGap = 85;
  const xSpread = 340;

  // ═══ CENTER: Agent ═══
  nodes.push({
    id: "agent",
    type: "xrayNode",
    position: { x: cx, y: cy },
    data: {
      title: data.agent.name,
      subtitle: data.agent.config?.model ?? "Agent",
      meta: data.agent.status,
      variant: "agent",
      icon: "🦉",
    },
  });

  // ═══ ABOVE: AI Providers ═══
  const aiProviders = data.aiProviders ?? [];
  if (aiProviders.length > 0) {
    const aiOffset = -((aiProviders.length - 1) * 210) / 2;
    aiProviders.forEach((provider, i) => {
      const id = `ai-${provider.name.replace(/\s+/g, "-")}`;
      nodes.push({
        id,
        type: "xrayNode",
        position: {
          x: cx + aiOffset + i * 210,
          y: cy - 160,
        },
        data: {
          title: provider.name,
          subtitle: `${provider.requests} req · ${formatCost(provider.cost)}`,
          meta: provider.lastSeen ? `Last: ${timeAgo(provider.lastSeen)}` : undefined,
          variant: "ai",
          icon: provider.icon,
          drillNodeType: "ai",
          drillNodeId: provider.name,
        },
      });
      edges.push(
        makeEdge(
          `edge-agent-${id}`,
          "agent",
          id,
          "ai",
          provider.lastSeen,
          provider.requests,
        ),
      );
    });
  }

  // ═══ LEFT: Channels ═══
  const channelList = data.channels ?? [];
  const messagingIntegration = (data.integrations ?? []).find(
    (i) => i.name === "Messaging",
  );

  const leftItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    meta?: string;
    icon: string;
    lastSeen: number;
    count: number;
    drillNodeType: string;
    drillNodeId: string;
  }> = [];

  for (const ch of channelList) {
    leftItems.push({
      id: `channel-${ch}`,
      title: ch,
      subtitle: "Channel",
      icon: channelIcon(ch),
      lastSeen: Date.now(),
      count: 10,
      drillNodeType: "channel",
      drillNodeId: ch,
    });
  }

  if (messagingIntegration) {
    leftItems.push({
      id: "integration-messaging",
      title: "Messaging",
      subtitle: `${messagingIntegration.callCount} calls`,
      meta: messagingIntegration.lastSeen
        ? `Last: ${timeAgo(messagingIntegration.lastSeen)}`
        : undefined,
      icon: messagingIntegration.icon,
      lastSeen: messagingIntegration.lastSeen,
      count: messagingIntegration.callCount,
      drillNodeType: "internal",
      drillNodeId: "Messaging",
    });
  }

  const leftOffset = -((leftItems.length - 1) * yGap) / 2;
  leftItems.forEach((item, i) => {
    nodes.push({
      id: item.id,
      type: "xrayNode",
      position: { x: cx - xSpread, y: leftOffset + i * yGap },
      data: {
        title: item.title,
        subtitle: item.subtitle,
        meta: item.meta,
        variant: "channel",
        icon: item.icon,
        drillNodeType: item.drillNodeType,
        drillNodeId: item.drillNodeId,
      },
    });
    edges.push(
      makeEdge(
        `edge-agent-${item.id}`,
        "agent",
        item.id,
        "channel",
        item.lastSeen,
        item.count,
      ),
    );
  });

  // ═══ RIGHT: External services ═══
  const services = (data.integrations ?? []).filter(
    (i) => i.category === "service",
  );

  const serviceOffset = -((services.length - 1) * yGap) / 2;
  services.forEach((svc, i) => {
    const id = `service-${svc.name.replace(/\s+/g, "-")}`;
    nodes.push({
      id,
      type: "xrayNode",
      position: { x: cx + xSpread, y: serviceOffset + i * yGap },
      data: {
        title: svc.name,
        subtitle: `${svc.callCount} call${svc.callCount === 1 ? "" : "s"}`,
        meta: svc.lastSeen ? `Last: ${timeAgo(svc.lastSeen)}` : undefined,
        variant: "service",
        icon: svc.icon,
        drillNodeType: "service",
        drillNodeId: svc.name,
      },
    });
    edges.push(
      makeEdge(
        `edge-agent-${id}`,
        "agent",
        id,
        "service",
        svc.lastSeen,
        svc.callCount,
      ),
    );
  });

  // ═══ BELOW-LEFT: Memory + Internal ═══
  const memoryItems = (data.integrations ?? []).filter(
    (i) => i.category === "memory",
  );
  const internalItems = (data.integrations ?? []).filter(
    (i) => i.category === "internal",
  );
  const subAgents = data.subAgents ?? [];

  const belowLeftItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    meta?: string;
    icon: string;
    variant: XrayNodeVariant;
    lastSeen: number;
    count: number;
    drillNodeType: string;
    drillNodeId: string;
  }> = [];

  for (const mem of memoryItems) {
    belowLeftItems.push({
      id: `memory-${mem.name.replace(/\s+/g, "-")}`,
      title: mem.name,
      subtitle: `${mem.callCount} lookups`,
      meta: mem.lastSeen ? `Last: ${timeAgo(mem.lastSeen)}` : undefined,
      icon: mem.icon,
      variant: "memory",
      lastSeen: mem.lastSeen,
      count: mem.callCount,
      drillNodeType: "memory",
      drillNodeId: mem.name,
    });
  }

  for (const int of internalItems) {
    if (int.name === "Sub-Agents" && subAgents.length > 0) continue;
    belowLeftItems.push({
      id: `internal-${int.name.replace(/[\s/]+/g, "-")}`,
      title: int.name,
      subtitle: `${int.callCount} calls`,
      meta: int.lastSeen ? `Last: ${timeAgo(int.lastSeen)}` : undefined,
      icon: int.icon,
      variant: "internal",
      lastSeen: int.lastSeen,
      count: int.callCount,
      drillNodeType: "internal",
      drillNodeId: int.name,
    });
  }

  for (const sub of subAgents) {
    belowLeftItems.push({
      id: `subagent-${sub.name.replace(/[\s/]+/g, "-")}`,
      title: sub.name,
      subtitle: `${sub.count} spawn${sub.count === 1 ? "" : "s"}`,
      meta: sub.lastSeen ? `Last: ${timeAgo(sub.lastSeen)}` : undefined,
      icon: "🤖",
      variant: "internal",
      lastSeen: sub.lastSeen,
      count: sub.count,
      drillNodeType: "internal",
      drillNodeId: "Sub-Agents",
    });
  }

  const blOffset = -((belowLeftItems.length - 1) * yGap) / 2;
  belowLeftItems.forEach((item, i) => {
    nodes.push({
      id: item.id,
      type: "xrayNode",
      position: {
        x: cx - xSpread + 20,
        y: cy + 200 + blOffset + i * yGap,
      },
      data: {
        title: item.title,
        subtitle: item.subtitle,
        meta: item.meta,
        variant: item.variant,
        icon: item.icon,
        drillNodeType: item.drillNodeType,
        drillNodeId: item.drillNodeId,
      },
    });
    edges.push(
      makeEdge(
        `edge-agent-${item.id}`,
        "agent",
        item.id,
        item.variant,
        item.lastSeen,
        item.count,
      ),
    );
  });

  // ═══ BELOW-RIGHT: Core Tools (grouped) ═══
  const coreToolCounts = data.coreToolCounts ?? {
    exec: 0,
    read: 0,
    write: 0,
    edit: 0,
    process: 0,
  };
  const totalCoreCalls = Object.values(coreToolCounts).reduce(
    (a, b) => a + b,
    0,
  );

  if (totalCoreCalls > 0) {
    const breakdown = Object.entries(coreToolCounts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");

    nodes.push({
      id: "core-tools",
      type: "xrayNode",
      position: { x: cx + xSpread - 20, y: cy + 200 },
      data: {
        title: "Core Tools",
        subtitle: `${totalCoreCalls} calls`,
        meta: breakdown,
        variant: "core",
        icon: "🔧",
        drillNodeType: "core",
        drillNodeId: "core-tools",
      },
    });
    edges.push({
      id: "edge-agent-core-tools",
      source: "agent",
      target: "core-tools",
      style: {
        stroke: XRAY_EDGE_COLOR,
        strokeWidth: edgeThickness(totalCoreCalls),
        strokeDasharray: XRAY_EDGE_DASH,
      },
    });
  }

  // ═══ BOTTOM: Gateway ═══
  if (data.agent.gatewayUrl) {
    nodes.push({
      id: "gateway",
      type: "xrayNode",
      position: { x: cx, y: cy + 300 },
      data: {
        title: "Gateway",
        subtitle: formatGatewayLabel(data.agent.gatewayUrl),
        variant: "gateway",
        icon: "🚀",
      },
    });
    edges.push({
      id: "edge-agent-gateway",
      source: "agent",
      target: "gateway",
      style: {
        stroke: XRAY_EDGE_COLOR,
        strokeWidth: 1.5,
        strokeDasharray: XRAY_EDGE_DASH,
      },
    });
  }

  return { nodes, edges };
}

// ─── Minimap node color callback ───

function minimapNodeColor(node: Node<XrayNodeData>): string {
  const variant = node.data?.variant as XrayNodeVariant | undefined;
  return variant ? (MINIMAP_COLOR[variant] ?? "hsl(270 70% 60%)") : "hsl(270 70% 60%)";
}

// ─── Drill-down types ───

interface DrilldownSelection {
  nodeType: string;
  nodeId: string;
  variant: XrayNodeVariant;
  title: string;
  icon?: string;
}

// ─── Drill-down detail panel ───

// Discriminated union for drilldown query results
interface AiDrilldown {
  type: "ai";
  provider: string;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  models: Array<{
    model: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
    requests: number;
    lastSeen: number;
  }>;
  recentRecords: Array<{
    timestamp: number;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    sessionKey: string | null;
  }>;
}

interface ServiceDrilldown {
  type: "service";
  service: string;
  totalCalls: number;
  recentActivities: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
    channel: string | null;
  }>;
}

interface ChannelDrilldown {
  type: "channel";
  channel: string;
  totalSessions: number;
  sessions: Array<{
    sessionKey: string;
    kind: string;
    lastActivity: number;
    totalTokens: number;
    estimatedCost: number;
    messageCount: number;
    isActive: boolean;
    startedAt: number;
  }>;
  recentActivity: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
  }>;
}

interface MemoryDrilldown {
  type: "memory";
  totalCalls: number;
  recentCalls: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
    tool: string;
  }>;
  filesAccessed: string[];
}

interface InternalSubagentsDrilldown {
  type: "internal";
  subType: "subagents";
  totalSpawns: number;
  sessions: Array<{
    sessionKey: string;
    displayName: string | null;
    lastActivity: number;
    totalTokens: number;
    estimatedCost: number;
    isActive: boolean;
    startedAt: number;
    messageCount: number;
  }>;
  recentActivity: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
  }>;
}

interface InternalCronDrilldown {
  type: "internal";
  subType: "cron";
  totalCalls: number;
  recentActivity: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
  }>;
}

interface InternalGenericDrilldown {
  type: "internal";
  subType: "generic";
  name: string;
  totalCalls: number;
  recentActivity: Array<{
    timestamp: number;
    summary: string;
    sessionKey: string | null;
  }>;
}

interface CoreDrilldown {
  type: "core";
  totalCalls: number;
  tools: Array<{
    tool: string;
    count: number;
    recentCalls: Array<{
      timestamp: number;
      summary: string;
      sessionKey: string | null;
    }>;
  }>;
}

type DrilldownData =
  | AiDrilldown
  | ServiceDrilldown
  | ChannelDrilldown
  | MemoryDrilldown
  | InternalSubagentsDrilldown
  | InternalCronDrilldown
  | InternalGenericDrilldown
  | CoreDrilldown;

// ─── Activity row component ───

function ActivityRow({ timestamp, summary, sessionKey }: {
  timestamp: number;
  summary: string;
  sessionKey: string | null;
}) {
  // Truncate long summaries
  const displaySummary = summary.length > 120
    ? `${summary.slice(0, 117)}…`
    : summary;

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
      <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0 mt-0.5 w-[100px]">
        {formatTimestamp(timestamp)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/90 break-words leading-relaxed">{displaySummary}</p>
        {sessionKey && (
          <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 truncate">
            {sessionKey}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───

function SectionHeader({ icon, title, count, className }: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 mb-2", className)}>
      <span className="text-muted-foreground">{icon}</span>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
      )}
    </div>
  );
}

// ─── Stat pill ───

function StatPill({ label, value, accent }: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-center", accent ?? "bg-muted/30 border-border/50")}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

// ─── Detail panel content ───

function DrilldownContent({ data, variant }: { data: DrilldownData; variant: XrayNodeVariant }) {
  const accentBg = VARIANT_ACCENT_BG[variant];

  if (data.type === "ai") {
    return (
      <div className="space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Total Cost" value={formatCost(data.totalCost)} accent={accentBg} />
          <StatPill label="Requests" value={data.totalRequests.toLocaleString()} accent={accentBg} />
          <StatPill label="Input Tokens" value={formatTokens(data.totalInputTokens)} />
          <StatPill label="Output Tokens" value={formatTokens(data.totalOutputTokens)} />
        </div>

        {/* Model breakdown */}
        {data.models.length > 0 && (
          <div>
            <SectionHeader icon={<Zap className="h-3.5 w-3.5" />} title="Model Breakdown" count={data.models.length} />
            <div className="space-y-1.5">
              {data.models.map((m) => (
                <div key={m.model} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{m.model}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.requests} req · {formatTokens(m.inputTokens + m.outputTokens)} tok
                    </p>
                  </div>
                  <span className="text-xs font-semibold shrink-0 ml-2">{formatCost(m.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent records */}
        {data.recentRecords.length > 0 && (
          <div>
            <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Requests" count={data.recentRecords.length} />
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
              {data.recentRecords.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/20 transition-colors text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground/70 font-mono">{formatTimestamp(r.timestamp)}</span>
                    <span className="mx-2 text-muted-foreground/30">·</span>
                    <span className="font-medium">{r.model}</span>
                    <span className="mx-2 text-muted-foreground/30">·</span>
                    <span className="text-muted-foreground">{formatTokens(r.inputTokens + r.outputTokens)} tok</span>
                  </div>
                  <span className="font-semibold shrink-0 ml-2">{formatCost(r.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (data.type === "service") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <StatPill label="Total Calls" value={data.totalCalls.toLocaleString()} accent={accentBg} />
        </div>

        {data.recentActivities.length > 0 && (
          <div>
            <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Activity" count={data.recentActivities.length} />
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
              {data.recentActivities.map((a, i) => (
                <ActivityRow key={i} timestamp={a.timestamp} summary={a.summary} sessionKey={a.sessionKey} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (data.type === "channel") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <StatPill label="Sessions" value={data.totalSessions.toLocaleString()} accent={accentBg} />
        </div>

        {data.sessions.length > 0 && (
          <div>
            <SectionHeader icon={<Hash className="h-3.5 w-3.5" />} title="Sessions" count={data.sessions.length} />
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              {data.sessions.map((s) => (
                <div key={s.sessionKey} className="py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono truncate max-w-[180px]" title={s.sessionKey}>
                      {s.sessionKey.length > 24 ? `${s.sessionKey.slice(0, 21)}…` : s.sessionKey}
                    </span>
                    <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                      {s.isActive ? "Active" : "Done"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{s.kind}</span>
                    <span>·</span>
                    <span>{formatTokens(s.totalTokens)} tok</span>
                    <span>·</span>
                    <span>{formatCost(s.estimatedCost)}</span>
                    <span>·</span>
                    <span>{timeAgo(s.lastActivity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recentActivity.length > 0 && (
          <div>
            <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Messages" count={data.recentActivity.length} />
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
              {data.recentActivity.map((a, i) => (
                <ActivityRow key={i} timestamp={a.timestamp} summary={a.summary} sessionKey={a.sessionKey} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (data.type === "memory") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <StatPill label="Total Lookups" value={data.totalCalls.toLocaleString()} accent={accentBg} />
        </div>

        {data.filesAccessed.length > 0 && (
          <div>
            <SectionHeader icon={<Hash className="h-3.5 w-3.5" />} title="Files Accessed" count={data.filesAccessed.length} />
            <div className="flex flex-wrap gap-1.5">
              {data.filesAccessed.map((f) => (
                <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/30 border border-border/30 text-muted-foreground truncate max-w-[250px]" title={f}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.recentCalls.length > 0 && (
          <div>
            <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Calls" count={data.recentCalls.length} />
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
              {data.recentCalls.map((c, i) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                  <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0 mt-0.5 w-[100px]">
                    {formatTimestamp(c.timestamp)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[9px] h-3.5 px-1">{c.tool}</Badge>
                    </div>
                    <p className="text-xs text-foreground/90 break-words leading-relaxed mt-0.5">
                      {c.summary.length > 120 ? `${c.summary.slice(0, 117)}…` : c.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (data.type === "internal") {
    if (data.subType === "subagents") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-2">
            <StatPill label="Total Spawns" value={data.totalSpawns.toLocaleString()} accent={accentBg} />
          </div>

          {data.sessions.length > 0 && (
            <div>
              <SectionHeader icon={<Hash className="h-3.5 w-3.5" />} title="Sub-Agent Sessions" count={data.sessions.length} />
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {data.sessions.map((s) => (
                  <div key={s.sessionKey} className="py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[180px]">
                        {s.displayName ?? s.sessionKey.slice(0, 24)}
                      </span>
                      <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {s.isActive ? "Active" : "Done"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{formatTokens(s.totalTokens)} tok</span>
                      <span>·</span>
                      <span>{formatCost(s.estimatedCost)}</span>
                      <span>·</span>
                      <span>{s.messageCount} msgs</span>
                      <span>·</span>
                      <span>{timeAgo(s.lastActivity)}</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5 truncate">{s.sessionKey}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.recentActivity.length > 0 && (
            <div>
              <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Spawns" count={data.recentActivity.length} />
              <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                {data.recentActivity.map((a, i) => (
                  <ActivityRow key={i} timestamp={a.timestamp} summary={a.summary} sessionKey={a.sessionKey} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Cron or generic internal
    const internalData = data as InternalCronDrilldown | InternalGenericDrilldown;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <StatPill label="Total Calls" value={internalData.totalCalls.toLocaleString()} accent={accentBg} />
        </div>

        {internalData.recentActivity.length > 0 && (
          <div>
            <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Recent Activity" count={internalData.recentActivity.length} />
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
              {internalData.recentActivity.map((a, i) => (
                <ActivityRow key={i} timestamp={a.timestamp} summary={a.summary} sessionKey={a.sessionKey} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (data.type === "core") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <StatPill label="Total Calls" value={data.totalCalls.toLocaleString()} accent={accentBg} />
        </div>

        {data.tools.length > 0 && (
          <div className="space-y-4">
            {data.tools
              .sort((a, b) => b.count - a.count)
              .map((t) => (
                <div key={t.tool}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1.5">{t.tool}</Badge>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{t.count} calls</span>
                  </div>
                  {t.recentCalls.length > 0 && (
                    <div className="space-y-0.5 pl-2 border-l border-border/30">
                      {t.recentCalls.map((c, i) => (
                        <ActivityRow key={i} timestamp={c.timestamp} summary={c.summary} sessionKey={c.sessionKey} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">No data available.</p>;
}

// ─── Drill-down panel wrapper ───

function DrilldownPanel({
  selection,
  agentId,
  onClose,
}: {
  selection: DrilldownSelection;
  agentId: Id<"agents">;
  onClose: () => void;
}) {
  const drilldownData = useQuery(api.agents.xrayDrilldown, {
    agentId,
    nodeType: selection.nodeType,
    nodeId: selection.nodeId,
  });

  const accentText = VARIANT_ACCENT_TEXT[selection.variant];

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[380px] bg-card/95 backdrop-blur-md border-l border-border/50 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b border-border/30", VARIANT_ACCENT_BG[selection.variant])}>
        <div className="flex items-center gap-2 min-w-0">
          {selection.icon && <span className="text-base">{selection.icon}</span>}
          <div className="min-w-0">
            <h3 className={cn("text-sm font-semibold truncate", accentText)}>{selection.title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{selection.nodeType}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {drilldownData === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading details…</p>
            </div>
          </div>
        ) : drilldownData === null ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-muted-foreground">No data found for this node.</p>
          </div>
        ) : (
          <DrilldownContent data={drilldownData as DrilldownData} variant={selection.variant} />
        )}
      </div>
    </div>
  );
}

// ─── Main component ───

export function AgentXrayInternal({ data, agentId }: AgentXrayProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(data),
    [data],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<DrilldownSelection | null>(null);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<XrayNodeData>) => {
      const { drillNodeType, drillNodeId } = node.data;
      if (!drillNodeType || !drillNodeId) return;

      setSelectedNode({
        nodeType: drillNodeType,
        nodeId: drillNodeId,
        variant: node.data.variant,
        title: node.data.title,
        icon: node.data.icon,
      });
    },
    [],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const typedAgentId = agentId as Id<"agents"> | undefined;

  return (
    <div className="h-[650px] rounded-lg border bg-card overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(270 70% 60% / 0.08)"
        />
        <Controls
          className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={minimapNodeColor}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>

      {/* Drill-down detail panel */}
      {selectedNode && typedAgentId && (
        <DrilldownPanel
          selection={selectedNode}
          agentId={typedAgentId}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
