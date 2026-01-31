import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, StatCard } from "@/components/Card";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { AlertBanner } from "@/components/AlertBanner";
import { MiniActivityFeed } from "@/components/MiniActivityFeed";
import { CostChart } from "@/components/CostChart";
import { SnitchLeaderboard, SnitchScore } from "@/components/SnitchScore";
import {
  DollarSign,
  Zap,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { formatCost, formatTokens } from "@/lib/utils";

export function Dashboard() {
  const agents = useQuery(api.agents.list);
  const costSummary = useQuery(api.costs.summary, {});
  const recentAlerts = useQuery(api.alerting.listAlerts, { limit: 5 });
  const recentActivities = useQuery(api.activities.recent, { limit: 10 });
  const costTimeSeries = useQuery(api.costs.timeSeries, { hours: 24 });

  const unresolvedAlerts = recentAlerts?.filter((a) => !a.resolvedAt) ?? [];

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
      {unresolvedAlerts.length > 0 && (
        <AlertBanner alerts={unresolvedAlerts} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cost Today"
          value={formatCost(costSummary?.today.cost ?? 0)}
          change={costSummary ? `${costSummary.today.requests} requests` : "Loading..."}
          icon={<DollarSign className="w-5 h-5 text-keel-400" />}
        />
        <StatCard
          label="Tokens (24h)"
          value={formatTokens(
            (costSummary?.today.inputTokens ?? 0) + (costSummary?.today.outputTokens ?? 0)
          )}
          change={`In: ${formatTokens(costSummary?.today.inputTokens ?? 0)} / Out: ${formatTokens(costSummary?.today.outputTokens ?? 0)}`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Active Agents"
          value={`${agents?.filter((a) => a.status === "online").length ?? 0} / ${agents?.length ?? 0}`}
          change={agents ? `${agents.filter((a) => a.status === "offline").length} offline` : "Loading..."}
          changeType={agents?.some((a) => a.status === "offline") ? "negative" : "positive"}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Active Alerts"
          value={unresolvedAlerts.length.toString()}
          change={
            unresolvedAlerts.filter((a) => a.severity === "critical").length > 0
              ? `${unresolvedAlerts.filter((a) => a.severity === "critical").length} critical`
              : "All clear"
          }
          changeType={unresolvedAlerts.length > 0 ? "negative" : "positive"}
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
          {agents[0] && <SnitchScore agentId={agents[0]._id} />}
        </div>
      )}

      {/* Snitch Leaderboard */}
      <SnitchLeaderboard />

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
                <p className="text-sm mt-1">Connect your Clawdbot gateway to start monitoring</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
