import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Provider color palette
const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97706", // amber
  openai: "#10b981", // emerald
  google: "#3b82f6", // blue
  "google-ai": "#3b82f6",
  mistral: "#f97316", // orange
  groq: "#8b5cf6", // violet
  openrouter: "#ec4899", // pink
  fireworks: "#ef4444", // red
  together: "#06b6d4", // cyan
  deepseek: "#14b8a6", // teal
  unknown: "#6b7280", // gray
};

function getProviderColor(provider: string): string {
  const key = provider.toLowerCase();
  return PROVIDER_COLORS[key] ?? PROVIDER_COLORS.unknown;
}

interface ProviderBucket {
  timestamp: number;
  [provider: string]: { cost: number; tokens: number; requests: number } | number;
}

interface Props {
  buckets: ProviderBucket[];
  providers: string[];
  metric?: "cost" | "tokens" | "requests" | "total";
  height?: number;
}

export function ProviderCostChart({
  buckets,
  providers,
  metric = "cost",
  height = 300,
}: Props) {
  const chartData = useMemo(() => {
    if (!buckets.length) return [];

    return buckets.map((b) => {
      const point: Record<string, number | string> = {
        time: new Date(b.timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        timestamp: b.timestamp,
      };

      for (const p of providers) {
        const data = b[p];
        if (data && typeof data === "object") {
          // Nested object: { cost, tokens, requests } or { input, output, total }
          const obj = data as Record<string, number>;
          point[p] = obj[metric] ?? obj.total ?? obj.cost ?? 0;
        } else if (typeof data === "number") {
          point[p] = data;
        } else {
          point[p] = 0;
        }
      }

      return point;
    });
  }, [buckets, providers, metric]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No data for this period
      </div>
    );
  }

  const formatValue = (val: number) => {
    if (metric === "cost") return `$${val.toFixed(4)}`;
    if (metric === "tokens") {
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
      return val.toString();
    }
    return val.toString();
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          {providers.map((p) => (
            <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={getProviderColor(p)} stopOpacity={0.4} />
              <stop offset="95%" stopColor={getProviderColor(p)} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#3f3f46" }}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#3f3f46" }}
          tickFormatter={formatValue}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value: number, name: string) => [formatValue(value), name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
        />
        {providers.map((p) => (
          <Area
            key={p}
            type="monotone"
            dataKey={p}
            stackId="1"
            stroke={getProviderColor(p)}
            fill={`url(#grad-${p})`}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
