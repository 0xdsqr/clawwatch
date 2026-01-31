import { memo, useCallback, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/Card";
import { cn, formatCost, timeAgo } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Bell,
  CheckCircle,
  X,
  Shield,
  DollarSign,
  Wifi,
  RefreshCw,
  AlertTriangle,
  Plus,
  Zap,
  TrendingUp,
  Clock,
  Activity,
  Target,
  Pause,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

// ─── Types ──────────────────────────────────────────────────────────────────

type AlertType =
  | "budget_exceeded"
  | "agent_offline"
  | "error_spike"
  | "session_loop"
  | "channel_disconnect"
  | "custom_threshold";
type Channel = "discord" | "email" | "webhook";
type Severity = "info" | "warning" | "critical";

interface AlertTemplate {
  name: string;
  description: string;
  icon: typeof Bell;
  type: AlertType;
  config: {
    threshold?: number;
    windowMinutes?: number;
    comparison?: "gt" | "lt" | "eq";
    metric?: string;
  };
  channels: Channel[];
  cooldownMinutes: number;
  severity: Severity;
  color: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, typeof Bell> = {
  budget_exceeded: DollarSign,
  agent_offline: Wifi,
  error_spike: AlertTriangle,
  session_loop: RefreshCw,
  channel_disconnect: Wifi,
  custom_threshold: Shield,
};

const SEVERITY_CONFIG: Record<Severity, { label: string; class: string; dot: string }> = {
  info: {
    label: "Info",
    class: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    dot: "bg-blue-400",
  },
  warning: {
    label: "Warning",
    class: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
  },
  critical: {
    label: "Critical",
    class: "text-red-400 bg-red-400/10 border-red-400/20",
    dot: "bg-red-400",
  },
};

const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    name: "Cost Spike",
    description: "Alert when hourly cost exceeds threshold",
    icon: DollarSign,
    type: "custom_threshold",
    config: { threshold: 5, metric: "cost_per_hour" },
    channels: ["discord"],
    cooldownMinutes: 60,
    severity: "warning",
    color: "text-amber-400",
  },
  {
    name: "Agent Offline",
    description: "Alert when agent stops sending heartbeats",
    icon: Wifi,
    type: "agent_offline",
    config: { windowMinutes: 5 },
    channels: ["discord"],
    cooldownMinutes: 15,
    severity: "critical",
    color: "text-red-400",
  },
  {
    name: "Error Rate Surge",
    description: "Alert on unusual error frequency",
    icon: AlertTriangle,
    type: "error_spike",
    config: { threshold: 5, windowMinutes: 10 },
    channels: ["discord"],
    cooldownMinutes: 30,
    severity: "warning",
    color: "text-orange-400",
  },
  {
    name: "Budget Exceeded",
    description: "Alert when spending exceeds budget limit",
    icon: TrendingUp,
    type: "budget_exceeded",
    config: { threshold: 100 },
    channels: ["discord"],
    cooldownMinutes: 60,
    severity: "critical",
    color: "text-red-400",
  },
  {
    name: "Session Loop",
    description: "Detect runaway sessions with excessive tokens",
    icon: RefreshCw,
    type: "session_loop",
    config: {},
    channels: ["discord"],
    cooldownMinutes: 60,
    severity: "critical",
    color: "text-purple-400",
  },
  {
    name: "Channel Disconnect",
    description: "Alert when Discord channel goes silent",
    icon: Wifi,
    type: "channel_disconnect",
    config: { windowMinutes: 30 },
    channels: ["discord"],
    cooldownMinutes: 60,
    severity: "warning",
    color: "text-yellow-400",
  },
];

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const tooltipLabelStyle = { color: "#a1a1aa" } as const;

// ─── Sub-components ─────────────────────────────────────────────────────────

const TemplateCard = memo(function TemplateCard({
  template,
  onUse,
}: {
  template: AlertTemplate;
  onUse: (template: AlertTemplate) => void;
}) {
  const Icon = template.icon;
  return (
    <button
      onClick={() => onUse(template)}
      className="group flex flex-col items-start gap-2 p-4 rounded-lg border border-zinc-800 bg-zinc-800/20 hover:bg-zinc-800/50 hover:border-purple-500/30 transition-all text-left w-full"
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 group-hover:bg-purple-500/10 transition-colors",
          )}
        >
          <Icon className={cn("w-4 h-4", template.color)} />
        </div>
        <span className="text-sm font-medium text-zinc-200">
          {template.name}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">
        {template.description}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full border",
            SEVERITY_CONFIG[template.severity].class,
          )}
        >
          {template.severity}
        </span>
        <span className="text-[10px] text-zinc-600">
          {template.cooldownMinutes}min cooldown
        </span>
      </div>
    </button>
  );
});

