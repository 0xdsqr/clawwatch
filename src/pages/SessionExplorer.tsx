import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, StatCard } from "@/components/Card";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Hash,
  MessageSquare,
  Zap,
  Trophy,
  Timer,
} from "lucide-react";
import { formatCost, formatTokens, timeAgo } from "@/lib/utils";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StatusFilter = "all" | "active" | "ended";

function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Session Detail View ───────────────────────────────────────────

function SessionDetail({
  sessionKey,
  onBack,
}: {
  sessionKey: string;
  onBack: () => void;
}) {
  const detail = useQuery(api.sessions.detail, { sessionKey });

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        {detail === null ? "Session not found" : "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-100">
            {detail.displayName ?? detail.sessionKey}
          </h3>
          <p className="text-xs text-zinc-500">
            {detail.agentName} · {detail.kind} · {detail.channel ?? "unknown"}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            detail.isActive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/20"
          }`}
        >
          {detail.isActive ? "Active" : "Ended"}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Duration"
          value={formatDuration(detail.duration)}
          change={`${formatTime(detail.startedAt)}${detail.isActive ? " → now" : ` → ${formatTime(detail.lastActivity)}`}`}
          icon={<Clock className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          label="Cost"
          value={formatCost(detail.estimatedCost)}
          change={`${detail.costRecords} cost records`}
          icon={<DollarSign className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label="Tokens"
          value={formatTokens(detail.totalTokens)}
          change={`In: ${formatTokens(detail.inputTokens)} / Out: ${formatTokens(detail.outputTokens)}`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Messages"
          value={String(detail.messages)}
          change={`${detail.toolCalls} tool calls · ${detail.errors} errors`}
          icon={<MessageSquare className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Cost/Token Timeline */}
      {detail.costTimeline.length > 0 && (
        <Card title="Cost & Token Timeline" subtitle="5-minute buckets">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={detail.costTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) =>
                  new Date(v).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
              />
              <YAxis
                yAxisId="cost"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) => `$${v.toFixed(3)}`}
              />
              <YAxis
                yAxisId="tokens"
                orientation="right"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) => formatTokens(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "0.5rem",
                  fontSize: 12,
                }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
                formatter={(value: any, name: any) => [
                  name === "cost"
                    ? formatCost(value as number)
                    : formatTokens(value as number),
                  name === "cost" ? "Cost" : "Tokens",
                ]}
              />
              <Area
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                yAxisId="tokens"
                type="monotone"
                dataKey="tokens"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.08}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ─── Top N Table ───────────────────────────────────────────────────

function TopNTable({
  title,
  icon,
  items,
  valueKey,
  formatValue,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{
    sessionKey: string;
    agentName: string;
    [key: string]: any;
  }>;
  valueKey: string;
  formatValue: (v: any) => string;
  onSelect: (key: string) => void;
}) {
  if (!items.length) return null;

  return (
    <Card
      title={title}
      subtitle="Top 10"
      action={icon}
    >
      <div className="space-y-1.5">
        {items.slice(0, 10).map((item, i) => (
          <button
            key={item.sessionKey}
            onClick={() => onSelect(item.sessionKey)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-zinc-800/50 transition-colors group"
          >
            <span className="text-xs font-mono text-zinc-600 w-5">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate group-hover:text-purple-300 transition-colors">
                {item.sessionKey}
              </p>
              <p className="text-xs text-zinc-500">{item.agentName}</p>
            </div>
            <span className="text-sm font-mono text-zinc-300">
              {formatValue(item[valueKey])}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Session Explorer ─────────────────────────────────────────

export function SessionExplorer() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [cursor, setCursor] = useState<number | undefined>(undefined);

  const agents = useQuery(api.agents.list, { limit: 100 });

  const agentId = useMemo(() => {
    if (agentFilter === "all" || !agents) return undefined;
    const agent = agents.find((a) => a.name === agentFilter);
    return agent?._id;
  }, [agentFilter, agents]);

  const listArgs = useMemo(
    () => ({
      agentId: agentId as Id<"agents"> | undefined,
      isActive:
        statusFilter === "all"
          ? undefined
          : statusFilter === "active",
      limit: 30,
      cursor,
    }),
    [agentId, statusFilter, cursor],
  );

  const sessionsResult = useQuery(api.sessions.list, listArgs);
  const stats = useQuery(api.sessions.stats, {});

  const agentNames = useMemo(
    () => agents?.map((a) => a.name).sort() ?? [],
    [agents],
  );

  const handleLoadMore = useCallback(() => {
    if (sessionsResult?.nextCursor) {
      setCursor(sessionsResult.nextCursor);
    }
  }, [sessionsResult?.nextCursor]);

  const handleSelectSession = useCallback((key: string) => {
    setSelectedSession(key);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSession(null);
  }, []);

  // If a session is selected, show detail view
  if (selectedSession) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <SessionDetail sessionKey={selectedSession} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Sessions</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Explore agent sessions — cost, duration, and activity
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={String(stats?.totalSessions ?? 0)}
          change={`${stats?.activeSessions ?? 0} active`}
          icon={<Hash className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label="Total Cost"
          value={formatCost(stats?.totalCost ?? 0)}
          change={`Avg ${formatCost(stats?.avgCostPerSession ?? 0)}/session`}
          icon={<DollarSign className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label="Total Tokens"
          value={formatTokens(stats?.totalTokens ?? 0)}
          change={`${stats?.totalSessions ?? 0} sessions`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Active Now"
          value={String(stats?.activeSessions ?? 0)}
          changeType={
            (stats?.activeSessions ?? 0) > 0 ? "positive" : "neutral"
          }
          change={
            (stats?.activeSessions ?? 0) > 0 ? "Sessions running" : "No active sessions"
          }
          icon={<Timer className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Cost Distribution Histogram */}
      {stats?.costDistribution && stats.costDistribution.length > 0 && (
        <Card
          title="Session Cost Distribution"
          subtitle="Number of sessions by cost range"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.costDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="range"
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
              />
              <YAxis
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "0.5rem",
                  fontSize: 12,
                }}
                formatter={(value: any) => [`${value} sessions`, "Count"]}
              />
              <Bar
                dataKey="count"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top N Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopNTable
          title="Most Expensive"
          icon={<Trophy className="w-4 h-4 text-amber-400" />}
          items={stats?.topByCost ?? []}
          valueKey="estimatedCost"
          formatValue={(v) => formatCost(v)}
          onSelect={handleSelectSession}
        />
        <TopNTable
          title="Longest Sessions"
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          items={stats?.topByDuration ?? []}
          valueKey="duration"
          formatValue={(v) => formatDuration(v)}
          onSelect={handleSelectSession}
        />
        <TopNTable
          title="Most Tokens"
          icon={<Zap className="w-4 h-4 text-purple-400" />}
          items={stats?.topByTokens ?? []}
          valueKey="totalTokens"
          formatValue={(v) => formatTokens(v)}
          onSelect={handleSelectSession}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {/* Status filter */}
          <div className="flex bg-zinc-800/50 rounded-lg p-0.5">
            {(["all", "active", "ended"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setCursor(undefined);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setCursor(undefined);
            }}
            className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All agents</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Session List */}
      <Card title="Sessions" subtitle={`${sessionsResult?.items.length ?? 0} shown`}>
        {!sessionsResult ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
            Loading sessions...
          </div>
        ) : sessionsResult.items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
            No sessions found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                    <th className="pb-3 font-medium">Session</th>
                    <th className="pb-3 font-medium">Agent</th>
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Duration</th>
                    <th className="pb-3 font-medium text-right">Tokens</th>
                    <th className="pb-3 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsResult.items.map((session) => (
                    <tr
                      key={session._id}
                      onClick={() => handleSelectSession(session.sessionKey)}
                      className="border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-zinc-200 font-mono text-xs truncate max-w-[200px] hover:text-purple-300 transition-colors">
                            {session.displayName ?? session.sessionKey}
                          </p>
                          <p className="text-zinc-600 text-xs mt-0.5">
                            {timeAgo(session.startedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">
                        {session.agentName}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {session.channel ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-700/30 text-zinc-500"
                          }`}
                        >
                          {session.isActive ? "Active" : "Ended"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-zinc-300 font-mono text-xs">
                        {formatDuration(session.duration)}
                      </td>
                      <td className="py-3 pr-4 text-right text-zinc-300 font-mono text-xs">
                        {formatTokens(session.totalTokens)}
                      </td>
                      <td className="py-3 text-right text-zinc-300 font-mono text-xs">
                        {formatCost(session.estimatedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sessionsResult.hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
