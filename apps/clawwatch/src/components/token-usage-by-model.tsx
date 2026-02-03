import { lazy, memo, Suspense } from "react";
import { ClientOnly } from "./client-only";

const TokenUsageByModelInternal = lazy(() =>
  import("./token-usage-by-model-internal").then((m) => ({
    default: m.TokenUsageByModelInternal,
  })),
);

const chartFallback = (
  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
    Loading chart...
  </div>
);

interface TokenUsageData {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface TokenUsageByModelProps {
  data: TokenUsageData[];
}

export const TokenUsageByModel = memo(function TokenUsageByModel({ 
  data 
}: TokenUsageByModelProps) {
  return (
    <ClientOnly fallback={chartFallback}>
      <Suspense fallback={chartFallback}>
        <TokenUsageByModelInternal data={data} />
      </Suspense>
    </ClientOnly>
  );
});