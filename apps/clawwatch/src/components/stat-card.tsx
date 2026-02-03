import { Card, CardContent } from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { ClientOnly } from "@/components/client-only";

interface SparklineData {
  value: number;
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  trend?: {
    percentage: number;
    direction: "up" | "down";
  };
  sparkline?: SparklineData[];
}

export const StatCard = memo(function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  trend,
  sparkline,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 transition-colors hover:border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/80">
                  {icon}
                </div>
              )}
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>

            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium tabular-nums",
                    trend.direction === "up" && "text-emerald-400",
                    trend.direction === "down" && "text-red-400",
                  )}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.percentage).toFixed(1)}%
                </div>
              )}

              {change && (
                <p
                  className={cn(
                    "text-[11px]",
                    changeType === "positive" && "text-emerald-400",
                    changeType === "negative" && "text-red-400",
                    changeType === "neutral" && "text-muted-foreground/70",
                    trend && "border-l border-border/50 pl-2",
                  )}
                >
                  {change}
                </p>
              )}
            </div>
          </div>

          {sparkline && sparkline.length > 0 && (
            <div className="h-10 w-20 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity">
              <ClientOnly>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkline}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      dot={false}
                      className="text-primary/60"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
