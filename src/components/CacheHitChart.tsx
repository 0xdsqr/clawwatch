import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97706",
  openai: "#10b981",
  google: "#3b82f6",
  "google-ai": "#3b82f6",
  mistral: "#f97316",
  groq: "#8b5cf6",
  openrouter: "#ec4899",
  fireworks: "#ef4444",
  together: "#06b6d4",
  deepseek: "#14b8a6",
  unknown: "#6b7280",
};

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? PROVIDER_COLORS.unknown;
}

type CacheBucket = Record<string, number>;

interface Props {
  buckets: CacheBucket[];
  providers: string[];
  height?: number;
}

export function CacheHitChart({ buckets, providers, height = 300 }: Props) {
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
        point[p] = b[p] ?? 0;
      }

      return point;
    });
  }, [buckets, providers]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No cache data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
      >
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
          tickFormatter={(val: number) => `${val}%`}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${(value ?? 0).toFixed(1)}%`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
        {providers.map((p) => (
          <Line
            key={p}
            type="monotone"
            dataKey={p}
            stroke={getProviderColor(p)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
