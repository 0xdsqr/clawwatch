import { Card, CardContent, CardHeader, CardTitle } from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { useQuery } from "convex/react";
import { memo, useMemo } from "react";
import { formatTokens } from "@/lib/utils";

export const TokenBreakdown = memo(function TokenBreakdown() {
  const costSummary = useQuery(api.costs.summary, {});

  const tokenData = useMemo(() => {
    if (!costSummary) return null;

    const { inputTokens, outputTokens } = costSummary.today;
    const cachedTokens = 0;
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
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Token Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 bg-muted rounded w-14 shimmer" />
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

  const tokenTypes = [
    {
      label: "Input",
      data: tokenData.input,
      barClass: "bg-primary",
    },
    {
      label: "Output",
      data: tokenData.output,
      barClass: "bg-blue-500",
    },
    {
      label: "Cache",
      data: tokenData.cache,
      barClass: "bg-emerald-500",
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Token Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokenData.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60">
            <p className="text-xs">No token usage today</p>
          </div>
        ) : (
          tokenTypes.map((type) => (
            <div key={type.label} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] text-muted-foreground">{type.label}</span>
                <span className="text-[13px] font-mono tabular-nums text-foreground/80">
                  {formatTokens(type.data.count)}
                </span>
              </div>
              <div className="relative h-1.5 bg-muted/80 rounded-full overflow-hidden">
                <div
                  className={`h-full ${type.barClass} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${type.data.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
});
