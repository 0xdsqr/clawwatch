import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { e as cn } from "./router-DJkLI7Pk.mjs";
import { t as timeAgo } from "./utils-B-v2tgNy.mjs";
import { B as Bell, H as Heart, i as TriangleAlert, o as Square, p as Play, q as Wrench, r as ArrowDown, s as MessageSquare } from "../_libs/lucide-react.mjs";
const ACTIVITY_ICONS = {
  message_sent: MessageSquare,
  message_received: ArrowDown,
  tool_call: Wrench,
  session_started: Play,
  session_ended: Square,
  error: TriangleAlert,
  heartbeat: Heart,
  alert_fired: Bell
};
const ACTIVITY_COLORS = {
  message_sent: "text-blue-400",
  message_received: "text-cyan-400",
  tool_call: "text-purple-400",
  session_started: "text-emerald-400",
  session_ended: "text-muted-foreground",
  error: "text-red-400",
  heartbeat: "text-primary",
  alert_fired: "text-amber-400"
};
const ActivityRow = reactExports.memo(function ActivityRow2({
  activity
}) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare;
  const color = ACTIVITY_COLORS[activity.type] ?? "text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-0.5 shrink-0", color), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm leading-snug", children: activity.summary }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center gap-2", children: [
        activity.agentName && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: activity.agentName }),
        activity.channel && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground/50", children: [
          "#",
          activity.channel
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/50", children: timeAgo(activity._creationTime) })
      ] })
    ] })
  ] });
});
const MiniActivityFeed = reactExports.memo(function MiniActivityFeed2({ activities }) {
  if (activities.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No recent activity" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-80 space-y-3 overflow-y-auto", children: activities.map((activity) => /* @__PURE__ */ jsxRuntimeExports.jsx(ActivityRow, { activity }, activity._id)) });
});
export {
  MiniActivityFeed as M
};
