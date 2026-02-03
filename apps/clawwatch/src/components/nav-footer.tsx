import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clawwatch/ui/components/sidebar";
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
          <ThemeIcon className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">
            {theme === "dark"
              ? "Dark mode"
              : theme === "light"
                ? "Light mode"
                : "System"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <div className="px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground/50">
            ClawWatch v0.1.0
          </span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
