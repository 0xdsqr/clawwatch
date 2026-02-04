import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const DailyCostTrendInternal = lazy(() =>
  import("./daily-cost-trend-internal").then((m) => ({
    default: m.DailyCostTrendInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

interface DailyCostData {
  date: string;
  cost: number;
}

interface DailyCostTrendProps {
  data: DailyCostData[];
}

export const DailyCostTrend = memo(function DailyCostTrend({ data }: DailyCostTrendProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <DailyCostTrendInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
