import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Activity, AlertTriangle, DollarSign, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { CostChart } from "@/components/cost-chart";
import { MiniActivityFeed } from "@/components/mini-activity-feed";
import { StatCard } from "@/components/stat-card";
import { SystemStatus } from "@/components/system-status";
import { type TimeRange, TimeRangeSelector } from "@/components/time-range-selector";
import { TokenBreakdown } from "@/components/token-breakdown";
import { TopModels } from "@/components/top-models";
import { formatCost, formatTokens } from "@/lib/utils";
import type { Agent, Alert } from "@/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const agents = useQuery(api.agents.list, {});
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, { limit: 5 });
  const recentActivities = useQuery(api.activities.recent, { limit: 10 });

  const hours = useMemo(() => {
    switch (timeRange) {
      case "7d":
        return 24 * 7;
      case "30d":
        return 24 * 30;
      default:
        return 24;
    }
  }, [timeRange]);

  const costTimeSeries = useQuery(api.costs.timeSeries, { hours });

  const unresolvedAlerts = useMemo(
    () => recentAlerts?.filter((a: Alert) => !a.resolvedAt) ?? [],
    [recentAlerts],
  );

  const costTodayFormatted = useMemo(
    () => formatCost(costSummary?.today.cost ?? 0),
    [costSummary?.today.cost],
  );

  const totalTokens = useMemo(
    () =>
      formatTokens((costSummary?.today.inputTokens ?? 0) + (costSummary?.today.outputTokens ?? 0)),
    [costSummary?.today.inputTokens, costSummary?.today.outputTokens],
  );

  const activeAgentCount = useMemo(() => {
    const online = agents?.filter((a: Agent) => a.status === "online").length ?? 0;
    return online.toString();
  }, [agents]);

  const costTrend = useMemo(() => {
    if (!costSummary?.today || !costSummary?.week) return undefined;
    const todayCost = costSummary.today.cost;
    // Average daily cost over the week (excluding today)
    const weekCost = costSummary.week.cost;
    const weekDays = 7;
    const avgDaily = weekDays > 1 ? (weekCost - todayCost) / (weekDays - 1) : 0;
    if (avgDaily === 0) return undefined;
    const pct = ((todayCost - avgDaily) / avgDaily) * 100;
    return {
      percentage: Math.abs(pct),
      direction: pct >= 0 ? ("up" as const) : ("down" as const),
    };
  }, [costSummary?.today, costSummary?.week]);

  const tokenTrend = useMemo(() => {
    if (!costSummary?.today || !costSummary?.week) return undefined;
    const todayTokens =
      (costSummary.today.inputTokens ?? 0) + (costSummary.today.outputTokens ?? 0);
    const weekTokens = (costSummary.week.inputTokens ?? 0) + (costSummary.week.outputTokens ?? 0);
    const weekDays = 7;
    const avgDaily = weekDays > 1 ? (weekTokens - todayTokens) / (weekDays - 1) : 0;
    if (avgDaily === 0) return undefined;
    const pct = ((todayTokens - avgDaily) / avgDaily) * 100;
    return {
      percentage: Math.abs(pct),
      direction: pct >= 0 ? ("up" as const) : ("down" as const),
    };
  }, [costSummary?.today, costSummary?.week]);

  const costSparkline = useMemo(() => {
    if (!costTimeSeries || costTimeSeries.length === 0) return [];
    return costTimeSeries.map((point: { cost: number }) => ({
      value: point.cost,
    }));
  }, [costTimeSeries]);

  const tokenSparkline = useMemo(() => {
    if (!costTimeSeries || costTimeSeries.length === 0) return [];
    return costTimeSeries.map((point: { tokens: number }) => ({
      value: point.tokens,
    }));
  }, [costTimeSeries]);

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      {/* Alert banner */}
      {unresolvedAlerts.length > 0 && <AlertBanner alerts={unresolvedAlerts} />}

      {/* KPI Stats */}
      <div className="stagger-grid grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cost Today"
          value={costTodayFormatted}
          change="vs. yesterday"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          trend={costTrend}
          sparkline={costSparkline}
        />
        <StatCard
          label="Tokens (24h)"
          value={totalTokens}
          change="vs. yesterday"
          icon={<Zap className="h-4 w-4 text-amber-400" />}
          trend={tokenTrend}
          sparkline={tokenSparkline}
        />
        <StatCard
          label="Active Agents"
          value={activeAgentCount}
          change={`${agents?.filter((a: Agent) => a.status === "offline").length ?? 0} offline`}
          changeType={
            agents?.filter((a: Agent) => a.status === "offline").length === 0
              ? "positive"
              : "negative"
          }
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Active Alerts"
          value={unresolvedAlerts.length.toString()}
          change={
            unresolvedAlerts.filter((a: Alert) => a.severity === "critical").length > 0
              ? `${unresolvedAlerts.filter((a: Alert) => a.severity === "critical").length} critical`
              : "All clear"
          }
          changeType={unresolvedAlerts.length > 0 ? "negative" : "positive"}
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-fade-in">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Cost Over Time</CardTitle>
                  <CardDescription className="text-xs">
                    {timeRange === "24h" && "Last 24 hours"}
                    {timeRange === "7d" && "Last 7 days"}
                    {timeRange === "30d" && "Last 30 days"}
                  </CardDescription>
                </div>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CostChart data={costTimeSeries ?? []} />
            </CardContent>
          </Card>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live Events
              </CardTitle>
              <CardDescription className="text-xs">Real-time agent activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <MiniActivityFeed activities={recentActivities ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Content */}
      <div className="stagger-grid grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TokenBreakdown />
        <TopModels />
        <SystemStatus />
      </div>
    </div>
  );
}
