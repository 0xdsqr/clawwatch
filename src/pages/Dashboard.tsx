import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Activity, AlertTriangle, DollarSign, Zap } from "lucide-react";

import { api } from "../../convex/_generated/api";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { AlertBanner } from "@/components/AlertBanner";
import { Card, StatCard } from "@/components/Card";
import { CostChart } from "@/components/CostChart";
import { MiniActivityFeed } from "@/components/MiniActivityFeed";
import { SnitchLeaderboard, SnitchScore } from "@/components/SnitchScore";
import { formatCost, formatTokens } from "@/lib/utils";

export function Dashboard() {
  const agents = useQuery(api.agents.list);
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, { limit: 5 });
  const recentActivities = useQuery(api.activities.recent, { limit: 10 });
  const costTimeSeries = useQuery(api.costs.timeSeries, { hours: 24 });

  const unresolvedAlerts = useMemo(
    () => recentAlerts?.filter((a) => !a.resolvedAt) ?? [],
    [recentAlerts],
  );

  // Memoize expensive formatting calculations
  const costTodayFormatted = useMemo(
    () => formatCost(costSummary?.today.cost ?? 0),
    [costSummary?.today.cost],
  );

  const todayRequests = useMemo(
    () =>
      costSummary
        ? `${costSummary.today.requests} requests`
        : "Loading...",
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
      text:
        criticalCount > 0
          ? `${criticalCount} critical`
          : "All clear",
      type:
        unresolvedAlerts.length > 0
          ? ("negative" as const)
          : ("positive" as const),
    };
  }, [unresolvedAlerts]);

  const firstAgentId = agents?.[0]?._id;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of your agents, costs, and alerts
        </p>
      </div>

      {/* Alert banner */}
      {unresolvedAlerts.length > 0 && <AlertBanner alerts={unresolvedAlerts} />}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cost Today"
          value={costTodayFormatted}
          change={todayRequests}
          icon={<DollarSign className="w-5 h-5 text-keel-400" />}
        />
        <StatCard
          label="Tokens (24h)"
          value={totalTokens}
          change={tokenBreakdown}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Active Agents"
          value={activeAgentCount}
          change={offlineAgentInfo.text}
          changeType={offlineAgentInfo.type}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Active Alerts"
          value={unresolvedAlerts.length.toString()}
          change={alertInfo.text}
          changeType={alertInfo.type}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost chart - takes 2 cols */}
        <div className="lg:col-span-2">
          <Card title="Cost Over Time" subtitle="Last 24 hours, hourly buckets">
            <CostChart data={costTimeSeries ?? []} />
          </Card>
        </div>

        {/* Activity feed */}
        <div>
          <Card title="Recent Activity" subtitle="Latest agent actions">
            <MiniActivityFeed activities={recentActivities ?? []} />
          </Card>
        </div>
      </div>

      {/* Snitch scores per agent */}
      {agents && agents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SnitchLeaderboard />
          {firstAgentId && <SnitchScore agentId={firstAgentId} />}
        </div>
      )}

      {/* Agent cards */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-4">Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent) => (
            <AgentStatusCard key={agent._id} agentId={agent._id} />
          ))}
          {agents?.length === 0 && (
            <Card className="col-span-full">
              <div className="text-center py-8 text-zinc-500">
                <p className="text-lg font-medium">No agents connected</p>
                <p className="text-sm mt-1">
                  Connect your Clawdbot gateway to start monitoring
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
