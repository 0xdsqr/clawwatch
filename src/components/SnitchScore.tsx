import { memo, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card } from "./Card";
import { cn, timeAgo } from "@/lib/utils";
import {
  Eye,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  HelpCircle,
  Megaphone,
  FileText,
  UserX,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Eye> = {
  alert_fired: AlertTriangle,
  safety_refusal: ShieldAlert,
  content_flag: Eye,
  budget_warning: DollarSign,
  permission_ask: HelpCircle,
  proactive_warning: Megaphone,
  compliance_report: FileText,
  tattled_on_user: UserX,
};

const TYPE_LABELS: Record<string, string> = {
  alert_fired: "Alert Fired",
  safety_refusal: "Safety Refusal",
  content_flag: "Content Flag",
  budget_warning: "Budget Warning",
  permission_ask: "Asked Permission",
  proactive_warning: "Proactive Warning",
  compliance_report: "Compliance Report",
  tattled_on_user: "Tattled on User",
};

interface Props {
  agentId: Id<"agents">;
}

function scoreStyles(score: number) {
  if (score < 25) return { color: "text-emerald-400", bar: "bg-emerald-500" };
  if (score < 50) return { color: "text-blue-400", bar: "bg-blue-500" };
  if (score < 75) return { color: "text-amber-400", bar: "bg-amber-500" };
  return { color: "text-red-400", bar: "bg-red-500" };
}

export const SnitchScore = memo(function SnitchScore({ agentId }: Props) {
  const score = useQuery(api.snitchScore.getScore, { agentId });

  const styles = useMemo(
    () => (score ? scoreStyles(score.score) : { color: "", bar: "" }),
    [score?.score],
  );

  const sortedBreakdown = useMemo(
    () =>
      score
        ? Object.entries(score.breakdown).sort(
            ([, a], [, b]) => (b as number) - (a as number),
          )
        : [],
    [score?.breakdown],
  );

  if (!score) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-zinc-800/50 rounded" />
      </Card>
    );
  }

  return (
    <Card title="Snitch Score™" subtitle="How often does your agent tattle?">
      <div className="space-y-4">
        {/* Big score display */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-4xl">{score.emoji}</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  styles.color,
                )}
              >
                {score.score}
              </span>
              <span className="text-sm text-zinc-500">/ 100</span>
            </div>
            <p className={cn("text-sm font-medium", styles.color)}>
              {score.label}
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${score.score}%` }}
          />
        </div>

        {/* Breakdown */}
        {sortedBreakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Breakdown
            </p>
            {sortedBreakdown.map(([type, count]) => {
              const Icon = TYPE_ICONS[type] ?? Eye;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-400">
                      {TYPE_LABELS[type] ?? type}
                    </span>
                  </div>
                  <span className="text-zinc-300 font-mono text-xs">
                    {count as number}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent snitches */}
        {score.recentSnitches.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Recent Snitching
            </p>
            {score.recentSnitches.map((snitch, i) => (
              <div
                key={i}
                className="text-xs text-zinc-500 flex items-center gap-2"
              >
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded",
                    snitch.severity === "narc"
                      ? "bg-red-500/10 text-red-400"
                      : snitch.severity === "hall_monitor"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-blue-500/10 text-blue-400",
                  )}
                >
                  {snitch.severity}
                </span>
                <span className="text-zinc-400 truncate">
                  {snitch.description}
                </span>
                <span className="text-zinc-700 shrink-0">
                  {timeAgo(snitch.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}

        {score.totalEvents === 0 && (
          <p className="text-center text-zinc-600 text-sm py-2">
            No snitching recorded yet. Your agent is keeping quiet... for now.
            🤫
          </p>
        )}
      </div>
    </Card>
  );
});

// Leaderboard component for multi-agent setups
export const SnitchLeaderboard = memo(function SnitchLeaderboard() {
  const leaderboard = useQuery(api.snitchScore.leaderboard);

  const medals = useMemo(() => ["🥇", "🥈", "🥉"], []);

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <Card title="Snitch Leaderboard" subtitle="Who's the biggest tattletale?">
      <div className="space-y-2">
        {leaderboard.map((entry, i) => (
          <div
            key={entry.agentId}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">
                {i < 3 ? medals[i] : `${i + 1}.`}
              </span>
              <span className="text-sm font-medium text-zinc-200">
                {entry.agentName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                {entry.totalSnitches} events
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  scoreStyles(entry.score).color,
                )}
              >
                {entry.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});
