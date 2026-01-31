import { useState, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";

// Lazy load pages to reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const MetricsPage = lazy(() => import("./pages/MetricsPage").then(m => ({ default: m.MetricsPage })));
const CostExplorer = lazy(() => import("./pages/CostExplorer").then(m => ({ default: m.CostExplorer })));
const AlertsPage = lazy(() => import("./pages/AlertsPage").then(m => ({ default: m.AlertsPage })));
const ActivityFeed = lazy(() => import("./pages/ActivityFeed").then(m => ({ default: m.ActivityFeed })));
const SessionExplorer = lazy(() => import("./pages/SessionExplorer").then(m => ({ default: m.SessionExplorer })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const ProvidersPage = lazy(() => import("./pages/ProvidersPage").then(m => ({ default: m.ProvidersPage })));

type Page =
  | "dashboard"
  | "metrics"
  | "costs"
  | "providers"
  | "sessions"
  | "alerts"
  | "activity"
  | "settings";

export function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-zinc-400">Loading...</div>
          </div>
        }>
          {page === "dashboard" && <Dashboard />}
          {page === "metrics" && <MetricsPage />}
          {page === "costs" && <CostExplorer />}
          {page === "providers" && <ProvidersPage />}
          {page === "sessions" && <SessionExplorer />}
          {page === "alerts" && <AlertsPage />}
          {page === "activity" && <ActivityFeed />}
          {page === "settings" && <Settings />}
        </Suspense>
      </main>
    </div>
  );
}
