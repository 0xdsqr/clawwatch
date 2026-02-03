import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCost } from "@/lib/utils";

interface DataPoint {
  timestamp: number;
  cost: number;
  model: string;
}

interface Props {
  data: DataPoint[];
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

function tooltipFormatter(value: number | undefined, name: string | undefined) {
  if (value !== undefined) return [formatCost(value), name];
  return [0, name];
}

function yAxisFormatter(v: number) {
  return formatCost(v);
}

export const CostByModelChartInternal = memo(function CostByModelChartInternal({
  data,
}: Props) {
  const processedData = useMemo(() => {
    // Group data by timestamp and aggregate by model
    const grouped = data.reduce(
      (acc, item) => {
        const timeKey = item.timestamp;
        const time = new Date(timeKey).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        if (!acc[timeKey]) {
          acc[timeKey] = { timestamp: timeKey, time };
        }

        acc[timeKey][item.model] = (acc[timeKey][item.model] || 0) + item.cost;

        return acc;
      },
      {} as Record<number, any>,
    );

    return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const models = useMemo(() => {
    const modelSet = new Set(data.map((d) => d.model));
    return Array.from(modelSet).sort();
  }, [data]);

  return (
    <div className="h-[300px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={processedData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            {models.map((model) => (
              <linearGradient
                key={`gradient-${model}`}
                id={`gradient-${model}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={getModelColor(model)}
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor={getModelColor(model)}
                  stopOpacity={0.05}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="time"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={tooltipFormatter}
          />
          {models.map((model) => (
            <Area
              key={model}
              type="monotone"
              dataKey={model}
              stackId="1"
              stroke={getModelColor(model)}
              strokeWidth={2}
              fill={`url(#gradient-${model})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
