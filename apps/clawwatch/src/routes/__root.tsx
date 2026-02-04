import { SidebarInset, SidebarProvider } from "@clawwatch/ui/components/sidebar";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import appCss from "../styles.css?url";

// Browser: route through Vite proxy (/_convex → Convex :3210)
// to avoid exit node / firewall blocking port 3210.
// Uses /_convex prefix because TanStack Start/Nitro intercepts /api.
// SSR: direct connection to Convex backend.
function getConvexUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/_convex`;
  }
  return import.meta.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";
}

const convex = new ConvexReactClient(getConvexUrl());

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "ClawWatch — Agent Monitoring" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/clawwatch-owl.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootLayout,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider defaultTheme="dark" storageKey="clawwatch-theme">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
