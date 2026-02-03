import { Button } from "@clawwatch/ui/components/button";
import {
  Card,
  CardContent,
} from "@clawwatch/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@clawwatch/ui/components/dialog";
import { Input } from "@clawwatch/ui/components/input";
import { Label } from "@clawwatch/ui/components/label";
import { api } from "@convex/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AgentStatusCard } from "@/components/agent-status-card";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
});

function AgentsPage() {
  const agents = useQuery(api.agents.list, {});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [gatewayUrl, setGatewayUrl] = useState("");

  const handleAddAgent = () => {
    // TODO: Implement agent creation with api.agents.create
    console.log("Creating agent:", { name: agentName, gatewayUrl });
    setIsAddDialogOpen(false);
    setAgentName("");
    setGatewayUrl("");
  };

  if (agents === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded w-32" />
        </div>
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
      {/* Header with Add Agent button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Manager</h1>
          <p className="text-muted-foreground">
            Monitor and manage your connected AI agents
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>
                Connect a new AI agent to ClawWatch for monitoring and management.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gateway">Gateway URL</Label>
                <Input
                  id="gateway"
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  placeholder="https://gateway.example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddAgent}
                disabled={!agentName.trim() || !gatewayUrl.trim()}
              >
                Add Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link 
            key={agent._id} 
            to="/agents/$agentId" 
            params={{ agentId: agent._id }}
            className="block transition-all hover:scale-105"
          >
            <AgentStatusCard agentId={agent._id} />
          </Link>
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
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}