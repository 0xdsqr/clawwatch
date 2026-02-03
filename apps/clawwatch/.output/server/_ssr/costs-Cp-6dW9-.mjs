import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, d as CardDescription, f as CardContent } from "./card-DVx9SFsi.mjs";
import { S as StatCard, C as CostChart } from "./cost-chart-BBAzf-i2.mjs";
import { f as formatCost, a as formatTokens } from "./utils-B-v2tgNy.mjs";
import { e as cn } from "./router-DJkLI7Pk.mjs";
import { u as useQuery } from "../_libs/convex.mjs";
import { e as Clock, D as DollarSign, f as TrendingUp, Z as Zap } from "../_libs/lucide-react.mjs";
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
function CostExplorer() {
  const summary = useQuery(api.costs.summary, {});
  const timeSeries24h = useQuery(api.costs.timeSeries, {
    hours: 24
  });
  const timeSeries7d = useQuery(api.costs.timeSeries, {
    hours: 168
  });
  const budgets = useQuery(api.budgets.list);
  const lastHourCost = reactExports.useMemo(() => formatCost(summary?.lastHour.cost ?? 0), [summary?.lastHour.cost]);
  const lastHourRequests = reactExports.useMemo(() => `${summary?.lastHour.requests ?? 0} requests`, [summary?.lastHour.requests]);
  const todayCost = reactExports.useMemo(() => formatCost(summary?.today.cost ?? 0), [summary?.today.cost]);
  const todayTokens = reactExports.useMemo(() => `${formatTokens((summary?.today.inputTokens ?? 0) + (summary?.today.outputTokens ?? 0))} tokens`, [summary?.today.inputTokens, summary?.today.outputTokens]);
  const weekCost = reactExports.useMemo(() => formatCost(summary?.week.cost ?? 0), [summary?.week.cost]);
  const weekRequests = reactExports.useMemo(() => `${summary?.week.requests ?? 0} requests`, [summary?.week.requests]);
  const monthCost = reactExports.useMemo(() => formatCost(summary?.month.cost ?? 0), [summary?.month.cost]);
  const monthTokens = reactExports.useMemo(() => `${formatTokens((summary?.month.inputTokens ?? 0) + (summary?.month.outputTokens ?? 0))} tokens`, [summary?.month.inputTokens, summary?.month.outputTokens]);
  const budgetItems = reactExports.useMemo(() => budgets?.map((budget) => {
    const pct = budget.limitDollars > 0 ? Math.min(100, budget.currentSpend / budget.limitDollars * 100) : 0;
    return {
      ...budget,
      pct,
      isOver: pct >= 100,
      isWarning: pct >= 80,
      formattedSpend: formatCost(budget.currentSpend),
      formattedLimit: formatCost(budget.limitDollars)
    };
  }) ?? [], [budgets]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Last Hour", value: lastHourCost, change: lastHourRequests, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Today", value: todayCost, change: todayTokens, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-5 w-5 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "This Week", value: weekCost, change: weekRequests, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5 text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "This Month", value: monthCost, change: monthTokens, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-amber-400" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Cost — Last 24 Hours" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Hourly breakdown" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CostChart, { data: timeSeries24h ?? [] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Cost — Last 7 Days" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Hourly breakdown" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CostChart, { data: timeSeries7d ?? [] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Budgets" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Spending limits and thresholds" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: budgetItems.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: budgetItems.map((budget) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: budget.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-xs text-muted-foreground", children: [
              budget.period,
              " · ",
              budget.hardStop ? "Hard stop" : "Alert only"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm", children: [
            budget.formattedSpend,
            " / ",
            budget.formattedLimit
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-full rounded-full transition-all", budget.isOver ? "bg-red-500" : budget.isWarning ? "bg-amber-500" : "bg-primary"), style: {
          width: `${budget.pct}%`
        } }) })
      ] }, budget._id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No budgets configured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs", children: "Set up spending limits in Settings" })
      ] }) })
    ] })
  ] });
}
export {
  CostExplorer as component
};
