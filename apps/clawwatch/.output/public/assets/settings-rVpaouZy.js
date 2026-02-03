import {
  e as $,
  f as A,
  b as H,
  a as S,
  C as U,
  c as W,
  d as z,
} from "./card-7H36IGPB.js";
import {
  f as ae,
  D as ce,
  e as de,
  j as e,
  E as G,
  N as g,
  c as ie,
  l as L,
  r as l,
  u as le,
  B as N,
  i as ne,
  n as oe,
  b as q,
  a as R,
  d as re,
  m as ue,
  g as X,
  k as Y,
  h as Z,
} from "./main-DhZaiQhw.js";
import { f as me } from "./utils-BIlMNCOp.js";
const J = ((t) => (
  (t.disabled = "data-disabled"),
  (t.valid = "data-valid"),
  (t.invalid = "data-invalid"),
  (t.touched = "data-touched"),
  (t.dirty = "data-dirty"),
  (t.filled = "data-filled"),
  (t.focused = "data-focused"),
  t
))({});
const fe = {
    badInput: !1,
    customError: !1,
    patternMismatch: !1,
    rangeOverflow: !1,
    rangeUnderflow: !1,
    stepMismatch: !1,
    tooLong: !1,
    tooShort: !1,
    typeMismatch: !1,
    valid: null,
    valueMissing: !1,
  },
  xe = {
    valid(t) {
      return t === null ? null : t ? { [J.valid]: "" } : { [J.invalid]: "" };
    },
  },
  he = l.createContext({
    invalid: void 0,
    name: void 0,
    validityData: {
      state: fe,
      errors: [],
      error: "",
      value: "",
      initialValue: null,
    },
    setValidityData: g,
    disabled: void 0,
    touched: !1,
    setTouched: g,
    dirty: !1,
    setDirty: g,
    filled: !1,
    setFilled: g,
    focused: !1,
    setFocused: g,
    validate: () => null,
    validationMode: "onSubmit",
    validationDebounceTime: 0,
    shouldValidateOnChange: () => !1,
    state: {
      disabled: !1,
      valid: null,
      touched: !1,
      dirty: !1,
      filled: !1,
      focused: !1,
    },
    markedDirtyRef: { current: !1 },
    validation: {
      getValidationProps: (t = G) => t,
      getInputValidationProps: (t = G) => t,
      inputRef: { current: null },
      commit: async () => {},
    },
  });
