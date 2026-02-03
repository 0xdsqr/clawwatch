import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, d as CardDescription, f as CardContent } from "./card-DVx9SFsi.mjs";
import { e as cn } from "./router-DJkLI7Pk.mjs";
import { t as timeAgo, s as severityColor } from "./utils-B-v2tgNy.mjs";
import { u as useQuery, b as useMutation } from "../_libs/convex.mjs";
import { g as Shield, W as Wifi, h as RefreshCw, i as TriangleAlert, D as DollarSign, B as Bell, j as CircleCheckBig, X } from "../_libs/lucide-react.mjs";
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
const TYPE_ICONS = {
  budget_exceeded: DollarSign,
  agent_offline: Wifi,
  error_spike: TriangleAlert,
  session_loop: RefreshCw,
  channel_disconnect: Wifi,
  custom_threshold: Shield
};
function AlertsPage() {
  const rules = useQuery(api.alerting.listRules);
  const alerts = useQuery(api.alerting.listAlerts, {
    limit: 50
  });
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Alert Rules" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Active monitoring rules" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: rules && rules.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: rules.map((rule) => {
        const Icon = TYPE_ICONS[rule.type] ?? Bell;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex items-center justify-between rounded-lg border p-3", rule.isActive ? "bg-card" : "bg-muted/30 opacity-50"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: rule.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                rule.type.replace(/_/g, " "),
                " · ",
                rule.channels.join(", "),
                " ·",
                " ",
                rule.cooldownMinutes,
                "min cooldown"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            rule.lastTriggered && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground/60", children: [
              "Last: ",
              timeAgo(rule.lastTriggered)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-2 py-0.5 text-xs", rule.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"), children: rule.isActive ? "Active" : "Paused" })
          ] })
        ] }, rule._id);
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "mx-auto mb-2 h-8 w-8 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No alert rules configured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs", children: "Create rules to monitor your agents" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Alert History" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Recent alerts fired" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: alerts && alerts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: alerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex items-start justify-between rounded-lg border p-3", alert.resolvedAt ? "bg-muted/30 opacity-60" : "bg-card"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium", severityColor(alert.severity)), children: alert.severity }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: alert.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: alert.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground/50", children: [
              timeAgo(alert._creationTime),
              alert.acknowledgedAt && " · Acknowledged",
              alert.resolvedAt && " · Resolved"
            ] })
          ] })
        ] }),
        !alert.resolvedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
          !alert.acknowledgedAt && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => acknowledge({
            id: alert._id
          }), className: "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", title: "Acknowledge", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => resolve({
            id: alert._id
          }), className: "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", title: "Resolve", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] })
      ] }, alert._id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "mx-auto mb-2 h-8 w-8 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No alerts fired" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs", children: "All quiet — that's good!" })
      ] }) })
    ] })
  ] });
}
export {
  AlertsPage as component
};
