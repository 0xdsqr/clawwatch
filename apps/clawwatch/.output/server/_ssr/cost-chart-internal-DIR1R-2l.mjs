import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { f as formatCost } from "./utils-B-v2tgNy.mjs";
import { R as ResponsiveContainer, A as AreaChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, c as Area } from "../_libs/recharts.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px"
};
const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))" };
function tooltipFormatter(value, name) {
  if (name === "cost" && value !== void 0) return [formatCost(value), "Cost"];
  return [value ?? 0, name];
}
function yAxisFormatter(v) {
  return formatCost(v);
}
const CostChartInternal = reactExports.memo(function CostChartInternal2({ data }) {
  const formatted = reactExports.useMemo(
    () => data.map((d) => ({
      ...d,
      time: new Date(d.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    })),
    [data]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: formatted, margin: { top: 4, right: 4, left: 0, bottom: 0 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "costGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "#a855f7", stopOpacity: 0.5 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "#a855f7", stopOpacity: 0.05 })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-border" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      XAxis,
      {
        dataKey: "time",
        className: "text-muted-foreground",
        tick: { fill: "currentColor", fontSize: 11 },
        tickLine: false,
        axisLine: false
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      YAxis,
      {
        className: "text-muted-foreground",
        tick: { fill: "currentColor", fontSize: 11 },
        tickLine: false,
        axisLine: false,
        tickFormatter: yAxisFormatter
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Tooltip,
      {
        contentStyle: tooltipStyle,
        labelStyle: tooltipLabelStyle,
        formatter: tooltipFormatter
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Area,
      {
        type: "monotone",
        dataKey: "cost",
        stroke: "#a855f7",
        strokeWidth: 2,
        fill: "url(#costGradient)"
      }
    )
  ] }) }) });
});
export {
  CostChartInternal
};