function O(t = !0) {
  const a = l.useContext(he);
  if (a.setValidityData === g && !t) throw new Error(ae(28));
  return a;
}
const pe = l.createContext({
  formRef: { current: { fields: new Map() } },
  errors: {},
  clearErrors: g,
  validationMode: "onSubmit",
  submitAttemptedRef: { current: !1 },
});
function ge() {
  return l.useContext(pe);
}
const ve = l.createContext({
  controlId: void 0,
  setControlId: g,
  labelId: void 0,
  setLabelId: g,
  messageIds: [],
  setMessageIds: g,
  getDescriptionProps: (t) => t,
});
function ee() {
  return l.useContext(ve);
}
function be(t, a) {
  return { ...t, state: { ...t.state, valid: !a && t.state.valid } };
}
function je({ controlled: t, default: a, name: i, state: c = "value" }) {
  const { current: m } = l.useRef(t !== void 0),
    [r, d] = l.useState(a),
    n = m ? t : r,
    b = l.useCallback((v) => {
      m || d(v);
    }, []);
  return [n, b];
}
function ye(t = {}) {
  const { id: a, implicit: i = !1, controlRef: c } = t,
    { controlId: m, setControlId: r } = ee(),
    d = le(a);
  return (
    R(() => {
      if (!((!i && !a) || r === g)) {
        if (i) {
          const n = c?.current;
          ne(n) && n.closest("label") != null ? r(a ?? null) : r(m ?? d);
        } else a && r(a);
        return () => {
          a && r(void 0);
        };
      }
    }, [a, c, m, r, i, d]),
    m ?? d
  );
}
function Ce(t) {
  const {
      enabled: a = !0,
      value: i,
      id: c,
      name: m,
      controlRef: r,
      commit: d,
    } = t,
    { formRef: n } = ge(),
    {
      invalid: b,
      markedDirtyRef: v,
      validityData: h,
      setValidityData: y,
    } = O(),
    f = q(t.getValue);
  R(() => {
    if (!a) return;
    let u = i;
    u === void 0 && (u = f()),
      h.initialValue === null &&
        u !== null &&
        y((p) => ({ ...p, initialValue: u }));
  }, [a, y, i, h.initialValue, f]),
    R(() => {
      !a ||
        !c ||
        n.current.fields.set(c, {
          getValue: f,
          name: m,
          controlRef: r,
          validityData: be(h, b),
          validate(u = !0) {
            let p = i;
            p === void 0 && (p = f()),
              (v.current = !0),
              u ? ie.flushSync(() => d(p)) : d(p);
          },
        });
    }, [d, r, a, n, f, c, b, v, m, h, i]),
    R(() => {
      const u = n.current.fields;
      return () => {
        c && u.delete(c);
      };
    }, [n, c]);
}
const Ne = l.forwardRef((a, i) => {
    const {
        render: c,
        className: m,
        id: r,
        name: d,
        value: n,
        disabled: b = !1,
        onValueChange: v,
        defaultValue: h,
        ...y
      } = a,
      { state: f, name: u, disabled: p } = O(),
      V = p || b,
      I = u ?? d,
      _ = l.useMemo(() => ({ ...f, disabled: V }), [f, V]),
      {
        setTouched: j,
        setDirty: F,
        validityData: E,
        setFocused: M,
        setFilled: C,
        validationMode: T,
        validation: x,
      } = O(),
      { labelId: B } = ee(),
      D = ye({ id: r });
    R(() => {
      const o = n != null;
      x.inputRef.current?.value || (o && n !== "")
        ? C(!0)
        : o && n === "" && C(!1);
    }, [x.inputRef, C, n]);
    const [P, s] = je({
        controlled: n,
        default: h,
        name: "FieldControl",
        state: "value",
      }),
      te = n !== void 0,
      se = q((o, k) => {
        v?.(o, k), !k.isCanceled && s(o);
      });
    return (
      Ce({
        id: D,
        name: I,
        commit: x.commit,
        value: P,
        getValue: () => x.inputRef.current?.value,
        controlRef: x.inputRef,
      }),
      re("input", a, {
        ref: i,
        state: _,
        props: [
          {
            id: D,
            disabled: V,
            name: I,
            ref: x.inputRef,
            "aria-labelledby": B,
            ...(te ? { value: P } : { defaultValue: h }),
            onChange(o) {
              const k = o.currentTarget.value;
              se(k, de(oe, o.nativeEvent)),
                F(k !== E.initialValue),
                C(k !== "");
            },
            onFocus() {
              M(!0);
            },
            onBlur(o) {
              j(!0), M(!1), T === "onBlur" && x.commit(o.currentTarget.value);
            },
            onKeyDown(o) {
              o.currentTarget.tagName === "INPUT" &&
                o.key === "Enter" &&
                (j(!0), x.commit(o.currentTarget.value));
            },
          },
          x.getInputValidationProps(),
          y,
        ],
        stateAttributesMapping: xe,
      })
    );
  }),
  we = l.forwardRef((a, i) => e.jsx(Ne, { ref: i, ...a }));
function w({ className: t, type: a, ...i }) {
  return e.jsx(we, {
    type: a,
    "data-slot": "input",
    className: X(
      "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      t,
    ),
    ...i,
  });
}
const ke = [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }],
  ],
  K = Z("plus", ke);
