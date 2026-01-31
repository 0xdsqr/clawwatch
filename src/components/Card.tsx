import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Card({ title, subtitle, children, className, action }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-6", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs mt-1",
                changeType === "positive" && "text-emerald-400",
                changeType === "negative" && "text-red-400",
                changeType === "neutral" && "text-zinc-500"
              )}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
