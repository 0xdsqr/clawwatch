globalThis.__nitro_main__ = import.meta.url;
import { N as NodeResponse, s as serve } from "./_libs/srvx.mjs";
import { d as defineHandler, H as HTTPError, t as toEventHandler, a as defineLazyEventHandler, b as H3Core, c as toRequest } from "./_libs/h3.mjs";
import { d as decodePath, w as withLeadingSlash, a as withoutTrailingSlash, j as joinURL } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "node:http";
import "node:stream";
import "node:https";
import "node:http2";
import "./_libs/rou3.mjs";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = event.url || new URL(event.req.url);
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.req.method}] ${url}
`, error);
  }
  const headers2 = {
    "content-type": "application/json",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers2["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    status,
    statusText: error.statusText,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status,
    statusText: error.statusText,
    headers: headers2,
    body
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/clawwatch.svg": {
    "type": "image/svg+xml",
    "etag": '"13a-Cp5iaI9k6nmM/mRqTlMKTGKx248"',
    "mtime": "2026-02-03T03:06:18.863Z",
    "size": 314,
    "path": "../public/clawwatch.svg"
  },
  "/assets/activity-D2gVynAS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1fb-xm95EcJZwVDKte5v9JRQVviMW0Q"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 507,
    "path": "../public/assets/activity-D2gVynAS.js"
  },
  "/assets/card-7H36IGPB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"641-nbH4xYY7iaPABcDBQSCrT15ARV4"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 1601,
    "path": "../public/assets/card-7H36IGPB.js"
  },
  "/assets/cost-chart-D4Y8yH8P.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"61f-+rnOaAydh7vEGDSSFbFT/SN8GcY"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 1567,
    "path": "../public/assets/cost-chart-D4Y8yH8P.js"
  },
  "/assets/alerts-BiIrU8x9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1150-fY2PPEcHWt5+NmZMipwKeqEMopA"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 4432,
    "path": "../public/assets/alerts-BiIrU8x9.js"
  },
  "/assets/cost-chart-internal-CIMiBzeM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5d0-Z61Rr7uTioc3d0jk2djDQVPTAl8"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 1488,
    "path": "../public/assets/cost-chart-internal-CIMiBzeM.js"
  },
  "/assets/costs-C_Rega1X.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"dce-JKC0Iw2Yt0SLtQ3LVr1DKlt2F7g"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 3534,
    "path": "../public/assets/costs-C_Rega1X.js"
  },
  "/assets/geist-mono-cyrillic-400-normal-BPBWmzPh.woff": {
    "type": "font/woff",
    "etag": '"1bfc-c8bzIVH0KpW5esb/V/ACyPMhKE0"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 7164,
    "path": "../public/assets/geist-mono-cyrillic-400-normal-BPBWmzPh.woff"
  },
  "/assets/geist-mono-cyrillic-400-normal-Ce5q_31Z.woff2": {
    "type": "font/woff2",
    "etag": '"1554-K5CHP5r70mrGYrEeCSRhLvS8Kps"',
    "mtime": "2026-02-03T03:06:19.177Z",
    "size": 5460,
    "path": "../public/assets/geist-mono-cyrillic-400-normal-Ce5q_31Z.woff2"
  },
  "/assets/geist-mono-latin-ext-400-normal-Cgks_Qgx.woff2": {
    "type": "font/woff2",
    "etag": '"1918-XYo3oQH6flyNZSJUIYBYtGa9A2Y"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 6424,
    "path": "../public/assets/geist-mono-latin-ext-400-normal-Cgks_Qgx.woff2"
  },
  "/assets/geist-mono-latin-400-normal-LC9RFr9I.woff2": {
    "type": "font/woff2",
    "etag": '"3978-0jOPzRjSdhaSgx3UsBELhTu+iYw"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 14712,
    "path": "../public/assets/geist-mono-latin-400-normal-LC9RFr9I.woff2"
  },
  "/assets/geist-mono-latin-400-normal-CoULgQGM.woff": {
    "type": "font/woff",
    "etag": '"4ae0-qvO//GrrvcJv+bqsyhS/1I4eUFA"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 19168,
    "path": "../public/assets/geist-mono-latin-400-normal-CoULgQGM.woff"
  },
  "/assets/geist-mono-latin-ext-400-normal-CxNRRMGd.woff": {
    "type": "font/woff",
    "etag": '"2228-UwpJKGuW+u6jAt0TTvRMpTl9ciU"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 8744,
    "path": "../public/assets/geist-mono-latin-ext-400-normal-CxNRRMGd.woff"
  },
  "/assets/AreaChart-t9V0r8-s.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"50759-cRcizCDj0odt2Y2A/rRnr20RgZc"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 329561,
    "path": "../public/assets/AreaChart-t9V0r8-s.js"
  },
  "/assets/geist-sans-latin-400-normal-BOaIZNA2.woff": {
    "type": "font/woff",
    "etag": '"9800-gmlNOsSjSWPuV/UJv7wPJT6Ti18"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 38912,
    "path": "../public/assets/geist-sans-latin-400-normal-BOaIZNA2.woff"
  },
  "/assets/index-BUQOF6qU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3aa2-s+e5CmkRHVjbJ59yDHPA6EZjvxY"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 15010,
    "path": "../public/assets/index-BUQOF6qU.js"
  },
  "/assets/settings-rVpaouZy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2ccf-xov1xQtD5YqPGcTrbh2azLoOxIc"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 11471,
    "path": "../public/assets/settings-rVpaouZy.js"
  },
  "/assets/mini-activity-feed-Bc16nSX4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9e4-ku/tdIm/gJzuG8+QmqBTXWH6bF8"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 2532,
    "path": "../public/assets/mini-activity-feed-Bc16nSX4.js"
  },
  "/assets/metrics-BcBBi4Hd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8c90-D0YYMB59RczjBssiZRNUrPQlsz4"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 35984,
    "path": "../public/assets/metrics-BcBBi4Hd.js"
  },
  "/assets/geist-sans-latin-400-normal-gapTbOY8.woff2": {
    "type": "font/woff2",
    "etag": '"8278-BL/1we+Fux5TMPkgvmAhfnvw2wk"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 33400,
    "path": "../public/assets/geist-sans-latin-400-normal-gapTbOY8.woff2"
  },
  "/assets/triangle-alert-CdUHjP11.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"109-VuozoOmdA13orHxQzpQ3dNeMScA"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 265,
    "path": "../public/assets/triangle-alert-CdUHjP11.js"
  },
  "/assets/utils-BIlMNCOp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"37e-kO08Kt1wzf8UokTD/aWK+sSYLWI"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 894,
    "path": "../public/assets/utils-BIlMNCOp.js"
  },
  "/assets/x-TOvDNqrr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"12c-HsceJQDYRku8ErrnYjyyTXOaDBU"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 300,
    "path": "../public/assets/x-TOvDNqrr.js"
  },
  "/assets/styles-Dc4xtuqV.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"22725-eqPW+WP5KVaW0/VLDcB4II5YCd8"',
    "mtime": "2026-02-03T03:06:19.178Z",
    "size": 141093,
    "path": "../public/assets/styles-Dc4xtuqV.css"
  },
  "/assets/main-DhZaiQhw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8de91-iK9PJQJeH8TXzcdsmtqZBL2xP7Y"',
    "mtime": "2026-02-03T03:06:19.179Z",
    "size": 581265,
    "path": "../public/assets/main-DhZaiQhw.js"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br"
};
const _0PpKQ2 = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    s.length - 1;
    if (s[1] === "assets") {
      r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
    }
    return r;
  };
})();
const _lazy_HVLSM5 = defineLazyEventHandler(() => Promise.resolve().then(function() {
  return ssrRenderer$1;
}));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_HVLSM5 };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_0PpKQ2)
].filter(Boolean);
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function createNitroApp() {
  const hooks = void 0;
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({
          error,
          context: errorCtx
        });
      }
    }
  };
  const h3App = createH3App({ onError(error, event) {
    return errorHandler(error, event);
  } });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  const app = {
    fetch: appHandler,
    h3: h3App,
    hooks,
    captureError
  };
  return app;
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  {
    h3App["~getMiddleware"] = (event, route) => {
      const pathname = event.url.pathname;
      const method = event.req.method;
      const middleware = [];
      {
        const routeRules = getRouteRules(method, pathname);
        event.context.routeRules = routeRules?.routeRules;
        if (routeRules?.routeRuleMiddleware.length) {
          middleware.push(...routeRules.routeRuleMiddleware);
        }
      }
      middleware.push(...h3App["~middleware"]);
      if (route?.data?.middleware?.length) {
        middleware.push(...route.data.middleware);
      }
      return middleware;
    };
  }
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};
function fetchViteEnv(viteEnvName, input, init) {
  const envs = globalThis.__nitro_vite_envs__ || {};
  const viteEnv = envs[viteEnvName];
  if (!viteEnv) {
    throw HTTPError.status(404);
  }
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}
const ssrRenderer$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ssrRenderer
});
export {
  nodeServer as default
};
