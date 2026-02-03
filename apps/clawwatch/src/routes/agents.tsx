import {
  Card,
  CardContent,
} from "@clawwatch/ui/components/card";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { AgentStatusCard } from "@/components/agent-status-card";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
});

function AgentsPage() {
  const agents = useQuery(api.agents.list, {});

  if (agents === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2 mb-4" />
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          Monitor and manage your connected AI agents
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentStatusCard key={agent._id} agentId={agent._id} />
        ))}
        {agents.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No agents connected</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Connect your Clawdbot gateway to start monitoring agent activity,
                costs, and performance metrics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}