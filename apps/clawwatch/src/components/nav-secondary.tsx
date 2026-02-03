import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@clawwatch/ui/components/sidebar";
import { cn } from "@clawwatch/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import type { NavItem } from "@/components/app-sidebar";

interface NavSecondaryProps extends React.ComponentProps<typeof SidebarGroup> {
  items: NavItem[];
}

export function NavSecondary({ items, ...props }: NavSecondaryProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                size="sm"
                isActive={currentPath.startsWith(item.url)}
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
