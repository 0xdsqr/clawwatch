import {
  C as c,
  b as d,
  f as h,
  c as m,
  a as r,
  d as u,
} from "./card-7H36IGPB.js";
import { Z as D, S as i, C as j } from "./cost-chart-D4Y8yH8P.js";
import {
  D as b,
  k as n,
  r as o,
  g as q,
  j as s,
  h as y,
} from "./main-DhZaiQhw.js";
import { f as a, a as k } from "./utils-BIlMNCOp.js";
const L = [
    ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }],
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ],
  $ = y("clock", L);
const _ = [
    ["path", { d: "M16 7h6v6", key: "box55l" }],
    ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }],
  ],
  E = y("trending-up", _);
function Z() {
  const e = n(r.costs.summary, {}),
    f = n(r.costs.timeSeries, { hours: 24 }),
    g = n(r.costs.timeSeries, { hours: 168 }),
    x = n(r.budgets.list),
    C = o.useMemo(() => a(e?.lastHour.cost ?? 0), [e?.lastHour.cost]),
    N = o.useMemo(
      () => `${e?.lastHour.requests ?? 0} requests`,
      [e?.lastHour.requests],
    ),
    v = o.useMemo(() => a(e?.today.cost ?? 0), [e?.today.cost]),
    T = o.useMemo(
      () =>
        `${k((e?.today.inputTokens ?? 0) + (e?.today.outputTokens ?? 0))} tokens`,
      [e?.today.inputTokens, e?.today.outputTokens],
    ),
    w = o.useMemo(() => a(e?.week.cost ?? 0), [e?.week.cost]),
    S = o.useMemo(
      () => `${e?.week.requests ?? 0} requests`,
      [e?.week.requests],
    ),
    M = o.useMemo(() => a(e?.month.cost ?? 0), [e?.month.cost]),
    H = o.useMemo(
      () =>
        `${k((e?.month.inputTokens ?? 0) + (e?.month.outputTokens ?? 0))} tokens`,
      [e?.month.inputTokens, e?.month.outputTokens],
    ),
    p = o.useMemo(
      () =>
        x?.map((t) => {
          const l =
            t.limitDollars > 0
              ? Math.min(100, (t.currentSpend / t.limitDollars) * 100)
              : 0;
          return {
            ...t,
            pct: l,
            isOver: l >= 100,
            isWarning: l >= 80,
            formattedSpend: a(t.currentSpend),
            formattedLimit: a(t.limitDollars),
          };
        }) ?? [],
      [x],
    );
  return s.jsxs("div", {
    className: "flex flex-1 flex-col gap-6 p-6",
    children: [
      s.jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
        children: [
          s.jsx(i, {
            label: "Last Hour",
            value: C,
            change: N,
            icon: s.jsx($, { className: "h-5 w-5 text-muted-foreground" }),
          }),
          s.jsx(i, {
            label: "Today",
            value: v,
            change: T,
            icon: s.jsx(b, { className: "h-5 w-5 text-primary" }),
          }),
          s.jsx(i, {
            label: "This Week",
            value: w,
            change: S,
            icon: s.jsx(E, { className: "h-5 w-5 text-blue-400" }),
          }),
          s.jsx(i, {
            label: "This Month",
            value: M,
            change: H,
            icon: s.jsx(D, { className: "h-5 w-5 text-amber-400" }),
          }),
        ],
      }),
      s.jsxs(c, {
        children: [
          s.jsxs(d, {
            children: [
              s.jsx(m, { children: "Cost — Last 24 Hours" }),
              s.jsx(u, { children: "Hourly breakdown" }),
            ],
          }),
          s.jsx(h, { children: s.jsx(j, { data: f ?? [] }) }),
        ],
      }),
      s.jsxs(c, {
        children: [
          s.jsxs(d, {
            children: [
              s.jsx(m, { children: "Cost — Last 7 Days" }),
              s.jsx(u, { children: "Hourly breakdown" }),
            ],
          }),
          s.jsx(h, { children: s.jsx(j, { data: g ?? [] }) }),
        ],
      }),
      s.jsxs(c, {
        children: [
          s.jsxs(d, {
            children: [
              s.jsx(m, { children: "Budgets" }),
              s.jsx(u, { children: "Spending limits and thresholds" }),
            ],
          }),
          s.jsx(h, {
            children:
              p.length > 0
                ? s.jsx("div", {
                    className: "space-y-3",
                    children: p.map((t) =>
                      s.jsxs(
                        "div",
                        {
                          className: "rounded-lg border p-4",
                          children: [
                            s.jsxs("div", {
                              className:
                                "mb-2 flex items-center justify-between",
                              children: [
                                s.jsxs("div", {
                                  children: [
                                    s.jsx("span", {
                                      className: "text-sm font-medium",
                                      children: t.name,
                                    }),
                                    s.jsxs("span", {
                                      className:
                                        "ml-2 text-xs text-muted-foreground",
                                      children: [
                                        t.period,
                                        " · ",
                                        t.hardStop ? "Hard stop" : "Alert only",
                                      ],
                                    }),
                                  ],
                                }),
                                s.jsxs("span", {
                                  className: "font-mono text-sm",
                                  children: [
                                    t.formattedSpend,
                                    " / ",
                                    t.formattedLimit,
                                  ],
                                }),
                              ],
                            }),
                            s.jsx("div", {
                              className:
                                "h-2 overflow-hidden rounded-full bg-muted",
                              children: s.jsx("div", {
                                className: q(
                                  "h-full rounded-full transition-all",
                                  t.isOver
                                    ? "bg-red-500"
                                    : t.isWarning
                                      ? "bg-amber-500"
                                      : "bg-primary",
                                ),
                                style: { width: `${t.pct}%` },
                              }),
                            }),
                          ],
                        },
                        t._id,
                      ),
                    ),
                  })
                : s.jsxs("div", {
                    className: "py-8 text-center text-muted-foreground",
                    children: [
                      s.jsx("p", {
                        className: "text-sm",
                        children: "No budgets configured",
                      }),
                      s.jsx("p", {
                        className: "mt-1 text-xs",
                        children: "Set up spending limits in Settings",
                      }),
                    ],
                  }),
          }),
        ],
      }),
    ],
  });
}
export { Z as component };
