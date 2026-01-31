import { memo, useMemo, useState } from "react";
import { formatCost, formatTokens } from "@/lib/utils";

interface ModelRow {
  model: string;
  provider: string;
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  totalTokens: number;
  totalCacheRead: number;
  requestCount: number;
  costPerRequest: number;
  costPer1kTokens: number;
  cacheHitRate: number;
}

type SortKey =
  | "model"
  | "provider"
  | "totalCost"
  | "totalTokens"
  | "requestCount"
  | "costPerRequest"
  | "costPer1kTokens"
  | "cacheHitRate";
type SortDir = "asc" | "desc";

interface Props {
  models: ModelRow[];
}

const PROVIDER_BADGE_COLORS: Record<string, string> = {
  anthropic: "bg-amber-500/15 text-amber-400",
  openai: "bg-emerald-500/15 text-emerald-400",
  google: "bg-blue-500/15 text-blue-400",
  "google-ai": "bg-blue-500/15 text-blue-400",
  mistral: "bg-orange-500/15 text-orange-400",
  groq: "bg-violet-500/15 text-violet-400",
  openrouter: "bg-pink-500/15 text-pink-400",
  fireworks: "bg-red-500/15 text-red-400",
  together: "bg-cyan-500/15 text-cyan-400",
  deepseek: "bg-teal-500/15 text-teal-400",
};

function getBadgeColor(provider: string): string {
  return PROVIDER_BADGE_COLORS[provider.toLowerCase()] ?? "bg-zinc-800 text-zinc-400";
}

export const ModelComparisonTable = memo(function ModelComparisonTable({
  models,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalCost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...models];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return copy;
  }, [models, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({
    label,
    field,
    align = "left",
  }: {
    label: string;
    field: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`px-3 py-2.5 text-xs font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => toggleSort(field)}
    >
      {label}
      {sortKey === field && (
        <span className="ml-1 text-purple-400">
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </th>
  );

  if (!models.length) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No model data for this period
      </div>
    );
  }

  // Find max values for mini bar rendering
  const maxCost = Math.max(...models.map((m) => m.totalCost));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <SortHeader label="Model" field="model" />
            <SortHeader label="Provider" field="provider" />
            <SortHeader label="Requests" field="requestCount" align="right" />
            <SortHeader label="Tokens" field="totalTokens" align="right" />
            <SortHeader label="$/Request" field="costPerRequest" align="right" />
            <SortHeader
              label="$/1K Tokens"
              field="costPer1kTokens"
              align="right"
            />
            <SortHeader
              label="Cache Hit"
              field="cacheHitRate"
              align="right"
            />
            <SortHeader label="Total Cost" field="totalCost" align="right" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const costBarWidth =
              maxCost > 0 ? (m.totalCost / maxCost) * 100 : 0;
            return (
              <tr
                key={m.model}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-3 py-2.5 text-zinc-200 font-mono text-xs">
                  {m.model.split("/").pop()}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getBadgeColor(m.provider)}`}
                  >
                    {m.provider}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-zinc-400 font-mono text-xs text-right">
                  {m.requestCount.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-zinc-400 font-mono text-xs text-right">
                  {formatTokens(m.totalTokens)}
                </td>
                <td className="px-3 py-2.5 text-zinc-400 font-mono text-xs text-right">
                  {formatCost(m.costPerRequest)}
                </td>
                <td className="px-3 py-2.5 text-zinc-400 font-mono text-xs text-right">
                  {formatCost(m.costPer1kTokens)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={`font-mono text-xs ${
                      m.cacheHitRate > 30
                        ? "text-emerald-400"
                        : m.cacheHitRate > 0
                          ? "text-zinc-300"
                          : "text-zinc-600"
                    }`}
                  >
                    {m.cacheHitRate}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500/60"
                        style={{ width: `${Math.max(costBarWidth, 2)}%` }}
                      />
                    </div>
                    <span className="text-zinc-200 font-mono text-xs font-medium min-w-[60px] text-right">
                      {formatCost(m.totalCost)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
