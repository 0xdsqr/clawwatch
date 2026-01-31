import { useMemo, useState, memo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, StatCard } from "@/components/Card";
import { ModelComparisonTable } from "@/components/ModelComparisonTable";
import { CacheHitChart } from "@/components/CacheHitChart";
import { ProviderCard } from "@/components/ProviderCard";
import {
  Building2,
  Cpu,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { formatCost, formatTokens } from "@/lib/utils";

type Period = "24h" | "7d" | "14d" | "30d";
const PERIOD_MS: Record<Period, number> = {
  "24h": 86_400_000,
  "7d": 604_800_000,
  "14d": 1_209_600_000,
  "30d": 2_592_000_000,
};
const BUCKET_MS: Record<Period, number> = {
  "24h": 3_600_000,
  "7d": 21_600_000,
  "14d": 86_400_000,
  "30d": 86_400_000,
};

const PeriodSelector = memo(function PeriodSelector({
  period,
  onSelect,
}: {
  period: Period;
  onSelect: (p: Period) => void;
}) {
  return (
    <div className="flex bg-zinc-800/50 rounded-lg p-0.5">
      {(["24h", "7d", "14d", "30d"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
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
  );
});

export function ProvidersPage() {
  const [period, setPeriod] = useState<Period>("7d");
  // Stabilize sinceMs so Convex queries don't re-subscribe every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sinceMs = useMemo(() => Date.now() - PERIOD_MS[period], [period]);

  const providerData = useQuery(api.providerAnalytics.providerBreakdown, {
    sinceMs,
  });
  const modelData = useQuery(api.providerAnalytics.modelComparison, {
    sinceMs,
  });
  const cacheHitData = useQuery(api.providerAnalytics.cacheHitRateByProvider, {
    sinceMs,
    bucketMs: BUCKET_MS[period],
  });
  const healthData = useQuery(api.providerAnalytics.providerHealth, {
    sinceMs,
  });

  // Memoize aggregate stats
  const stats = useMemo(() => {
    if (!providerData) return null;
    const totalCost = providerData.reduce((s, p) => s + p.totalCost, 0);
    const totalTokens = providerData.reduce(
      (s, p) => s + p.totalInput + p.totalOutput,
      0,
    );
    const totalRequests = providerData.reduce(
      (s, p) => s + p.requestCount,
      0,
    );
    const totalCacheRead = providerData.reduce(
      (s, p) => s + p.totalCacheRead,
      0,
    );
    const totalInput = providerData.reduce((s, p) => s + p.totalInput, 0);
    const overallCacheRate =
      totalInput + totalCacheRead > 0
        ? Math.round((totalCacheRead / (totalInput + totalCacheRead)) * 1000) /
          10
        : 0;

    return {
      totalCost,
      totalTokens,
      totalRequests,
      providerCount: providerData.length,
      overallCacheRate,
    };
  }, [providerData]);

  // Memoize health map for provider cards
  type HealthItem = NonNullable<typeof healthData>[number];
  const healthMap = useMemo(() => {
    if (!healthData) return new Map<string, HealthItem>();
    return new Map(healthData.map((h) => [h.provider, h]));
  }, [healthData]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">
            Provider Analytics
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Compare providers, models, and cache efficiency
          </p>
        </div>
        <PeriodSelector period={period} onSelect={setPeriod} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Providers"
          value={String(stats?.providerCount ?? 0)}
          change={`${stats?.totalRequests ?? 0} total requests`}
          icon={<Building2 className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          label={`Total Spend (${period})`}
          value={formatCost(stats?.totalCost ?? 0)}
          change={`Across ${stats?.providerCount ?? 0} providers`}
          icon={<Cpu className="w-5 h-5 text-keel-400" />}
        />
        <StatCard
          label={`Total Tokens (${period})`}
          value={formatTokens(stats?.totalTokens ?? 0)}
          change={`${stats?.totalRequests ?? 0} requests`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Cache Hit Rate"
          value={`${stats?.overallCacheRate ?? 0}%`}
          change="cacheRead / (input + cacheRead)"
          changeType={
            (stats?.overallCacheRate ?? 0) > 30 ? "positive" : "neutral"
          }
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Provider cards */}
      {providerData && providerData.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">
            Provider Breakdown
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {providerData.map((provider) => (
              <ProviderCard
                key={provider.provider}
                provider={provider}
                totalCost={stats?.totalCost ?? 0}
                health={healthMap.get(provider.provider)}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <div className="text-center py-12 text-zinc-600 text-sm">
            {providerData === undefined ? "Loading provider data..." : "No cost data for this period"}
          </div>
        </Card>
      )}

      {/* Cache hit rate chart */}
      <Card
        title="Cache Hit Rate Over Time"
        subtitle={`${period} · cacheRead / (input + cacheRead) per provider`}
      >
        {cacheHitData && cacheHitData.providers.length > 0 ? (
          <CacheHitChart
            buckets={cacheHitData.buckets}
            providers={cacheHitData.providers}
            height={300}
          />
        ) : (
          <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
            {cacheHitData ? "No cache data for this period" : "Loading..."}
          </div>
        )}
      </Card>

      {/* Model comparison table */}
      <Card
        title="Model Comparison"
        subtitle={`${period} · All models across all providers`}
      >
        {modelData && modelData.length > 0 ? (
          <ModelComparisonTable models={modelData} />
        ) : (
          <div className="text-center py-8 text-zinc-600 text-sm">
            {modelData === undefined ? "Loading..." : "No model data for this period"}
          </div>
        )}
      </Card>

      {/* Provider health */}
      {healthData && healthData.length > 0 && (
        <Card
          title="Provider Health"
          subtitle="Error rates based on activity log"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {healthData.map((h) => (
              <div
                key={h.provider}
                className="border border-zinc-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      h.status === "healthy"
                        ? "bg-emerald-400"
                        : h.status === "warning"
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-200 capitalize">
                      {h.provider}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {h.requestCount} requests
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-mono ${
                      h.errorCount === 0
                        ? "text-emerald-400"
                        : h.errorRate > 10
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {h.errorRate}% errors
                  </span>
                  {h.errorCount > 0 && (
                    <p className="text-xs text-zinc-500">
                      {h.errorCount} errors
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
