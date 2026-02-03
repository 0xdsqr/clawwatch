import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatTokens } from "@/lib/utils";

interface TokenDistributionData {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

interface Props {
  data: TokenDistributionData;
}

const COLORS = {
  input: "#3b82f6", // blue
  output: "#a855f7", // purple
  cacheRead: "#22c55e", // emerald
  cacheWrite: "#f59e0b", // amber
} as const;

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

function tooltipFormatter(value: number | undefined) {
  if (value !== undefined) return [formatTokens(value), "Tokens"];
  return [0, "Tokens"];
}

export const TokenDistributionChartInternal = memo(
  function TokenDistributionChartInternal({ data }: Props) {
    const chartData = useMemo(() => {
      const items = [
        { name: "Input", value: data.inputTokens, color: COLORS.input },
        { name: "Output", value: data.outputTokens, color: COLORS.output },
        {
          name: "Cache Read",
          value: data.cacheReadTokens,
          color: COLORS.cacheRead,
        },
        {
          name: "Cache Write",
          value: data.cacheWriteTokens,
          color: COLORS.cacheWrite,
        },
      ];
      return items.filter((item) => item.value > 0);
    }, [data]);

    const total = useMemo(
      () => chartData.reduce((sum, item) => sum + item.value, 0),
      [chartData],
    );

    if (total === 0) {
      return (
        <div className="flex h-[250px] items-center justify-center text-muted-foreground">
          <p className="text-sm">No token data available</p>
        </div>
      );
    }

    return (
      <div className="flex h-[250px] items-center gap-4">
        <div className="h-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={tooltipFormatter}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 pr-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="ml-2 font-mono font-medium">
                  {formatTokens(item.value)}
                </span>
                <span className="ml-1 text-muted-foreground">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
