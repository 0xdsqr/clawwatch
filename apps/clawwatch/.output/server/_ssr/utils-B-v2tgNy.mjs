function formatCost(dollars) {
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  if (dollars < 1) return `$${dollars.toFixed(3)}`;
  return `$${dollars.toFixed(2)}`;
}
function formatTokens(tokens) {
  if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
  if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
  return tokens.toString();
}
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1e3);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
function statusColor(status) {
  switch (status) {
    case "online":
      return "text-emerald-400";
    case "offline":
      return "text-red-400";
    case "degraded":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}
function severityColor(severity) {
  switch (severity) {
    case "critical":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "warning":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "info":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}
export {
  formatTokens as a,
  statusColor as b,
  formatCost as f,
  severityColor as s,
  timeAgo as t
};
