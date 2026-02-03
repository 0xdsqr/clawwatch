import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const ModelCostBreakdownInternal = lazy(() =>
  import("./model-cost-breakdown-internal").then((m) => ({
    default: m.ModelCostBreakdownInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

interface ModelCostData {
  model: string;
  cost: number;
  percentage: number;
}

interface ModelCostBreakdownProps {
  data: ModelCostData[];
}

export const ModelCostBreakdown = memo(function ModelCostBreakdown({ 
  data 
}: ModelCostBreakdownProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <ModelCostBreakdownInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});