import { memo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCost } from "@/lib/utils";

interface ModelCostData {
  model: string;
  cost: number;
  percentage: number;
}

interface Props {
  data: ModelCostData[];
}

// Model-specific colors based on requirements
const getModelColor = (model: string): string => {
  if (model.includes("claude-opus")) return "#a855f7"; // purple
  if (model.includes("claude-sonnet")) return "#3b82f6"; // blue
  if (model.includes("delivery-mirror")) return "#6b7280"; // gray
  return "#22c55e"; // emerald for others
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))" } as const;

function tooltipFormatter(value: number | undefined) {
  if (value !== undefined) return [formatCost(value), "Cost"];
  return [0, "Cost"];
}

export const ModelCostBreakdownInternal = memo(function ModelCostBreakdownInternal({
  data,
}: Props) {
  // Add color to each data point
  const dataWithColors = data.map(item => ({
    ...item,
    fill: getModelColor(item.model),
  }));

  return (
    <div className="h-[250px] w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithColors}
          layout="horizontal"
          margin={{ top: 4, right: 4, left: 60, bottom: 4 }}
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
            dataKey="model"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={tooltipFormatter}
          />
          <Bar 
            dataKey="cost" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});