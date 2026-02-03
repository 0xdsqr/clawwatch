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
import { useState, useMemo } from "react";
import { AlertBanner } from "@/components/alert-banner";
import { CostChart } from "@/components/cost-chart";
import { MiniActivityFeed } from "@/components/mini-activity-feed";
import { StatCard } from "@/components/stat-card";
import { SystemStatus } from "@/components/system-status";
import { TimeRangeSelector, type TimeRange } from "@/components/time-range-selector";
import { TokenBreakdown } from "@/components/token-breakdown";
import { TopModels } from "@/components/top-models";
import { formatCost, formatTokens } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  
  const agents = useQuery(api.agents.list, {});
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, { limit: 5 });
  const recentActivities = useQuery(api.activities.recent, { limit: 10 });
  
  // Get time series data based on selected range
  const hours = useMemo(() => {
    switch (timeRange) {
      case "7d": return 24 * 7;
      case "30d": return 24 * 30;
      default: return 24;
    }
  }, [timeRange]);
  
  const costTimeSeries = useQuery(api.costs.timeSeries, { hours });

  const unresolvedAlerts = useMemo(
    () => recentAlerts?.filter((a) => !a.resolvedAt) ?? [],
    [recentAlerts],
  );

  // Hero KPI Stats with trends
  const costTodayFormatted = useMemo(
    () => formatCost(costSummary?.today.cost ?? 0),
    [costSummary?.today.cost],
  );

  const totalTokens = useMemo(
    () =>
      formatTokens(
        (costSummary?.today.inputTokens ?? 0) +
          (costSummary?.today.outputTokens ?? 0),
      ),
    [costSummary?.today.inputTokens, costSummary?.today.outputTokens],
  );

  const activeAgentCount = useMemo(() => {
    const online = agents?.filter((a) => a.status === "online").length ?? 0;
    return online.toString();
  }, [agents]);

  // Mock trend data (in real app, this would come from Convex)
  const costTrend = useMemo(() => ({
    percentage: 8.2,
    direction: "up" as const,
  }), []);

  const tokenTrend = useMemo(() => ({
    percentage: 15.7,
    direction: "up" as const,
  }), []);

  // Mock sparkline data (in real app, this would come from Convex)
  const costSparkline = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => ({ value: 50 + Math.sin(i) * 20 + i * 5 })),
    []
  );

  const tokenSparkline = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => ({ value: 100000 + Math.sin(i) * 30000 + i * 10000 })),
    []
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Alert banner */}
      {unresolvedAlerts.length > 0 && <AlertBanner alerts={unresolvedAlerts} />}

      {/* Row 1: Hero KPI Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cost Today"
          value={costTodayFormatted}
          change="vs. yesterday"
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={costTrend}
          sparkline={costSparkline}
        />
        <StatCard
          label="Tokens (24h)"
          value={totalTokens}
          change="vs. yesterday"
          icon={<Zap className="h-5 w-5 text-amber-400" />}
          trend={tokenTrend}
          sparkline={tokenSparkline}
        />
        <StatCard
          label="Active Agents"
          value={activeAgentCount}
          change={`${agents?.filter((a) => a.status === "offline").length ?? 0} offline`}
          changeType={agents?.filter((a) => a.status === "offline").length === 0 ? "positive" : "negative"}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Active Alerts"
          value={unresolvedAlerts.length.toString()}
          change={unresolvedAlerts.filter((a) => a.severity === "critical").length > 0 
            ? `${unresolvedAlerts.filter((a) => a.severity === "critical").length} critical` 
            : "All clear"}
          changeType={unresolvedAlerts.length > 0 ? "negative" : "positive"}
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        />
      </div>

      {/* Row 2: Main Content (2/3 + 1/3 split) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cost Over Time</CardTitle>
                  <CardDescription>
                    {timeRange === "24h" && "Last 24 hours, hourly buckets"}
                    {timeRange === "7d" && "Last 7 days, daily buckets"}
                    {timeRange === "30d" && "Last 30 days, daily buckets"}
                  </CardDescription>
                </div>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
              </div>
            </CardHeader>
            <CardContent>
              <CostChart data={costTimeSeries ?? []} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live Events
              </CardTitle>
              <CardDescription>Real-time agent events</CardDescription>
            </CardHeader>
            <CardContent>
              <MiniActivityFeed activities={recentActivities ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3: Secondary Content (1/3 + 1/3 + 1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TokenBreakdown />
        <TopModels />
        <SystemStatus />
      </div>
    </div>
  );
}
