import { memo, useMemo } from "react";
import { formatCost, formatTokens } from "@/lib/utils";

interface ModelData {
  model: string;
  cost: number;
  input: number;
  output: number;
  cacheRead: number;
  requests: number;
}

interface ProviderData {
  provider: string;
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  requestCount: number;
  earliestRecord: number;
  latestRecord: number;
  models: Record<string, ModelData>;
}

interface HealthData {
  provider: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  status: "healthy" | "warning" | "degraded";
}

const PROVIDER_COLORS: Record<string, { dot: string; bar: string; text: string }> = {
  anthropic: { dot: "bg-amber-500", bar: "bg-amber-500", text: "text-amber-400" },
  openai: { dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-400" },
  google: { dot: "bg-blue-500", bar: "bg-blue-500", text: "text-blue-400" },
  "google-ai": { dot: "bg-blue-500", bar: "bg-blue-500", text: "text-blue-400" },
  mistral: { dot: "bg-orange-500", bar: "bg-orange-500", text: "text-orange-400" },
  groq: { dot: "bg-violet-500", bar: "bg-violet-500", text: "text-violet-400" },
  openrouter: { dot: "bg-pink-500", bar: "bg-pink-500", text: "text-pink-400" },
  fireworks: { dot: "bg-red-500", bar: "bg-red-500", text: "text-red-400" },
  together: { dot: "bg-cyan-500", bar: "bg-cyan-500", text: "text-cyan-400" },
  deepseek: { dot: "bg-teal-500", bar: "bg-teal-500", text: "text-teal-400" },
};

const DEFAULT_COLORS = { dot: "bg-zinc-500", bar: "bg-zinc-500", text: "text-zinc-400" };

function getColors(provider: string) {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? DEFAULT_COLORS;
}

interface Props {
  provider: ProviderData;
  totalCost: number;
  health?: HealthData;
}

export const ProviderCard = memo(function ProviderCard({
  provider: p,
  totalCost,
  health,
}: Props) {
  const colors = getColors(p.provider);
  const pct = totalCost > 0 ? (p.totalCost / totalCost) * 100 : 0;

  const cacheHitRate = useMemo(() => {
    if (p.totalInput + p.totalCacheRead <= 0) return 0;
    return Math.round((p.totalCacheRead / (p.totalInput + p.totalCacheRead)) * 1000) / 10;
  }, [p.totalInput, p.totalCacheRead]);

  const models = useMemo(
    () => Object.values(p.models).sort((a, b) => b.cost - a.cost),
    [p.models],
  );

  const avgCostPerReq = useMemo(
    () => (p.requestCount > 0 ? p.totalCost / p.requestCount : 0),
    [p.totalCost, p.requestCount],
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${colors.dot}`} />
          <div>
            <h4 className="text-base font-semibold text-zinc-100 capitalize">
              {p.provider}
            </h4>
            <p className="text-xs text-zinc-500">
              {p.requestCount} requests · {Math.round(pct)}% of spend
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-zinc-100">
            {formatCost(p.totalCost)}
          </span>
          {health && (
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  health.status === "healthy"
                    ? "bg-emerald-400"
                    : health.status === "warning"
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
              />
              <span className="text-xs text-zinc-500 capitalize">
                {health.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cost bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-500">Input Tokens</p>
          <p className="text-sm font-mono text-zinc-200">
            {formatTokens(p.totalInput)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-500">Output Tokens</p>
          <p className="text-sm font-mono text-zinc-200">
            {formatTokens(p.totalOutput)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-500">Cache Hit Rate</p>
          <p
            className={`text-sm font-mono ${cacheHitRate > 30 ? "text-emerald-400" : "text-zinc-200"}`}
          >
            {cacheHitRate}%
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-500">Avg $/Request</p>
          <p className="text-sm font-mono text-zinc-200">
            {formatCost(avgCostPerReq)}
          </p>
        </div>
      </div>

      {/* Model breakdown */}
      {models.length > 0 && (
        <div className="border-t border-zinc-800/50 pt-3 space-y-2">
          <p className="text-xs font-medium text-zinc-400">Models</p>
          {models.map((m) => {
            const modelPct =
              p.totalCost > 0 ? (m.cost / p.totalCost) * 100 : 0;
            return (
              <div key={m.model} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono truncate max-w-[60%]">
                    {m.model.split("/").pop()}
                  </span>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span>{m.requests} req</span>
                    <span>{formatTokens(m.input + m.output)} tok</span>
                    <span className="text-zinc-200 font-medium">
                      {formatCost(m.cost)}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar} opacity-60`}
                    style={{ width: `${Math.max(modelPct, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
