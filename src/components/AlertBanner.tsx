import { memo, useMemo, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn, severityColor, timeAgo } from "@/lib/utils";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

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
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "shrink-0 px-1.5 py-0.5 rounded text-xs font-medium",
            severityColor(alert.severity),
          )}
        >
          {alert.severity}
        </span>
        <span className="text-zinc-300 truncate">{alert.title}</span>
        <span className="text-zinc-600 text-xs shrink-0">
          {timeAgo(alert._creationTime)}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {!alert.acknowledgedAt && (
          <button
            onClick={() => onAcknowledge(alert._id)}
            className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300"
            title="Acknowledge"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onResolve(alert._id)}
          className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300"
          title="Resolve"
        >
          <X className="w-3.5 h-3.5" />
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
        "rounded-xl border p-4",
        criticalCount > 0
          ? "border-red-500/30 bg-red-500/5"
          : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            "w-5 h-5 mt-0.5 shrink-0",
            criticalCount > 0 ? "text-red-400" : "text-amber-400",
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200">
            {alerts.length} unresolved alert{alerts.length > 1 ? "s" : ""}
            {criticalCount > 0 && (
              <span className="text-red-400 ml-2">
                ({criticalCount} critical)
              </span>
            )}
          </p>
          <div className="mt-2 space-y-1.5">
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
