import { useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { MetricPoint } from "@/lib/mockMetrics";

interface AlarmThreshold {
  value: number;
  label: string;
  color: string;
}

interface MetricWidgetProps {
  title: string;
  subtitle?: string;
  data: MetricPoint[];
  color?: string;
  fillColor?: string;
  unit?: string;
  chartType?: "area" | "line";
  alarm?: AlarmThreshold;
  // For multi-line (like latency percentiles)
  multiLine?: {
    label: string;
    data: MetricPoint[];
    color: string;
  }[];
  height?: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MetricWidget({
  title,
  subtitle,
  data,
  color = "#14b8a6",
  fillColor,
  unit = "",
  chartType = "area",
  alarm,
  multiLine,
  height = 200,
}: MetricWidgetProps) {
  const formatted = useMemo(() => {
    if (multiLine) {
      // Merge multiple data series by timestamp
      const merged = data.map((point, i) => {
        const entry: Record<string, number | string> = {
          timestamp: point.timestamp,
          time: formatTime(point.timestamp),
          primary: point.value,
        };
        for (const line of multiLine) {
          if (line.data[i]) {
            entry[line.label] = line.data[i].value;
          }
        }
        return entry;
      });
      return merged;
    }
    return data.map((d) => ({
      ...d,
      time: formatTime(d.timestamp),
    }));
  }, [data, multiLine]);

  // Calculate current, min, max, avg
  const values = data.map((d) => d.value);
  const current = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const isAlarming = alarm && current > alarm.value;

  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={cn(isAlarming && "border-red-500/30")}
    >
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-3">
        <div>
          <p className="text-xs text-zinc-500">Current</p>
          <p className={cn("text-lg font-bold tabular-nums", isAlarming ? "text-red-400" : "text-zinc-100")}>
            {typeof current === "number" ? current.toLocaleString() : current}{unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Avg</p>
          <p className="text-sm font-medium text-zinc-300 tabular-nums">{Math.round(avg).toLocaleString()}{unit}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Min</p>
          <p className="text-sm font-medium text-zinc-300 tabular-nums">{Math.round(min).toLocaleString()}{unit}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Max</p>
          <p className="text-sm font-medium text-zinc-300 tabular-nums">{Math.round(max).toLocaleString()}{unit}</p>
        </div>
        {alarm && (
          <div className="ml-auto">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              isAlarming
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
              {isAlarming ? "⚠ ALARM" : "✓ OK"}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {multiLine ? (
            <LineChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="time"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value: number, name: string) => [`${value.toLocaleString()}${unit}`, name]}
              />
              <Line type="monotone" dataKey="primary" stroke={color} strokeWidth={2} dot={false} name="P50" />
              {multiLine.map((line) => (
                <Line
                  key={line.label}
                  type="monotone"
                  dataKey={line.label}
                  stroke={line.color}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray={line.label === "P99" ? "4 2" : undefined}
                  name={line.label}
                />
              ))}
              {alarm && (
                <ReferenceLine
                  y={alarm.value}
                  stroke={alarm.color}
                  strokeDasharray="8 4"
                  strokeWidth={1.5}
                  label={{
                    value: alarm.label,
                    position: "right",
                    fill: alarm.color,
                    fontSize: 10,
                  }}
                />
              )}
            </LineChart>
          ) : chartType === "line" ? (
            <LineChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="time"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value: number) => [`${value.toLocaleString()}${unit}`, title]}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              {alarm && (
                <ReferenceLine
                  y={alarm.value}
                  stroke={alarm.color}
                  strokeDasharray="8 4"
                  strokeWidth={1.5}
                  label={{
                    value: alarm.label,
                    position: "right",
                    fill: alarm.color,
                    fontSize: 10,
                  }}
                />
              )}
            </LineChart>
          ) : (
            <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor ?? color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={fillColor ?? color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="time"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value: number) => [`${value.toLocaleString()}${unit}`, title]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title.replace(/\s/g, "")})`}
              />
              {alarm && (
                <ReferenceLine
                  y={alarm.value}
                  stroke={alarm.color}
                  strokeDasharray="8 4"
                  strokeWidth={1.5}
                  label={{
                    value: alarm.label,
                    position: "right",
                    fill: alarm.color,
                    fontSize: 10,
                  }}
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
