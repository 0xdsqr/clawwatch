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
import { useNavigate } from "@tanstack/react-router";
import { Activity, Circle, MessageSquare, Smartphone } from "lucide-react";
import { memo, useMemo } from "react";
import { formatCost, statusColor } from "@/lib/utils";

// ── Types ──

interface AgentData {
  _id: string;
  name: string;
  status: string;
  lastHeartbeat: number;
  config?: { model?: string; channel?: string };
}

interface HealthData {
  activeSessions: number;
  totalSessions: number;
  costLastHour: number;
  tokensLastHour: number;
  errorCount: number;
  isHealthy: boolean;
}

interface CostData {
  today: { cost: number; requests: number };
}

export interface AgentGraphProps {
  agents: AgentData[];
  healthMap: Map<string, HealthData>;
  costMap: Map<string, CostData>;
}

// ── Custom Node Types ──

type AgentNodeData = {
  label: string;
  agent: AgentData;
  health?: HealthData;
  cost?: CostData;
};

const AgentNode = memo(function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const navigate = useNavigate();
  const { agent, health, cost } = data;
  const costToday = formatCost(cost?.today.cost ?? 0);
  const sessions = health?.activeSessions ?? 0;
  const channels = agent.config?.channel?.split(",").map((c) => c.trim()) ?? [];

  return (
    <div
      className="group cursor-pointer"
      onDoubleClick={() => navigate({ to: "/agents/$agentId", params: { agentId: agent._id } })}
    >
      <div
        className={cn(
          "rounded-xl border bg-card shadow-lg transition-all",
          "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5",
          "min-w-[220px] max-w-[280px]",
          agent.status === "online"
            ? "border-border"
            : agent.status === "degraded"
              ? "border-amber-500/30"
              : "border-red-500/20",
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Circle
              className={cn("h-2.5 w-2.5 fill-current shrink-0", statusColor(agent.status))}
            />
            <span className="font-semibold text-sm truncate">{agent.name}</span>
          </div>
          {agent.config?.model && (
            <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
              {agent.config.model}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {costToday} today · {sessions} session{sessions !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Integration info */}
        <div className="px-4 py-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
          {channels.length > 0 &&
            channels.map((ch) => (
              <div key={ch} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                <span>{ch}</span>
              </div>
            ))}
          {channels.length === 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>no channel</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>{health?.totalSessions ?? 0} total</span>
          </div>
          {(health?.errorCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-red-400">
              <span>⚠ {health?.errorCount} errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Handles for edges */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !w-2 !h-2 !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !w-2 !h-2 !border-2 !border-background"
      />
    </div>
  );
});

const nodeTypes = {
  agentNode: AgentNode,
};

// ── Layout ──

function buildLayout(
  agents: AgentData[],
  healthMap: Map<string, HealthData>,
  costMap: Map<string, CostData>,
): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  const COLS = Math.min(agents.length, 3);
  const X_GAP = 360;
  const Y_GAP = 220;

  const nodes: Node<AgentNodeData>[] = agents.map((agent, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    return {
      id: agent._id,
      type: "agentNode",
      position: { x: col * X_GAP + 40, y: row * Y_GAP + 40 },
      data: {
        label: agent.name,
        agent,
        health: healthMap.get(agent._id),
        cost: costMap.get(agent._id),
      },
    };
  });

  // Build edges between agents that share channels (interaction inference)
  const edges: Edge[] = [];
  const channelAgents = new Map<string, string[]>();

  for (const agent of agents) {
    const channels = agent.config?.channel?.split(",").map((c) => c.trim()) ?? [];
    for (const ch of channels) {
      if (!channelAgents.has(ch)) channelAgents.set(ch, []);
      channelAgents.get(ch)?.push(agent._id);
    }
  }

  const seenPairs = new Set<string>();
  for (const [channel, agentIds] of channelAgents) {
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const a = agentIds[i] as string;
        const b = agentIds[j] as string;
        const pair = [a, b].sort().join("-");
        if (seenPairs.has(pair)) continue;
        seenPairs.add(pair);
        edges.push({
          id: `edge-${pair}`,
          source: a,
          target: b,
          animated: true,
          style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5 },
          label: channel,
          labelStyle: {
            fontSize: 10,
            fill: "hsl(var(--muted-foreground))",
          },
          labelBgStyle: {
            fill: "hsl(var(--card))",
            fillOpacity: 0.9,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

// ── Main Component ──

export function AgentGraphInternal({ agents, healthMap, costMap }: AgentGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(agents, healthMap, costMap),
    [agents, healthMap, costMap],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[600px] rounded-lg border bg-card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.15)"
        />
        <Controls
          className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
