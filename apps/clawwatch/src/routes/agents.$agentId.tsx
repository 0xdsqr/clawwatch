import { Badge } from "@clawwatch/ui/components/badge";
import { Button } from "@clawwatch/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@clawwatch/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@clawwatch/ui/components/tabs";
import { Textarea } from "@clawwatch/ui/components/textarea";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { 
  Activity, 
  AlertTriangle, 
  ArrowLeft, 
  Circle, 
  DollarSign,
  Edit,
  File,
  Folder,
  Zap
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { CostChart } from "@/components/cost-chart";
import { StatCard } from "@/components/stat-card";
import { formatCost, formatTokens, statusColor, timeAgo } from "@/lib/utils";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const health = useQuery(api.agents.healthSummary, { 
    agentId: agentId as Id<"agents"> 
  });
  
  const agentCostSummary = useQuery(api.costs.summary, { 
    agentId: agentId as Id<"agents"> 
  });
  
  const agentTimeSeries = useQuery(api.costs.timeSeries, { 
    hours: 24, 
    agentId: agentId as Id<"agents"> 
  });

  // Mock file tree data - will be replaced with real API later
  const mockFiles = [
    { name: "SOUL.md", type: "file", content: "# Agent Soul\n\nThis is the core identity and personality of the agent..." },
    { name: "HEARTBEAT.md", type: "file", content: "# Heartbeat Configuration\n\nCheck email every 30 minutes\nMonitor alerts\nUpdate activity logs" },
    { name: "AGENTS.md", type: "file", content: "# Agent Configuration\n\nWorkspace: /home/agent\nModel: claude-sonnet-3-5\nCapabilities: code, web, files" },
    { name: "USER.md", type: "file", content: "# User Profile\n\nName: Dave\nPreferences: Technical details, concise responses\nContext: Building ClawWatch dashboard" },
    { name: "TOOLS.md", type: "file", content: "# Tools Configuration\n\nGitHub: enabled\nTerminal: enabled\nWeb search: enabled\nFile system: enabled" },
    { name: "MEMORY.md", type: "file", content: "# Long-term Memory\n\nRecent projects:\n- ClawWatch dashboard\n- Cost optimization\n- Agent monitoring" },
  ];

  const formattedAgentCost = useMemo(
    () => formatCost(agentCostSummary?.today.cost ?? 0),
    [agentCostSummary?.today.cost],
  );

  const formattedAgentTokens = useMemo(
    () => formatTokens((agentCostSummary?.today.inputTokens ?? 0) + (agentCostSummary?.today.outputTokens ?? 0)),
    [agentCostSummary?.today.inputTokens, agentCostSummary?.today.outputTokens],
  );

  const handleFileClick = (fileName: string) => {
    const file = mockFiles.find(f => f.name === fileName);
    if (file) {
      setSelectedFile(fileName);
      setFileContent(file.content);
      setIsEditing(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // TODO: Implement actual save functionality
    setIsEditing(false);
  };

  if (!health) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const { agent, activeSessions, errorCount, isHealthy } = health;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate({ to: "/agents" })}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Circle
            className={cn(
              "h-3 w-3 fill-current",
              statusColor(agent.status),
            )}
          />
          <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
          
          {agent.config?.model && (
            <Badge variant="secondary">{agent.config.model}</Badge>
          )}
          
          <span className="text-sm text-muted-foreground">
            Last heartbeat {timeAgo(agent.lastHeartbeat)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Agent-specific stat cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cost Today"
              value={formattedAgentCost}
              change={`${agentCostSummary?.today.requests ?? 0} requests`}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
            />
            <StatCard
              label="Tokens Today"
              value={formattedAgentTokens}
              change="Input + Output"
              icon={<Zap className="h-5 w-5 text-amber-400" />}
            />
            <StatCard
              label="Active Sessions"
              value={activeSessions.toString()}
              change="Currently running"
              icon={<Activity className="h-5 w-5 text-blue-400" />}
            />
            <StatCard
              label="Errors"
              value={errorCount.toString()}
              change="Last 24 hours"
              icon={<AlertTriangle className={cn(
                "h-5 w-5",
                errorCount > 0 ? "text-red-400" : "text-muted-foreground"
              )} />}
            />
          </div>

          {/* Agent-specific cost chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost — Last 24 Hours</CardTitle>
              <CardDescription>Hourly cost breakdown for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <CostChart data={agentTimeSeries ?? []} />
            </CardContent>
          </Card>

          {/* Health status */}
          <Card>
            <CardHeader>
              <CardTitle>Health Status</CardTitle>
              <CardDescription>Agent performance and reliability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health</span>
                  <Badge variant={isHealthy ? "default" : "destructive"}>
                    {isHealthy ? "Healthy" : "Issues Detected"}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full",
                    isHealthy ? "bg-emerald-500/20" : "bg-red-500/20",
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Session activity for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Key</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mock data - will be replaced with real session data */}
                  <TableRow>
                    <TableCell className="font-mono text-xs">session_123</TableCell>
                    <TableCell>conversation</TableCell>
                    <TableCell>discord</TableCell>
                    <TableCell>2 hours ago</TableCell>
                    <TableCell>1 min ago</TableCell>
                    <TableCell>2.4K</TableCell>
                    <TableCell>{formatCost(0.045)}</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">session_122</TableCell>
                    <TableCell>task</TableCell>
                    <TableCell>api</TableCell>
                    <TableCell>3 hours ago</TableCell>
                    <TableCell>2 hours ago</TableCell>
                    <TableCell>1.8K</TableCell>
                    <TableCell>{formatCost(0.032)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Empty state when no sessions */}
              <div className="py-8 text-center text-muted-foreground hidden">
                <p className="text-sm">No sessions found for this agent</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* File tree */}
            <Card>
              <CardHeader>
                <CardTitle>Workspace Files</CardTitle>
                <CardDescription>Agent configuration and memory files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockFiles.map((file) => (
                    <div
                      key={file.name}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted",
                        selectedFile === file.name && "bg-muted"
                      )}
                      onClick={() => handleFileClick(file.name)}
                    >
                      {file.type === "folder" ? (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <File className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* File viewer */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedFile || "Select a file"}
                  </CardTitle>
                  <CardDescription>
                    {selectedFile ? "File content and editor" : "Choose a file from the tree to view its content"}
                  </CardDescription>
                </div>
                {selectedFile && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                    {isEditing && (
                      <Button size="sm" onClick={handleSave}>
                        Save
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-4">
                    {isEditing ? (
                      <Textarea
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="File content..."
                      />
                    ) : (
                      <div className="bg-muted rounded-md p-4 min-h-[300px]">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {fileContent}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p className="text-sm">No file selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentDetailPage;