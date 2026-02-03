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

export const TokenBreakdown = memo(function TokenBreakdown() {
  const costSummary = useQuery(api.costs.summary, {});

  const tokenData = useMemo(() => {
    if (!costSummary) return null;

    const { inputTokens, outputTokens } = costSummary.today;
    const cachedTokens = 0; // TODO: Add cachedTokens to cost summary type
    const total = inputTokens + outputTokens + cachedTokens;

    if (total === 0) {
      return {
        input: { count: 0, percentage: 0 },
        output: { count: 0, percentage: 0 },
        cache: { count: 0, percentage: 0 },
        total: 0,
      };
    }

    return {
      input: {
        count: inputTokens,
        percentage: (inputTokens / total) * 100,
      },
      output: {
        count: outputTokens,
        percentage: (outputTokens / total) * 100,
      },
      cache: {
        count: cachedTokens ?? 0,
        percentage: ((cachedTokens ?? 0) / total) * 100,
      },
      total,
    };
  }, [costSummary]);

  if (!tokenData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-16" />
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

  const tokenTypes = [
    {
      label: "Input",
      data: tokenData.input,
      color: "bg-primary", // purple
    },
    {
      label: "Output",
      data: tokenData.output,
      color: "bg-blue-500", // blue
    },
    {
      label: "Cache",
      data: tokenData.cache,
      color: "bg-emerald-500", // emerald
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Token Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokenTypes.map((type) => (
          <div key={type.label} className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium">{type.label}</span>
              <span className="text-sm font-mono">
                {formatTokens(type.data.count)}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${type.color} rounded-full transition-all duration-300`}
                style={{ width: `${type.data.percentage}%` }}
              />
            </div>
          </div>
        ))}
        
        {tokenData.total === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No token usage today
          </div>
        )}
      </CardContent>
    </Card>
  );
});