import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/Card";
import { Bell, Plus, Trash2, DollarSign } from "lucide-react";
import { cn, formatCost } from "@/lib/utils";

export function Settings() {
  const notificationChannels = useQuery(api.notifications.list);
  const budgets = useQuery(api.budgets.list);

  const createBudget = useMutation(api.budgets.create);
  const removeBudget = useMutation(api.budgets.remove);
  const createNotification = useMutation(api.notifications.create);
  const removeNotification = useMutation(api.notifications.remove);

  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);

  // Budget form state
  const [budgetName, setBudgetName] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("10");
  const [budgetPeriod, setBudgetPeriod] = useState<
    "hourly" | "daily" | "weekly" | "monthly"
  >("daily");
  const [budgetHardStop, setBudgetHardStop] = useState(false);

  // Notification form state
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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Settings</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Configure budgets, notifications, and integrations
        </p>
      </div>

      {/* Budgets */}
      <Card
        title="Budgets"
        subtitle="Set spending limits for your agents"
        action={
          <button
            onClick={() => setShowNewBudget(!showNewBudget)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-keel-500/10 text-keel-400 text-xs font-medium hover:bg-keel-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Budget
          </button>
        }
      >
        {showNewBudget && (
          <div className="mb-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50 space-y-3">
            <input
              type="text"
              placeholder="Budget name"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">
                  Limit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-keel-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">
                  Period
                </label>
                <select
                  value={budgetPeriod}
                  onChange={(e) =>
                    setBudgetPeriod(e.target.value as typeof budgetPeriod)
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-keel-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={budgetHardStop}
                onChange={(e) => setBudgetHardStop(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Hard stop (pause agent when exceeded)
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewBudget(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBudget}
                className="px-3 py-1.5 rounded-lg bg-keel-500 text-zinc-900 text-xs font-medium hover:bg-keel-400"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {budgets && budgets.length > 0 ? (
          <div className="space-y-2">
            {budgets.map((budget) => (
              <div
                key={budget._id}
                className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {budget.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatCost(budget.limitDollars)} / {budget.period}
                      {budget.hardStop && " · Hard stop"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeBudget({ id: budget._id })}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-4">
            No budgets configured
          </p>
        )}
      </Card>

      {/* Notification Channels */}
      <Card
        title="Notification Channels"
        subtitle="Where alerts get delivered"
        action={
          <button
            onClick={() => setShowNewChannel(!showNewChannel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-keel-500/10 text-keel-400 text-xs font-medium hover:bg-keel-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Channel
          </button>
        }
      >
        {showNewChannel && (
          <div className="mb-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                <select
                  value={channelType}
                  onChange={(e) =>
                    setChannelType(e.target.value as typeof channelType)
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-keel-500"
                >
                  <option value="discord">Discord Webhook</option>
                  <option value="email">Email</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">Name</label>
                <input
                  type="text"
                  placeholder="e.g. #alerts"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
                />
              </div>
            </div>
            {(channelType === "discord" || channelType === "webhook") && (
              <input
                type="url"
                placeholder="Webhook URL"
                value={channelWebhook}
                onChange={(e) => setChannelWebhook(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
              />
            )}
            {channelType === "email" && (
              <input
                type="email"
                placeholder="Email address"
                value={channelEmail}
                onChange={(e) => setChannelEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChannel(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                className="px-3 py-1.5 rounded-lg bg-keel-500 text-zinc-900 text-xs font-medium hover:bg-keel-400"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {notificationChannels && notificationChannels.length > 0 ? (
          <div className="space-y-2">
            {notificationChannels.map((channel) => (
              <div
                key={channel._id}
                className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {channel.name}
                    </p>
                    <p className="text-xs text-zinc-500">{channel.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      channel.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-700/50 text-zinc-500",
                    )}
                  >
                    {channel.isActive ? "Active" : "Disabled"}
                  </span>
                  <button
                    onClick={() => removeNotification({ id: channel._id })}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-4">
            No notification channels configured
          </p>
        )}
      </Card>

      {/* Gateway Connection */}
      <Card
        title="Gateway Connection"
        subtitle="Connect to your Clawdbot gateway"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Gateway URL
            </label>
            <input
              type="url"
              placeholder="ws://127.0.0.1:18789"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Gateway Token
            </label>
            <input
              type="password"
              placeholder="Your gateway token"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-keel-500"
            />
          </div>
          <button className="px-4 py-2 rounded-lg bg-keel-500 text-zinc-900 text-sm font-medium hover:bg-keel-400 transition-colors">
            Connect
          </button>
        </div>
      </Card>
    </div>
  );
}
