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
import { memo, useMemo } from "react";
import { timeAgo } from "@/lib/utils";

export interface AgentXrayData {
  agent: {
    _id: string;
    name: string;
    gatewayUrl: string;
    status: string;
    config?: { model?: string; channel?: string };
  };
  channels: string[];
  tools: Array<{ name: string; count: number; lastSeen: number }>;
}

export interface AgentXrayProps {
  data: AgentXrayData;
}

type XrayNodeVariant = "agent" | "gateway" | "channel" | "tool" | "convex";

type XrayNodeData = {
  title: string;
  subtitle?: string;
  meta?: string;
  variant: XrayNodeVariant;
};

const VARIANT_STYLES: Record<XrayNodeVariant, string> = {
  agent: "border-purple-500/40 bg-purple-500/8",
  gateway: "border-emerald-500/30 bg-emerald-500/8",
  channel: "border-blue-500/30 bg-blue-500/8",
  tool: "border-purple-400/30 bg-purple-500/8",
  convex: "border-amber-500/30 bg-amber-500/8",
};

const EDGE_STYLE = {
  stroke: "hsl(270 85% 65%)",
  strokeWidth: 1.5,
  strokeDasharray: "4 6",
};

const XrayNode = memo(function XrayNode({ data }: NodeProps<Node<XrayNodeData>>) {
  const meta = data.meta;
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs shadow-sm min-w-[160px] bg-card/70",
        VARIANT_STYLES[data.variant],
      )}
    >
      <div className="font-semibold truncate">{data.title}</div>
      {data.subtitle && <div className="text-[11px] text-muted-foreground">{data.subtitle}</div>}
      {meta && <div className="text-[10px] text-muted-foreground mt-0.5">{meta}</div>}

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-400 !w-2 !h-2 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-400 !w-2 !h-2 !border-2 !border-background"
      />
    </div>
  );
});

const nodeTypes = {
  xrayNode: XrayNode,
};

function formatGatewayLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function buildLayout(data: AgentXrayData): { nodes: Node<XrayNodeData>[]; edges: Edge[] } {
  const nodes: Node<XrayNodeData>[] = [];
  const edges: Edge[] = [];

  const center = { x: 0, y: 0 };
  const leftX = -320;
  const rightX = 320;
  const yGap = 90;

  nodes.push({
    id: "agent",
    type: "xrayNode",
    position: center,
    data: {
      title: data.agent.name,
      subtitle: data.agent.config?.model ?? "Agent",
      meta: data.agent.status,
      variant: "agent",
    },
  });

  const channels = data.channels ?? [];
  const tools = data.tools ?? [];

  const channelOffset = -((channels.length - 1) * yGap) / 2;
  channels.forEach((channel, index) => {
    const id = `channel-${channel}`;
    nodes.push({
      id,
      type: "xrayNode",
      position: { x: leftX, y: channelOffset + index * yGap },
      data: {
        title: channel,
        subtitle: "Channel",
        variant: "channel",
      },
    });
    edges.push({
      id: `edge-agent-${id}`,
      source: "agent",
      target: id,
      style: EDGE_STYLE,
    });
  });

  const toolOffset = -((tools.length - 1) * yGap) / 2;
  tools.forEach((tool, index) => {
    const id = `tool-${tool.name}`;
    const lastSeen = tool.lastSeen ? `Last: ${timeAgo(tool.lastSeen)}` : undefined;
    nodes.push({
      id,
      type: "xrayNode",
      position: { x: rightX, y: toolOffset + index * yGap },
      data: {
        title: tool.name,
        subtitle: `${tool.count} call${tool.count === 1 ? "" : "s"}`,
        meta: lastSeen,
        variant: "tool",
      },
    });
    edges.push({
      id: `edge-agent-${id}`,
      source: "agent",
      target: id,
      style: EDGE_STYLE,
      animated: tool.count > 0,
    });
  });

  if (data.agent.gatewayUrl) {
    nodes.push({
      id: "gateway",
      type: "xrayNode",
      position: { x: 0, y: 220 },
      data: {
        title: "Gateway",
        subtitle: formatGatewayLabel(data.agent.gatewayUrl),
        variant: "gateway",
      },
    });
    edges.push({
      id: "edge-agent-gateway",
      source: "agent",
      target: "gateway",
      style: EDGE_STYLE,
    });
  }

  nodes.push({
    id: "convex",
    type: "xrayNode",
    position: { x: 0, y: -220 },
    data: {
      title: "Convex",
      subtitle: "Data store",
      variant: "convex",
    },
  });
  edges.push({
    id: "edge-agent-convex",
    source: "agent",
    target: "convex",
    style: EDGE_STYLE,
  });

  return { nodes, edges };
}

export function AgentXrayInternal({ data }: AgentXrayProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(data),
    [data],
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
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(270 70% 60% / 0.12)"
        />
        <Controls
          className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor="hsl(270 70% 60%)"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
