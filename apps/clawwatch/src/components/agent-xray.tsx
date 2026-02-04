import { lazy, memo, Suspense } from "react";
import type { AgentXrayProps } from "./agent-xray-internal";
import { ClientOnly } from "./client-only";

const AgentXrayInternal = lazy(() =>
  import("./agent-xray-internal").then((m) => ({
    default: m.AgentXrayInternal,
  })),
);

const xrayFallback = (
  <div className="flex h-[600px] items-center justify-center rounded-lg border bg-card text-muted-foreground">
    <div className="text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <p className="text-sm">Loading x-ray...</p>
    </div>
  </div>
);

export const AgentXray = memo(function AgentXray(props: AgentXrayProps) {
  return (
    <ClientOnly fallback={xrayFallback}>
      <Suspense fallback={xrayFallback}>
        <AgentXrayInternal {...props} />
      </Suspense>
    </ClientOnly>
  );
});
