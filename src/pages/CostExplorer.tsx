import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, StatCard } from "@/components/Card";
import { CostChart } from "@/components/CostChart";
import { ProviderCostChart } from "@/components/ProviderCostChart";
import { ProviderBreakdown } from "@/components/ProviderBreakdown";
import { CostTable } from "@/components/CostTable";
import { DollarSign, TrendingUp, Zap, Clock } from "lucide-react";
import { formatCost, formatTokens } from "@/lib/utils";

type Period = "24h" | "7d" | "14d" | "30d";
const PERIOD_MS: Record<Period, number> = {
  "24h": 86_400_000,
  "7d": 604_800_000,
  "14d": 1_209_600_000,
  "30d": 2_592_000_000,
};
const BUCKET_MS: Record<Period, number> = {
  "24h": 3_600_000,     // hourly
  "7d": 21_600_000,     // 6-hourly
  "14d": 86_400_000,    // daily
  "30d": 86_400_000,    // daily
};

export function CostExplorer() {
  const [period, setPeriod] = useState<Period>("7d");
  // Stabilize sinceMs so Convex queries don't re-subscribe every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sinceMs = useMemo(() => Date.now() - PERIOD_MS[period], [period]);

  const summary = useQuery(api.costs.summary, {});
  const timeSeries24h = useQuery(api.costs.timeSeries, { hours: 24 });
  const timeSeries7d = useQuery(api.costs.timeSeries, { hours: 168 });
  const budgets = useQuery(api.budgets.list);

  // New analytics queries
  const analyticsSummary = useQuery(api.costAnalytics.summary, { periodMs: PERIOD_MS[period] });
  const providerBreakdown = useQuery(api.costAnalytics.byProvider, { sinceMs });
  const costByProvider = useQuery(api.costAnalytics.costOverTimeByProvider, {
    sinceMs,
    bucketMs: BUCKET_MS[period],
  });
  const tokensByModel = useQuery(api.costAnalytics.tokensOverTimeByModel, {
    sinceMs,
    bucketMs: BUCKET_MS[period],
  });
  const costTable = useQuery(api.costAnalytics.table, { sinceMs, limit: 200 });

  // Memoize formatted stat values
  const lastHourCost = useMemo(
    () => formatCost(summary?.lastHour.cost ?? 0),
    [summary?.lastHour.cost],
  );
  const lastHourRequests = useMemo(
    () => `${summary?.lastHour.requests ?? 0} requests`,
    [summary?.lastHour.requests],
  );

  // Memoize budget rendering data
  const budgetItems = useMemo(
    () =>
      budgets?.map((budget) => {
        const pct =
          budget.limitDollars > 0
            ? Math.min(
                100,
                (budget.currentSpend / budget.limitDollars) * 100,
              )
            : 0;
        return {
          ...budget,
          pct,
          isOver: pct >= 100,
          isWarning: pct >= 80,
          formattedSpend: formatCost(budget.currentSpend),
          formattedLimit: formatCost(budget.limitDollars),
        };
      }) ?? [],
    [budgets],
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Cost Explorer</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Track spending across all your agents and providers
          </p>
        </div>
        <div className="flex gap-2">
          {/* Period pills */}
          <div className="flex bg-zinc-800/50 rounded-lg p-0.5">
            {(["24h", "7d", "14d", "30d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats with period comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Last Hour"
          value={lastHourCost}
          change={lastHourRequests}
          icon={<Clock className="w-5 h-5 text-zinc-400" />}
        />
        <StatCard
          label={`Cost (${period})`}
          value={formatCost(analyticsSummary?.currentCost ?? 0)}
          change={
            analyticsSummary?.costChangePercent
              ? `${analyticsSummary.costChangePercent > 0 ? "+" : ""}${analyticsSummary.costChangePercent}% vs prev`
              : `${analyticsSummary?.requestCount ?? 0} requests`
          }
          changeType={
            analyticsSummary?.costChangePercent && analyticsSummary.costChangePercent > 20
              ? "negative"
              : analyticsSummary?.costChangePercent && analyticsSummary.costChangePercent < -10
                ? "positive"
                : "neutral"
          }
          icon={<DollarSign className="w-5 h-5 text-keel-400" />}
        />
        <StatCard
          label={`Tokens (${period})`}
          value={formatTokens(analyticsSummary?.currentTokens ?? 0)}
          change={`In: ${formatTokens(analyticsSummary?.inputTokens ?? 0)} / Out: ${formatTokens(analyticsSummary?.outputTokens ?? 0)}`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Avg Cost/Request"
          value={formatCost(analyticsSummary?.avgCostPerRequest ?? 0)}
          change={`${analyticsSummary?.requestCount ?? 0} total requests`}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
        />
      </div>

      {/* Stacked cost by provider */}
      <Card
        title="Cost by Provider"
        subtitle={`${period} · Stacked area chart`}
      >
        {costByProvider && costByProvider.providers.length > 0 ? (
          <ProviderCostChart
            buckets={costByProvider.buckets}
            providers={costByProvider.providers}
            metric="cost"
            height={320}
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
            {costByProvider ? "No cost data for this period" : "Loading..."}
          </div>
        )}
      </Card>

      {/* Two-column: token chart + provider breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Tokens by Model"
          subtitle={`${period} · Stacked by model`}
        >
          {tokensByModel && tokensByModel.models.length > 0 ? (
            <ProviderCostChart
              buckets={tokensByModel.buckets}
              providers={tokensByModel.models}
              metric="total"
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
              {tokensByModel ? "No token data for this period" : "Loading..."}
            </div>
          )}
        </Card>

        <Card
          title="Provider Breakdown"
          subtitle="Cost, tokens, cache hit rate per provider"
        >
          <ProviderBreakdown providers={providerBreakdown ?? []} />
        </Card>
      </div>

      {/* Legacy 24h/7d charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Cost — Last 24 Hours" subtitle="Hourly breakdown">
          <CostChart data={timeSeries24h ?? []} />
        </Card>
        <Card title="Cost — Last 7 Days" subtitle="Hourly breakdown">
          <CostChart data={timeSeries7d ?? []} />
        </Card>
      </div>

      {/* Table view */}
      {costTable && costTable.length > 0 && (
        <Card title="Recent Cost Records" subtitle={`${period} · Sortable table`}>
          <CostTable records={costTable} maxRows={100} />
        </Card>
      )}

      {/* Budgets */}
      <Card title="Budgets" subtitle="Spending limits and thresholds">
        {budgetItems.length > 0 ? (
          <div className="space-y-3">
            {budgetItems.map((budget) => (
              <div
                key={budget._id}
                className="border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-zinc-200">
                      {budget.name}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {budget.period} ·{" "}
                      {budget.hardStop ? "Hard stop" : "Alert only"}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-zinc-300">
                    {budget.formattedSpend} / {budget.formattedLimit}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.isOver
                        ? "bg-red-500"
                        : budget.isWarning
                          ? "bg-amber-500"
                          : "bg-keel-500"
                    }`}
                    style={{ width: `${budget.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600">
            <p className="text-sm">No budgets configured</p>
            <p className="text-xs mt-1">Set up spending limits in Settings</p>
          </div>
        )}
      </Card>
    </div>
  );
}
