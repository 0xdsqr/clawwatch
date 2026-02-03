import { memo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCost } from "@/lib/utils";

interface DailyCostData {
  date: string;
  cost: number;
}

interface Props {
  data: DailyCostData[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))" } as const;

function tooltipFormatter(value: number | undefined) {
  if (value !== undefined) return [formatCost(value), "Daily Cost"];
  return [0, "Daily Cost"];
}

function yAxisFormatter(v: number) {
  return formatCost(v);
}

export const DailyCostTrendInternal = memo(function DailyCostTrendInternal({
  data,
}: Props) {
  return (
    <div className="h-[250px] w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString([], { 
                month: "short", 
                day: "numeric" 
              });
            }}
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
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            }}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ fill: "#a855f7", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});