import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@clawwatch/ui/components/sidebar";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function NavFooter() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="sm" onClick={toggleTheme}>
          <ThemeIcon className="h-3.5 w-3.5" />
          <span className="text-xs text-muted-foreground">
            {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <div className="px-2 py-1">
          <span className="text-[10px] font-mono text-muted-foreground/40">v0.1.0</span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
