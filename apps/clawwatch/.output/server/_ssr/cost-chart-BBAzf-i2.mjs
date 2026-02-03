import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { e as cn } from "./router-DJkLI7Pk.mjs";
import { C as Card, f as CardContent } from "./card-DVx9SFsi.mjs";
const StatCard = reactExports.memo(function StatCard2({
  label,
  value,
  change,
  changeType = "neutral",
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-bold", children: value }),
      change && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          className: cn(
            "mt-1 text-xs",
            changeType === "positive" && "text-emerald-400",
            changeType === "negative" && "text-red-400",
            changeType === "neutral" && "text-muted-foreground"
          ),
          children: change
        }
      )
    ] }),
    icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-muted", children: icon })
  ] }) }) });
});
const CostChartInternal = reactExports.lazy(
  () => import("./cost-chart-internal-DIR1R-2l.mjs").then((m) => ({
    default: m.CostChartInternal
  }))
);
const CostChart = reactExports.memo(function CostChart2({ data }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    reactExports.Suspense,
    {
      fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-[200px] items-center justify-center text-muted-foreground", children: "Loading chart..." }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(CostChartInternal, { data })
    }
  );
});
export {
  CostChart as C,
  StatCard as S
};
