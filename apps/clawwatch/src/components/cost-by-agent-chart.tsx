import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const CostByAgentChartInternal = lazy(() =>
  import("./cost-by-agent-chart-internal").then((m) => ({
    default: m.CostByAgentChartInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

export interface AgentCostData {
  agentId: string;
  agentName: string;
  cost: number;
  tokens: number;
  requests: number;
}

interface CostByAgentChartProps {
  data: AgentCostData[];
}

export const CostByAgentChart = memo(function CostByAgentChart({
  data,
}: CostByAgentChartProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <CostByAgentChartInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});
