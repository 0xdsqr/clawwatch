import { cn } from "@clawwatch/ui/lib/utils";
import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { useMutation } from "convex/react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { severityColor, timeAgo } from "@/lib/utils";

interface Alert {
  _id: Id<"alerts">;
  _creationTime: number;
  severity: string;
  title: string;
  message: string;
  acknowledgedAt?: number;
}

interface Props {
  alerts: Alert[];
}

const AlertRow = memo(function AlertRow({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: Alert;
  onAcknowledge: (id: Id<"alerts">) => void;
  onResolve: (id: Id<"alerts">) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
            severityColor(alert.severity),
          )}
        >
          {alert.severity}
        </span>
        <span className="truncate text-[13px]">{alert.title}</span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/40">
          {timeAgo(alert._creationTime)}
        </span>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-0.5">
        {!alert.acknowledgedAt && (
          <button
            type="button"
            onClick={() => onAcknowledge(alert._id)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Acknowledge"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onResolve(alert._id)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Resolve"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

export const AlertBanner = memo(function AlertBanner({ alerts }: Props) {
  const acknowledge = useMutation(api.alerting.acknowledge);
  const resolve = useMutation(api.alerting.resolve);

  const handleAcknowledge = useCallback(
    (id: Id<"alerts">) => acknowledge({ id }),
    [acknowledge],
  );

  const handleResolve = useCallback(
    (id: Id<"alerts">) => resolve({ id }),
    [resolve],
  );

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === "critical").length,
    [alerts],
  );

  if (alerts.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 animate-fade-in",
        criticalCount > 0
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/20 bg-amber-500/5",
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            criticalCount > 0 ? "text-red-400" : "text-amber-400",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">
            {alerts.length} unresolved alert{alerts.length > 1 ? "s" : ""}
            {criticalCount > 0 && (
              <span className="ml-1.5 text-red-400">
                ({criticalCount} critical)
              </span>
            )}
          </p>
          <div className="mt-1.5 space-y-1">
            {alerts.slice(0, 3).map((alert) => (
              <AlertRow
                key={alert._id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
