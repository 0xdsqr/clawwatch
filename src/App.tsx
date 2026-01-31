import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { MetricsPage } from "./pages/MetricsPage";
import { CostExplorer } from "./pages/CostExplorer";
import { AlertsPage } from "./pages/AlertsPage";
import { ActivityFeed } from "./pages/ActivityFeed";
import { Settings } from "./pages/Settings";
import { Sidebar } from "./components/Sidebar";

type Page = "dashboard" | "metrics" | "costs" | "alerts" | "activity" | "settings";

export function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "metrics" && <MetricsPage />}
        {page === "costs" && <CostExplorer />}
        {page === "alerts" && <AlertsPage />}
        {page === "activity" && <ActivityFeed />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}
