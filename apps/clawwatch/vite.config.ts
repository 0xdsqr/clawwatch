import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import httpProxy from "http-proxy";
import { nitro } from "nitro/vite";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

/**
 * Custom Vite plugin to proxy /_convex → Convex backend.
 *
 * Vite's built-in server.proxy and Nitro's devProxy both get intercepted by
 * TanStack Start's SSR middleware (Nitro catches all paths as "Not Found").
 * This plugin hooks into configureServer to register middleware + WebSocket
 * upgrade handling BEFORE the SSR middleware processes the request.
 */
function convexProxy(convexBackend: string): Plugin {
  return {
    name: "convex-proxy",
    configureServer(server) {
      const proxy = httpProxy.createProxyServer({
        target: convexBackend,
        changeOrigin: true,
        ws: true,
      });

      proxy.on("error", (err, _req, res) => {
        console.error("[convex-proxy] error:", err.message);
        if (res && "writeHead" in res && !res.headersSent) {
          (res as import("node:http").ServerResponse).writeHead(502);
          (res as import("node:http").ServerResponse).end("Convex proxy error");
        }
      });

      // HTTP requests: intercept before SSR middleware
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/_convex")) {
          req.url = req.url.replace(/^\/_convex/, "");
          proxy.web(req, res);
        } else {
          next();
        }
      });

      // WebSocket upgrade: must listen on the raw HTTP server
      server.httpServer?.on("upgrade", (req, socket, head) => {
        if (req.url?.startsWith("/_convex")) {
          req.url = req.url.replace(/^\/_convex/, "");
          proxy.ws(req, socket, head);
        }
      });
    },
  };
}

function isLocalConvexUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("100.") ||
      hostname.startsWith("192.")
    );
  } catch {
    return false;
  }
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname, "../..");
  const env = loadEnv(mode, envDir, "");
  const convexBackend = env.VITE_CONVEX_URL || env.CONVEX_URL;
  const shouldProxyConvex = isLocalConvexUrl(env.VITE_CONVEX_URL);

  return {
    envDir,
    plugins: [
      // convexProxy MUST be first so its middleware runs before everything else
      ...(shouldProxyConvex && convexBackend ? [convexProxy(convexBackend)] : []),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      nitro(),
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: true,
    },
  };
});
