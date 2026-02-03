import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const TokenDistributionChartInternal = lazy(() =>
  import("./token-distribution-chart-internal").then((m) => ({
    default: m.TokenDistributionChartInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

export interface TokenDistributionData {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

interface TokenDistributionChartProps {
  data: TokenDistributionData;
}

export const TokenDistributionChart = memo(function TokenDistributionChart({
  data,
}: TokenDistributionChartProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <TokenDistributionChartInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
