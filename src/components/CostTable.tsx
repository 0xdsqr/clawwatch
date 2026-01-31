import { useMemo, useState } from "react";
import { formatCost, formatTokens } from "@/lib/utils";

interface CostRecord {
  _id: string;
  timestamp: number;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cost: number;
  agentName: string;
}

type SortKey = "timestamp" | "cost" | "inputTokens" | "outputTokens" | "provider" | "model";
type SortDir = "asc" | "desc";

interface Props {
  records: CostRecord[];
  maxRows?: number;
}

export function CostTable({ records, maxRows = 50 }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return copy.slice(0, maxRows);
  }, [records, sortKey, sortDir, maxRows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 select-none"
      onClick={() => toggleSort(field)}
    >
      {label}
      {sortKey === field && (
        <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );

  if (!records.length) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No cost records for this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <SortHeader label="Time" field="timestamp" />
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">
              Agent
            </th>
            <SortHeader label="Provider" field="provider" />
            <SortHeader label="Model" field="model" />
            <SortHeader label="Input" field="inputTokens" />
            <SortHeader label="Output" field="outputTokens" />
            <SortHeader label="Cost" field="cost" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r._id}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td className="px-3 py-2 text-zinc-400 font-mono text-xs">
                {new Date(r.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-3 py-2 text-zinc-300">{r.agentName}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                  {r.provider}
                </span>
              </td>
              <td className="px-3 py-2 text-zinc-400 font-mono text-xs">
                {r.model.split("/").pop()}
              </td>
              <td className="px-3 py-2 text-zinc-400 font-mono text-xs">
                {formatTokens(r.inputTokens)}
              </td>
              <td className="px-3 py-2 text-zinc-400 font-mono text-xs">
                {formatTokens(r.outputTokens)}
              </td>
              <td className="px-3 py-2 text-zinc-200 font-mono text-xs font-medium">
                {formatCost(r.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length > maxRows && (
        <p className="text-xs text-zinc-600 text-center mt-2">
          Showing {maxRows} of {records.length} records
        </p>
      )}
    </div>
  );
}
