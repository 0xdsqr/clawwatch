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
import { Activity, DollarSign, Hash, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CachePerformance } from "@/components/cache-performance";
import { CostByAgentChart } from "@/components/cost-by-agent-chart";
import { CostByModelChart } from "@/components/cost-by-model-chart";
import { DailyCostTrend } from "@/components/daily-cost-trend";
import { ModelComparisonTable } from "@/components/model-comparison-table";
import { MonitoringFilters } from "@/components/monitoring-filters";
import { StatCard } from "@/components/stat-card";
import type { TimeRange } from "@/components/time-range-selector";
import { TokenDistributionChart } from "@/components/token-distribution-chart";
import { TopSessionsTable } from "@/components/top-sessions-table";
import { formatCost, formatTokens } from "@/lib/utils";
import type { Budget, CostRecord } from "@/types";

interface AgentCostSummary {
  agentId: string;
  agentName: string;
  cost: number;
  tokens: number;
  requests: number;
}

interface ModelBreakdownEntry {
  model: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  requests: number;
  avgCostPerRequest: number;
  costPer1KTokens: number;
}

export const Route = createFileRoute("/monitoring")({
  component: MonitoringPage,
});

function MonitoringPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const budgets = useQuery(api.budgets.list);

  // Memoize time range arguments to prevent infinite re-renders
  const timeRangeArgs = useMemo(() => {
    const now = new Date();
    const roundedTime = new Date(
      Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000),
    );

    switch (timeRange) {
      case "24h":
        return {
          startTime: new Date(
            roundedTime.getTime() - 24 * 60 * 60 * 1000,
          ).getTime(),
          endTime: roundedTime.getTime(),
        };
      case "7d":
        return {
          startTime: new Date(
            roundedTime.getTime() - 7 * 24 * 60 * 60 * 1000,
          ).getTime(),
          endTime: roundedTime.getTime(),
        };
      case "30d":
        return {
          startTime: new Date(
            roundedTime.getTime() - 30 * 24 * 60 * 60 * 1000,
          ).getTime(),
          endTime: roundedTime.getTime(),
        };
      default:
        return {
          startTime: new Date(
            roundedTime.getTime() - 24 * 60 * 60 * 1000,
          ).getTime(),
          endTime: roundedTime.getTime(),
        };
    }
  }, [timeRange]);

  const costData = useQuery(api.costs.byTimeRange, timeRangeArgs);
  const agentCostData = useQuery(api.costs.byAgent, timeRangeArgs);
  const modelBreakdownData = useQuery(api.costs.modelBreakdown, timeRangeArgs);
  const topSessionsData = useQuery(api.costs.topSessions, {
    ...timeRangeArgs,
    limit: 10,
  });

  // Daily cost trend for 30 days
  const dailyCostArgs = useMemo(() => {
    const now = new Date();
    const roundedTime = new Date(
      Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000),
    );
    return {
      startTime: new Date(
        roundedTime.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).getTime(),
      endTime: roundedTime.getTime(),
    };
  }, []);

  const dailyCostData = useQuery(api.costs.byTimeRange, dailyCostArgs);

  // Available models and agents for filters
  const availableModels = useMemo(() => {
    if (!costData) return [];
    const modelSet = new Set<string>(costData.map((r: CostRecord) => r.model));
    return Array.from(modelSet).sort();
  }, [costData]);

  const availableAgents = useMemo(() => {
    if (!agentCostData) return [];
    return agentCostData.map((a: AgentCostSummary) => ({
      id: a.agentId,
      name: a.agentName,
    }));
  }, [agentCostData]);

  // Filter cost data
  const filteredCostData = useMemo(() => {
    if (!costData) return [];
    return costData.filter((r: CostRecord) => {
      if (selectedModels.length > 0 && !selectedModels.includes(r.model))
        return false;
      if (selectedAgents.length > 0 && !selectedAgents.includes(r.agentId))
        return false;
      return true;
    });
  }, [costData, selectedModels, selectedAgents]);

  // Process data for cost over time by model chart
  const costByModelTimeSeriesData = useMemo(() => {
    return filteredCostData.map((record: CostRecord) => ({
      timestamp: record.timestamp || Date.now(),
      cost: record.cost,
      model: record.model,
    }));
  }, [filteredCostData]);

  // Daily trend data
  const dailyTrendData = useMemo(() => {
    if (!dailyCostData) return [];
    const dailyTotals: Record<string, number> = {};
    for (const record of dailyCostData) {
      const date = new Date(record.timestamp || Date.now());
      const dateKey = date.toISOString().slice(0, 10);
      dailyTotals[dateKey] = (dailyTotals[dateKey] ?? 0) + record.cost;
    }

    return Object.entries(dailyTotals)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyCostData]);

  // Cache performance data
  const cacheData = useMemo(() => {
    if (!modelBreakdownData) {
      return {
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalInputTokens: 0,
        estimatedSavings: 0,
      };
    }
    const totals = modelBreakdownData.reduce(
      (
        acc: {
          cacheReadTokens: number;
          cacheWriteTokens: number;
          totalInputTokens: number;
        },
        m: ModelBreakdownEntry,
      ) => {
        acc.cacheReadTokens += m.cacheReadTokens;
        acc.cacheWriteTokens += m.cacheWriteTokens;
        acc.totalInputTokens += m.inputTokens;
        return acc;
      },
      { cacheReadTokens: 0, cacheWriteTokens: 0, totalInputTokens: 0 },
    );

    // Estimate savings: cache read tokens cost ~90% less than normal input
    const estimatedSavings = totals.cacheReadTokens * 0.000003 * 0.9; // rough estimate

    return { ...totals, estimatedSavings };
  }, [modelBreakdownData]);

  // Token distribution data
  const tokenDistributionData = useMemo(() => {
    if (!modelBreakdownData) {
      return {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      };
    }
    return modelBreakdownData.reduce(
      (
        acc: {
          inputTokens: number;
          outputTokens: number;
          cacheReadTokens: number;
          cacheWriteTokens: number;
        },
        m: ModelBreakdownEntry,
      ) => {
        acc.inputTokens += m.inputTokens;
        acc.outputTokens += m.outputTokens;
        acc.cacheReadTokens += m.cacheReadTokens;
        acc.cacheWriteTokens += m.cacheWriteTokens;
        return acc;
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    );
  }, [modelBreakdownData]);

  // Summary stat calculations
  const periodCost = useMemo(() => {
    const total = filteredCostData.reduce(
      (sum: number, r: CostRecord) => sum + r.cost,
      0,
    );
    return formatCost(total);
  }, [filteredCostData]);

  const periodTokens = useMemo(() => {
    const total = filteredCostData.reduce(
      (sum: number, r: CostRecord) => sum + r.inputTokens + r.outputTokens,
      0,
    );
    return formatTokens(total);
  }, [filteredCostData]);

  const periodRequests = useMemo(() => {
    return filteredCostData.length.toString();
  }, [filteredCostData]);

  const projectedMonthlyCost = useMemo(() => {
    if (!filteredCostData.length) return "$0.00";
    const total = filteredCostData.reduce(
      (sum: number, r: CostRecord) => sum + r.cost,
      0,
    );

    // Calculate time span of data
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const hoursInMonth = 730;
    const projected = (total / hours) * hoursInMonth;
    return formatCost(projected);
  }, [filteredCostData, timeRange]);

  // Sparkline data from time series
  const costSparkline = useMemo(() => {
    if (!filteredCostData.length) return [];
    // Bucket into chunks for sparkline
    const sorted = [...filteredCostData].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );
    const bucketSize = Math.max(1, Math.floor(sorted.length / 20));
    const sparkline: { value: number }[] = [];
    for (let i = 0; i < sorted.length; i += bucketSize) {
      const slice = sorted.slice(i, i + bucketSize);
      const value = slice.reduce((sum, r) => sum + r.cost, 0);
      sparkline.push({ value });
    }
    return sparkline;
  }, [filteredCostData]);

  const tokenSparkline = useMemo(() => {
    if (!filteredCostData.length) return [];
    const sorted = [...filteredCostData].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );
    const bucketSize = Math.max(1, Math.floor(sorted.length / 20));
    const sparkline: { value: number }[] = [];
    for (let i = 0; i < sorted.length; i += bucketSize) {
      const slice = sorted.slice(i, i + bucketSize);
      const value = slice.reduce(
        (sum, r) => sum + r.inputTokens + r.outputTokens,
        0,
      );
      sparkline.push({ value });
    }
    return sparkline;
  }, [filteredCostData]);

  const budgetItems = useMemo(
    () =>
      budgets?.map((budget: Budget) => {
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
    <div className="flex flex-1 flex-col gap-5 p-5">
      {/* Top: Filter bar */}
      <Card className="border-border/50 animate-fade-in">
        <CardContent className="py-3">
          <MonitoringFilters
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedModels={selectedModels}
            onModelsChange={setSelectedModels}
            availableModels={availableModels}
            selectedAgents={selectedAgents}
            onAgentsChange={setSelectedAgents}
            availableAgents={availableAgents}
          />
        </CardContent>
      </Card>

      {/* Row 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Cost"
          value={periodCost}
          change={`${timeRange} period`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          sparkline={costSparkline}
        />
        <StatCard
          label="Total Tokens"
          value={periodTokens}
          change={`${periodRequests} requests`}
          icon={<Hash className="h-5 w-5 text-blue-400" />}
          sparkline={tokenSparkline}
        />
        <StatCard
          label="Requests"
          value={periodRequests}
          change={`${timeRange} period`}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Projected Monthly"
          value={projectedMonthlyCost}
          change="Based on current burn rate"
          icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Row 2: Main Chart (full width) */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Over Time by Model</CardTitle>
          <CardDescription>
            Stacked breakdown showing cost contribution per model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CostByModelChart data={costByModelTimeSeriesData} />
        </CardContent>
      </Card>

      {/* Row 3: Two-column — Cost by Agent + Model Comparison */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Agent</CardTitle>
            <CardDescription>Which agents are costing the most</CardDescription>
          </CardHeader>
          <CardContent>
            {agentCostData && agentCostData.length > 0 ? (
              <CostByAgentChart data={agentCostData} />
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p className="text-sm">No agent data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
            <CardDescription>Sortable breakdown by model</CardDescription>
          </CardHeader>
          <CardContent>
            <ModelComparisonTable data={modelBreakdownData ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Two-column — Daily Cost Trend + Cache Performance */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Cost Trend</CardTitle>
            <CardDescription>
              Cost per day over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyCostTrend data={dailyTrendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>
              Cache utilization and estimated savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CachePerformance data={cacheData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Two-column — Token Distribution + Top Sessions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Token Distribution</CardTitle>
            <CardDescription>
              Input vs output vs cache token usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TokenDistributionChart data={tokenDistributionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Sessions by Cost</CardTitle>
            <CardDescription>
              Highest cost sessions in this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopSessionsTable data={topSessionsData ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Spending limits and thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetItems.length > 0 ? (
            <div className="space-y-3">
              {budgetItems.map(
                (
                  budget: Budget & {
                    pct: number;
                    isOver: boolean;
                    isWarning: boolean;
                    formattedSpend: string;
                    formattedLimit: string;
                  },
                ) => (
                  <div key={budget._id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {budget.name}
                        </span>
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
                ),
              )}
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
