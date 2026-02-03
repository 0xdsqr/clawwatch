import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only on the client (after hydration).
 * Use for components that depend on DOM measurements (e.g. recharts).
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
