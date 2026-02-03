import { Badge } from "@clawwatch/ui/components/badge";
import { Card, CardContent } from "@clawwatch/ui/components/card";
import { Skeleton } from "@clawwatch/ui/components/skeleton";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useQuery } from "convex/react";
import { Activity, AlertTriangle, Circle, DollarSign } from "lucide-react";
import { memo, useMemo } from "react";
import { formatCost, formatTokens, statusColor, timeAgo } from "@/lib/utils";

interface Props {
  agentId: Id<"agents">;
}

export const AgentStatusCard = memo(function AgentStatusCard({
  agentId,
}: Props) {
  const health = useQuery(api.agents.healthSummary, { agentId });

  const formattedCost = useMemo(
    () => formatCost(health?.costLastHour ?? 0),
    [health?.costLastHour],
  );

  const formattedTokens = useMemo(
    () => formatTokens(health?.tokensLastHour ?? 0),
    [health?.tokensLastHour],
  );

  const formattedHeartbeat = useMemo(
    () => (health ? timeAgo(health.agent.lastHeartbeat) : ""),
    [health?.agent.lastHeartbeat],
  );

  if (!health) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { agent, activeSessions, errorCount, isHealthy } = health;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                "h-2.5 w-2.5 fill-current",
                statusColor(agent.status),
              )}
            />
            <span className="font-semibold">{agent.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formattedHeartbeat}
          </span>
        </div>

        {/* Model / Channel */}
        {agent.config && (
          <div className="flex gap-2">
            {agent.config.model && (
              <Badge variant="secondary">{agent.config.model}</Badge>
            )}
            {agent.config.channel && (
              <Badge variant="secondary">{agent.config.channel}</Badge>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-sm font-medium">{activeSessions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cost/hr</p>
              <p className="text-sm font-medium">{formattedCost}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center text-xs font-bold text-muted-foreground">
              T
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens/hr</p>
              <p className="text-sm font-medium">{formattedTokens}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5",
                errorCount > 0 ? "text-red-400" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-xs text-muted-foreground">Errors</p>
              <p
                className={cn(
                  "text-sm font-medium",
                  errorCount > 0 ? "text-red-400" : "",
                )}
              >
                {errorCount}
              </p>
            </div>
          </div>
        </div>

        {/* Health bar */}
        <div
          className={cn(
            "h-1 rounded-full",
            isHealthy ? "bg-emerald-500/40" : "bg-red-500/40",
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isHealthy ? "bg-emerald-500" : "bg-red-500",
            )}
            style={{
              width: isHealthy
                ? "100%"
                : `${Math.max(10, 100 - errorCount * 20)}%`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
});
