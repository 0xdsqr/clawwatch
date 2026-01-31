import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCost } from "@/lib/utils";

interface DataPoint {
  timestamp: number;
  cost: number;
  tokens: number;
  requests: number;
}

interface Props {
  data: DataPoint[];
}

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "#a1a1aa" } as const;

function tooltipFormatter(value: number | undefined, name: string) {
  if (name === "cost" && value !== undefined) return [formatCost(value), "Cost"];
  return [value ?? 0, name];
}

function yAxisFormatter(v: number) {
  return formatCost(v);
}

export default memo(function CostChartInternal({ data }: Props) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    [data],
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="time"
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={tooltipFormatter}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#costGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
