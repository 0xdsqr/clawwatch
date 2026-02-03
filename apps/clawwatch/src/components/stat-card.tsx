import { Card, CardContent } from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold leading-none">{value}</p>
            
            <div className="mt-3 flex items-center gap-2">
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.direction === "up" && "text-emerald-400",
                  trend.direction === "down" && "text-red-400"
                )}>
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
                    "text-xs",
                    changeType === "positive" && "text-emerald-400",
                    changeType === "negative" && "text-red-400",
                    changeType === "neutral" && "text-muted-foreground",
                    trend && "border-l border-border pl-2"
                  )}
                >
                  {change}
                </p>
              )}
            </div>

            {sparkline && sparkline.length > 0 && (
              <div className="mt-3 h-8 w-full">
                <ClientOnly>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkline}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        dot={false}
                        className="text-muted-foreground/60"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted ml-4">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
