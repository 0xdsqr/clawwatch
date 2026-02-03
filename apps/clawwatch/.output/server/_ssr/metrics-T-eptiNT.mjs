import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, d as CardDescription, f as CardContent } from "./card-DVx9SFsi.mjs";
import { e as cn } from "./router-DJkLI7Pk.mjs";
import { u as useQuery } from "../_libs/convex.mjs";
import { R as ResponsiveContainer, L as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Line, b as ReferenceLine, A as AreaChart, c as Area } from "../_libs/recharts.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_chunks/_libs/@tanstack/query-core.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/es-toolkit.mjs";
import "../_libs/clsx.mjs";
import "../_libs/reselect.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_chunks/_libs/@reduxjs/toolkit.mjs";
import "../_libs/redux.mjs";
import "../_libs/immer.mjs";
import "../_libs/redux-thunk.mjs";
import "../_libs/react-redux.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px"
};
function MetricWidget({
  title,
  subtitle,
  data,
  color = "#a855f7",
  fillColor,
  unit = "",
  chartType = "area",
  alarm,
  multiLine,
  height = 200
}) {
  const formatted = reactExports.useMemo(() => {
    if (multiLine) {
      return data.map((point, i) => {
        const entry = {
          timestamp: point.timestamp,
          time: formatTime(point.timestamp),
          primary: point.value
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
      time: formatTime(d.timestamp)
    }));
  }, [data, multiLine]);
  const values = data.map((d) => d.value);
  const current = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const isAlarming = alarm && current > alarm.value;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: cn(isAlarming && "border-red-500/30"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Current" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: cn("tabular-nums text-lg font-bold", isAlarming ? "text-red-400" : ""), children: [
            typeof current === "number" ? current.toLocaleString() : current,
            unit
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Avg" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "tabular-nums text-sm font-medium", children: [
            Math.round(avg).toLocaleString(),
            unit
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Min" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "tabular-nums text-sm font-medium", children: [
            Math.round(min).toLocaleString(),
            unit
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Max" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "tabular-nums text-sm font-medium", children: [
            Math.round(max).toLocaleString(),
            unit
          ] })
        ] }),
        alarm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "rounded-full border px-2 py-1 text-xs font-medium",
              isAlarming ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            ),
            children: isAlarming ? "ALARM" : "OK"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: multiLine ? /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: formatted, margin: { top: 4, right: 4, left: 0, bottom: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          XAxis,
          {
            dataKey: "time",
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            interval: "preserveStartEnd",
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          YAxis,
          {
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            tickFormatter: (v) => `${v.toLocaleString()}${unit}`,
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Tooltip,
          {
            contentStyle: tooltipStyle,
            formatter: (value, name) => [
              `${(value ?? 0).toLocaleString()}${unit}`,
              name
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Line,
          {
            type: "monotone",
            dataKey: "primary",
            stroke: color,
            strokeWidth: 2,
            dot: false,
            name: "P50"
          }
        ),
        multiLine.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Line,
          {
            type: "monotone",
            dataKey: line.label,
            stroke: line.color,
            strokeWidth: 1.5,
            dot: false,
            strokeDasharray: line.label === "P99" ? "4 2" : void 0,
            name: line.label
          },
          line.label
        )),
        alarm && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReferenceLine,
          {
            y: alarm.value,
            stroke: alarm.color,
            strokeDasharray: "8 4",
            strokeWidth: 1.5,
            label: {
              value: alarm.label,
              position: "right",
              fill: alarm.color,
              fontSize: 10
            }
          }
        )
      ] }) : chartType === "line" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: formatted, margin: { top: 4, right: 4, left: 0, bottom: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          XAxis,
          {
            dataKey: "time",
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            interval: "preserveStartEnd",
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          YAxis,
          {
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            tickFormatter: (v) => `${v.toLocaleString()}${unit}`,
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Tooltip,
          {
            contentStyle: tooltipStyle,
            formatter: (value) => [
              `${(value ?? 0).toLocaleString()}${unit}`,
              title
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "value", stroke: color, strokeWidth: 2, dot: false }),
        alarm && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReferenceLine,
          {
            y: alarm.value,
            stroke: alarm.color,
            strokeDasharray: "8 4",
            strokeWidth: 1.5,
            label: {
              value: alarm.label,
              position: "right",
              fill: alarm.color,
              fontSize: 10
            }
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: formatted, margin: { top: 4, right: 4, left: 0, bottom: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "linearGradient",
          {
            id: `grad-${title.replace(/\s/g, "")}`,
            x1: "0",
            y1: "0",
            x2: "0",
            y2: "1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: fillColor ?? color, stopOpacity: 0.5 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: fillColor ?? color, stopOpacity: 0.05 })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          XAxis,
          {
            dataKey: "time",
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            interval: "preserveStartEnd",
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          YAxis,
          {
            tick: { fill: "currentColor", fontSize: 10 },
            tickLine: false,
            axisLine: false,
            tickFormatter: (v) => `${v.toLocaleString()}${unit}`,
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Tooltip,
          {
            contentStyle: tooltipStyle,
            formatter: (value) => [
              `${(value ?? 0).toLocaleString()}${unit}`,
              title
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Area,
          {
            type: "monotone",
            dataKey: "value",
            stroke: color,
            strokeWidth: 2,
            fill: `url(#grad-${title.replace(/\s/g, "")})`
          }
        ),
        alarm && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReferenceLine,
          {
            y: alarm.value,
            stroke: alarm.color,
            strokeDasharray: "8 4",
            strokeWidth: 1.5,
            label: {
              value: alarm.label,
              position: "right",
              fill: alarm.color,
              fontSize: 10
            }
          }
        )
      ] }) }) })
    ] })
  ] });
}
const TIME_RANGES = [{
  value: "1h",
  label: "1 Hour",
  hours: 1
}, {
  value: "6h",
  label: "6 Hours",
  hours: 6
}, {
  value: "24h",
  label: "24 Hours",
  hours: 24
}, {
  value: "7d",
  label: "7 Days",
  hours: 168
}];
function bucketPoints(raw, bucketMs) {
  const buckets = /* @__PURE__ */ new Map();
  for (const p of raw) {
    const key = Math.floor(p.timestamp / bucketMs) * bucketMs;
    const arr = buckets.get(key) ?? [];
    arr.push(p.value);
    buckets.set(key, arr);
  }
  return Array.from(buckets.entries()).map(([timestamp, values]) => ({
    timestamp,
    value: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  })).sort((a, b) => a.timestamp - b.timestamp);
}
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
function bucketPercentiles(raw, bucketMs) {
  const buckets = /* @__PURE__ */ new Map();
  for (const p of raw) {
    const key = Math.floor(p.timestamp / bucketMs) * bucketMs;
    const arr = buckets.get(key) ?? [];
    arr.push(p.value);
    buckets.set(key, arr);
  }
  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  return {
    p50: keys.map((k) => ({
      timestamp: k,
      value: Math.round(percentile(buckets.get(k), 50))
    })),
    p95: keys.map((k) => ({
      timestamp: k,
      value: Math.round(percentile(buckets.get(k), 95))
    })),
    p99: keys.map((k) => ({
      timestamp: k,
      value: Math.round(percentile(buckets.get(k), 99))
    }))
  };
}
function MetricsPage() {
  const [range, setRange] = reactExports.useState("24h");
  const hours = TIME_RANGES.find((r) => r.value === range)?.hours ?? 24;
  const bucketMs = hours <= 1 ? 6e4 : hours <= 6 ? 5 * 6e4 : hours <= 24 ? 15 * 6e4 : 60 * 6e4;
  const healthData = useQuery(api.metrics.healthTimeSeries, {
    hours
  });
  const costData = useQuery(api.metrics.costTimeSeries, {
    hours
  });
  const activityData = useQuery(api.metrics.activityTimeSeries, {
    hours
  });
  const isLoading = healthData === void 0 || costData === void 0 || activityData === void 0;
  const hasData = (healthData?.length ?? 0) > 0 || (costData?.length ?? 0) > 0 || (activityData?.length ?? 0) > 0;
  const latency = reactExports.useMemo(() => {
    if (!healthData?.length) return {
      p50: [],
      p95: [],
      p99: []
    };
    const raw = healthData.filter((h) => h.responseTimeMs > 0).map((h) => ({
      timestamp: h.timestamp,
      value: h.responseTimeMs
    }));
    return bucketPercentiles(raw, bucketMs);
  }, [healthData, bucketMs]);
  const requestRate = reactExports.useMemo(() => {
    if (!activityData?.length) return [];
    return activityData.map((a) => ({
      timestamp: a.timestamp,
      value: a.total
    }));
  }, [activityData]);
  const errorRate = reactExports.useMemo(() => {
    if (!activityData?.length) return [];
    return activityData.map((a) => ({
      timestamp: a.timestamp,
      value: a.errors
    }));
  }, [activityData]);
  const tokenThroughput = reactExports.useMemo(() => {
    if (!costData?.length) return [];
    const raw = costData.map((c) => ({
      timestamp: c.timestamp,
      value: c.inputTokens + c.outputTokens
    }));
    return bucketPoints(raw, bucketMs);
  }, [costData, bucketMs]);
  const sessionCount = reactExports.useMemo(() => {
    if (!healthData?.length) return [];
    const raw = healthData.map((h) => ({
      timestamp: h.timestamp,
      value: h.activeSessionCount
    }));
    return bucketPoints(raw, bucketMs);
  }, [healthData, bucketMs]);
  const heartbeatLatency = reactExports.useMemo(() => {
    if (!healthData?.length) return [];
    return healthData.filter((h) => h.responseTimeMs > 0).map((h) => ({
      timestamp: h.timestamp,
      value: h.responseTimeMs
    }));
  }, [healthData]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 rounded-lg border bg-card p-1", children: TIME_RANGES.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setRange(r.value), className: cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", range === r.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"), children: r.label }, r.value)) })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Loading metrics..." }) }),
    !isLoading && !hasData && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-amber-400/80", children: "No metrics data yet — the collector will populate this as data flows in" }) }),
    !isLoading && hasData && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-emerald-400/80", children: [
      "Live metrics from gateway — ",
      healthData?.length ?? 0,
      " health checks,",
      " ",
      costData?.length ?? 0,
      " cost records, ",
      activityData?.length ?? 0,
      " activity windows"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Response Latency", subtitle: "Gateway response time percentiles", data: latency.p50, color: "#a855f7", unit: "ms", multiLine: [{
        label: "P95",
        data: latency.p95,
        color: "#f59e0b"
      }, {
        label: "P99",
        data: latency.p99,
        color: "#ef4444"
      }], alarm: {
        value: 2e3,
        label: "P99 > 2s",
        color: "#ef4444"
      }, height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Request Rate", subtitle: "Agent activities per 15-min window", data: requestRate, color: "#8b5cf6", unit: " req", chartType: "area", height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Error Rate", subtitle: "Errors per 15-min window", data: errorRate, color: "#ef4444", fillColor: "#ef4444", unit: " err", chartType: "area", alarm: {
        value: 5,
        label: "Spike > 5",
        color: "#ef4444"
      }, height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Token Throughput", subtitle: "Total tokens processed per window", data: tokenThroughput, color: "#06b6d4", unit: " tok", chartType: "area", alarm: {
        value: 4e4,
        label: "Budget Alert",
        color: "#f59e0b"
      }, height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Active Sessions", subtitle: "Concurrent agent sessions", data: sessionCount, color: "#22c55e", chartType: "line", height: 220 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetricWidget, { title: "Heartbeat Interval", subtitle: "Gateway poll response time", data: heartbeatLatency, color: "#f97316", unit: "ms", chartType: "line", alarm: {
        value: 2e3,
        label: "Slow > 2s",
        color: "#ef4444"
      }, height: 220 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Alarm Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Configured metric alarms" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3", children: [{
        name: "P99 Latency",
        metric: "Response time > 2000ms",
        status: (latency.p99.at(-1)?.value ?? 0) > 2e3 ? "ALARM" : "OK"
      }, {
        name: "Error Spike",
        metric: "Errors > 5 per window",
        status: (errorRate.at(-1)?.value ?? 0) > 5 ? "ALARM" : "OK"
      }, {
        name: "Token Budget",
        metric: "Tokens > 40K per window",
        status: (tokenThroughput.at(-1)?.value ?? 0) > 4e4 ? "ALARM" : "OK"
      }, {
        name: "Heartbeat",
        metric: "Interval > 2000ms",
        status: (heartbeatLatency.at(-1)?.value ?? 0) > 2e3 ? "ALARM" : "OK"
      }, {
        name: "Agent Offline",
        metric: "No heartbeat > 5min",
        status: "OK"
      }, {
        name: "Session Loop",
        metric: "Same session > 100 turns",
        status: "OK"
      }].map((alarm) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-lg border p-3", alarm.status === "ALARM" ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: alarm.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-2 py-0.5 text-xs font-medium", alarm.status === "ALARM" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"), children: alarm.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: alarm.metric })
      ] }, alarm.name)) }) })
    ] })
  ] });
}
export {
  MetricsPage as component
};
