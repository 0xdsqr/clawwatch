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
import { Separator } from "@clawwatch/ui/components/separator";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Bell, DollarSign, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatCost } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const notificationChannels = useQuery(api.notifications.list);
  const budgets = useQuery(api.budgets.list);

  const createBudget = useMutation(api.budgets.create);
  const removeBudget = useMutation(api.budgets.remove);
  const createNotification = useMutation(api.notifications.create);
  const removeNotification = useMutation(api.notifications.remove);

  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);

  const [budgetName, setBudgetName] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("10");
  const [budgetPeriod, setBudgetPeriod] = useState<
    "hourly" | "daily" | "weekly" | "monthly"
  >("daily");
  const [budgetHardStop, setBudgetHardStop] = useState(false);

  const [channelType, setChannelType] = useState<
    "discord" | "email" | "webhook"
  >("discord");
  const [channelName, setChannelName] = useState("");
  const [channelWebhook, setChannelWebhook] = useState("");
  const [channelEmail, setChannelEmail] = useState("");

  const handleCreateBudget = async () => {
    if (!budgetName || !budgetLimit) return;
    await createBudget({
      name: budgetName,
      limitDollars: parseFloat(budgetLimit),
      period: budgetPeriod,
      hardStop: budgetHardStop,
    });
    setBudgetName("");
    setBudgetLimit("10");
    setShowNewBudget(false);
  };

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
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
      {/* Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Set spending limits for your agents</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewBudget(!showNewBudget)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Budget
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {showNewBudget && (
            <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
              <Input
                placeholder="Budget name"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Limit ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Period
                  </label>
                  <select
                    value={budgetPeriod}
                    onChange={(e) =>
                      setBudgetPeriod(e.target.value as typeof budgetPeriod)
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={budgetHardStop}
                  onChange={(e) => setBudgetHardStop(e.target.checked)}
                  className="rounded border-border"
                />
                Hard stop (pause agent when exceeded)
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewBudget(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateBudget}>
                  Create
                </Button>
              </div>
            </div>
          )}

          {budgets && budgets.length > 0 ? (
            <div className="space-y-2">
              {budgets.map((budget) => (
                <div
                  key={budget._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{budget.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCost(budget.limitDollars)} / {budget.period}
                        {budget.hardStop && " · Hard stop"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBudget({ id: budget._id })}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No budgets configured
            </p>
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
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={channelType}
                    onChange={(e) =>
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
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Name
                  </label>
                  <Input
                    placeholder="e.g. #alerts"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>
              </div>
              {(channelType === "discord" || channelType === "webhook") && (
                <Input
                  type="url"
                  placeholder="Webhook URL"
                  value={channelWebhook}
                  onChange={(e) => setChannelWebhook(e.target.value)}
                />
              )}
              {channelType === "email" && (
                <Input
                  type="email"
                  placeholder="Email address"
                  value={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.value)}
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
              {notificationChannels.map((channel) => (
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

      {/* Gateway Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Connection</CardTitle>
          <CardDescription>Connect to your Clawdbot gateway</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Gateway URL
              </label>
              <Input placeholder="ws://127.0.0.1:18789" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Gateway Token
              </label>
              <Input type="password" placeholder="Your gateway token" />
            </div>
            <Button>Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
