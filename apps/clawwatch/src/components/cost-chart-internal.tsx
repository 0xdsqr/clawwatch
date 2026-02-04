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
  tokens?: number;
  requests?: number;
}

interface Props {
  data: DataPoint[];
}

const tooltipStyle = {
  backgroundColor: "oklch(0.16 0.008 285)",
  border: "1px solid oklch(0.24 0.008 285)",
  borderRadius: "8px",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 8px 16px rgb(0 0 0 / 0.3)",
} as const;

const tooltipLabelStyle = {
  color: "oklch(0.55 0 0)",
  fontSize: "11px",
} as const;

function tooltipFormatter(value: number | undefined, name: string | undefined) {
  if (name === "cost" && value !== undefined) return [formatCost(value), "Cost"];
  return [value ?? 0, name];
}

function yAxisFormatter(v: number) {
  return formatCost(v);
}

export const CostChartInternal = memo(function CostChartInternal({ data }: Props) {
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
    <div className="h-[280px] w-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.007 285)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "oklch(0.45 0 0)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "oklch(0.45 0 0)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
            width={52}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={tooltipFormatter}
            cursor={{ stroke: "oklch(0.35 0.01 285)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#costGradient)"
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
