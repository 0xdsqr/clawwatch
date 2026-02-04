import { Card, CardContent, CardHeader, CardTitle } from "@clawwatch/ui/components/card";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import { useQuery } from "convex/react";
import { Wifi, WifiOff } from "lucide-react";
import { memo, useMemo } from "react";
import { timeAgo } from "@/lib/utils";
import type { Agent } from "@/types";

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export const SystemStatus = memo(function SystemStatus() {
  const agents = useQuery(api.agents.list, {});

  const statusInfo = useMemo(() => {
    if (!agents || agents.length === 0) return null;

    const now = Date.now();
    const mostRecentHeartbeat = Math.max(...agents.map((a: Agent) => a.lastHeartbeat));
    const gatewayConnected = now - mostRecentHeartbeat < STALE_THRESHOLD_MS;
    const onlineCount = agents.filter(
      (a: Agent) => now - a.lastHeartbeat < STALE_THRESHOLD_MS,
    ).length;
    const offlineCount = agents.length - onlineCount;

    return {
      gatewayConnected,
      lastHeartbeat: mostRecentHeartbeat,
      onlineCount,
      offlineCount,
      totalAgents: agents.length,
    };
  }, [agents]);

  if (!statusInfo) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2.5">
            <div className="h-3.5 bg-muted rounded w-3/4 shimmer" />
            <div className="h-3.5 bg-muted rounded w-1/2 shimmer" />
            <div className="h-3.5 bg-muted rounded w-2/3 shimmer" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { gatewayConnected, lastHeartbeat, onlineCount, offlineCount } = statusInfo;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-md bg-muted/40 px-3 py-2">
          {gatewayConnected ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <div className="flex-1">
            <span className="text-[13px] font-medium">
              {gatewayConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {gatewayConnected && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          )}
        </div>

        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last heartbeat</span>
            <span
              className={cn("font-mono tabular-nums text-xs", !gatewayConnected && "text-red-400")}
            >
              {timeAgo(lastHeartbeat)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Agents</span>
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-medium",
                  onlineCount > 0 ? "text-emerald-400" : "text-muted-foreground",
                )}
              >
                {onlineCount} online
              </span>
              {offlineCount > 0 && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-xs font-medium text-red-400">{offlineCount} offline</span>
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
