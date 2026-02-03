import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const CachePerformanceInternal = lazy(() =>
  import("./cache-performance-internal").then((m) => ({
    default: m.CachePerformanceInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

export interface CacheData {
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalInputTokens: number;
  estimatedSavings: number;
}

interface CachePerformanceProps {
  data: CacheData;
}

export const CachePerformance = memo(function CachePerformance({
  data,
}: CachePerformanceProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <CachePerformanceInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
