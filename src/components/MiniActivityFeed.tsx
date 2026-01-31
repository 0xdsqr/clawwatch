import { memo } from "react";
import { cn, timeAgo } from "@/lib/utils";
import {
  MessageSquare,
  Wrench,
  Play,
  Square,
  AlertTriangle,
  Heart,
  Bell,
  ArrowDown,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof MessageSquare> = {
  message_sent: MessageSquare,
  message_received: ArrowDown,
  tool_call: Wrench,
  session_started: Play,
  session_ended: Square,
  error: AlertTriangle,
  heartbeat: Heart,
  alert_fired: Bell,
};

const ACTIVITY_COLORS: Record<string, string> = {
  message_sent: "text-blue-400",
  message_received: "text-cyan-400",
  tool_call: "text-purple-400",
  session_started: "text-emerald-400",
  session_ended: "text-zinc-400",
  error: "text-red-400",
  heartbeat: "text-keel-400",
  alert_fired: "text-amber-400",
};

interface ActivityItem {
  _id: string;
  _creationTime: number;
  type: string;
  summary: string;
  agentName?: string;
  channel?: string;
}

interface Props {
  activities: ActivityItem[];
}

const ActivityRow = memo(function ActivityRow({
  activity,
}: {
  activity: ActivityItem;
}) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare;
  const color = ACTIVITY_COLORS[activity.type] ?? "text-zinc-400";

  return (
    <div className="flex items-start gap-3 group">
      <div className={cn("mt-0.5 shrink-0", color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 leading-snug truncate">
          {activity.summary}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {activity.agentName && (
            <span className="text-xs text-zinc-600">{activity.agentName}</span>
          )}
          {activity.channel && (
            <span className="text-xs text-zinc-700">#{activity.channel}</span>
          )}
          <span className="text-xs text-zinc-700">
            {timeAgo(activity._creationTime)}
          </span>
        </div>
      </div>
    </div>
  );
});

export const MiniActivityFeed = memo(function MiniActivityFeed({
  activities,
}: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {activities.map((activity) => (
        <ActivityRow key={activity._id} activity={activity} />
      ))}
    </div>
  );
});
