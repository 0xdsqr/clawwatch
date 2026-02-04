import { memo } from "react";
import { formatCost, formatTokens } from "@/lib/utils";

interface CacheData {
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalInputTokens: number;
  estimatedSavings: number;
}

interface Props {
  data: CacheData;
}

export const CachePerformanceInternal = memo(function CachePerformanceInternal({ data }: Props) {
  // Hit rate = cache reads / (cache reads + uncached input tokens)
  const totalRequested = data.cacheReadTokens + data.totalInputTokens;
  const hitRate = totalRequested > 0 ? (data.cacheReadTokens / totalRequested) * 100 : 0;

  const totalCacheTokens = data.cacheReadTokens + data.cacheWriteTokens;

  return (
    <div className="space-y-6">
      {/* Cache Hit Rate Ring */}
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg
            className="h-24 w-24 -rotate-90"
            viewBox="0 0 36 36"
            role="img"
            aria-label="Cache hit rate chart"
          >
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray={`${hitRate}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{hitRate.toFixed(0)}%</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
          <p className="text-xs text-muted-foreground">
            {formatTokens(data.cacheReadTokens)} read / {formatTokens(data.totalInputTokens)} input
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Cache Reads</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatTokens(data.cacheReadTokens)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Cache Writes</p>
          <p className="mt-1 text-lg font-bold text-blue-400">
            {formatTokens(data.cacheWriteTokens)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Total Cached</p>
          <p className="mt-1 text-lg font-bold">{formatTokens(totalCacheTokens)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Est. Savings</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatCost(data.estimatedSavings)}
          </p>
        </div>
      </div>
    </div>
  );
});