const Se = [
    ["path", { d: "M10 11v6", key: "nco0om" }],
    ["path", { d: "M14 11v6", key: "outv1u" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
  ],
  Q = Z("trash-2", Se);
function Re() {
  const t = Y(S.notifications.list),
    a = Y(S.budgets.list),
    i = L(S.budgets.create),
    c = L(S.budgets.remove),
    m = L(S.notifications.create),
    r = L(S.notifications.remove),
    [d, n] = l.useState(!1),
    [b, v] = l.useState(!1),
    [h, y] = l.useState(""),
    [f, u] = l.useState("10"),
    [p, V] = l.useState("daily"),
    [I, _] = l.useState(!1),
    [j, F] = l.useState("discord"),
    [E, M] = l.useState(""),
    [C, T] = l.useState(""),
    [x, B] = l.useState(""),
    D = async () => {
      !h ||
        !f ||
        (await i({
          name: h,
          limitDollars: parseFloat(f),
          period: p,
          hardStop: I,
        }),
        y(""),
        u("10"),
        n(!1));
    },
    P = async () => {
      E &&
        (await m({
          type: j,
          name: E,
          config: { webhookUrl: C || void 0, email: x || void 0 },
        }),
        M(""),
        T(""),
        B(""),
        v(!1));
    };
  return e.jsxs("div", {
    className: "flex flex-1 flex-col gap-6 p-6 max-w-4xl",
    children: [
      e.jsxs(U, {
        children: [
          e.jsxs(H, {
            children: [
              e.jsx(W, { children: "Budgets" }),
              e.jsx(z, { children: "Set spending limits for your agents" }),
              e.jsx($, {
                children: e.jsxs(N, {
                  variant: "outline",
                  size: "sm",
                  onClick: () => n(!d),
                  children: [
                    e.jsx(K, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "Add Budget",
                  ],
                }),
              }),
            ],
          }),
          e.jsxs(A, {
            children: [
              d &&
                e.jsxs("div", {
                  className: "mb-4 space-y-3 rounded-lg border bg-muted/30 p-4",
                  children: [
                    e.jsx(w, {
                      placeholder: "Budget name",
                      value: h,
                      onChange: (s) => y(s.target.value),
                    }),
                    e.jsxs("div", {
                      className: "flex gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "flex-1",
                          children: [
                            e.jsx("label", {
                              className:
                                "mb-1 block text-xs text-muted-foreground",
                              children: "Limit ($)",
                            }),
                            e.jsx(w, {
                              type: "number",
                              step: "0.01",
                              value: f,
                              onChange: (s) => u(s.target.value),
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className: "flex-1",
                          children: [
                            e.jsx("label", {
                              className:
                                "mb-1 block text-xs text-muted-foreground",
                              children: "Period",
                            }),
                            e.jsxs("select", {
                              value: p,
                              onChange: (s) => V(s.target.value),
                              className:
                                "w-full rounded-md border bg-background px-3 py-2 text-sm",
                              children: [
                                e.jsx("option", {
                                  value: "hourly",
                                  children: "Hourly",
                                }),
                                e.jsx("option", {
                                  value: "daily",
                                  children: "Daily",
                                }),
                                e.jsx("option", {
                                  value: "weekly",
                                  children: "Weekly",
                                }),
                                e.jsx("option", {
                                  value: "monthly",
                                  children: "Monthly",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs("label", {
                      className: "flex items-center gap-2 text-sm",
                      children: [
                        e.jsx("input", {
                          type: "checkbox",
                          checked: I,
                          onChange: (s) => _(s.target.checked),
                          className: "rounded border-border",
                        }),
                        "Hard stop (pause agent when exceeded)",
                      ],
                    }),
                    e.jsxs("div", {
                      className: "flex justify-end gap-2",
                      children: [
                        e.jsx(N, {
                          variant: "ghost",
                          size: "sm",
                          onClick: () => n(!1),
                          children: "Cancel",
                        }),
                        e.jsx(N, {
                          size: "sm",
                          onClick: D,
                          children: "Create",
                        }),
                      ],
                    }),
                  ],
                }),
              a && a.length > 0
                ? e.jsx("div", {
                    className: "space-y-2",
                    children: a.map((s) =>
                      e.jsxs(
                        "div",
                        {
                          className:
                            "flex items-center justify-between rounded-lg border p-3",
                          children: [
                            e.jsxs("div", {
                              className: "flex items-center gap-3",
                              children: [
                                e.jsx(ce, {
                                  className: "h-4 w-4 text-muted-foreground",
                                }),
                                e.jsxs("div", {
                                  children: [
                                    e.jsx("p", {
                                      className: "text-sm font-medium",
                                      children: s.name,
                                    }),
                                    e.jsxs("p", {
                                      className:
                                        "text-xs text-muted-foreground",
                                      children: [
                                        me(s.limitDollars),
                                        " / ",
                                        s.period,
                                        s.hardStop && " · Hard stop",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            e.jsx("button", {
                              onClick: () => c({ id: s._id }),
                              className:
                                "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400",
                              children: e.jsx(Q, { className: "h-4 w-4" }),
                            }),
                          ],
                        },
                        s._id,
                      ),
                    ),
                  })
                : e.jsx("p", {
                    className: "py-4 text-center text-sm text-muted-foreground",
                    children: "No budgets configured",
                  }),
            ],
          }),
        ],
      }),
      e.jsxs(U, {
        children: [
          e.jsxs(H, {
            children: [
              e.jsx(W, { children: "Notification Channels" }),
              e.jsx(z, { children: "Where alerts get delivered" }),
              e.jsx($, {
                children: e.jsxs(N, {
                  variant: "outline",
                  size: "sm",
                  onClick: () => v(!b),
                  children: [
                    e.jsx(K, { className: "mr-1.5 h-3.5 w-3.5" }),
                    "Add Channel",
                  ],
                }),
              }),
            ],
          }),
          e.jsxs(A, {
            children: [
              b &&
                e.jsxs("div", {
                  className: "mb-4 space-y-3 rounded-lg border bg-muted/30 p-4",
                  children: [
                    e.jsxs("div", {
                      className: "flex gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "flex-1",
                          children: [
                            e.jsx("label", {
                              className:
                                "mb-1 block text-xs text-muted-foreground",
                              children: "Type",
                            }),
                            e.jsxs("select", {
                              value: j,
                              onChange: (s) => F(s.target.value),
                              className:
                                "w-full rounded-md border bg-background px-3 py-2 text-sm",
                              children: [
                                e.jsx("option", {
                                  value: "discord",
                                  children: "Discord Webhook",
                                }),
                                e.jsx("option", {
                                  value: "email",
                                  children: "Email",
                                }),
                                e.jsx("option", {
                                  value: "webhook",
                                  children: "Custom Webhook",
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className: "flex-1",
                          children: [
                            e.jsx("label", {
                              className:
                                "mb-1 block text-xs text-muted-foreground",
                              children: "Name",
                            }),
                            e.jsx(w, {
                              placeholder: "e.g. #alerts",
                              value: E,
                              onChange: (s) => M(s.target.value),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (j === "discord" || j === "webhook") &&
                      e.jsx(w, {
                        type: "url",
                        placeholder: "Webhook URL",
                        value: C,
                        onChange: (s) => T(s.target.value),
                      }),
                    j === "email" &&
                      e.jsx(w, {
                        type: "email",
                        placeholder: "Email address",
                        value: x,
                        onChange: (s) => B(s.target.value),
                      }),
                    e.jsxs("div", {
                      className: "flex justify-end gap-2",
                      children: [
                        e.jsx(N, {
                          variant: "ghost",
                          size: "sm",
                          onClick: () => v(!1),
                          children: "Cancel",
                        }),
                        e.jsx(N, {
                          size: "sm",
                          onClick: P,
                          children: "Create",
                        }),
                      ],
                    }),
                  ],
                }),
              t && t.length > 0
                ? e.jsx("div", {
                    className: "space-y-2",
                    children: t.map((s) =>
                      e.jsxs(
                        "div",
                        {
                          className:
                            "flex items-center justify-between rounded-lg border p-3",
                          children: [
                            e.jsxs("div", {
                              className: "flex items-center gap-3",
                              children: [
                                e.jsx(ue, {
                                  className: "h-4 w-4 text-muted-foreground",
                                }),
                                e.jsxs("div", {
                                  children: [
                                    e.jsx("p", {
                                      className: "text-sm font-medium",
                                      children: s.name,
                                    }),
                                    e.jsx("p", {
                                      className:
                                        "text-xs text-muted-foreground",
                                      children: s.type,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            e.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                e.jsx("span", {
                                  className: X(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    s.isActive
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-muted text-muted-foreground",
                                  ),
                                  children: s.isActive ? "Active" : "Disabled",
                                }),
                                e.jsx("button", {
                                  onClick: () => r({ id: s._id }),
                                  className:
                                    "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400",
                                  children: e.jsx(Q, { className: "h-4 w-4" }),
                                }),
                              ],
                            }),
                          ],
                        },
                        s._id,
                      ),
                    ),
                  })
                : e.jsx("p", {
                    className: "py-4 text-center text-sm text-muted-foreground",
                    children: "No notification channels configured",
                  }),
            ],
          }),
        ],
      }),
      e.jsxs(U, {
        children: [
          e.jsxs(H, {
            children: [
              e.jsx(W, { children: "Gateway Connection" }),
              e.jsx(z, { children: "Connect to your Clawdbot gateway" }),
            ],
          }),
          e.jsx(A, {
            children: e.jsxs("div", {
              className: "space-y-3",
              children: [
                e.jsxs("div", {
                  children: [
                    e.jsx("label", {
                      className: "mb-1 block text-xs text-muted-foreground",
                      children: "Gateway URL",
                    }),
                    e.jsx(w, { placeholder: "ws://127.0.0.1:18789" }),
                  ],
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("label", {
                      className: "mb-1 block text-xs text-muted-foreground",
                      children: "Gateway Token",
                    }),
                    e.jsx(w, {
                      type: "password",
                      placeholder: "Your gateway token",
                    }),
                  ],
                }),
                e.jsx(N, { children: "Connect" }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
export { Re as component };
