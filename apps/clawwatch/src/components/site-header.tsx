import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@clawwatch/ui/components/breadcrumb";
import { Separator } from "@clawwatch/ui/components/separator";
import { SidebarTrigger } from "@clawwatch/ui/components/sidebar";
import { useRouterState } from "@tanstack/react-router";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/agents": "Agents",
  "/monitoring": "Monitoring",
  "/events": "Events",
  "/alerting": "Alerting",
  "/settings": "Settings",
};

export function SiteHeader() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const segments = currentPath.split("/").filter(Boolean);
  const pageTitle =
    ROUTE_LABELS[currentPath] ??
    ROUTE_LABELS[`/${segments[0]}`] ??
    segments[segments.length - 1] ??
    "Overview";

  const parentRoute = segments.length > 1 ? `/${segments[0]}` : null;
  const parentLabel = parentRoute ? ROUTE_LABELS[parentRoute] : null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {parentLabel && (
            <>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">{parentLabel}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
