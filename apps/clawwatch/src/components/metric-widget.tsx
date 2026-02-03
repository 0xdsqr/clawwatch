import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricPoint } from "@/lib/utils";

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
  multiLine?: {
    label: string;
    data: MetricPoint[];
    color: string;
  }[];
  height?: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
} as const;

export function MetricWidget({
  title,
  subtitle,
  data,
  color = "#a855f7",
  fillColor,
  unit = "",
  chartType = "area",
  alarm,
  multiLine,
  height = 200,
}: MetricWidgetProps) {
  const formatted = useMemo(() => {
    if (multiLine) {
      return data.map((point, i) => {
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
    }
    return data.map((d) => ({
      ...d,
      time: formatTime(d.timestamp),
    }));
  }, [data, multiLine]);

  const values = data.map((d) => d.value);
  const current = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const isAlarming = alarm && current > alarm.value;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className={cn(isAlarming && "border-red-500/30")}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="mb-3 flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p
              className={cn(
                "tabular-nums text-lg font-bold",
                isAlarming ? "text-red-400" : "",
              )}
            >
              {typeof current === "number" ? current.toLocaleString() : current}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="tabular-nums text-sm font-medium">
              {Math.round(avg).toLocaleString()}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="tabular-nums text-sm font-medium">
              {Math.round(min).toLocaleString()}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="tabular-nums text-sm font-medium">
              {Math.round(max).toLocaleString()}
              {unit}
            </p>
          </div>
          {alarm && (
            <div className="ml-auto">
              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-xs font-medium",
                  isAlarming
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                )}
              >
                {isAlarming ? "ALARM" : "OK"}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="w-full min-h-0" style={{ height }}>
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Loading...
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            {multiLine ? (
              <LineChart
                data={formatted}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(
                    value: number | undefined,
                    name: string | undefined,
                  ) => [`${(value ?? 0).toLocaleString()}${unit}`, name]}
                />
                <Line
                  type="monotone"
                  dataKey="primary"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  name="P50"
                />
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
              <LineChart
                data={formatted}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toLocaleString()}${unit}`,
                    title,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
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
              </LineChart>
            ) : (
              <AreaChart
                data={formatted}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`grad-${title.replace(/\s/g, "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={fillColor ?? color}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={fillColor ?? color}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v.toLocaleString()}${unit}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toLocaleString()}${unit}`,
                    title,
                  ]}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
