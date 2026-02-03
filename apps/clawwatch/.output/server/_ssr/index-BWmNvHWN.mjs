import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, d as CardDescription, f as CardContent } from "./card-DVx9SFsi.mjs";
import { e as cn, g as useRender, m as mergeProps$1, h as cva } from "./router-DJkLI7Pk.mjs";
import { f as formatCost, a as formatTokens, t as timeAgo, b as statusColor, s as severityColor } from "./utils-B-v2tgNy.mjs";
import { S as StatCard, C as CostChart } from "./cost-chart-BBAzf-i2.mjs";
import { M as MiniActivityFeed } from "./mini-activity-feed-HU82k6s5.mjs";
import { u as useQuery, b as useMutation } from "../_libs/convex.mjs";
import { D as DollarSign, Z as Zap, A as Activity, i as TriangleAlert, U as UserX, F as FileText, k as Megaphone, l as CircleQuestionMark, E as Eye, m as ShieldAlert, n as Circle, j as CircleCheckBig, X } from "../_libs/lucide-react.mjs";
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
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("bg-muted rounded-md animate-pulse", className),
      ...props
    }
  );
}
const badgeVariants = cva(
  "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps$1(
      {
        className: cn(badgeVariants({ className, variant }))
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant
    }
  });
}
const AgentStatusCard = reactExports.memo(function AgentStatusCard2({ agentId }) {
  const health = useQuery(api.agents.healthSummary, { agentId });
  const formattedCost = reactExports.useMemo(
    () => formatCost(health?.costLastHour ?? 0),
    [health?.costLastHour]
  );
  const formattedTokens = reactExports.useMemo(
    () => formatTokens(health?.tokensLastHour ?? 0),
    [health?.tokensLastHour]
  );
  const formattedHeartbeat = reactExports.useMemo(
    () => health ? timeAgo(health.agent.lastHeartbeat) : "",
    [health?.agent.lastHeartbeat]
  );
  if (!health) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full" }) }) });
  }
  const { agent, activeSessions, errorCount, isHealthy } = health;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 pt-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: cn("h-2.5 w-2.5 fill-current", statusColor(agent.status)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: agent.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: formattedHeartbeat })
    ] }),
    agent.config && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      agent.config.model && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: agent.config.model }),
      agent.config.channel && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: agent.config.channel })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sessions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: activeSessions })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Cost/hr" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: formattedCost })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-3.5 w-3.5 items-center justify-center text-xs font-bold text-muted-foreground", children: "T" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Tokens/hr" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: formattedTokens })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TriangleAlert,
          {
            className: cn(
              "h-3.5 w-3.5",
              errorCount > 0 ? "text-red-400" : "text-muted-foreground"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Errors" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cn("text-sm font-medium", errorCount > 0 ? "text-red-400" : ""), children: errorCount })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-1 rounded-full", isHealthy ? "bg-emerald-500/40" : "bg-red-500/40"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: cn(
          "h-full rounded-full transition-all",
          isHealthy ? "bg-emerald-500" : "bg-red-500"
        ),
        style: {
          width: isHealthy ? "100%" : `${Math.max(10, 100 - errorCount * 20)}%`
        }
      }
    ) })
  ] }) });
});
const AlertRow = reactExports.memo(function AlertRow2({
  alert,
  onAcknowledge,
  onResolve
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: cn(
            "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
            severityColor(alert.severity)
          ),
          children: alert.severity
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: alert.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-xs text-muted-foreground/50", children: timeAgo(alert._creationTime) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-2 flex shrink-0 items-center gap-1", children: [
      !alert.acknowledgedAt && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onAcknowledge(alert._id),
          className: "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
          title: "Acknowledge",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onResolve(alert._id),
          className: "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
          title: "Resolve",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
        }
      )
    ] })
  ] });
});
const AlertBanner = reactExports.memo(function AlertBanner2({ alerts }) {
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);
  const handleAcknowledge = reactExports.useCallback((id) => acknowledge({ id }), [acknowledge]);
  const handleResolve = reactExports.useCallback((id) => resolve({ id }), [resolve]);
  const criticalCount = reactExports.useMemo(
    () => alerts.filter((a) => a.severity === "critical").length,
    [alerts]
  );
  if (alerts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "rounded-xl border p-4",
        criticalCount > 0 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TriangleAlert,
          {
            className: cn(
              "mt-0.5 h-5 w-5 shrink-0",
              criticalCount > 0 ? "text-red-400" : "text-amber-400"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold", children: [
            alerts.length,
            " unresolved alert",
            alerts.length > 1 ? "s" : "",
            criticalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-red-400", children: [
              "(",
              criticalCount,
              " critical)"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-1.5", children: alerts.slice(0, 3).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            AlertRow,
            {
              alert,
              onAcknowledge: handleAcknowledge,
              onResolve: handleResolve
            },
            alert._id
          )) })
        ] })
      ] })
    }
  );
});
const TYPE_ICONS = {
  alert_fired: TriangleAlert,
  safety_refusal: ShieldAlert,
  content_flag: Eye,
  budget_warning: DollarSign,
  permission_ask: CircleQuestionMark,
  proactive_warning: Megaphone,
  compliance_report: FileText,
  tattled_on_user: UserX
};
const TYPE_LABELS = {
  alert_fired: "Alert Fired",
  safety_refusal: "Safety Refusal",
  content_flag: "Content Flag",
  budget_warning: "Budget Warning",
  permission_ask: "Asked Permission",
  proactive_warning: "Proactive Warning",
  compliance_report: "Compliance Report",
  tattled_on_user: "Tattled on User"
};
function scoreStyles(score) {
  if (score < 25) return { color: "text-emerald-400", bar: "bg-emerald-500" };
  if (score < 50) return { color: "text-blue-400", bar: "bg-blue-500" };
  if (score < 75) return { color: "text-amber-400", bar: "bg-amber-500" };
  return { color: "text-red-400", bar: "bg-red-500" };
}
const SnitchScore = reactExports.memo(function SnitchScore2({ agentId }) {
  const score = useQuery(api.snitchScore.getScore, { agentId });
  const styles = reactExports.useMemo(
    () => score ? scoreStyles(score.score) : { color: "", bar: "" },
    [score?.score]
  );
  const sortedBreakdown = reactExports.useMemo(
    () => score ? Object.entries(score.breakdown).sort(([, a], [, b]) => b - a) : [],
    [score?.breakdown]
  );
  if (!score) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-32 w-full" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Snitch Score" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "How often does your agent tattle?" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl", children: score.emoji }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("tabular-nums text-3xl font-bold", styles.color), children: score.score }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "/ 100" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cn("text-sm font-medium", styles.color), children: score.label })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: cn("h-full rounded-full transition-all", styles.bar),
          style: { width: `${score.score}%` }
        }
      ) }),
      sortedBreakdown.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Breakdown" }),
        sortedBreakdown.map(([type, count]) => {
          const Icon = TYPE_ICONS[type] ?? Eye;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: TYPE_LABELS[type] ?? type })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: count })
          ] }, type);
        })
      ] }),
      score.recentSnitches.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Recent Snitching" }),
        score.recentSnitches.map((snitch, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: cn(
                "rounded px-1.5 py-0.5",
                snitch.severity === "narc" ? "bg-red-500/10 text-red-400" : snitch.severity === "hall_monitor" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
              ),
              children: snitch.severity
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: snitch.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-muted-foreground/50", children: timeAgo(snitch.timestamp) })
        ] }, i))
      ] }),
      score.totalEvents === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-2 text-center text-sm text-muted-foreground", children: "No snitching recorded yet. Your agent is keeping quiet... for now." })
    ] })
  ] });
});
const SnitchLeaderboard = reactExports.memo(function SnitchLeaderboard2() {
  const leaderboard = useQuery(api.snitchScore.leaderboard);
  const medals = reactExports.useMemo(() => ["1.", "2.", "3."], []);
  if (!leaderboard || leaderboard.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Snitch Leaderboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Who's the biggest tattletale?" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: leaderboard.map((entry, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between rounded-lg p-2 hover:bg-muted/50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 text-center text-lg", children: i < 3 ? medals[i] : `${i + 1}.` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: entry.agentName })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              entry.totalSnitches,
              " events"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: cn("tabular-nums text-sm font-bold", scoreStyles(entry.score).color),
                children: entry.score
              }
            )
          ] })
        ]
      },
      entry.agentId
    )) }) })
  ] });
});
function Dashboard() {
  const agents = useQuery(api.agents.list, {});
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, {
    limit: 5
  });
  const recentActivities = useQuery(api.activities.recent, {
    limit: 10
  });
  const costTimeSeries = useQuery(api.costs.timeSeries, {
    hours: 24
  });
  const unresolvedAlerts = reactExports.useMemo(() => recentAlerts?.filter((a) => !a.resolvedAt) ?? [], [recentAlerts]);
  const costTodayFormatted = reactExports.useMemo(() => formatCost(costSummary?.today.cost ?? 0), [costSummary?.today.cost]);
  const todayRequests = reactExports.useMemo(() => costSummary ? `${costSummary.today.requests} requests` : "Loading...", [costSummary?.today.requests]);
  const totalTokens = reactExports.useMemo(() => formatTokens((costSummary?.today.inputTokens ?? 0) + (costSummary?.today.outputTokens ?? 0)), [costSummary?.today.inputTokens, costSummary?.today.outputTokens]);
  const tokenBreakdown = reactExports.useMemo(() => `In: ${formatTokens(costSummary?.today.inputTokens ?? 0)} / Out: ${formatTokens(costSummary?.today.outputTokens ?? 0)}`, [costSummary?.today.inputTokens, costSummary?.today.outputTokens]);
  const activeAgentCount = reactExports.useMemo(() => `${agents?.filter((a) => a.status === "online").length ?? 0} / ${agents?.length ?? 0}`, [agents]);
  const offlineAgentInfo = reactExports.useMemo(() => {
    if (!agents) return {
      text: "Loading...",
      type: "neutral"
    };
    const offlineCount = agents.filter((a) => a.status === "offline").length;
    return {
      text: `${offlineCount} offline`,
      type: offlineCount > 0 ? "negative" : "positive"
    };
  }, [agents]);
  const alertInfo = reactExports.useMemo(() => {
    const criticalCount = unresolvedAlerts.filter((a) => a.severity === "critical").length;
    return {
      text: criticalCount > 0 ? `${criticalCount} critical` : "All clear",
      type: unresolvedAlerts.length > 0 ? "negative" : "positive"
    };
  }, [unresolvedAlerts]);
  const firstAgentId = agents?.[0]?._id;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-6 p-6", children: [
    unresolvedAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(AlertBanner, { alerts: unresolvedAlerts }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Cost Today", value: costTodayFormatted, change: todayRequests, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-5 w-5 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Tokens (24h)", value: totalTokens, change: tokenBreakdown, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-amber-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Active Agents", value: activeAgentCount, change: offlineAgentInfo.text, changeType: offlineAgentInfo.type, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-5 w-5 text-emerald-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Active Alerts", value: unresolvedAlerts.length.toString(), change: alertInfo.text, changeType: alertInfo.type, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-red-400" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Cost Over Time" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Last 24 hours, hourly buckets" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CostChart, { data: costTimeSeries ?? [] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recent Activity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Latest agent actions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniActivityFeed, { activities: recentActivities ?? [] }) })
      ] }) })
    ] }),
    agents && agents.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SnitchLeaderboard, {}),
      firstAgentId && /* @__PURE__ */ jsxRuntimeExports.jsx(SnitchScore, { agentId: firstAgentId })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 text-lg font-semibold", children: "Agents" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
        agents?.map((agent) => /* @__PURE__ */ jsxRuntimeExports.jsx(AgentStatusCard, { agentId: agent._id }, agent._id)),
        agents?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "col-span-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-8 text-center text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "No agents connected" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm", children: "Connect your Clawdbot gateway to start monitoring" })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
