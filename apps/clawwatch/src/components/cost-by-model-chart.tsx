import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const CostByModelChartInternal = lazy(() =>
  import("./cost-by-model-chart-internal").then((m) => ({
    default: m.CostByModelChartInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

interface CostByModelData {
  timestamp: number;
  cost: number;
  model: string;
}

interface CostByModelChartProps {
  data: CostByModelData[];
}

export const CostByModelChart = memo(function CostByModelChart({
  data,
}: CostByModelChartProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <CostByModelChartInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
