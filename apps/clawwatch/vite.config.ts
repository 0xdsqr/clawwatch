import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import httpProxy from "http-proxy";
import { nitro } from "nitro/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const CONVEX_BACKEND = "http://100.115.177.85:3210";

/**
 * Custom Vite plugin to proxy /_convex → Convex backend.
 *
 * Vite's built-in server.proxy and Nitro's devProxy both get intercepted by
 * TanStack Start's SSR middleware (Nitro catches all paths as "Not Found").
 * This plugin hooks into configureServer to register middleware + WebSocket
 * upgrade handling BEFORE the SSR middleware processes the request.
 */
function convexProxy(): Plugin {
  return {
    name: "convex-proxy",
    configureServer(server) {
      const proxy = httpProxy.createProxyServer({
        target: CONVEX_BACKEND,
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

const config = defineConfig({
  envDir: path.resolve(import.meta.dirname, "../.."),
  plugins: [
    // convexProxy MUST be first so its middleware runs before everything else
    convexProxy(),
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
});

export default config;
