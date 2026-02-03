import {
  a as d,
  d as h,
  C as l,
  b as m,
  f as p,
  c as x,
} from "./card-7H36IGPB.js";
import {
  l as c,
  j as e,
  k as n,
  m as o,
  h as r,
  g as t,
  D as y,
} from "./main-DhZaiQhw.js";
import { T as b } from "./triangle-alert-CdUHjP11.js";
import { t as g, s as k } from "./utils-BIlMNCOp.js";
import { X as A, C as u } from "./x-TOvDNqrr.js";
const _ = [
    [
      "path",
      {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
        key: "v9h5vc",
      },
    ],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    [
      "path",
      {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
        key: "3uifl3",
      },
    ],
    ["path", { d: "M8 16H3v5", key: "1cv678" }],
  ],
  w = r("refresh-cw", _);
const C = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
  ],
  M = r("shield", C);
const R = [
    ["path", { d: "M12 20h.01", key: "zekei9" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0", key: "dnpr2z" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0", key: "1x1e6c" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ],
  j = r("wifi", R),
  T = {
    budget_exceeded: y,
    agent_offline: j,
    error_spike: b,
    session_loop: w,
    channel_disconnect: j,
    custom_threshold: M,
  };
function P() {
  const a = n(d.alerting.listRules),
    i = n(d.alerting.listAlerts, { limit: 50 }),
    f = c(d.alerting.acknowledge),
    v = c(d.alerting.resolve);
  return e.jsxs("div", {
    className: "flex flex-1 flex-col gap-6 p-6",
    children: [
      e.jsxs(l, {
        children: [
          e.jsxs(m, {
            children: [
              e.jsx(x, { children: "Alert Rules" }),
              e.jsx(h, { children: "Active monitoring rules" }),
            ],
          }),
          e.jsx(p, {
            children:
              a && a.length > 0
                ? e.jsx("div", {
                    className: "space-y-2",
                    children: a.map((s) => {
                      const N = T[s.type] ?? o;
                      return e.jsxs(
                        "div",
                        {
                          className: t(
                            "flex items-center justify-between rounded-lg border p-3",
                            s.isActive ? "bg-card" : "bg-muted/30 opacity-50",
                          ),
                          children: [
                            e.jsxs("div", {
                              className: "flex items-center gap-3",
                              children: [
                                e.jsx(N, {
                                  className: "h-4 w-4 text-muted-foreground",
                                }),
                                e.jsxs("div", {
                                  children: [
                                    e.jsx("p", {
                                      className: "text-sm font-medium",
                                      children: s.name,
                                    }),
                                    e.jsxs("p", {
                                      className:
                                        "text-xs text-muted-foreground",
                                      children: [
                                        s.type.replace(/_/g, " "),
                                        " · ",
                                        s.channels.join(", "),
                                        " ·",
                                        " ",
                                        s.cooldownMinutes,
                                        "min cooldown",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            e.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                s.lastTriggered &&
                                  e.jsxs("span", {
                                    className:
                                      "text-xs text-muted-foreground/60",
                                    children: ["Last: ", g(s.lastTriggered)],
                                  }),
                                e.jsx("span", {
                                  className: t(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    s.isActive
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-muted text-muted-foreground",
                                  ),
                                  children: s.isActive ? "Active" : "Paused",
                                }),
                              ],
                            }),
                          ],
                        },
                        s._id,
                      );
                    }),
                  })
                : e.jsxs("div", {
                    className: "py-8 text-center text-muted-foreground",
                    children: [
                      e.jsx(o, {
                        className: "mx-auto mb-2 h-8 w-8 opacity-50",
                      }),
                      e.jsx("p", {
                        className: "text-sm",
                        children: "No alert rules configured",
                      }),
                      e.jsx("p", {
                        className: "mt-1 text-xs",
                        children: "Create rules to monitor your agents",
                      }),
                    ],
                  }),
          }),
        ],
      }),
      e.jsxs(l, {
        children: [
          e.jsxs(m, {
            children: [
              e.jsx(x, { children: "Alert History" }),
              e.jsx(h, { children: "Recent alerts fired" }),
            ],
          }),
          e.jsx(p, {
            children:
              i && i.length > 0
                ? e.jsx("div", {
                    className: "space-y-2",
                    children: i.map((s) =>
                      e.jsxs(
                        "div",
                        {
                          className: t(
                            "flex items-start justify-between rounded-lg border p-3",
                            s.resolvedAt ? "bg-muted/30 opacity-60" : "bg-card",
                          ),
                          children: [
                            e.jsxs("div", {
                              className: "flex items-start gap-3",
                              children: [
                                e.jsx("span", {
                                  className: t(
                                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                                    k(s.severity),
                                  ),
                                  children: s.severity,
                                }),
                                e.jsxs("div", {
                                  children: [
                                    e.jsx("p", {
                                      className: "text-sm font-medium",
                                      children: s.title,
                                    }),
                                    e.jsx("p", {
                                      className:
                                        "mt-0.5 text-xs text-muted-foreground",
                                      children: s.message,
                                    }),
                                    e.jsxs("p", {
                                      className:
                                        "mt-1 text-xs text-muted-foreground/50",
                                      children: [
                                        g(s._creationTime),
                                        s.acknowledgedAt && " · Acknowledged",
                                        s.resolvedAt && " · Resolved",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            !s.resolvedAt &&
                              e.jsxs("div", {
                                className: "flex shrink-0 items-center gap-1",
                                children: [
                                  !s.acknowledgedAt &&
                                    e.jsx("button", {
                                      onClick: () => f({ id: s._id }),
                                      className:
                                        "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                      title: "Acknowledge",
                                      children: e.jsx(u, {
                                        className: "h-4 w-4",
                                      }),
                                    }),
                                  e.jsx("button", {
                                    onClick: () => v({ id: s._id }),
                                    className:
                                      "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                    title: "Resolve",
                                    children: e.jsx(A, {
                                      className: "h-4 w-4",
                                    }),
                                  }),
                                ],
                              }),
                          ],
                        },
                        s._id,
                      ),
                    ),
                  })
                : e.jsxs("div", {
                    className: "py-8 text-center text-muted-foreground",
                    children: [
                      e.jsx(u, {
                        className: "mx-auto mb-2 h-8 w-8 opacity-50",
                      }),
                      e.jsx("p", {
                        className: "text-sm",
                        children: "No alerts fired",
                      }),
                      e.jsx("p", {
                        className: "mt-1 text-xs",
                        children: "All quiet — that's good!",
                      }),
                    ],
                  }),
          }),
        ],
      }),
    ],
  });
}
export { P as component };
