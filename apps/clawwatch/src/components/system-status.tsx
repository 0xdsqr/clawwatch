import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { useQuery } from "convex/react";
import { memo, useMemo } from "react";
import { timeAgo } from "@/lib/utils";

export const SystemStatus = memo(function SystemStatus() {
  const agents = useQuery(api.agents.list, {});
  
  const statusInfo = useMemo(() => {
    if (!agents) return null;
    
    const onlineCount = agents.filter((a) => a.status === "online").length;
    const offlineCount = agents.filter((a) => a.status === "offline").length;
    
    // Mock gateway connection (in real app this would come from Convex)
    const gatewayConnected = onlineCount > 0;
    const lastHeartbeat = Date.now() - (gatewayConnected ? 30000 : 300000); // 30s ago if connected, 5min if not
    
    return {
      gatewayConnected,
      lastHeartbeat,
      onlineCount,
      offlineCount,
    };
  }, [agents]);

  if (!statusInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { gatewayConnected, lastHeartbeat, onlineCount, offlineCount } = statusInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              gatewayConnected ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
          <span className="text-sm font-medium">
            {gatewayConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Last heartbeat:</span>
          <span className="ml-2 font-mono">
            {timeAgo(lastHeartbeat)}
          </span>
        </div>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Agents:</span>
          <span className="ml-2">
            <span className="font-medium text-emerald-400">{onlineCount} online</span>
            {offlineCount > 0 && (
              <>
                <span className="text-muted-foreground mx-1">•</span>
                <span className="font-medium text-red-400">{offlineCount} offline</span>
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});