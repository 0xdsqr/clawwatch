import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { useQuery } from "convex/react";
import { memo, useMemo } from "react";
import { formatTokens } from "@/lib/utils";
import type { CostRecord } from "@/types";

export const TopModels = memo(function TopModels() {
  const timeRange = useMemo(() => {
    const now = Math.floor(Date.now() / 3600000) * 3600000;
    return {
      startTime: now - 7 * 24 * 3600000,
      endTime: now + 3600000,
    };
  }, []);

  const costRecords = useQuery(api.costs.byTimeRange, timeRange);

  const modelData = useMemo(() => {
    if (!costRecords) return null;

    const modelMap = new Map<string, { tokens: number; cost: number }>();

    costRecords.forEach((record: CostRecord) => {
      const existing = modelMap.get(record.model) ?? { tokens: 0, cost: 0 };
      modelMap.set(record.model, {
        tokens:
          existing.tokens +
          (record.inputTokens ?? 0) +
          (record.outputTokens ?? 0),
        cost: existing.cost + record.cost,
      });
    });

    const models = Array.from(modelMap.entries())
      .map(([name, data]) => ({
        name,
        tokens: data.tokens,
        cost: data.cost,
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);

    const maxTokens = models[0]?.tokens ?? 0;

    return models.map((model) => ({
      ...model,
      percentage: maxTokens > 0 ? (model.tokens / maxTokens) * 100 : 0,
    }));
  }, [costRecords]);

  if (!modelData) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Top Models</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 bg-muted rounded w-24 shimmer" />
                  <div className="h-3.5 bg-muted rounded w-10 shimmer" />
                </div>
                <div className="h-1.5 bg-muted rounded-full shimmer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Models</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modelData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60">
            <p className="text-xs">No model usage data</p>
          </div>
        ) : (
          modelData.map((model, i) => (
            <div
              key={model.name}
              className="space-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[13px] font-medium truncate flex-1">
                  {model.name}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
                  {formatTokens(model.tokens)}
                </span>
              </div>
              <div className="relative h-1.5 bg-muted/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/90 to-primary/50 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${model.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
});
