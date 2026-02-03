import { memo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTokens } from "@/lib/utils";

interface TokenUsageData {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface Props {
  data: TokenUsageData[];
}

// Model-specific colors based on requirements
const getModelColor = (model: string, isOutput = false): string => {
  const opacity = isOutput ? "0.7" : "1";
  if (model.includes("claude-opus")) return isOutput ? "#c084fc" : "#a855f7"; // purple variations
  if (model.includes("claude-sonnet")) return isOutput ? "#60a5fa" : "#3b82f6"; // blue variations
  if (model.includes("delivery-mirror")) return isOutput ? "#9ca3af" : "#6b7280"; // gray variations
  return isOutput ? "#4ade80" : "#22c55e"; // emerald variations for others
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))" } as const;

function tooltipFormatter(value: number | undefined, name: string | undefined) {
  if (value !== undefined) return [formatTokens(value), name === "inputTokens" ? "Input Tokens" : "Output Tokens"];
  return [0, name];
}

export const TokenUsageByModelInternal = memo(function TokenUsageByModelInternal({
  data,
}: Props) {
  return (
    <div className="h-[250px] w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 4, right: 4, left: 60, bottom: 4 }}
        >
          <XAxis 
            type="number"
            className="text-muted-foreground"
            tick={{ fill: "currentColor", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTokens}
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
            dataKey="inputTokens" 
            stackId="tokens"
            radius={[0, 0, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`input-${index}`} fill={getModelColor(entry.model, false)} />
            ))}
          </Bar>
          <Bar 
            dataKey="outputTokens" 
            stackId="tokens"
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`output-${index}`} fill={getModelColor(entry.model, true)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});