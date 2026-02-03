function i(e) {
  return e < 0.01
    ? `$${e.toFixed(4)}`
    : e < 1
      ? `$${e.toFixed(3)}`
      : `$${e.toFixed(2)}`;
}
function a(e) {
  return e >= 1e6
    ? `${(e / 1e6).toFixed(1)}M`
    : e >= 1e3
      ? `${(e / 1e3).toFixed(1)}K`
      : e.toString();
}
function u(e) {
  const t = Math.floor((Date.now() - e) / 1e3);
  if (t < 60) return `${t}s ago`;
  const r = Math.floor(t / 60);
  if (r < 60) return `${r}m ago`;
  const n = Math.floor(r / 60);
  return n < 24 ? `${n}h ago` : `${Math.floor(n / 24)}d ago`;
}
function c(e) {
  switch (e) {
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
function f(e) {
  switch (e) {
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
export { a, c as b, i as f, f as s, u as t };
