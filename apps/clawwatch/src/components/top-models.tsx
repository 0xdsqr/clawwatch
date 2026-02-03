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

export const TopModels = memo(function TopModels() {
  // Stable time range — rounded to nearest hour to prevent re-render loops
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

    // Group by model and sum tokens
    const modelMap = new Map<string, { tokens: number; cost: number }>();
    
    costRecords.forEach((record) => {
      const existing = modelMap.get(record.model) ?? { tokens: 0, cost: 0 };
      modelMap.set(record.model, {
        tokens: existing.tokens + (record.inputTokens ?? 0) + (record.outputTokens ?? 0),
        cost: existing.cost + record.cost,
      });
    });

    // Convert to array and sort by token usage
    const models = Array.from(modelMap.entries())
      .map(([name, data]) => ({
        name,
        tokens: data.tokens,
        cost: data.cost,
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5); // Top 5

    // Calculate max tokens for percentage calculation
    const maxTokens = models[0]?.tokens ?? 0;

    return models.map((model) => ({
      ...model,
      percentage: maxTokens > 0 ? (model.tokens / maxTokens) * 100 : 0,
    }));
  }, [costRecords]);

  if (!modelData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Models</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-12" />
                </div>
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Models</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modelData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No model usage data available
          </div>
        ) : (
          modelData.map((model) => (
            <div key={model.name} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {model.name}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  {formatTokens(model.tokens)}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
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