import { cn } from "@clawwatch/ui/lib/utils";
import {
  AlertTriangle,
  ArrowDown,
  Bell,
  Heart,
  MessageSquare,
  Play,
  Square,
  Wrench,
} from "lucide-react";
import { memo } from "react";
import { timeAgo } from "@/lib/utils";

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
  session_ended: "text-muted-foreground",
  error: "text-red-400",
  heartbeat: "text-primary",
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
  const color = ACTIVITY_COLORS[activity.type] ?? "text-muted-foreground";

  return (
    <div className="group flex items-start gap-3">
      <div className={cn("mt-0.5 shrink-0", color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-snug">{activity.summary}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {activity.agentName && (
            <span className="text-xs text-muted-foreground">
              {activity.agentName}
            </span>
          )}
          {activity.channel && (
            <span className="text-xs text-muted-foreground/50">
              #{activity.channel}
            </span>
          )}
          <span className="text-xs text-muted-foreground/50">
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
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto">
      {activities.map((activity) => (
        <ActivityRow key={activity._id} activity={activity} />
      ))}
    </div>
  );
});
