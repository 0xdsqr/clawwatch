import { m as d, j as e, g as l, r, h as t } from "./main-DhZaiQhw.js";
import { T as i } from "./triangle-alert-CdUHjP11.js";
import { t as m } from "./utils-BIlMNCOp.js";
const x = [
    ["path", { d: "M12 5v14", key: "s699le" }],
    ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }],
  ],
  h = t("arrow-down", x);
const p = [
    [
      "path",
      {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
        key: "mvr1a0",
      },
    ],
  ],
  u = t("heart", p);
const _ = [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
        key: "18887p",
      },
    ],
  ],
  n = t("message-square", _);
const g = [
    [
      "path",
      {
        d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
        key: "10ikf1",
      },
    ],
  ],
  N = t("play", g);
const f = [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
  ],
  j = t("square", f);
const y = [
    [
      "path",
      {
        d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
        key: "1ngwbx",
      },
    ],
  ],
  w = t("wrench", y),
  A = {
    message_sent: n,
    message_received: h,
    tool_call: w,
    session_started: N,
    session_ended: j,
    error: i,
    heartbeat: u,
    alert_fired: d,
  },
  k = {
    message_sent: "text-blue-400",
    message_received: "text-cyan-400",
    tool_call: "text-purple-400",
    session_started: "text-emerald-400",
    session_ended: "text-muted-foreground",
    error: "text-red-400",
    heartbeat: "text-primary",
    alert_fired: "text-amber-400",
  },
  M = r.memo(({ activity: s }) => {
    const a = A[s.type] ?? n,
      c = k[s.type] ?? "text-muted-foreground";
    return e.jsxs("div", {
      className: "group flex items-start gap-3",
      children: [
        e.jsx("div", {
          className: l("mt-0.5 shrink-0", c),
          children: e.jsx(a, { className: "h-3.5 w-3.5" }),
        }),
        e.jsxs("div", {
          className: "min-w-0 flex-1",
          children: [
            e.jsx("p", {
              className: "truncate text-sm leading-snug",
              children: s.summary,
            }),
            e.jsxs("div", {
              className: "mt-0.5 flex items-center gap-2",
              children: [
                s.agentName &&
                  e.jsx("span", {
                    className: "text-xs text-muted-foreground",
                    children: s.agentName,
                  }),
                s.channel &&
                  e.jsxs("span", {
                    className: "text-xs text-muted-foreground/50",
                    children: ["#", s.channel],
                  }),
                e.jsx("span", {
                  className: "text-xs text-muted-foreground/50",
                  children: m(s._creationTime),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }),
  b = r.memo(({ activities: s }) =>
    s.length === 0
      ? e.jsx("div", {
          className: "py-8 text-center text-muted-foreground",
          children: e.jsx("p", {
            className: "text-sm",
            children: "No recent activity",
          }),
        })
      : e.jsx("div", {
          className: "max-h-80 space-y-3 overflow-y-auto",
          children: s.map((a) => e.jsx(M, { activity: a }, a._id)),
        }),
  );
export { b as M };
