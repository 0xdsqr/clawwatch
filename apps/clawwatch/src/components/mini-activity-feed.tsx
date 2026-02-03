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
  index,
}: {
  activity: ActivityItem;
  index: number;
}) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare;
  const color = ACTIVITY_COLORS[activity.type] ?? "text-muted-foreground";

  return (
    <div
      className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40 animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={cn("mt-0.5 shrink-0", color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-snug text-foreground/90">
          {activity.summary}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {activity.agentName && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {activity.agentName}
            </span>
          )}
          {activity.channel && (
            <span className="text-[11px] text-muted-foreground/40">
              #{activity.channel}
            </span>
          )}
          <span className="text-[11px] tabular-nums text-muted-foreground/40">
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
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60">
        <MessageSquare className="h-5 w-5 mb-2 opacity-40" />
        <p className="text-xs">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="max-h-[340px] -mx-1 space-y-0.5 overflow-y-auto">
      {activities.map((activity, i) => (
        <ActivityRow key={activity._id} activity={activity} index={i} />
      ))}
    </div>
  );
});
