import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clawwatch/ui/components/sidebar";
import {
  Bell,
  Bot,
  DollarSign,
  LayoutDashboard,
  Radar,
  Settings,
} from "lucide-react";
import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainItems: NavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Costs", url: "/costs", icon: DollarSign },
  { title: "Alerts", url: "/alerts", icon: Bell },
];

const secondaryItems: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radar className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">ClawWatch</span>
                <span className="text-xs text-muted-foreground">
                  Agent Monitoring
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainItems} />
        <NavSecondary items={secondaryItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
