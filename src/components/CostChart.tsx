import { lazy, memo, Suspense } from "react";

// Lazy load the actual chart component to reduce bundle size
const CostChartInternal = lazy(() => import("./CostChartInternal"));

interface DataPoint {
  timestamp: number;
  cost: number;
  tokens: number;
  requests: number;
}

interface Props {
  data: DataPoint[];
}

export const CostChart = memo(function CostChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-600">
        <p className="text-sm">No cost data yet</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center text-zinc-600">
        <p className="text-sm">Loading chart...</p>
      </div>
    }>
      <CostChartInternal data={data} />
    </Suspense>
  );
});
