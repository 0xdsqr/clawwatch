import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  DollarSign,
  RefreshCw,
  Shield,
  Wifi,
  X,
} from "lucide-react";
import { severityColor, timeAgo } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

const TYPE_ICONS: Record<string, typeof Bell> = {
  budget_exceeded: DollarSign,
  agent_offline: Wifi,
  error_spike: AlertTriangle,
  session_loop: RefreshCw,
  channel_disconnect: Wifi,
  custom_threshold: Shield,
};

function AlertsPage() {
  const rules = useQuery(api.alerting.listRules);
  const alerts = useQuery(api.alerting.listAlerts, { limit: 50 });
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>Active monitoring rules</CardDescription>
        </CardHeader>
        <CardContent>
          {rules && rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((rule) => {
                const Icon = TYPE_ICONS[rule.type] ?? Bell;
                return (
                  <div
                    key={rule._id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3",
                      rule.isActive ? "bg-card" : "bg-muted/30 opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.type.replace(/_/g, " ")} ·{" "}
                          {rule.channels.join(", ")} · {rule.cooldownMinutes}min
                          cooldown
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.lastTriggered && (
                        <span className="text-xs text-muted-foreground/60">
                          Last: {timeAgo(rule.lastTriggered)}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          rule.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-muted text-muted-foreground",
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
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No alert rules configured</p>
              <p className="mt-1 text-xs">
                Create rules to monitor your agents
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>Recent alerts fired</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={cn(
                    "flex items-start justify-between rounded-lg border p-3",
                    alert.resolvedAt ? "bg-muted/30 opacity-60" : "bg-card",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                        severityColor(alert.severity),
                      )}
                    >
                      {alert.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/50">
                        {timeAgo(alert._creationTime)}
                        {alert.acknowledgedAt && " · Acknowledged"}
                        {alert.resolvedAt && " · Resolved"}
                      </p>
                    </div>
                  </div>
                  {!alert.resolvedAt && (
                    <div className="flex shrink-0 items-center gap-1">
                      {!alert.acknowledgedAt && (
                        <button
                          onClick={() => acknowledge({ id: alert._id })}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Acknowledge"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => resolve({ id: alert._id })}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Resolve"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No alerts fired</p>
              <p className="mt-1 text-xs">All quiet — that's good!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
