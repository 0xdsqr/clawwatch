import { g as d, j as r } from "./main-DhZaiQhw.js";
const i = new Proxy(
  {},
  {
    get(t, a) {
      return new Proxy(
        {},
        {
          get(s, e) {
            return `${String(a)}.${String(e)}`;
          },
        },
      );
    },
  },
);
function n({ className: t, size: a = "default", ...s }) {
  return r.jsx("div", {
    "data-slot": "card",
    "data-size": a,
    className: d(
      "ring-foreground/10 bg-card text-card-foreground gap-6 overflow-hidden rounded-xl py-6 text-sm shadow-xs ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col",
      t,
    ),
    ...s,
  });
}
function c({ className: t, ...a }) {
  return r.jsx("div", {
    "data-slot": "card-header",
    className: d(
      "gap-1 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
      t,
    ),
    ...a,
  });
}
function u({ className: t, ...a }) {
  return r.jsx("div", {
    "data-slot": "card-title",
    className: d(
      "text-base leading-normal font-medium group-data-[size=sm]/card:text-sm",
      t,
    ),
    ...a,
  });
}
function l({ className: t, ...a }) {
  return r.jsx("div", {
    "data-slot": "card-description",
    className: d("text-muted-foreground text-sm", t),
    ...a,
  });
}
function g({ className: t, ...a }) {
  return r.jsx("div", {
    "data-slot": "card-action",
    className: d(
      "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
      t,
    ),
    ...a,
  });
}
function x({ className: t, ...a }) {
  return r.jsx("div", {
    "data-slot": "card-content",
    className: d("px-6 group-data-[size=sm]/card:px-4", t),
    ...a,
  });
}
export { n as C, i as a, c as b, u as c, l as d, g as e, x as f };
