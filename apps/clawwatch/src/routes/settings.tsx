import { Badge } from "@clawwatch/ui/components/badge";
import { Button } from "@clawwatch/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { Input } from "@clawwatch/ui/components/input";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  ExternalLink,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import type { Agent, NotificationChannel } from "@/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const notificationChannels = useQuery(api.notifications.list);
  const agents = useQuery(api.agents.list, {});

  const createNotification = useMutation(api.notifications.create);
  const removeNotification = useMutation(api.notifications.remove);

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [channelType, setChannelType] = useState<
    "discord" | "email" | "webhook"
  >("discord");
  const [channelName, setChannelName] = useState("");
  const [channelWebhook, setChannelWebhook] = useState("");
  const [channelEmail, setChannelEmail] = useState("");

  // Determine connection health from agent data
  const connectionStatus = useMemo(() => {
    if (!agents) return "loading";
    if (agents.length === 0) return "disconnected";
    const onlineAgents = agents.filter((a: Agent) => a.status === "online");
    if (onlineAgents.length === 0) return "offline";
    // Consider connected if any agent had a heartbeat within last 5 minutes
    const recentHeartbeat = agents.some(
      (a: Agent) => Date.now() - a.lastHeartbeat < 5 * 60 * 1000,
    );
    return recentHeartbeat ? "connected" : "stale";
  }, [agents]);

  const handleCreateChannel = async () => {
    if (!channelName) return;
    await createNotification({
      type: channelType,
      name: channelName,
      config: {
        webhookUrl: channelWebhook || undefined,
        email: channelEmail || undefined,
      },
    });
    setChannelName("");
    setChannelWebhook("");
    setChannelEmail("");
    setShowNewChannel(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-5 p-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your gateway connection and notification preferences
        </p>
      </div>

      {/* Gateway Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Gateway Connection
            {connectionStatus === "connected" && (
              <Badge variant="default" className="text-xs">
                Connected
              </Badge>
            )}
            {connectionStatus === "stale" && (
              <Badge variant="secondary" className="text-xs">
                Stale
              </Badge>
            )}
            {(connectionStatus === "disconnected" ||
              connectionStatus === "offline") && (
              <Badge variant="destructive" className="text-xs">
                {connectionStatus === "disconnected"
                  ? "Not Connected"
                  : "Offline"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Status of your Clawdbot gateway collector
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus === "connected" ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Collector is connected and receiving data
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {agents?.filter((a: Agent) => a.status === "online").length ??
                    0}{" "}
                  agent(s) online · Data flowing normally
                </p>
              </div>
            </div>
          ) : connectionStatus === "stale" ? (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Connection may be stale
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No heartbeat received in the last 5 minutes. The gateway might
                  be experiencing issues.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">
                    {connectionStatus === "disconnected"
                      ? "No agents connected"
                      : "All agents are offline"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure your Clawdbot gateway to start sending data to
                    ClawWatch.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-2">Quick Setup</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Add these environment variables to your Clawdbot
                  configuration:
                </p>
                <div className="rounded-md bg-background p-3 font-mono text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">CONVEX_URL=</span>
                    <span className="text-primary">
                      http://100.115.177.85:3210
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Where alerts get delivered</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewChannel(!showNewChannel)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Channel
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {showNewChannel && (
            <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="mb-1 block text-xs text-muted-foreground">
                    Type
                  </div>
                  <select
                    value={channelType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setChannelType(e.target.value as typeof channelType)
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="discord">Discord Webhook</option>
                    <option value="email">Email</option>
                    <option value="webhook">Custom Webhook</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="mb-1 block text-xs text-muted-foreground">
                    Name
                  </div>
                  <Input
                    placeholder="e.g. #alerts"
                    value={channelName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setChannelName(e.target.value)
                    }
                  />
                </div>
              </div>
              {(channelType === "discord" || channelType === "webhook") && (
                <Input
                  type="url"
                  placeholder="Webhook URL"
                  value={channelWebhook}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setChannelWebhook(e.target.value)
                  }
                />
              )}
              {channelType === "email" && (
                <Input
                  type="email"
                  placeholder="Email address"
                  value={channelEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setChannelEmail(e.target.value)
                  }
                />
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewChannel(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateChannel}>
                  Create
                </Button>
              </div>
            </div>
          )}

          {notificationChannels && notificationChannels.length > 0 ? (
            <div className="space-y-2">
              {notificationChannels.map((channel: NotificationChannel) => (
                <div
                  key={channel._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        channel.isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {channel.isActive ? "Active" : "Disabled"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNotification({ id: channel._id })}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No notification channels configured
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget Management Link */}
      <Card>
        <CardHeader>
          <CardTitle>Budget & Alert Management</CardTitle>
          <CardDescription>
            Configure spending limits and alert thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Budgets and alerts are now managed from the Alerting page
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create budget alerts, error monitors, and more from one place.
              </p>
            </div>
            <Link to="/alerting">
              <Button variant="outline" size="sm">
                Go to Alerting
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
