import { formatCost, formatTokens } from "@/lib/utils";

interface ProviderData {
  provider: string;
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  requestCount: number;
  models: Record<
    string,
    { model: string; cost: number; input: number; output: number; requests: number }
  >;
}

interface Props {
  providers: ProviderData[];
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-amber-500",
  openai: "bg-emerald-500",
  google: "bg-blue-500",
  "google-ai": "bg-blue-500",
  mistral: "bg-orange-500",
  groq: "bg-violet-500",
  openrouter: "bg-pink-500",
  unknown: "bg-zinc-500",
};

function getBarColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? PROVIDER_COLORS.unknown;
}

export function ProviderBreakdown({ providers }: Props) {
  if (!providers.length) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No provider data yet
      </div>
    );
  }

  const totalCost = providers.reduce((s, p) => s + p.totalCost, 0);

  return (
    <div className="space-y-4">
      {providers.map((p) => {
        const pct = totalCost > 0 ? (p.totalCost / totalCost) * 100 : 0;
        const cacheHitRate =
          p.totalInput > 0
            ? ((p.totalCacheRead / (p.totalInput + p.totalCacheRead)) * 100).toFixed(1)
            : "0";
        const models = Object.values(p.models).sort((a, b) => b.cost - a.cost);

        return (
          <div
            key={p.provider}
            className="border border-zinc-800 rounded-lg p-4 space-y-3"
          >
            {/* Provider header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getBarColor(p.provider)}`} />
                <span className="text-sm font-semibold text-zinc-200 capitalize">
                  {p.provider}
                </span>
                <span className="text-xs text-zinc-500">
                  {p.requestCount} requests
                </span>
              </div>
              <span className="text-sm font-mono font-medium text-zinc-200">
                {formatCost(p.totalCost)}
              </span>
            </div>

            {/* Cost bar */}
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(p.provider)}`}
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-zinc-500">Input</p>
                <p className="text-zinc-300 font-mono">
                  {formatTokens(p.totalInput)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Output</p>
                <p className="text-zinc-300 font-mono">
                  {formatTokens(p.totalOutput)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Cache Hit</p>
                <p className="text-zinc-300 font-mono">{cacheHitRate}%</p>
              </div>
              <div>
                <p className="text-zinc-500">Avg $/req</p>
                <p className="text-zinc-300 font-mono">
                  {formatCost(p.requestCount > 0 ? p.totalCost / p.requestCount : 0)}
                </p>
              </div>
            </div>

            {/* Model breakdown */}
            {models.length > 1 && (
              <div className="border-t border-zinc-800/50 pt-2 space-y-1">
                {models.map((m) => (
                  <div
                    key={m.model}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-500 font-mono truncate max-w-48">
                      {m.model.split("/").pop()}
                    </span>
                    <div className="flex gap-4 text-zinc-400">
                      <span>{m.requests} req</span>
                      <span>{formatTokens(m.input + m.output)} tok</span>
                      <span className="text-zinc-300 font-medium">
                        {formatCost(m.cost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
