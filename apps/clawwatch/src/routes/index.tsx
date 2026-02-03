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
import { useMemo } from "react";
import { AgentStatusCard } from "@/components/agent-status-card";
import { AlertBanner } from "@/components/alert-banner";
import { CostChart } from "@/components/cost-chart";
import { MiniActivityFeed } from "@/components/mini-activity-feed";
import { SnitchLeaderboard, SnitchScore } from "@/components/snitch-score";
import { StatCard } from "@/components/stat-card";
import { formatCost, formatTokens } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const agents = useQuery(api.agents.list, {});
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, { limit: 5 });
  const recentActivities = useQuery(api.activities.recent, { limit: 10 });
  const costTimeSeries = useQuery(api.costs.timeSeries, { hours: 24 });

  const unresolvedAlerts = useMemo(
    () => recentAlerts?.filter((a) => !a.resolvedAt) ?? [],
    [recentAlerts],
  );

  const costTodayFormatted = useMemo(
    () => formatCost(costSummary?.today.cost ?? 0),
    [costSummary?.today.cost],
  );

  const todayRequests = useMemo(
    () =>
      costSummary ? `${costSummary.today.requests} requests` : "Loading...",
    [costSummary?.today.requests],
  );

  const totalTokens = useMemo(
    () =>
      formatTokens(
        (costSummary?.today.inputTokens ?? 0) +
          (costSummary?.today.outputTokens ?? 0),
      ),
    [costSummary?.today.inputTokens, costSummary?.today.outputTokens],
  );

  const tokenBreakdown = useMemo(
    () =>
      `In: ${formatTokens(costSummary?.today.inputTokens ?? 0)} / Out: ${formatTokens(costSummary?.today.outputTokens ?? 0)}`,
    [costSummary?.today.inputTokens, costSummary?.today.outputTokens],
  );

  const activeAgentCount = useMemo(
    () =>
      `${agents?.filter((a) => a.status === "online").length ?? 0} / ${agents?.length ?? 0}`,
    [agents],
  );

  const offlineAgentInfo = useMemo(() => {
    if (!agents) return { text: "Loading...", type: "neutral" as const };
    const offlineCount = agents.filter((a) => a.status === "offline").length;
    return {
      text: `${offlineCount} offline`,
      type: offlineCount > 0 ? ("negative" as const) : ("positive" as const),
    };
  }, [agents]);

  const alertInfo = useMemo(() => {
    const criticalCount = unresolvedAlerts.filter(
      (a) => a.severity === "critical",
    ).length;
    return {
      text: criticalCount > 0 ? `${criticalCount} critical` : "All clear",
      type:
        unresolvedAlerts.length > 0
          ? ("negative" as const)
          : ("positive" as const),
    };
  }, [unresolvedAlerts]);

  const firstAgentId = agents?.[0]?._id;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Alert banner */}
      {unresolvedAlerts.length > 0 && <AlertBanner alerts={unresolvedAlerts} />}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cost Today"
          value={costTodayFormatted}
          change={todayRequests}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Tokens (24h)"
          value={totalTokens}
          change={tokenBreakdown}
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          label="Active Agents"
          value={activeAgentCount}
          change={offlineAgentInfo.text}
          changeType={offlineAgentInfo.type}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Active Alerts"
          value={unresolvedAlerts.length.toString()}
          change={alertInfo.text}
          changeType={alertInfo.type}
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cost Over Time</CardTitle>
              <CardDescription>Last 24 hours, hourly buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <CostChart data={costTimeSeries ?? []} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest agent actions</CardDescription>
            </CardHeader>
            <CardContent>
              <MiniActivityFeed activities={recentActivities ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Snitch scores */}
      {agents && agents.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SnitchLeaderboard />
          {firstAgentId && <SnitchScore agentId={firstAgentId} />}
        </div>
      )}

      {/* Agent cards */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Agents</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents?.map((agent) => (
            <AgentStatusCard key={agent._id} agentId={agent._id} />
          ))}
          {agents?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No agents connected</p>
                <p className="mt-1 text-sm">
                  Connect your Clawdbot gateway to start monitoring
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
