import { b as a, c, f as n, C as r, a as s } from "./card-7H36IGPB.js";
import { j as i, k as t } from "./main-DhZaiQhw.js";
import { M as o } from "./mini-activity-feed-Bc16nSX4.js";
import "./utils-BIlMNCOp.js";
import "./triangle-alert-CdUHjP11.js";
function f() {
  const e = t(s.activities.recent, { limit: 100 });
  return i.jsx("div", {
    className: "flex flex-1 flex-col gap-6 p-6",
    children: i.jsxs(r, {
      children: [
        i.jsx(a, { children: i.jsx(c, { children: "Activity Feed" }) }),
        i.jsx(n, { children: i.jsx(o, { activities: e ?? [] }) }),
      ],
    }),
  });
}
export { f as component };
