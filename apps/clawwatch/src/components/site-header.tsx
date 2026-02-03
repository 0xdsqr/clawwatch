import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@clawwatch/ui/components/breadcrumb";
import { Separator } from "@clawwatch/ui/components/separator";
import { SidebarTrigger } from "@clawwatch/ui/components/sidebar";
import { useRouterState } from "@tanstack/react-router";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/agents": "Agents",
  "/costs": "Costs",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

export function SiteHeader() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const pageTitle = ROUTE_LABELS[currentPath] ?? "ClawWatch";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
