import {
  LayoutDashboard,
  DollarSign,
  Bell,
  Activity,
  Settings,
  Radar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "metrics" as const, label: "Metrics", icon: BarChart3 },
  { id: "costs" as const, label: "Cost Explorer", icon: DollarSign },
  { id: "alerts" as const, label: "Alarms", icon: Bell },
  { id: "activity" as const, label: "Activity", icon: Activity },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

type Page = "dashboard" | "metrics" | "costs" | "alerts" | "activity" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-keel-500/20 flex items-center justify-center">
          <Radar className="w-5 h-5 text-keel-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100">ClawWatch</h1>
          <p className="text-xs text-zinc-500">Agent Monitoring</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
              currentPage === item.id
                ? "bg-keel-500/10 text-keel-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">
          ClawWatch v0.1.0 — Self-hosted
        </div>
      </div>
    </aside>
  );
}
