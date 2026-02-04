import { memo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCost } from "@/lib/utils";

interface AgentCostData {
  agentId: string;
  agentName: string;
  cost: number;
  tokens: number;
  requests: number;
}

interface Props {
  data: AgentCostData[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))" } as const;

// Agent-specific colors — distinct but cohesive palette
const AGENT_COLORS = [
  "#a855f7", // purple
  "#3b82f6", // blue
  "#22c55e", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
];

function tooltipFormatter(value: number | undefined) {
  if (value !== undefined) return [formatCost(value), "Cost"];
  return [0, "Cost"];
}

export const CostByAgentChartInternal = memo(function CostByAgentChartInternal({ data }: Props) {
  const dataWithColors = data.map((item, i) => ({
    ...item,
    fill: AGENT_COLORS[i % AGENT_COLORS.length],
  }));

  return (
    <div className="h-[250px] w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithColors}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCost}
          />
          <YAxis
            type="category"
            dataKey="agentName"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={tooltipFormatter}
          />
          <Bar dataKey="cost" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
