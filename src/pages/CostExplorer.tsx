import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, StatCard } from "@/components/Card";
import { CostChart } from "@/components/CostChart";
import { DollarSign, TrendingUp, Zap, Clock } from "lucide-react";
import { formatCost, formatTokens } from "@/lib/utils";

export function CostExplorer() {
  const summary = useQuery(api.costs.summary, {});
  const timeSeries24h = useQuery(api.costs.timeSeries, { hours: 24 });
  const timeSeries7d = useQuery(api.costs.timeSeries, { hours: 168 });
  const budgets = useQuery(api.budgets.list);

  // Memoize formatted stat values
  const lastHourCost = useMemo(
    () => formatCost(summary?.lastHour.cost ?? 0),
    [summary?.lastHour.cost],
  );
  const lastHourRequests = useMemo(
    () => `${summary?.lastHour.requests ?? 0} requests`,
    [summary?.lastHour.requests],
  );

  const todayCost = useMemo(
    () => formatCost(summary?.today.cost ?? 0),
    [summary?.today.cost],
  );
  const todayTokens = useMemo(
    () =>
      `${formatTokens((summary?.today.inputTokens ?? 0) + (summary?.today.outputTokens ?? 0))} tokens`,
    [summary?.today.inputTokens, summary?.today.outputTokens],
  );

  const weekCost = useMemo(
    () => formatCost(summary?.week.cost ?? 0),
    [summary?.week.cost],
  );
  const weekRequests = useMemo(
    () => `${summary?.week.requests ?? 0} requests`,
    [summary?.week.requests],
  );

  const monthCost = useMemo(
    () => formatCost(summary?.month.cost ?? 0),
    [summary?.month.cost],
  );
  const monthTokens = useMemo(
    () =>
      `${formatTokens((summary?.month.inputTokens ?? 0) + (summary?.month.outputTokens ?? 0))} tokens`,
    [summary?.month.inputTokens, summary?.month.outputTokens],
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
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Cost Explorer</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Track spending across all your agents
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Last Hour"
          value={lastHourCost}
          change={lastHourRequests}
          icon={<Clock className="w-5 h-5 text-zinc-400" />}
        />
        <StatCard
          label="Today"
          value={todayCost}
          change={todayTokens}
          icon={<DollarSign className="w-5 h-5 text-keel-400" />}
        />
        <StatCard
          label="This Week"
          value={weekCost}
          change={weekRequests}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          label="This Month"
          value={monthCost}
          change={monthTokens}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Charts */}
      <Card title="Cost — Last 24 Hours" subtitle="Hourly breakdown">
        <CostChart data={timeSeries24h ?? []} />
      </Card>

      <Card title="Cost — Last 7 Days" subtitle="Hourly breakdown">
        <CostChart data={timeSeries7d ?? []} />
      </Card>

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
