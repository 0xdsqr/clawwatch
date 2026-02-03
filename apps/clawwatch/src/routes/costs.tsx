import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Clock, DollarSign, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { CostByModelChart } from "@/components/cost-by-model-chart";
import { ModelCostBreakdown } from "@/components/model-cost-breakdown";
import { TokenUsageByModel } from "@/components/token-usage-by-model";
import { DailyCostTrend } from "@/components/daily-cost-trend";
import { StatCard } from "@/components/stat-card";
import { TimeRangeSelector, type TimeRange } from "@/components/time-range-selector";
import { formatCost, formatTokens } from "@/lib/utils";

export const Route = createFileRoute("/costs")({
  component: CostExplorer,
});

function CostExplorer() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  
  const summary = useQuery(api.costs.summary, {});
  const budgets = useQuery(api.budgets.list);

  // Memoize time range arguments to prevent infinite re-renders
  const timeRangeArgs = useMemo(() => {
    const now = new Date();
    const roundedTime = new Date(Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000));
    
    switch (timeRange) {
      case "24h":
        return {
          startTime: new Date(roundedTime.getTime() - 24 * 60 * 60 * 1000).getTime(),
          endTime: roundedTime.getTime(),
        };
      case "7d":
        return {
          startTime: new Date(roundedTime.getTime() - 7 * 24 * 60 * 60 * 1000).getTime(),
          endTime: roundedTime.getTime(),
        };
      case "30d":
        return {
          startTime: new Date(roundedTime.getTime() - 30 * 24 * 60 * 60 * 1000).getTime(),
          endTime: roundedTime.getTime(),
        };
      default:
        return {
          startTime: new Date(roundedTime.getTime() - 24 * 60 * 60 * 1000).getTime(),
          endTime: roundedTime.getTime(),
        };
    }
  }, [timeRange]);

  const costData = useQuery(api.costs.byTimeRange, timeRangeArgs);

  // Daily cost trend for 30 days
  const dailyCostArgs = useMemo(() => {
    const now = new Date();
    const roundedTime = new Date(Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000));
    return {
      startTime: new Date(roundedTime.getTime() - 30 * 24 * 60 * 60 * 1000).getTime(),
      endTime: roundedTime.getTime(),
    };
  }, []);

  const dailyCostData = useQuery(api.costs.byTimeRange, dailyCostArgs);

  // Process data for charts
  const modelBreakdownData = useMemo(() => {
    if (!costData) return [];
    
    const modelTotals = costData.reduce((acc, record) => {
      acc[record.model] = (acc[record.model] || 0) + record.cost;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(modelTotals).reduce((sum, cost) => sum + cost, 0);
    
    return Object.entries(modelTotals).map(([model, cost]) => ({
      model,
      cost,
      percentage: total > 0 ? (cost / total) * 100 : 0,
    })).sort((a, b) => b.cost - a.cost);
  }, [costData]);

  const tokenUsageData = useMemo(() => {
    if (!costData) return [];
    
    const modelTokens = costData.reduce((acc, record) => {
      if (!acc[record.model]) {
        acc[record.model] = { inputTokens: 0, outputTokens: 0 };
      }
      acc[record.model].inputTokens += record.inputTokens || 0;
      acc[record.model].outputTokens += record.outputTokens || 0;
      return acc;
    }, {} as Record<string, { inputTokens: number; outputTokens: number }>);

    return Object.entries(modelTokens).map(([model, tokens]) => ({
      model,
      ...tokens,
    })).sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens));
  }, [costData]);

  const costByModelTimeSeriesData = useMemo(() => {
    if (!costData) return [];
    
    return costData.map(record => ({
      timestamp: record.timestamp || Date.now(),
      cost: record.cost,
      model: record.model,
    }));
  }, [costData]);

  const dailyTrendData = useMemo(() => {
    if (!dailyCostData) return [];
    
    const dailyTotals = dailyCostData.reduce((acc, record) => {
      const date = new Date(record.timestamp || Date.now());
      const dateKey = date.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + record.cost;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyCostData]);

  const tokenEfficiencyData = useMemo(() => {
    if (!costData) return [];
    
    const modelStats = costData.reduce((acc, record) => {
      if (!acc[record.model]) {
        acc[record.model] = { cost: 0, tokens: 0 };
      }
      acc[record.model].cost += record.cost;
      acc[record.model].tokens += (record.inputTokens || 0) + (record.outputTokens || 0);
      return acc;
    }, {} as Record<string, { cost: number; tokens: number }>);

    return Object.entries(modelStats).map(([model, stats]) => ({
      model,
      costPer1K: stats.tokens > 0 ? (stats.cost / stats.tokens) * 1000 : 0,
    })).sort((a, b) => a.costPer1K - b.costPer1K);
  }, [costData]);

  // Summary stats calculations
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

  const budgetItems = useMemo(
    () =>
      budgets?.map((budget) => {
        const pct =
          budget.limitDollars > 0
            ? Math.min(100, (budget.currentSpend / budget.limitDollars) * 100)
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Row 1: Summary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Last Hour"
          value={lastHourCost}
          change={lastHourRequests}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Today"
          value={todayCost}
          change={todayTokens}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="This Week"
          value={weekCost}
          change={weekRequests}
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
        />
        <StatCard
          label="This Month"
          value={monthCost}
          change={monthTokens}
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Row 2: Cost Over Time with Model Breakdown (full width) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cost Over Time by Model</CardTitle>
            <CardDescription>Stacked breakdown showing cost contribution per model</CardDescription>
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </CardHeader>
        <CardContent>
          <CostByModelChart data={costByModelTimeSeriesData} />
        </CardContent>
      </Card>

      {/* Row 3: Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
            <CardDescription>Spending breakdown by model type</CardDescription>
          </CardHeader>
          <CardContent>
            <ModelCostBreakdown data={modelBreakdownData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Usage by Model</CardTitle>
            <CardDescription>Input and output token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenUsageByModel data={tokenUsageData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Cost Trend</CardTitle>
            <CardDescription>Cost per day over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyCostTrend data={dailyTrendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Efficiency</CardTitle>
            <CardDescription>Cost per 1K tokens by model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tokenEfficiencyData.map((item) => (
                <div key={item.model} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.model}</span>
                  <span className="font-mono text-sm">
                    {formatCost(item.costPer1K)}/1K tokens
                  </span>
                </div>
              ))}
              {tokenEfficiencyData.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Spending limits and thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetItems.length > 0 ? (
            <div className="space-y-3">
              {budgetItems.map((budget) => (
                <div key={budget._id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{budget.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {budget.period} ·{" "}
                        {budget.hardStop ? "Hard stop" : "Alert only"}
                      </span>
                    </div>
                    <span className="font-mono text-sm">
                      {budget.formattedSpend} / {budget.formattedLimit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        budget.isOver
                          ? "bg-red-500"
                          : budget.isWarning
                            ? "bg-amber-500"
                            : "bg-primary",
                      )}
                      style={{ width: `${budget.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No budgets configured</p>
              <p className="mt-1 text-xs">Set up spending limits in Settings</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
