import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, f as CardContent } from "./card-DVx9SFsi.mjs";
import { M as MiniActivityFeed } from "./mini-activity-feed-HU82k6s5.mjs";
import { u as useQuery } from "../_libs/convex.mjs";
import "./router-DJkLI7Pk.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_chunks/_libs/@tanstack/query-core.mjs";
import "../_libs/lucide-react.mjs";
import "./utils-B-v2tgNy.mjs";
function ActivityPage() {
  const activities = useQuery(api.activities.recent, {
    limit: 100
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 flex-col gap-6 p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Activity Feed" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MiniActivityFeed, { activities: activities ?? [] }) })
  ] }) });
}
export {
  ActivityPage as component
};
