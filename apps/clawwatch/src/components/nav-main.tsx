import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clawwatch/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import type { NavItem } from "@/components/app-sidebar";

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={
                  item.url === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.url)
                }
                render={(props) => <Link {...props} to={item.url} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
