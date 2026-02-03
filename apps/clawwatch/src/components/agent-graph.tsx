import { lazy, memo, Suspense } from "react";
import type { AgentGraphProps } from "./agent-graph-internal";
import { ClientOnly } from "./client-only";

const AgentGraphInternal = lazy(() =>
  import("./agent-graph-internal").then((m) => ({
    default: m.AgentGraphInternal,
  })),
);

const graphFallback = (
  <div className="flex h-[600px] items-center justify-center rounded-lg border bg-card text-muted-foreground">
    <div className="text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <p className="text-sm">Loading graph...</p>
    </div>
  </div>
);

export const AgentGraph = memo(function AgentGraph(props: AgentGraphProps) {
  return (
    <ClientOnly fallback={graphFallback}>
      <Suspense fallback={graphFallback}>
        <AgentGraphInternal {...props} />
      </Suspense>
    </ClientOnly>
  );
});