const CooldownBadge = memo(function CooldownBadge({
  lastTriggered,
  cooldownMinutes,
}: {
  lastTriggered: number | undefined;
  cooldownMinutes: number;
}) {
  if (!lastTriggered) return null;
  const now = Date.now();
  const cooldownEnd = lastTriggered + cooldownMinutes * 60000;
  const inCooldown = now < cooldownEnd;

  if (!inCooldown) return null;

  const remainingMs = cooldownEnd - now;
  const remainingMin = Math.ceil(remainingMs / 60000);

  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 border border-zinc-700">
      <Pause className="w-2.5 h-2.5" />
      Cooldown: {remainingMin}m
    </span>
  );
});

const SeverityBadge = memo(function SeverityBadge({
  severity,
}: {
  severity: Severity;
}) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.class,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
});

// ─── Forecast Chart ─────────────────────────────────────────────────────────

interface ForecastPoint {
  timestamp: number;
  actual: number | null;
  projected: number;
  limit: number;
}

const ForecastChart = memo(function ForecastChart({
  data,
  budgetName,
}: {
  data: ForecastPoint[];
  budgetName: string;
}) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        date: new Date(d.timestamp).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      })),
    [data],
  );

  const limit = data[0]?.limit ?? 0;

  const forecastTooltip = useCallback(
    (value: number | undefined, name: string | undefined) => {
      if (value === null || value === undefined) return [null, null];
      if (name === "actual") return [formatCost(value), "Actual"];
      if (name === "projected") return [formatCost(value), "Projected"];
      if (name === "limit") return [formatCost(value), "Budget"];
      return [value, name ?? ""];
    },
    [],
  );

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`actualGrad-${budgetName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`projGrad-${budgetName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCost(v)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            formatter={forecastTooltip}
          />
          <ReferenceLine
            y={limit}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: `Budget: ${formatCost(limit)}`,
              position: "insideTopRight",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#a855f7"
            strokeWidth={2}
            fill={`url(#actualGrad-${budgetName})`}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="projected"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill={`url(#projGrad-${budgetName})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

// ─── Create Rule Form ───────────────────────────────────────────────────────

const CreateRuleForm = memo(function CreateRuleForm({
  initial,
  onClose,
}: {
  initial?: AlertTemplate | null;
  onClose: () => void;
}) {
  const createRule = useMutation(api.alerting.createRule);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AlertType>(
    initial?.type ?? "budget_exceeded",
  );
  const [threshold, setThreshold] = useState(
    String(initial?.config.threshold ?? ""),
  );
  const [windowMinutes, setWindowMinutes] = useState(
    String(initial?.config.windowMinutes ?? ""),
  );
  const [metric, setMetric] = useState(initial?.config.metric ?? "");
  const [channels, setChannels] = useState<Channel[]>(
    initial?.channels ?? ["discord"],
  );
  const [cooldown, setCooldown] = useState(
    String(initial?.cooldownMinutes ?? 60),
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        await createRule({
          name,
          type,
          config: {
            threshold: threshold ? Number(threshold) : undefined,
            windowMinutes: windowMinutes ? Number(windowMinutes) : undefined,
            metric: metric || undefined,
          },
          channels,
          cooldownMinutes: Number(cooldown) || 60,
        });
        onClose();
      } catch (err) {
        console.error("Failed to create rule:", err);
      } finally {
        setSaving(false);
      }
    },
    [name, type, threshold, windowMinutes, metric, channels, cooldown, createRule, onClose],
  );

  const toggleChannel = useCallback(
    (ch: Channel) => {
      setChannels((prev) =>
        prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
      );
    },
    [],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Rule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            placeholder="e.g. Cost Spike Alert"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Alert Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlertType)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="budget_exceeded">Budget Exceeded</option>
            <option value="agent_offline">Agent Offline</option>
            <option value="error_spike">Error Spike</option>
            <option value="session_loop">Session Loop</option>
            <option value="channel_disconnect">Channel Disconnect</option>
            <option value="custom_threshold">Custom Threshold</option>
          </select>
        </div>

        {/* Threshold */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Threshold
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            step="any"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            placeholder="e.g. 5"
          />
        </div>

        {/* Window */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Window (minutes)
          </label>
          <input
            type="number"
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            placeholder="e.g. 10"
          />
        </div>

        {/* Metric (for custom_threshold) */}
        {type === "custom_threshold" && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Metric
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            >
              <option value="">Select metric...</option>
              <option value="cost_per_hour">Cost per Hour</option>
            </select>
          </div>
        )}

        {/* Cooldown */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Cooldown (minutes)
          </label>
          <input
            type="number"
            value={cooldown}
            onChange={(e) => setCooldown(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            placeholder="60"
          />
        </div>
      </div>

      {/* Channels */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">
          Notification Channels
        </label>
        <div className="flex gap-2">
          {(["discord", "email", "webhook"] as Channel[]).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => toggleChannel(ch)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                channels.includes(ch)
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300",
              )}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Creating..." : "Create Rule"}
        </button>
      </div>
    </form>
  );
});

// ─── Anomaly Row ────────────────────────────────────────────────────────────

interface AnomalyItem {
  sessionKey: string;
  displayName: string;
  agentId: Id<"agents">;
  cost: number;
  tokens: number;
  duration: number;
  severity: "warning" | "critical";
  reasons: string[];
  zScore: number;
  timestamp: number;
}

const AnomalyRow = memo(function AnomalyRow({
  anomaly,
}: {
  anomaly: AnomalyItem;
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-800/20">
      <div className="flex items-start gap-3">
        <SeverityBadge severity={anomaly.severity} />
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {anomaly.displayName}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {anomaly.reasons.map((r, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
              >
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {formatCost(anomaly.cost)} ·{" "}
            {anomaly.tokens >= 1000
              ? `${(anomaly.tokens / 1000).toFixed(1)}K`
              : anomaly.tokens}{" "}
            tokens · {Math.round(anomaly.duration / 60000)}min ·{" "}
            {timeAgo(anomaly.timestamp)}
          </p>
        </div>
      </div>
      <span className="text-xs text-zinc-600 shrink-0">
        {anomaly.zScore}σ
      </span>
    </div>
  );
});

// ─── Main Page ──────────────────────────────────────────────────────────────

export function AlertsPage() {
  const rules = useQuery(api.alerting.listRules);
  const alerts = useQuery(api.alerting.listAlerts, { limit: 50 });
  const forecasts = useQuery(api.forecasting.budgetForecast);
  const anomalyData = useQuery(api.forecasting.anomalies, { windowDays: 7 });
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);
  const toggleRule = useMutation(api.alerting.updateRule);
  const deleteRule = useMutation(api.alerting.deleteRule);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplate | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const handleUseTemplate = useCallback((template: AlertTemplate) => {
    setSelectedTemplate(template);
    setShowCreate(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowCreate(false);
    setSelectedTemplate(null);
  }, []);

  const handleToggleRule = useCallback(
    (id: Id<"alertRules">, isActive: boolean) => {
      toggleRule({ id, isActive: !isActive });
    },
    [toggleRule],
  );

  const handleDeleteRule = useCallback(
    (id: Id<"alertRules">) => {
      deleteRule({ id });
    },
    [deleteRule],
  );

  // Separate active vs resolved alerts
  const { activeAlerts, resolvedAlerts } = useMemo(() => {
    if (!alerts)
      return { activeAlerts: [], resolvedAlerts: [] };
    const active = alerts.filter((a) => !a.resolvedAt);
    const resolved = alerts.filter((a) => a.resolvedAt);
    return { activeAlerts: active, resolvedAlerts: resolved };
  }, [alerts]);

  const displayedAlerts = useMemo(() => {
    const all = [...activeAlerts, ...resolvedAlerts];
    return showAllAlerts ? all : all.slice(0, 10);
  }, [activeAlerts, resolvedAlerts, showAllAlerts]);

  const anomalies = useMemo(
    () => (anomalyData?.anomalies ?? []) as AnomalyItem[],
    [anomalyData],
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Smart Alerts</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Templates, budget forecasting, anomaly detection & alert management
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setShowCreate(!showCreate);
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            showCreate
              ? "bg-zinc-800 text-zinc-400"
              : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30",
          )}
        >
          {showCreate ? (
            <>
              <X className="w-4 h-4" /> Close
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> New Rule
            </>
          )}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card title="Create Alert Rule" subtitle="Configure a new monitoring rule">
          <CreateRuleForm initial={selectedTemplate} onClose={handleCloseForm} />
        </Card>
      )}

      {/* Quick Templates */}
      <Card
        title="Quick Templates"
        subtitle="One-click alarm setup — click to pre-fill the create form"
        action={<Zap className="w-4 h-4 text-purple-400" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALERT_TEMPLATES.map((t) => (
            <TemplateCard key={t.name} template={t} onUse={handleUseTemplate} />
          ))}
        </div>
      </Card>

      {/* Budget Forecasting */}
      <Card
        title="Budget Forecasting"
        subtitle="Projected spend based on current burn rate"
        action={<TrendingUp className="w-4 h-4 text-purple-400" />}
      >
        {forecasts && forecasts.length > 0 ? (
          <div className="space-y-6">
            {forecasts.map((f) => (
              <div
                key={f.budgetId}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-800/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-zinc-200">
                        {f.name}
                      </h4>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                          f.status === "healthy" &&
                            "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                          f.status === "warning" &&
                            "text-amber-400 bg-amber-400/10 border-amber-400/20",
                          f.status === "critical" &&
                            "text-red-400 bg-red-400/10 border-red-400/20",
                        )}
                      >
                        {f.status}
                      </span>
                      {f.hardStop && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Hard Stop
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {f.period} budget · Resets{" "}
                      {new Date(f.resetAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-zinc-200">
                      {formatCost(f.currentSpend)}{" "}
                      <span className="text-zinc-600">/</span>{" "}
                      {formatCost(f.limitDollars)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {f.percentUsed}% used
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 rounded-full bg-zinc-800 mb-3 overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all",
                      f.status === "healthy" && "bg-emerald-500",
                      f.status === "warning" && "bg-amber-500",
                      f.status === "critical" && "bg-red-500",
                    )}
                    style={{
                      width: `${Math.min(f.percentUsed, 100)}%`,
                    }}
                  />
                  {f.projectedPercent > f.percentUsed && (
                    <div
                      className={cn(
                        "absolute inset-y-0 rounded-full opacity-30",
                        f.status === "healthy" && "bg-emerald-500",
                        f.status === "warning" && "bg-amber-500",
                        f.status === "critical" && "bg-red-500",
                      )}
                      style={{
                        left: `${Math.min(f.percentUsed, 100)}%`,
                        width: `${Math.min(f.projectedPercent - f.percentUsed, 100 - Math.min(f.percentUsed, 100))}%`,
                      }}
                    />
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Daily Burn</p>
                    <p className="text-sm font-mono text-zinc-200">
                      {formatCost(f.dailyBurnRate)}
                      <span className="text-zinc-600">/day</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Projected End</p>
                    <p
                      className={cn(
                        "text-sm font-mono",
                        f.projectedPercent > 100
                          ? "text-red-400"
                          : "text-zinc-200",
                      )}
                    >
                      {formatCost(f.projectedSpend)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">
                      {f.daysUntilExhausted !== null
                        ? "Exhausted In"
                        : "Status"}
                    </p>
                    <p className="text-sm font-mono text-zinc-200">
                      {f.daysUntilExhausted !== null
                        ? `${f.daysUntilExhausted}d`
                        : "∞"}
                    </p>
                  </div>
                </div>

                {/* Forecast message */}
                {f.projectedPercent > 100 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10 mb-4">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">
                      At current rate, you'll hit{" "}
                      <span className="font-mono font-medium">
                        {formatCost(f.projectedSpend)}
                      </span>{" "}
                      by end of period — {Math.round(f.projectedPercent)}% of budget
                    </p>
                  </div>
                )}

                {/* Chart */}
                <ForecastChart
                  data={f.projectionPoints}
                  budgetName={f.name}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active budgets</p>
            <p className="text-xs mt-1">
              Create a budget in Settings to see forecasts
            </p>
          </div>
        )}
      </Card>

      {/* Anomaly Detection */}
      <Card
        title="Anomaly Detection"
        subtitle="Sessions deviating significantly from rolling averages"
        action={<Activity className="w-4 h-4 text-purple-400" />}
      >
        {anomalyData?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Avg Cost
              </p>
              <p className="text-sm font-mono text-zinc-200 mt-0.5">
                {formatCost(anomalyData.stats.avgCost)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Avg Tokens
              </p>
              <p className="text-sm font-mono text-zinc-200 mt-0.5">
                {anomalyData.stats.avgTokens >= 1000
                  ? `${(anomalyData.stats.avgTokens / 1000).toFixed(1)}K`
                  : anomalyData.stats.avgTokens}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Sessions
              </p>
              <p className="text-sm font-mono text-zinc-200 mt-0.5">
                {anomalyData.stats.sessionCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Anomalies
              </p>
              <p
                className={cn(
                  "text-sm font-mono mt-0.5",
                  anomalies.length > 0 ? "text-amber-400" : "text-emerald-400",
                )}
              >
                {anomalies.length}
              </p>
            </div>
          </div>
        )}

        {anomalies.length > 0 ? (
          <div className="space-y-2">
            {anomalies.map((a) => (
              <AnomalyRow key={a.sessionKey} anomaly={a} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-600">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No anomalies detected</p>
            <p className="text-xs mt-1">
              All sessions within normal range (7-day window)
            </p>
          </div>
        )}
      </Card>

      {/* Alert Rules */}
      <Card
        title="Alert Rules"
        subtitle="Active monitoring rules"
        action={
          <span className="text-xs text-zinc-600">
            {rules?.filter((r) => r.isActive).length ?? 0} active
          </span>
        }
      >
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
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {rule.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-zinc-500">
                          {rule.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-500">
                          {rule.channels.join(", ")}
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-500">
                          {rule.cooldownMinutes}min cooldown
                        </span>
                        <CooldownBadge
                          lastTriggered={rule.lastTriggered}
                          cooldownMinutes={rule.cooldownMinutes}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {rule.lastTriggered && (
                      <span className="text-xs text-zinc-600 hidden sm:inline">
                        Last: {timeAgo(rule.lastTriggered)}
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleRule(rule._id, rule.isActive)}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full transition-colors",
                        rule.isActive
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-zinc-700/50 text-zinc-500 hover:bg-zinc-700/80",
                      )}
                    >
                      {rule.isActive ? "Active" : "Paused"}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-1 rounded hover:bg-zinc-700/50 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Delete rule"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alert rules configured</p>
            <p className="text-xs mt-1">
              Use a template above or create a custom rule
            </p>
          </div>
        )}
      </Card>

      {/* Alert History Timeline */}
      <Card
        title="Alert History"
        subtitle={`${activeAlerts.length} active · ${resolvedAlerts.length} resolved`}
        action={<Clock className="w-4 h-4 text-purple-400" />}
      >
        {alerts && alerts.length > 0 ? (
          <div className="space-y-1">
            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />

              {displayedAlerts.map((alert) => (
                <div key={alert._id} className="relative pl-10 pb-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-[11px] top-2 w-[10px] h-[10px] rounded-full border-2 border-zinc-900",
                      alert.resolvedAt
                        ? "bg-zinc-600"
                        : alert.severity === "critical"
                          ? "bg-red-400"
                          : alert.severity === "warning"
                            ? "bg-amber-400"
                            : "bg-blue-400",
                    )}
                  />

                  <div
                    className={cn(
                      "flex items-start justify-between p-3 rounded-lg border",
                      alert.resolvedAt
                        ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                        : "border-zinc-800 bg-zinc-800/30",
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <SeverityBadge severity={alert.severity} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200">
                          {alert.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-zinc-700">
                            {timeAgo(alert._creationTime)}
                          </span>
                          {alert.acknowledgedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Acknowledged
                            </span>
                          )}
                          {alert.resolvedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Resolved
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-700">
                            {alert.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.resolvedAt && (
                      <div className="flex items-center gap-1 shrink-0 ml-4">
                        {!alert.acknowledgedAt && (
                          <button
                            onClick={() => acknowledge({ id: alert._id })}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 transition-colors"
                            title="Acknowledge"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => resolve({ id: alert._id })}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 transition-colors"
                          title="Resolve"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / less */}
            {(alerts?.length ?? 0) > 10 && (
              <button
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="flex items-center gap-1 mx-auto text-xs text-zinc-500 hover:text-purple-400 transition-colors pt-2"
              >
                {showAllAlerts ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Show all{" "}
                    {alerts?.length} alerts
                  </>
                )}
              </button>
            )}
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
