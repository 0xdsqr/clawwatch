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
import { useMemo } from "react";
import { CostChart } from "@/components/cost-chart";
import { StatCard } from "@/components/stat-card";
import { formatCost, formatTokens } from "@/lib/utils";

export const Route = createFileRoute("/costs")({
  component: CostExplorer,
});

function CostExplorer() {
  const summary = useQuery(api.costs.summary, {});
  const timeSeries24h = useQuery(api.costs.timeSeries, { hours: 24 });
  const timeSeries7d = useQuery(api.costs.timeSeries, { hours: 168 });
  const budgets = useQuery(api.budgets.list);

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
      {/* Summary stats */}
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

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Cost — Last 24 Hours</CardTitle>
          <CardDescription>Hourly breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <CostChart data={timeSeries24h ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost — Last 7 Days</CardTitle>
          <CardDescription>Hourly breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <CostChart data={timeSeries7d ?? []} />
        </CardContent>
      </Card>

      {/* Budgets */}
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
