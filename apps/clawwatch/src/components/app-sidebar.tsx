import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clawwatch/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Activity, Bell, Bot, LayoutDashboard, Radio, Settings } from "lucide-react";
import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainItems: NavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Monitoring", url: "/monitoring", icon: Activity },
  { title: "Events", url: "/events", icon: Radio },
  { title: "Alerting", url: "/alerting", icon: Bell },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <img src="/clawwatch-owl.svg" alt="ClawWatch" className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0 leading-none">
                <span className="text-sm font-semibold tracking-tight">ClawWatch</span>
                <span className="text-[11px] text-muted-foreground">Agent Monitoring</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              render={({ ref: _ref, ...props }) => <Link {...props} to="/settings" />}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
