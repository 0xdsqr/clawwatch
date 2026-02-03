const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/cost-chart-internal-CIMiBzeM.js",
      "assets/main-DhZaiQhw.js",
      "assets/utils-BIlMNCOp.js",
      "assets/AreaChart-t9V0r8-s.js",
    ]),
) => i.map((i) => d[i]);
import { f as m, C as x } from "./card-7H36IGPB.js";
import { _ as c, r as e, g as i, h as l, j as t } from "./main-DhZaiQhw.js";
const u = [
    [
      "path",
      {
        d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        key: "1xq2db",
      },
    ],
  ],
  p = l("zap", u),
  C = e.memo(
    ({ label: r, value: o, change: n, changeType: a = "neutral", icon: d }) =>
      t.jsx(x, {
        children: t.jsx(m, {
          className: "pt-6",
          children: t.jsxs("div", {
            className: "flex items-start justify-between",
            children: [
              t.jsxs("div", {
                children: [
                  t.jsx("p", {
                    className:
                      "text-xs font-medium uppercase tracking-wider text-muted-foreground",
                    children: r,
                  }),
                  t.jsx("p", {
                    className: "mt-1 text-2xl font-bold",
                    children: o,
                  }),
                  n &&
                    t.jsx("p", {
                      className: i(
                        "mt-1 text-xs",
                        a === "positive" && "text-emerald-400",
                        a === "negative" && "text-red-400",
                        a === "neutral" && "text-muted-foreground",
                      ),
                      children: n,
                    }),
                ],
              }),
              d &&
                t.jsx("div", {
                  className:
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
                  children: d,
                }),
            ],
          }),
        }),
      }),
  ),
  f = e.lazy(() =>
    c(
      () => import("./cost-chart-internal-CIMiBzeM.js"),
      __vite__mapDeps([0, 1, 2, 3]),
    ).then((s) => ({ default: s.CostChartInternal })),
  ),
  _ = e.memo(({ data: r }) =>
    t.jsx(e.Suspense, {
      fallback: t.jsx("div", {
        className:
          "flex h-[200px] items-center justify-center text-muted-foreground",
        children: "Loading chart...",
      }),
      children: t.jsx(f, { data: r }),
    }),
  );
export { _ as C, C as S, p as Z };
