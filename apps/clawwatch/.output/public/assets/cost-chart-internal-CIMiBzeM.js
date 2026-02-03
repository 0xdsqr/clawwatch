import {
  a9 as c,
  aa as d,
  ab as f,
  ad as l,
  ac as m,
  a8 as n,
  ae as x,
} from "./AreaChart-t9V0r8-s.js";
import { r as s, j as t } from "./main-DhZaiQhw.js";
import { f as a } from "./utils-BIlMNCOp.js";
const p = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  },
  u = { color: "hsl(var(--muted-foreground))" };
function h(o, r) {
  return r === "cost" && o !== void 0 ? [a(o), "Cost"] : [o ?? 0, r];
}
function j(o) {
  return a(o);
}
const k = s.memo(({ data: r }) => {
  const i = s.useMemo(
    () =>
      r.map((e) => ({
        ...e,
        time: new Date(e.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    [r],
  );
  return t.jsx("div", {
    className: "h-64",
    children: t.jsx(n, {
      width: "100%",
      height: "100%",
      children: t.jsxs(l, {
        data: i,
        margin: { top: 4, right: 4, left: 0, bottom: 0 },
        children: [
          t.jsx("defs", {
            children: t.jsxs("linearGradient", {
              id: "costGradient",
              x1: "0",
              y1: "0",
              x2: "0",
              y2: "1",
              children: [
                t.jsx("stop", {
                  offset: "5%",
                  stopColor: "#a855f7",
                  stopOpacity: 0.5,
                }),
                t.jsx("stop", {
                  offset: "95%",
                  stopColor: "#a855f7",
                  stopOpacity: 0.05,
                }),
              ],
            }),
          }),
          t.jsx(c, { strokeDasharray: "3 3", className: "stroke-border" }),
          t.jsx(d, {
            dataKey: "time",
            className: "text-muted-foreground",
            tick: { fill: "currentColor", fontSize: 11 },
            tickLine: !1,
            axisLine: !1,
          }),
          t.jsx(f, {
            className: "text-muted-foreground",
            tick: { fill: "currentColor", fontSize: 11 },
            tickLine: !1,
            axisLine: !1,
            tickFormatter: j,
          }),
          t.jsx(m, { contentStyle: p, labelStyle: u, formatter: h }),
          t.jsx(x, {
            type: "monotone",
            dataKey: "cost",
            stroke: "#a855f7",
            strokeWidth: 2,
            fill: "url(#costGradient)",
          }),
        ],
      }),
    }),
  });
});
export { k as CostChartInternal };
