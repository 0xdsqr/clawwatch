import { Button } from "@clawwatch/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@clawwatch/ui/components/dialog";
import { Input } from "@clawwatch/ui/components/input";
import { Label } from "@clawwatch/ui/components/label";
import { Switch } from "@clawwatch/ui/components/switch";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  DollarSign,
  Lightbulb,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCost, severityColor, timeAgo } from "@/lib/utils";
import type { Alert, AlertRule } from "@/types";

export const Route = createFileRoute("/alerting")({
  component: AlertingPage,
});

// ─── Constants ───

const ALERT_TYPES = [
  {
    value: "budget_exceeded",
    label: "Budget Exceeded",
    icon: DollarSign,
    description: "Threshold in $, per agent or global",
  },
  {
    value: "agent_offline",
    label: "Agent Offline",
    icon: Wifi,
    description: "Agent heartbeat missed for X minutes",
  },
  {
    value: "error_spike",
    label: "Error Spike",
    icon: AlertTriangle,
    description: "Error count exceeds threshold in time window",
  },
  {
    value: "cost_spike",
    label: "Cost Spike",
    icon: TrendingUp,
    description: "Cost exceeds X% of daily average",
  },
  {
    value: "high_token_usage",
    label: "High Token Usage",
    icon: Zap,
    description: "Token usage exceeds threshold",
  },
] as const;

const TYPE_ICONS: Record<string, typeof Bell> = {
  budget_exceeded: DollarSign,
  agent_offline: Wifi,
  error_spike: AlertTriangle,
  cost_spike: TrendingUp,
  high_token_usage: Zap,
  session_loop: RefreshCw,
  channel_disconnect: Wifi,
  custom_threshold: Shield,
};

type AlertType = (typeof ALERT_TYPES)[number]["value"];

// ─── Main Page ───

