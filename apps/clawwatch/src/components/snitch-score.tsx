import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clawwatch/ui/components/card";
import { Skeleton } from "@clawwatch/ui/components/skeleton";
import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  DollarSign,
  Eye,
  FileText,
  HelpCircle,
  Megaphone,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { memo, useMemo } from "react";
import { timeAgo } from "@/lib/utils";

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
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snitch Score</CardTitle>
        <CardDescription>How often does your agent tattle?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big score display */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-4xl">{score.emoji}</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn("tabular-nums text-3xl font-bold", styles.color)}
              >
                {score.score}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className={cn("text-sm font-medium", styles.color)}>
              {score.label}
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${score.score}%` }}
          />
        </div>

        {/* Breakdown */}
        {sortedBreakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {TYPE_LABELS[type] ?? type}
                    </span>
                  </div>
                  <span className="font-mono text-xs">{count as number}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent snitches */}
        {score.recentSnitches.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recent Snitching
            </p>
            {score.recentSnitches.map((snitch, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5",
                    snitch.severity === "narc"
                      ? "bg-red-500/10 text-red-400"
                      : snitch.severity === "hall_monitor"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-blue-500/10 text-blue-400",
                  )}
                >
                  {snitch.severity}
                </span>
                <span className="truncate">{snitch.description}</span>
                <span className="shrink-0 text-muted-foreground/50">
                  {timeAgo(snitch.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}

        {score.totalEvents === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No snitching recorded yet. Your agent is keeping quiet... for now.
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export const SnitchLeaderboard = memo(function SnitchLeaderboard() {
  const leaderboard = useQuery(api.snitchScore.leaderboard);

  const medals = useMemo(() => ["1.", "2.", "3."], []);

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snitch Leaderboard</CardTitle>
        <CardDescription>Who's the biggest tattletale?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <div
              key={entry.agentId}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <span className="text-sm font-medium">{entry.agentName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {entry.totalSnitches} events
                </span>
                <span
                  className={cn(
                    "tabular-nums text-sm font-bold",
                    scoreStyles(entry.score).color,
                  )}
                >
                  {entry.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
