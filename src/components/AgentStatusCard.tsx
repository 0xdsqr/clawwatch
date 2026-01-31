import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card } from "./Card";
import { cn, formatCost, formatTokens, timeAgo, statusColor } from "@/lib/utils";
import { Circle, Activity, DollarSign, AlertTriangle } from "lucide-react";

interface Props {
  agentId: Id<"agents">;
}

export function AgentStatusCard({ agentId }: Props) {
  const health = useQuery(api.agents.healthSummary, { agentId });

  if (!health) {
    return (
      <Card className="animate-pulse">
        <div className="h-24 bg-zinc-800/50 rounded" />
      </Card>
    );
  }

  const { agent, activeSessions, costLastHour, tokensLastHour, errorCount, isHealthy } = health;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle
              className={cn("w-2.5 h-2.5 fill-current", statusColor(agent.status))}
            />
            <span className="font-semibold text-zinc-200">{agent.name}</span>
          </div>
          <span className="text-xs text-zinc-500">{timeAgo(agent.lastHeartbeat)}</span>
        </div>

        {/* Model / Channel */}
        {agent.config && (
          <div className="flex gap-2">
            {agent.config.model && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {agent.config.model}
              </span>
            )}
            {agent.config.channel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {agent.config.channel}
              </span>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Sessions</p>
              <p className="text-sm font-medium text-zinc-300">{activeSessions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Cost/hr</p>
              <p className="text-sm font-medium text-zinc-300">{formatCost(costLastHour)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 text-zinc-500 text-xs font-bold flex items-center justify-center">T</div>
            <div>
              <p className="text-xs text-zinc-500">Tokens/hr</p>
              <p className="text-sm font-medium text-zinc-300">{formatTokens(tokensLastHour)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("w-3.5 h-3.5", errorCount > 0 ? "text-red-400" : "text-zinc-500")} />
            <div>
              <p className="text-xs text-zinc-500">Errors</p>
              <p className={cn("text-sm font-medium", errorCount > 0 ? "text-red-400" : "text-zinc-300")}>
                {errorCount}
              </p>
            </div>
          </div>
        </div>

        {/* Health bar */}
        <div className={cn(
          "h-1 rounded-full",
          isHealthy ? "bg-emerald-500/40" : "bg-red-500/40"
        )}>
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isHealthy ? "bg-emerald-500" : "bg-red-500"
            )}
            style={{ width: isHealthy ? "100%" : `${Math.max(10, 100 - errorCount * 20)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