function AlertingPage() {
  const rules = useQuery(api.alerting.listRules);
  const alerts = useQuery(api.alerting.listAlerts, { limit: 100 });
  const agents = useQuery(api.agents.list, {});
  const costSummary = useQuery(api.costs.summary, {});

  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);
  const seedDefaults = useMutation(api.alerting.seedDefaults);
  const updateRule = useMutation(api.alerting.updateRule);
  const deleteRule = useMutation(api.alerting.deleteRule);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");

  // Seed defaults once if no rules exist
  const seeded = useRef(false);
  useEffect(() => {
    if (rules && rules.length === 0 && !seeded.current) {
      seeded.current = true;
      seedDefaults();
    }
  }, [rules, seedDefaults]);

  // Smart suggestions computed from real data
  const suggestions = useMemo(() => {
    const items: { icon: typeof Lightbulb; text: string; action?: string }[] = [];
    if (!costSummary || !agents || !rules) return items;

    const dailyCost = costSummary.today.cost;
    const hasBudgetRule = rules.some((r: AlertRule) => r.type === "budget_exceeded");
    if (dailyCost > 0 && !hasBudgetRule) {
      const suggested = Math.ceil((dailyCost * 1.5) / 10) * 10;
      items.push({
        icon: DollarSign,
        text: `Based on your current spending (~${formatCost(dailyCost)}/day), we suggest a daily budget alert at ${formatCost(suggested)}`,
        action: "budget",
      });
    }

    const hasOfflineRule = rules.some((r: AlertRule) => r.type === "agent_offline");
    if (!hasOfflineRule && agents.length > 0) {
      items.push({
        icon: Wifi,
        text: `${agents.length} agent${agents.length !== 1 ? "s" : ""} without heartbeat monitoring — add an offline alert?`,
        action: "offline",
      });
    }

    const cacheHits = costSummary.today.inputTokens > 0 ? 0.999 : 0;
    if (cacheHits > 0.99) {
      items.push({
        icon: CheckCircle,
        text: `Your cache hit rate is excellent — no action needed`,
      });
    }

    return items;
  }, [costSummary, agents, rules]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return undefined;
    return alerts.filter((alert: Alert) => {
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesResolved =
        resolvedFilter === "all" ||
        (resolvedFilter === "resolved" && alert.resolvedAt) ||
        (resolvedFilter === "unresolved" && !alert.resolvedAt);
      return matchesSeverity && matchesResolved;
    });
  }, [alerts, severityFilter, resolvedFilter]);

  // Group alerts by date
  const groupedAlerts = useMemo(() => {
    if (!filteredAlerts) return undefined;
    const groups = new Map<string, typeof filteredAlerts>();
    for (const alert of filteredAlerts) {
      const date = new Date(alert._creationTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)?.push(alert);
    }
    return groups;
  }, [filteredAlerts]);

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Alerting</h1>
          <p className="text-xs text-muted-foreground">
            Monitor thresholds and get notified when things go wrong
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <CreateAlertRuleDialog
            agents={agents ?? []}
            onClose={() => setIsCreateOpen(false)}
          />
        </Dialog>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border bg-background p-3"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm flex-1">{s.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>
            {rules
              ? `${rules.length} rule${rules.length !== 1 ? "s" : ""} configured`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules && rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((rule: AlertRule) => {
                const Icon = TYPE_ICONS[rule.type] ?? Bell;
                return (
                  <div
                    key={rule._id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors",
                      rule.isActive ? "bg-card" : "bg-muted/30 opacity-60",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{rule.name}</p>
                          {rule.severity && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-xs font-medium",
                                severityColor(rule.severity),
                              )}
                            >
                              {rule.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rule.type.replace(/_/g, " ")} · {rule.channels.join(", ")} ·{" "}
                          {rule.cooldownMinutes}min cooldown
                          {rule.config?.threshold && ` · threshold: ${rule.config.threshold}`}
                          {rule.config?.windowMinutes &&
                            ` · ${rule.config.windowMinutes}min window`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {rule.lastTriggered && (
                        <span className="text-xs text-muted-foreground/60">
                          Last: {timeAgo(rule.lastTriggered)}
                        </span>
                      )}
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked: boolean) =>
                          updateRule({ id: rule._id, isActive: checked })
                        }
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => deleteRule({ id: rule._id })}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : rules ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No alert rules configured</p>
              <p className="mt-1 text-xs">Default rules are being created...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>
            {filteredAlerts
              ? `${filteredAlerts.length} alert${filteredAlerts.length !== 1 ? "s" : ""}`
              : "Loading..."}
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="all">All severity</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <select
                value={resolvedFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setResolvedFilter(e.target.value)}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="all">All status</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {groupedAlerts && groupedAlerts.size > 0 ? (
            <div className="space-y-6">
              {Array.from(groupedAlerts.entries()).map(([date, dateAlerts]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {date}
                  </p>
                  <div className="space-y-2">
                    {dateAlerts.map((alert: Alert) => (
                      <div
                        key={alert._id}
                        className={cn(
                          "flex items-start justify-between rounded-lg border p-3 transition-colors",
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
                            <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
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
                                type="button"
                                onClick={() => acknowledge({ id: alert._id })}
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Acknowledge"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
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
                </div>
              ))}
            </div>
          ) : filteredAlerts ? (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No alerts fired</p>
              <p className="mt-1 text-xs">All quiet — that's good!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Create Alert Rule Dialog ───

function CreateAlertRuleDialog({
  agents,
  onClose,
}: {
  agents: { _id: string; name: string }[];
  onClose: () => void;
}) {
  const createRule = useMutation(api.alerting.createRule);

  const [name, setName] = useState("");
  const [type, setType] = useState<AlertType>("budget_exceeded");
  const [agentScope, setAgentScope] = useState<string>("all");
  const [threshold, setThreshold] = useState("100");
  const [windowMinutes, setWindowMinutes] = useState("15");
  const [cooldownMinutes, setCooldownMinutes] = useState("30");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [hardStop, setHardStop] = useState(false);
  const [percentageThreshold, setPercentageThreshold] = useState("50");

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const config: Record<string, unknown> = {};
    if (type === "budget_exceeded") {
      config.threshold = parseFloat(threshold);
      config.metric = "daily_cost";
      if (hardStop) config.hardStop = true;
    } else if (type === "agent_offline") {
      config.windowMinutes = parseInt(windowMinutes, 10);
    } else if (type === "error_spike") {
      config.threshold = parseFloat(threshold);
      config.windowMinutes = parseInt(windowMinutes, 10);
    } else if (type === "cost_spike") {
      config.percentageThreshold = parseInt(percentageThreshold, 10);
      config.windowMinutes = parseInt(windowMinutes, 10);
    } else if (type === "high_token_usage") {
      config.threshold = parseFloat(threshold);
    }

    await createRule({
      name: name.trim(),
      type,
      agentId: agentScope !== "all" ? (agentScope as Id<"agents">) : undefined,
      config: config as any,
      severity,
      channels: ["discord"] as any,
      cooldownMinutes: parseInt(cooldownMinutes, 10),
    });

    onClose();
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Create Alert Rule</DialogTitle>
        <DialogDescription>
          Configure a new monitoring rule to detect issues automatically.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto">
        {/* Name */}
        <div className="grid gap-2">
          <Label htmlFor="rule-name">Rule Name</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g. Daily Budget Warning"
          />
        </div>

        {/* Type selection */}
        <div className="grid gap-2">
          <Label>Alert Type</Label>
          <div className="grid gap-1.5">
            {ALERT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    type === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent scope */}
        <div className="grid gap-2">
          <Label>Agent Scope</Label>
          <select
            value={agentScope}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setAgentScope(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All agents</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type-specific config */}
        {(type === "budget_exceeded" || type === "error_spike" || type === "high_token_usage") && (
          <div className="grid gap-2">
            <Label>
              {type === "budget_exceeded"
                ? "Budget Threshold ($)"
                : type === "high_token_usage"
                  ? "Token Threshold"
                  : "Error Count Threshold"}
            </Label>
            <Input
              type="number"
              step={type === "budget_exceeded" ? "1" : "1"}
              value={threshold}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setThreshold(e.target.value)}
            />
          </div>
        )}

        {type === "cost_spike" && (
          <div className="grid gap-2">
            <Label>Percentage Above Daily Average (%)</Label>
            <Input
              type="number"
              value={percentageThreshold}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPercentageThreshold(e.target.value)
              }
            />
          </div>
        )}

        {(type === "agent_offline" || type === "error_spike" || type === "cost_spike") && (
          <div className="grid gap-2">
            <Label>Time Window (minutes)</Label>
            <Input
              type="number"
              value={windowMinutes}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setWindowMinutes(e.target.value)}
            />
          </div>
        )}

        {type === "budget_exceeded" && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={hardStop}
              onCheckedChange={(checked: boolean) => setHardStop(checked)}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium">Hard Stop</p>
              <p className="text-xs text-muted-foreground">
                Pause the agent when budget is exceeded
              </p>
            </div>
          </div>
        )}

        {/* Severity */}
        <div className="grid gap-2">
          <Label>Severity</Label>
          <div className="flex gap-2">
            {(["info", "warning", "critical"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSeverity(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium border transition-colors flex-1",
                  severity === s ? severityColor(s) : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Notifications are delivered to active Discord channels configured in Settings.
        </div>

        {/* Cooldown */}
        <div className="grid gap-2">
          <Label>Cooldown (minutes between re-fires)</Label>
          <Input
            type="number"
            value={cooldownMinutes}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCooldownMinutes(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          Create Rule
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
