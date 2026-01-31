import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/Card";
import { cn, severityColor, timeAgo } from "@/lib/utils";
import {
  Bell,
  CheckCircle,
  X,
  Shield,
  DollarSign,
  Wifi,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Bell> = {
  budget_exceeded: DollarSign,
  agent_offline: Wifi,
  error_spike: AlertTriangle,
  session_loop: RefreshCw,
  channel_disconnect: Wifi,
  custom_threshold: Shield,
};

export function AlertsPage() {
  const rules = useQuery(api.alerting.listRules);
  const alerts = useQuery(api.alerting.listAlerts, { limit: 50 });
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Alarms</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Configure alarm rules and view alert history
          </p>
        </div>
      </div>

      {/* Alert Rules */}
      <Card title="Alert Rules" subtitle="Active monitoring rules">
        {rules && rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map((rule) => {
              const Icon = TYPE_ICONS[rule.type] ?? Bell;
              return (
                <div
                  key={rule._id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    rule.isActive
                      ? "border-zinc-800 bg-zinc-800/30"
                      : "border-zinc-800/50 bg-zinc-900/30 opacity-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {rule.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {rule.type.replace(/_/g, " ")} ·{" "}
                        {rule.channels.join(", ")} · {rule.cooldownMinutes}min
                        cooldown
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.lastTriggered && (
                      <span className="text-xs text-zinc-600">
                        Last: {timeAgo(rule.lastTriggered)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        rule.isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-700/50 text-zinc-500",
                      )}
                    >
                      {rule.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alert rules configured</p>
            <p className="text-xs mt-1">Create rules to monitor your agents</p>
          </div>
        )}
      </Card>

      {/* Alert History */}
      <Card title="Alert History" subtitle="Recent alerts fired">
        {alerts && alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg border",
                  alert.resolvedAt
                    ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                    : "border-zinc-800 bg-zinc-800/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                      severityColor(alert.severity),
                    )}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {alert.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {alert.message}
                    </p>
                    <p className="text-xs text-zinc-700 mt-1">
                      {timeAgo(alert._creationTime)}
                      {alert.acknowledgedAt && " · Acknowledged"}
                      {alert.resolvedAt && " · Resolved"}
                    </p>
                  </div>
                </div>
                {!alert.resolvedAt && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!alert.acknowledgedAt && (
                      <button
                        onClick={() => acknowledge({ id: alert._id })}
                        className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Acknowledge"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => resolve({ id: alert._id })}
                      className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Resolve"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts fired</p>
            <p className="text-xs mt-1">All quiet — that's good!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
