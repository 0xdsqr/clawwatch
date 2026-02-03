import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const CostChartInternal = lazy(() =>
  import("./cost-chart-internal").then((m) => ({
    default: m.CostChartInternal,
  })),
);

const chartFallback = (
  <div className="flex h-64 items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

interface CostChartProps {
  data: { timestamp: number; cost: number }[];
}

export const CostChart = memo(function CostChart({ data }: CostChartProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <CostChartInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
