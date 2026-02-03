import {
  v as _,
  k as _t,
  h as $t,
  W as ar,
  b as B,
  q as Bt,
  a1 as Ce,
  R as Ct,
  a4 as cr,
  a as ct,
  a0 as De,
  S as Dt,
  i as de,
  a6 as dr,
  D as dt,
  T as er,
  p as Ft,
  ab as fe,
  ad as fr,
  B as ft,
  G as Gt,
  F as Ht,
  O as ht,
  o as Ie,
  w as It,
  r as ie,
  Y as ir,
  P as Jt,
  n as Kt,
  a3 as lr,
  u as lt,
  f as Mt,
  aa as me,
  a8 as mr,
  z as mt,
  H as Ne,
  C as Nt,
  X as nr,
  a2 as or,
  a9 as pe,
  a7 as pr,
  Z as pt,
  Q as Qt,
  l as q,
  y as qt,
  e as Rt,
  V as rr,
  L as Se,
  _ as sr,
  d as T,
  x as Te,
  g as Tt,
  U as tr,
  c as U,
  M as Ut,
  a5 as ur,
  J as ut,
  s as V,
  A as Vt,
  ac as ve,
  ae as vr,
  E as vt,
  m as Wt,
  j as we,
  I as Xt,
  K as Yt,
  $ as yt,
  N as Zt,
  t as zt,
} from "./AreaChart-t9V0r8-s.js";
import {
  C as at,
  c as it,
  b as nt,
  f as ot,
  d as st,
  a as ue,
} from "./card-7H36IGPB.js";
import {
  j as c,
  k as ce,
  p as Lt,
  o as ne,
  q as Oe,
  r as o,
  g as W,
} from "./main-DhZaiQhw.js";
const gt = Math.cos,
  Q = Math.sin,
  k = Math.sqrt,
  ee = Math.PI,
  se = 2 * ee,
  Ae = {
    draw(e, r) {
      const t = k(r / ee);
      e.moveTo(t, 0), e.arc(0, 0, t, 0, se);
    },
  },
  hr = {
    draw(e, r) {
      const t = k(r / 5) / 2;
      e.moveTo(-3 * t, -t),
        e.lineTo(-t, -t),
        e.lineTo(-t, -3 * t),
        e.lineTo(t, -3 * t),
        e.lineTo(t, -t),
        e.lineTo(3 * t, -t),
        e.lineTo(3 * t, t),
        e.lineTo(t, t),
        e.lineTo(t, 3 * t),
        e.lineTo(-t, 3 * t),
        e.lineTo(-t, t),
        e.lineTo(-3 * t, t),
        e.closePath();
    },
  },
  xt = k(1 / 3),
  yr = xt * 2,
  gr = {
    draw(e, r) {
      const t = k(r / yr),
        a = t * xt;
      e.moveTo(0, -t),
        e.lineTo(a, 0),
        e.lineTo(0, t),
        e.lineTo(-a, 0),
        e.closePath();
    },
  },
  xr = {
    draw(e, r) {
      const t = k(r),
        a = -t / 2;
      e.rect(a, a, t, t);
    },
  },
  br = 0.8908130915292852,
  bt = Q(ee / 10) / Q((7 * ee) / 10),
  Pr = Q(se / 10) * bt,
  jr = -gt(se / 10) * bt,
  Or = {
    draw(e, r) {
      const t = k(r * br),
        a = Pr * t,
        n = jr * t;
      e.moveTo(0, -t), e.lineTo(a, n);
      for (let i = 1; i < 5; ++i) {
        const s = (se * i) / 5,
          l = gt(s),
          u = Q(s);
        e.lineTo(u * t, -l * t), e.lineTo(l * a - u * n, u * a + l * n);
      }
      e.closePath();
    },
  },
  he = k(3),
  Sr = {
    draw(e, r) {
      const t = -k(r / (he * 3));
      e.moveTo(0, t * 2),
        e.lineTo(-he * t, -t),
        e.lineTo(he * t, -t),
        e.closePath();
    },
  },
  A = -0.5,
  E = k(3) / 2,
  Pe = 1 / k(12),
  wr = (Pe / 2 + 1) * 3,
  Ar = {
    draw(e, r) {
      const t = k(r / wr),
        a = t / 2,
        n = t * Pe,
        i = a,
        s = t * Pe + t,
        l = -i,
        u = s;
      e.moveTo(a, n),
        e.lineTo(i, s),
        e.lineTo(l, u),
        e.lineTo(A * a - E * n, E * a + A * n),
        e.lineTo(A * i - E * s, E * i + A * s),
        e.lineTo(A * l - E * u, E * l + A * u),
        e.lineTo(A * a + E * n, A * n - E * a),
        e.lineTo(A * i + E * s, A * s - E * i),
        e.lineTo(A * l + E * u, A * u - E * l),
        e.closePath();
    },
  };
function Er(e, r) {
  let t = null,
    a = It(n);
  (e = typeof e == "function" ? e : U(e || Ae)),
    (r = typeof r == "function" ? r : U(r === void 0 ? 64 : +r));
  function n() {
    let i;
    if (
      (t || (t = i = a()),
      e.apply(this, arguments).draw(t, +r.apply(this, arguments)),
      i)
    )
      return (t = null), i + "" || null;
  }
  return (
    (n.type = function (i) {
      return arguments.length
        ? ((e = typeof i == "function" ? i : U(i)), n)
        : e;
    }),
    (n.size = function (i) {
      return arguments.length
        ? ((r = typeof i == "function" ? i : U(+i)), n)
        : r;
    }),
    (n.context = function (i) {
      return arguments.length ? ((t = i ?? null), n) : t;
    }),
    n
  );
}
var kr = ["type", "size", "sizeType"];
function je() {
  return (
    (je = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var r = 1; r < arguments.length; r++) {
            var t = arguments[r];
            for (var a in t) Object.hasOwn(t, a) && (e[a] = t[a]);
          }
          return e;
        }),
    je.apply(null, arguments)
  );
}
function Re(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    r &&
      (a = a.filter((n) => Object.getOwnPropertyDescriptor(e, n).enumerable)),
      t.push.apply(t, a);
  }
  return t;
}
function Me(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? Re(Object(t), !0).forEach((a) => {
          Lr(e, a, t[a]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : Re(Object(t)).forEach((a) => {
            Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(t, a));
          });
  }
  return e;
}
function Lr(e, r, t) {
  return (
    (r = Ir(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function Ir(e) {
  var r = Tr(e, "string");
  return typeof r == "symbol" ? r : r + "";
}
function Tr(e, r) {
  if (typeof e != "object" || !e) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var a = t.call(e, r);
    if (typeof a != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function Nr(e, r) {
  if (e == null) return {};
  var t,
    a,
    n = Dr(e, r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      (t = i[a]),
        r.indexOf(t) === -1 &&
          {}.propertyIsEnumerable.call(e, t) &&
          (n[t] = e[t]);
  }
  return n;
}
function Dr(e, r) {
  if (e == null) return {};
  var t = {};
  for (var a in e)
    if (Object.hasOwn(e, a)) {
      if (r.indexOf(a) !== -1) continue;
      t[a] = e[a];
    }
  return t;
}
var Pt = {
    symbolCircle: Ae,
    symbolCross: hr,
    symbolDiamond: gr,
    symbolSquare: xr,
    symbolStar: Or,
    symbolTriangle: Sr,
    symbolWye: Ar,
  },
  Cr = Math.PI / 180,
  Rr = (e) => {
    var r = "symbol".concat(lt(e));
    return Pt[r] || Ae;
  },
  Mr = (e, r, t) => {
    if (r === "area") return e;
    switch (t) {
      case "cross":
        return (5 * e * e) / 9;
      case "diamond":
        return (0.5 * e * e) / Math.sqrt(3);
      case "square":
        return e * e;
      case "star": {
        var a = 18 * Cr;
        return (
          1.25 * e * e * (Math.tan(a) - Math.tan(a * 2) * Math.tan(a) ** 2)
        );
      }
      case "triangle":
        return (Math.sqrt(3) * e * e) / 4;
      case "wye":
        return ((21 - 10 * Math.sqrt(3)) * e * e) / 8;
      default:
        return (Math.PI * e * e) / 4;
    }
  },
  $r = (e, r) => {
    Pt["symbol".concat(lt(e))] = r;
  },
  jt = (e) => {
    var { type: r = "circle", size: t = 64, sizeType: a = "area" } = e,
      n = Nr(e, kr),
      i = Me(Me({}, n), {}, { type: r, size: t, sizeType: a }),
      s = "circle";
    typeof r == "string" && (s = r);
    var l = () => {
        var v = Rr(s),
          y = Er()
            .type(v)
            .size(Mr(t, a, s)),
          x = y();
        if (x !== null) return x;
      },
      { className: u, cx: p, cy: h } = i,
      f = V(i);
    return de(p) && de(h) && de(t)
      ? o.createElement(
          "path",
          je({}, f, {
            className: ne("recharts-symbols", u),
            transform: "translate(".concat(p, ", ").concat(h, ")"),
            d: l(),
          }),
        )
      : null;
  };
jt.registerSymbol = $r;
var ye = {},
  $e;
function _r() {
  return (
    $e ||
      (($e = 1),
      ((e) => {
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" });
        function r(t) {
          if (typeof t != "object" || t == null) return !1;
          if (Object.getPrototypeOf(t) === null) return !0;
          if (Object.prototype.toString.call(t) !== "[object Object]") {
            const n = t[Symbol.toStringTag];
            return n == null ||
              !Object.getOwnPropertyDescriptor(t, Symbol.toStringTag)?.writable
              ? !1
              : t.toString() === `[object ${n}]`;
          }
          let a = t;
          for (; Object.getPrototypeOf(a) !== null; )
            a = Object.getPrototypeOf(a);
          return Object.getPrototypeOf(t) === a;
        }
        e.isPlainObject = r;
      })(ye)),
    ye
  );
}
var ge, _e;
function Wr() {
  return _e || ((_e = 1), (ge = _r().isPlainObject)), ge;
}
var Kr = Wr();
const Fr = Lt(Kr);
var We, Ke, Fe, Be, ze;
function qe(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    r &&
      (a = a.filter((n) => Object.getOwnPropertyDescriptor(e, n).enumerable)),
      t.push.apply(t, a);
  }
  return t;
}
function Ve(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? qe(Object(t), !0).forEach((a) => {
          Br(e, a, t[a]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : qe(Object(t)).forEach((a) => {
            Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(t, a));
          });
  }
  return e;
}
function Br(e, r, t) {
  return (
    (r = zr(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function zr(e) {
  var r = qr(e, "string");
  return typeof r == "symbol" ? r : r + "";
}
function qr(e, r) {
  if (typeof e != "object" || !e) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var a = t.call(e, r);
    if (typeof a != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function te() {
  return (
    (te = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var r = 1; r < arguments.length; r++) {
            var t = arguments[r];
            for (var a in t) Object.hasOwn(t, a) && (e[a] = t[a]);
          }
          return e;
        }),
    te.apply(null, arguments)
  );
}
function z(e, r) {
  return (
    r || (r = e.slice(0)),
    Object.freeze(
      Object.defineProperties(e, { raw: { value: Object.freeze(r) } }),
    )
  );
}
var He = (e, r, t, a, n) => {
    var i = t - a,
      s;
    return (
      (s = B(We || (We = z(["M ", ",", ""])), e, r)),
      (s += B(Ke || (Ke = z(["L ", ",", ""])), e + t, r)),
      (s += B(Fe || (Fe = z(["L ", ",", ""])), e + t - i / 2, r + n)),
      (s += B(Be || (Be = z(["L ", ",", ""])), e + t - i / 2 - a, r + n)),
      (s += B(ze || (ze = z(["L ", ",", " Z"])), e, r)),
      s
    );
  },
  Vr = {
    x: 0,
    y: 0,
    upperWidth: 0,
    lowerWidth: 0,
    height: 0,
    isUpdateAnimationActive: !1,
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: "ease",
  },
  Hr = (e) => {
    var r = ie(e, Vr),
      { x: t, y: a, upperWidth: n, lowerWidth: i, height: s, className: l } = r,
      {
        animationEasing: u,
        animationDuration: p,
        animationBegin: h,
        isUpdateAnimationActive: f,
      } = r,
      v = o.useRef(null),
      [y, x] = o.useState(-1),
      d = o.useRef(n),
      g = o.useRef(i),
      m = o.useRef(s),
      b = o.useRef(t),
      P = o.useRef(a),
      j = ct(e, "trapezoid-");
    if (
      (o.useEffect(() => {
        if (v.current && v.current.getTotalLength)
          try {
            var w = v.current.getTotalLength();
            w && x(w);
          } catch {}
      }, []),
      t !== +t ||
        a !== +a ||
        n !== +n ||
        i !== +i ||
        s !== +s ||
        (n === 0 && i === 0) ||
        s === 0)
    )
      return null;
    var L = ne("recharts-trapezoid", l);
    if (!f)
      return o.createElement(
        "g",
        null,
        o.createElement(
          "path",
          te({}, V(r), { className: L, d: He(t, a, n, i, s) }),
        ),
      );
    var N = d.current,
      S = g.current,
      K = m.current,
      D = b.current,
      M = P.current,
      G = "0px ".concat(y === -1 ? 1 : y, "px"),
      C = "".concat(y, "px 0px"),
      oe = Tt(["strokeDasharray"], p, u);
    return o.createElement(
      ut,
      {
        animationId: j,
        key: j,
        canBegin: y > 0,
        duration: p,
        easing: u,
        isActive: f,
        begin: h,
      },
      (w) => {
        var R = T(N, n, w),
          X = T(S, i, w),
          Y = T(K, s, w),
          F = T(D, t, w),
          O = T(M, a, w);
        v.current &&
          ((d.current = R),
          (g.current = X),
          (m.current = Y),
          (b.current = F),
          (P.current = O));
        var le =
          w > 0
            ? { transition: oe, strokeDasharray: C }
            : { strokeDasharray: G };
        return o.createElement(
          "path",
          te({}, V(r), {
            className: L,
            d: He(F, O, R, X, Y),
            ref: v,
            style: Ve(Ve({}, le), r.style),
          }),
        );
      },
    );
  },
  Gr = ["option", "shapeType", "activeClassName"];
function Xr(e, r) {
  if (e == null) return {};
  var t,
    a,
    n = Yr(e, r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      (t = i[a]),
        r.indexOf(t) === -1 &&
          {}.propertyIsEnumerable.call(e, t) &&
          (n[t] = e[t]);
  }
  return n;
}
function Yr(e, r) {
  if (e == null) return {};
  var t = {};
  for (var a in e)
    if (Object.hasOwn(e, a)) {
      if (r.indexOf(a) !== -1) continue;
      t[a] = e[a];
    }
  return t;
}
function Ge(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    r &&
      (a = a.filter((n) => Object.getOwnPropertyDescriptor(e, n).enumerable)),
      t.push.apply(t, a);
  }
  return t;
}
function re(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? Ge(Object(t), !0).forEach((a) => {
          Ur(e, a, t[a]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : Ge(Object(t)).forEach((a) => {
            Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(t, a));
          });
  }
  return e;
}
function Ur(e, r, t) {
  return (
    (r = Zr(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function Zr(e) {
  var r = Jr(e, "string");
  return typeof r == "symbol" ? r : r + "";
}
function Jr(e, r) {
  if (typeof e != "object" || !e) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var a = t.call(e, r);
    if (typeof a != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function Qr(e, r) {
  return re(re({}, r), e);
}
function ea(e, r) {
  return e === "symbols";
}
function Xe(e) {
  var { shapeType: r, elementProps: t } = e;
  switch (r) {
    case "rectangle":
      return o.createElement(Ct, t);
    case "trapezoid":
      return o.createElement(Hr, t);
    case "sector":
      return o.createElement(Dt, t);
    case "symbols":
      if (ea(r)) return o.createElement(jt, t);
      break;
    case "curve":
      return o.createElement(Nt, t);
    default:
      return null;
  }
}
function ta(e) {
  return o.isValidElement(e) ? e.props : e;
}
function ra(e) {
  var {
      option: r,
      shapeType: t,
      activeClassName: a = "recharts-active-shape",
    } = e,
    n = Xr(e, Gr),
    i;
  if (o.isValidElement(r)) i = o.cloneElement(r, re(re({}, n), ta(r)));
  else if (typeof r == "function") i = r(n, n.index);
  else if (Fr(r) && typeof r != "boolean") {
    var s = Qr(r, n);
    i = o.createElement(Xe, { shapeType: t, elementProps: s });
  } else {
    var l = n;
    i = o.createElement(Xe, { shapeType: t, elementProps: l });
  }
  return n.isActive ? o.createElement(Se, { className: a }, i) : i;
}
class aa {
  constructor(r) {
    var { x: t, y: a } = r;
    (this.xAxisScale = t), (this.yAxisScale = a);
  }
  map(r, t) {
    var a,
      n,
      { position: i } = t;
    return {
      x:
        (a = this.xAxisScale.map(r.x, { position: i })) !== null && a !== void 0
          ? a
          : 0,
      y:
        (n = this.yAxisScale.map(r.y, { position: i })) !== null && n !== void 0
          ? n
          : 0,
    };
  }
  mapWithFallback(r, t) {
    var a,
      n,
      { position: i, fallback: s } = t,
      l,
      u;
    return (
      s === "rangeMin"
        ? (l = this.yAxisScale.rangeMin())
        : s === "rangeMax"
          ? (l = this.yAxisScale.rangeMax())
          : (l = 0),
      s === "rangeMin"
        ? (u = this.xAxisScale.rangeMin())
        : s === "rangeMax"
          ? (u = this.xAxisScale.rangeMax())
          : (u = 0),
      {
        x:
          (a = this.xAxisScale.map(r.x, { position: i })) !== null &&
          a !== void 0
            ? a
            : u,
        y:
          (n = this.yAxisScale.map(r.y, { position: i })) !== null &&
          n !== void 0
            ? n
            : l,
      }
    );
  }
  isInRange(r) {
    var { x: t, y: a } = r,
      n = t == null || this.xAxisScale.isInRange(t),
      i = a == null || this.yAxisScale.isInRange(a);
    return n && i;
  }
}
function Ye(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    r &&
      (a = a.filter((n) => Object.getOwnPropertyDescriptor(e, n).enumerable)),
      t.push.apply(t, a);
  }
  return t;
}
function Ue(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? Ye(Object(t), !0).forEach((a) => {
          na(e, a, t[a]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : Ye(Object(t)).forEach((a) => {
            Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(t, a));
          });
  }
  return e;
}
function na(e, r, t) {
  return (
    (r = ia(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function ia(e) {
  var r = sa(e, "string");
  return typeof r == "symbol" ? r : r + "";
}
function sa(e, r) {
  if (typeof e != "object" || !e) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var a = t.call(e, r);
    if (typeof a != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function ae() {
  return (
    (ae = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var r = 1; r < arguments.length; r++) {
            var t = arguments[r];
            for (var a in t) Object.hasOwn(t, a) && (e[a] = t[a]);
          }
          return e;
        }),
    ae.apply(null, arguments)
  );
}
var oa = (e, r) => {
    var t;
    if (o.isValidElement(e)) t = o.cloneElement(e, r);
    else if (typeof e == "function") t = e(r);
    else {
      if (!_(r.x1) || !_(r.y1) || !_(r.x2) || !_(r.y2)) return null;
      t = o.createElement(
        "line",
        ae({}, r, { className: "recharts-reference-line-line" }),
      );
    }
    return t;
  },
  la = (e, r, t, a, n, i) => {
    var { x: s, width: l } = i,
      u = n.map(e, { position: t });
    if (!_(u) || (r === "discard" && !n.isInRange(u))) return null;
    var p = [
      { x: s + l, y: u },
      { x: s, y: u },
    ];
    return a === "left" ? p.reverse() : p;
  },
  ca = (e, r, t, a, n, i) => {
    var { y: s, height: l } = i,
      u = n.map(e, { position: t });
    if (!_(u) || (r === "discard" && !n.isInRange(u))) return null;
    var p = [
      { x: u, y: s + l },
      { x: u, y: s },
    ];
    return a === "top" ? p.reverse() : p;
  },
  ua = (e, r, t, a) => {
    var n = [
      a.mapWithFallback(e[0], { position: t, fallback: "rangeMin" }),
      a.mapWithFallback(e[1], { position: t, fallback: "rangeMax" }),
    ];
    return r === "discard" && n.some((i) => !a.isInRange(i)) ? null : n;
  },
  da = (e, r, t, a, n, i, s) => {
    var { x: l, y: u, segment: p, ifOverflow: h } = s,
      f = Te(l),
      v = Te(u);
    return v
      ? la(u, h, a, i, r, t)
      : f
        ? ca(l, h, a, n, e, t)
        : p != null && p.length === 2
          ? ua(p, h, a, new aa({ x: e, y: r }))
          : null;
  };
function pa(e) {
  var r = Rt();
  return (
    o.useEffect(
      () => (
        r(Mt(e)),
        () => {
          r($t(e));
        }
      ),
    ),
    null
  );
}
function ma(e) {
  var { xAxisId: r, yAxisId: t, shape: a, className: n, ifOverflow: i } = e,
    s = we(),
    l = _t(),
    u = q((S) => Wt(S, r)),
    p = q((S) => Kt(S, t)),
    h = q((S) => Ie(S, "xAxis", r, s)),
    f = q((S) => Ie(S, "yAxis", t, s)),
    v = Ft();
  if (!l || !v || u == null || p == null || h == null || f == null) return null;
  var y = da(h, f, v, e.position, u.orientation, p.orientation, e);
  if (!y) return null;
  var x = y[0],
    d = y[1];
  if (x == null || d == null) return null;
  var { x: g, y: m } = x,
    { x: b, y: P } = d,
    j = i === "hidden" ? "url(#".concat(l, ")") : void 0,
    L = Ue(Ue({ clipPath: j }, V(e)), {}, { x1: g, y1: m, x2: b, y2: P }),
    N = qt({ x1: g, y1: m, x2: b, y2: P });
  return o.createElement(
    pt,
    { zIndex: e.zIndex },
    o.createElement(
      Se,
      { className: ne("recharts-reference-line", n) },
      oa(a, L),
      o.createElement(
        Bt,
        ae({}, N, { lowerWidth: N.width, upperWidth: N.width }),
        o.createElement(zt, { label: e.label }),
        e.children,
      ),
    ),
  );
}
var fa = {
  ifOverflow: "discard",
  xAxisId: 0,
  yAxisId: 0,
  fill: "none",
  label: !1,
  stroke: "#ccc",
  fillOpacity: 1,
  strokeWidth: 1,
  position: "middle",
  zIndex: dt.line,
};
function Z(e) {
  var r = ie(e, fa);
  return o.createElement(
    o.Fragment,
    null,
    o.createElement(pa, {
      yAxisId: r.yAxisId,
      xAxisId: r.xAxisId,
      ifOverflow: r.ifOverflow,
      x: r.x,
      y: r.y,
      segment: r.segment,
    }),
    o.createElement(ma, r),
  );
}
Z.displayName = "ReferenceLine";
var va = ["children"];
function ha(e, r) {
  if (e == null) return {};
  var t,
    a,
    n = ya(e, r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      (t = i[a]),
        r.indexOf(t) === -1 &&
          {}.propertyIsEnumerable.call(e, t) &&
          (n[t] = e[t]);
  }
  return n;
}
function ya(e, r) {
  if (e == null) return {};
  var t = {};
  for (var a in e)
    if (Object.hasOwn(e, a)) {
      if (r.indexOf(a) !== -1) continue;
      t[a] = e[a];
    }
  return t;
}
var ga = {
    data: [],
    xAxisId: "xAxis-0",
    yAxisId: "yAxis-0",
    dataPointFormatter: () => ({ x: 0, y: 0, value: 0 }),
    errorBarOffset: 0,
  },
  xa = o.createContext(ga);
function ba(e) {
  var { children: r } = e,
    t = ha(e, va);
  return o.createElement(xa.Provider, { value: t }, r);
}
var Ot = (e, r, t, a) => ft(e, "xAxis", r, a),
  St = (e, r, t, a) => vt(e, "xAxis", r, a),
  wt = (e, r, t, a) => ft(e, "yAxis", t, a),
  At = (e, r, t, a) => vt(e, "yAxis", t, a),
  Pa = Oe([mt, Ot, wt, St, At], (e, r, t, a, n) =>
    Gt(e, "xAxis") ? Ne(r, a, !1) : Ne(t, n, !1),
  ),
  ja = (e, r, t, a, n) => n;
function Oa(e) {
  return e.type === "line";
}
var Sa = Oe([Ht, ja], (e, r) => e.filter(Oa).find((t) => t.id === r)),
  wa = Oe([mt, Ot, wt, St, At, Sa, Pa, Vt], (e, r, t, a, n, i, s, l) => {
    var { chartData: u, dataStartIndex: p, dataEndIndex: h } = l;
    if (
      !(
        i == null ||
        r == null ||
        t == null ||
        a == null ||
        n == null ||
        a.length === 0 ||
        n.length === 0 ||
        s == null ||
        (e !== "horizontal" && e !== "vertical")
      )
    ) {
      var { dataKey: f, data: v } = i,
        y;
      if (
        (v != null && v.length > 0 ? (y = v) : (y = u?.slice(p, h + 1)),
        y != null)
      )
        return Va({
          layout: e,
          xAxis: r,
          yAxis: t,
          xAxisTicks: a,
          yAxisTicks: n,
          dataKey: f,
          bandSize: s,
          displayedData: y,
        });
    }
  }),
  Aa = ["id"],
  Ea = ["type", "layout", "connectNulls", "needClip", "shape"],
  ka = [
    "activeDot",
    "animateNewValues",
    "animationBegin",
    "animationDuration",
    "animationEasing",
    "connectNulls",
    "dot",
    "hide",
    "isAnimationActive",
    "label",
    "legendType",
    "xAxisId",
    "yAxisId",
    "id",
  ];
function H() {
  return (
    (H = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var r = 1; r < arguments.length; r++) {
            var t = arguments[r];
            for (var a in t) Object.hasOwn(t, a) && (e[a] = t[a]);
          }
          return e;
        }),
    H.apply(null, arguments)
  );
}
function Ze(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    r &&
      (a = a.filter((n) => Object.getOwnPropertyDescriptor(e, n).enumerable)),
      t.push.apply(t, a);
  }
  return t;
}
function I(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2
      ? Ze(Object(t), !0).forEach((a) => {
          La(e, a, t[a]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
        : Ze(Object(t)).forEach((a) => {
            Object.defineProperty(e, a, Object.getOwnPropertyDescriptor(t, a));
          });
  }
  return e;
}
function La(e, r, t) {
  return (
    (r = Ia(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[r] = t),
    e
  );
}
function Ia(e) {
  var r = Ta(e, "string");
  return typeof r == "symbol" ? r : r + "";
}
function Ta(e, r) {
  if (typeof e != "object" || !e) return e;
  var t = e[Symbol.toPrimitive];
  if (t !== void 0) {
    var a = t.call(e, r);
    if (typeof a != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(e);
}
function Ee(e, r) {
  if (e == null) return {};
  var t,
    a,
    n = Na(e, r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      (t = i[a]),
        r.indexOf(t) === -1 &&
          {}.propertyIsEnumerable.call(e, t) &&
          (n[t] = e[t]);
  }
  return n;
}
function Na(e, r) {
  if (e == null) return {};
  var t = {};
  for (var a in e)
    if (Object.hasOwn(e, a)) {
      if (r.indexOf(a) !== -1) continue;
      t[a] = e[a];
    }
  return t;
}
var Da = (e) => {
    var { dataKey: r, name: t, stroke: a, legendType: n, hide: i } = e;
    return [
      {
        inactive: i,
        dataKey: r,
        type: n,
        color: a,
        value: ht(t, r),
        payload: e,
      },
    ];
  },
  Ca = o.memo((e) => {
    var {
        dataKey: r,
        data: t,
        stroke: a,
        strokeWidth: n,
        fill: i,
        name: s,
        hide: l,
        unit: u,
        tooltipType: p,
        id: h,
      } = e,
      f = {
        dataDefinedOnItem: t,
        getPosition: Qt,
        settings: {
          stroke: a,
          strokeWidth: n,
          fill: i,
          dataKey: r,
          nameKey: void 0,
          name: ht(s, r),
          hide: l,
          type: p,
          color: a,
          unit: u,
          graphicalItemId: h,
        },
      };
    return o.createElement(Jt, { tooltipEntrySettings: f });
  }),
  Et = (e, r) => "".concat(r, "px ").concat(e - r, "px");
function Ra(e, r) {
  for (var t = e.length % 2 !== 0 ? [...e, 0] : e, a = [], n = 0; n < r; ++n)
    a = [...a, ...t];
  return a;
}
var Ma = (e, r, t) => {
  var a = t.reduce((y, x) => y + x);
  if (!a) return Et(r, e);
  for (
    var n = Math.floor(e / a), i = e % a, s = r - e, l = [], u = 0, p = 0;
    u < t.length;
    p += (h = t[u]) !== null && h !== void 0 ? h : 0, ++u
  ) {
    var h,
      f = t[u];
    if (f != null && p + f > i) {
      l = [...t.slice(0, u), i - p];
      break;
    }
  }
  var v = l.length % 2 === 0 ? [0, s] : [s];
  return [...Ra(t, n), ...l, ...v].map((y) => "".concat(y, "px")).join(", ");
};
function $a(e) {
  var { clipPathId: r, points: t, props: a } = e,
    { dot: n, dataKey: i, needClip: s } = a,
    { id: l } = a,
    u = Ee(a, Aa),
    p = cr(u);
  return o.createElement(ur, {
    points: t,
    dot: n,
    className: "recharts-line-dots",
    dotClassName: "recharts-line-dot",
    dataKey: i,
    baseProps: p,
    needClip: s,
    clipPathId: r,
  });
}
function _a(e) {
  var { showLabels: r, children: t, points: a } = e,
    n = o.useMemo(
      () =>
        a?.map((i) => {
          var s,
            l,
            u = {
              x: (s = i.x) !== null && s !== void 0 ? s : 0,
              y: (l = i.y) !== null && l !== void 0 ? l : 0,
              width: 0,
              lowerWidth: 0,
              upperWidth: 0,
              height: 0,
            };
          return I(
            I({}, u),
            {},
            {
              value: i.value,
              payload: i.payload,
              viewBox: u,
              parentViewBox: void 0,
              fill: void 0,
            },
          );
        }),
      [a],
    );
  return o.createElement(lr, { value: r ? n : void 0 }, t);
}
function Je(e) {
  var {
      clipPathId: r,
      pathRef: t,
      points: a,
      strokeDasharray: n,
      props: i,
    } = e,
    { type: s, layout: l, connectNulls: u, needClip: p, shape: h } = i,
    f = Ee(i, Ea),
    v = I(
      I({}, V(f)),
      {},
      {
        fill: "none",
        className: "recharts-line-curve",
        clipPath: p ? "url(#clipPath-".concat(r, ")") : void 0,
        points: a,
        type: s,
        layout: l,
        connectNulls: u,
        strokeDasharray: n ?? i.strokeDasharray,
      },
    );
  return o.createElement(
    o.Fragment,
    null,
    a?.length > 1 &&
      o.createElement(
        ra,
        H({ shapeType: "curve", option: h }, v, { pathRef: t }),
      ),
    o.createElement($a, { points: a, clipPathId: r, props: i }),
  );
}
function Wa(e) {
  try {
    return (e && e.getTotalLength && e.getTotalLength()) || 0;
  } catch {
    return 0;
  }
}
function Ka(e) {
  var {
      clipPathId: r,
      props: t,
      pathRef: a,
      previousPointsRef: n,
      longestAnimatedLengthRef: i,
    } = e,
    {
      points: s,
      strokeDasharray: l,
      isAnimationActive: u,
      animationBegin: p,
      animationDuration: h,
      animationEasing: f,
      animateNewValues: v,
      width: y,
      height: x,
      onAnimationEnd: d,
      onAnimationStart: g,
    } = t,
    m = n.current,
    b = ct(s, "recharts-line-"),
    P = o.useRef(b),
    [j, L] = o.useState(!1),
    N = !j,
    S = o.useCallback(() => {
      typeof d == "function" && d(), L(!1);
    }, [d]),
    K = o.useCallback(() => {
      typeof g == "function" && g(), L(!0);
    }, [g]),
    D = Wa(a.current),
    M = o.useRef(0);
  P.current !== b && ((M.current = i.current), (P.current = b));
  var G = M.current;
  return o.createElement(
    _a,
    { points: s, showLabels: N },
    t.children,
    o.createElement(
      ut,
      {
        animationId: b,
        begin: p,
        duration: h,
        isActive: u,
        easing: f,
        onAnimationEnd: S,
        onAnimationStart: K,
        key: b,
      },
      (C) => {
        var oe = T(G, D + G, C),
          w = Math.min(oe, D),
          R;
        if (u)
          if (l) {
            var X = ""
              .concat(l)
              .split(/[,\s]+/gim)
              .map((O) => parseFloat(O));
            R = Ma(w, D, X);
          } else R = Et(D, w);
        else R = l == null ? void 0 : String(l);
        if (
          (C > 0 &&
            D > 0 &&
            ((n.current = s), (i.current = Math.max(i.current, w))),
          m)
        ) {
          var Y = m.length / s.length,
            F =
              C === 1
                ? s
                : s.map((O, le) => {
                    var ke = Math.floor(le * Y);
                    if (m[ke]) {
                      var Le = m[ke];
                      return I(
                        I({}, O),
                        {},
                        { x: T(Le.x, O.x, C), y: T(Le.y, O.y, C) },
                      );
                    }
                    return v
                      ? I(
                          I({}, O),
                          {},
                          { x: T(y * 2, O.x, C), y: T(x / 2, O.y, C) },
                        )
                      : I(I({}, O), {}, { x: O.x, y: O.y });
                  });
          return (
            (n.current = F),
            o.createElement(Je, {
              props: t,
              points: F,
              clipPathId: r,
              pathRef: a,
              strokeDasharray: R,
            })
          );
        }
        return o.createElement(Je, {
          props: t,
          points: s,
          clipPathId: r,
          pathRef: a,
          strokeDasharray: R,
        });
      },
    ),
    o.createElement(or, { label: t.label }),
  );
}
function Fa(e) {
  var { clipPathId: r, props: t } = e,
    a = o.useRef(null),
    n = o.useRef(0),
    i = o.useRef(null);
  return o.createElement(Ka, {
    props: t,
    clipPathId: r,
    previousPointsRef: a,
    longestAnimatedLengthRef: n,
    pathRef: i,
  });
}
var Ba = (e, r) => {
  var t, a;
  return {
    x: (t = e.x) !== null && t !== void 0 ? t : void 0,
    y: (a = e.y) !== null && a !== void 0 ? a : void 0,
    value: e.value,
    errorVal: yt(e.payload, r),
  };
};
class za extends o.Component {
  render() {
    var {
      hide: r,
      dot: t,
      points: a,
      className: n,
      xAxisId: i,
      yAxisId: s,
      top: l,
      left: u,
      width: p,
      height: h,
      id: f,
      needClip: v,
      zIndex: y,
    } = this.props;
    if (r) return null;
    var x = ne("recharts-line", n),
      d = f,
      { r: g, strokeWidth: m } = ar(t),
      b = nr(t),
      P = g * 2 + m,
      j = v ? "url(#clipPath-".concat(b ? "" : "dots-").concat(d, ")") : void 0;
    return o.createElement(
      pt,
      { zIndex: y },
      o.createElement(
        Se,
        { className: x },
        v &&
          o.createElement(
            "defs",
            null,
            o.createElement(ir, { clipPathId: d, xAxisId: i, yAxisId: s }),
            !b &&
              o.createElement(
                "clipPath",
                { id: "clipPath-dots-".concat(d) },
                o.createElement("rect", {
                  x: u - P / 2,
                  y: l - P / 2,
                  width: p + P,
                  height: h + P,
                }),
              ),
          ),
        o.createElement(
          ba,
          {
            xAxisId: i,
            yAxisId: s,
            data: a,
            dataPointFormatter: Ba,
            errorBarOffset: 0,
          },
          o.createElement(Fa, { props: this.props, clipPathId: d }),
        ),
      ),
      o.createElement(sr, {
        activeDot: this.props.activeDot,
        points: a,
        mainColor: this.props.stroke,
        itemDataKey: this.props.dataKey,
        clipPath: j,
      }),
    );
  }
}
var kt = {
  activeDot: !0,
  animateNewValues: !0,
  animationBegin: 0,
  animationDuration: 1500,
  animationEasing: "ease",
  connectNulls: !1,
  dot: !0,
  fill: "#fff",
  hide: !1,
  isAnimationActive: "auto",
  label: !1,
  legendType: "line",
  stroke: "#3182bd",
  strokeWidth: 1,
  xAxisId: 0,
  yAxisId: 0,
  zIndex: dt.line,
  type: "linear",
};
function qa(e) {
  var r = ie(e, kt),
    {
      activeDot: t,
      animateNewValues: a,
      animationBegin: n,
      animationDuration: i,
      animationEasing: s,
      connectNulls: l,
      dot: u,
      hide: p,
      isAnimationActive: h,
      label: f,
      legendType: v,
      xAxisId: y,
      yAxisId: x,
      id: d,
    } = r,
    g = Ee(r, ka),
    { needClip: m } = er(y, x),
    b = tr(),
    P = rr(),
    j = we(),
    L = q((M) => wa(M, y, x, j, d));
  if ((P !== "horizontal" && P !== "vertical") || L == null || b == null)
    return null;
  var { height: N, width: S, x: K, y: D } = b;
  return o.createElement(
    za,
    H({}, g, {
      id: d,
      connectNulls: l,
      dot: u,
      activeDot: t,
      animateNewValues: a,
      animationBegin: n,
      animationDuration: i,
      animationEasing: s,
      isAnimationActive: h,
      hide: p,
      label: f,
      legendType: v,
      xAxisId: y,
      yAxisId: x,
      points: L,
      layout: P,
      height: N,
      width: S,
      left: K,
      top: D,
      needClip: m,
    }),
  );
}
function Va(e) {
  var {
    layout: r,
    xAxis: t,
    yAxis: a,
    xAxisTicks: n,
    yAxisTicks: i,
    dataKey: s,
    bandSize: l,
    displayedData: u,
  } = e;
  return u
    .map((p, h) => {
      var f = yt(p, s);
      if (r === "horizontal") {
        var v = De({ axis: t, ticks: n, bandSize: l, entry: p, index: h }),
          y = Ce(f) ? null : a.scale.map(f);
        return { x: v, y: y ?? null, value: f, payload: p };
      }
      var x = Ce(f) ? null : t.scale.map(f),
        d = De({ axis: a, ticks: i, bandSize: l, entry: p, index: h });
      return x == null || d == null ? null : { x, y: d, value: f, payload: p };
    })
    .filter(Boolean);
}
function Ha(e) {
  var r = ie(e, kt),
    t = we();
  return o.createElement(Yt, { id: r.id, type: "line" }, (a) =>
    o.createElement(
      o.Fragment,
      null,
      o.createElement(Ut, { legendPayload: Da(r) }),
      o.createElement(Ca, {
        dataKey: r.dataKey,
        data: r.data,
        stroke: r.stroke,
        strokeWidth: r.strokeWidth,
        fill: r.fill,
        name: r.name,
        hide: r.hide,
        unit: r.unit,
        tooltipType: r.tooltipType,
        id: a,
      }),
      o.createElement(Zt, {
        type: "line",
        id: a,
        data: r.data,
        xAxisId: r.xAxisId,
        yAxisId: r.yAxisId,
        zAxisId: 0,
        dataKey: r.dataKey,
        hide: r.hide,
        isPanorama: t,
      }),
      o.createElement(qa, H({}, r, { id: a })),
    ),
  );
}
var J = o.memo(Ha, Xt);
J.displayName = "Line";
var Ga = ["axis"],
  Qe = o.forwardRef((e, r) =>
    o.createElement(dr, {
      chartName: "LineChart",
      defaultTooltipEventType: "axis",
      validateTooltipEventTypes: Ga,
      tooltipPayloadSearcher: pr,
      categoricalChartProps: e,
      ref: r,
    }),
  );
function et(e) {
  return new Date(e).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
const xe = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
};
function $({
  title: e,
  subtitle: r,
  data: t,
  color: a = "#a855f7",
  fillColor: n,
  unit: i = "",
  chartType: s = "area",
  alarm: l,
  multiLine: u,
  height: p = 200,
}) {
  const h = o.useMemo(
      () =>
        u
          ? t.map((m, b) => {
              const P = {
                timestamp: m.timestamp,
                time: et(m.timestamp),
                primary: m.value,
              };
              for (const j of u) j.data[b] && (P[j.label] = j.data[b].value);
              return P;
            })
          : t.map((m) => ({ ...m, time: et(m.timestamp) })),
      [t, u],
    ),
    f = t.map((m) => m.value),
    v = f[f.length - 1] ?? 0,
    y = Math.min(...f),
    x = Math.max(...f),
    d = f.reduce((m, b) => m + b, 0) / f.length,
    g = l && v > l.value;
  return c.jsxs(at, {
    className: W(g && "border-red-500/30"),
    children: [
      c.jsxs(nt, {
        children: [
          c.jsx(it, { className: "text-sm", children: e }),
          r && c.jsx(st, { children: r }),
        ],
      }),
      c.jsxs(ot, {
        children: [
          c.jsxs("div", {
            className: "mb-3 flex items-center gap-6",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children: "Current",
                  }),
                  c.jsxs("p", {
                    className: W(
                      "tabular-nums text-lg font-bold",
                      g ? "text-red-400" : "",
                    ),
                    children: [
                      typeof v == "number" ? v.toLocaleString() : v,
                      i,
                    ],
                  }),
                ],
              }),
              c.jsxs("div", {
                children: [
                  c.jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children: "Avg",
                  }),
                  c.jsxs("p", {
                    className: "tabular-nums text-sm font-medium",
                    children: [Math.round(d).toLocaleString(), i],
                  }),
                ],
              }),
              c.jsxs("div", {
                children: [
                  c.jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children: "Min",
                  }),
                  c.jsxs("p", {
                    className: "tabular-nums text-sm font-medium",
                    children: [Math.round(y).toLocaleString(), i],
                  }),
                ],
              }),
              c.jsxs("div", {
                children: [
                  c.jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children: "Max",
                  }),
                  c.jsxs("p", {
                    className: "tabular-nums text-sm font-medium",
                    children: [Math.round(x).toLocaleString(), i],
                  }),
                ],
              }),
              l &&
                c.jsx("div", {
                  className: "ml-auto",
                  children: c.jsx("span", {
                    className: W(
                      "rounded-full border px-2 py-1 text-xs font-medium",
                      g
                        ? "border-red-500/20 bg-red-500/10 text-red-400"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                    ),
                    children: g ? "ALARM" : "OK",
                  }),
                }),
            ],
          }),
          c.jsx("div", {
            style: { height: p },
            children: c.jsx(mr, {
              width: "100%",
              height: "100%",
              children: u
                ? c.jsxs(Qe, {
                    data: h,
                    margin: { top: 4, right: 4, left: 0, bottom: 0 },
                    children: [
                      c.jsx(pe, {
                        strokeDasharray: "3 3",
                        className: "stroke-border",
                      }),
                      c.jsx(me, {
                        dataKey: "time",
                        tick: { fill: "currentColor", fontSize: 10 },
                        tickLine: !1,
                        axisLine: !1,
                        interval: "preserveStartEnd",
                        className: "text-muted-foreground",
                      }),
                      c.jsx(fe, {
                        tick: { fill: "currentColor", fontSize: 10 },
                        tickLine: !1,
                        axisLine: !1,
                        tickFormatter: (m) => `${m.toLocaleString()}${i}`,
                        className: "text-muted-foreground",
                      }),
                      c.jsx(ve, {
                        contentStyle: xe,
                        formatter: (m, b) => [
                          `${(m ?? 0).toLocaleString()}${i}`,
                          b,
                        ],
                      }),
                      c.jsx(J, {
                        type: "monotone",
                        dataKey: "primary",
                        stroke: a,
                        strokeWidth: 2,
                        dot: !1,
                        name: "P50",
                      }),
                      u.map((m) =>
                        c.jsx(
                          J,
                          {
                            type: "monotone",
                            dataKey: m.label,
                            stroke: m.color,
                            strokeWidth: 1.5,
                            dot: !1,
                            strokeDasharray: m.label === "P99" ? "4 2" : void 0,
                            name: m.label,
                          },
                          m.label,
                        ),
                      ),
                      l &&
                        c.jsx(Z, {
                          y: l.value,
                          stroke: l.color,
                          strokeDasharray: "8 4",
                          strokeWidth: 1.5,
                          label: {
                            value: l.label,
                            position: "right",
                            fill: l.color,
                            fontSize: 10,
                          },
                        }),
                    ],
                  })
                : s === "line"
                  ? c.jsxs(Qe, {
                      data: h,
                      margin: { top: 4, right: 4, left: 0, bottom: 0 },
                      children: [
                        c.jsx(pe, {
                          strokeDasharray: "3 3",
                          className: "stroke-border",
                        }),
                        c.jsx(me, {
                          dataKey: "time",
                          tick: { fill: "currentColor", fontSize: 10 },
                          tickLine: !1,
                          axisLine: !1,
                          interval: "preserveStartEnd",
                          className: "text-muted-foreground",
                        }),
                        c.jsx(fe, {
                          tick: { fill: "currentColor", fontSize: 10 },
                          tickLine: !1,
                          axisLine: !1,
                          tickFormatter: (m) => `${m.toLocaleString()}${i}`,
                          className: "text-muted-foreground",
                        }),
                        c.jsx(ve, {
                          contentStyle: xe,
                          formatter: (m) => [
                            `${(m ?? 0).toLocaleString()}${i}`,
                            e,
                          ],
                        }),
                        c.jsx(J, {
                          type: "monotone",
                          dataKey: "value",
                          stroke: a,
                          strokeWidth: 2,
                          dot: !1,
                        }),
                        l &&
                          c.jsx(Z, {
                            y: l.value,
                            stroke: l.color,
                            strokeDasharray: "8 4",
                            strokeWidth: 1.5,
                            label: {
                              value: l.label,
                              position: "right",
                              fill: l.color,
                              fontSize: 10,
                            },
                          }),
                      ],
                    })
                  : c.jsxs(fr, {
                      data: h,
                      margin: { top: 4, right: 4, left: 0, bottom: 0 },
                      children: [
                        c.jsx("defs", {
                          children: c.jsxs("linearGradient", {
                            id: `grad-${e.replace(/\s/g, "")}`,
                            x1: "0",
                            y1: "0",
                            x2: "0",
                            y2: "1",
                            children: [
                              c.jsx("stop", {
                                offset: "5%",
                                stopColor: n ?? a,
                                stopOpacity: 0.5,
                              }),
                              c.jsx("stop", {
                                offset: "95%",
                                stopColor: n ?? a,
                                stopOpacity: 0.05,
                              }),
                            ],
                          }),
                        }),
                        c.jsx(pe, {
                          strokeDasharray: "3 3",
                          className: "stroke-border",
                        }),
                        c.jsx(me, {
                          dataKey: "time",
                          tick: { fill: "currentColor", fontSize: 10 },
                          tickLine: !1,
                          axisLine: !1,
                          interval: "preserveStartEnd",
                          className: "text-muted-foreground",
                        }),
                        c.jsx(fe, {
                          tick: { fill: "currentColor", fontSize: 10 },
                          tickLine: !1,
                          axisLine: !1,
                          tickFormatter: (m) => `${m.toLocaleString()}${i}`,
                          className: "text-muted-foreground",
                        }),
                        c.jsx(ve, {
                          contentStyle: xe,
                          formatter: (m) => [
                            `${(m ?? 0).toLocaleString()}${i}`,
                            e,
                          ],
                        }),
                        c.jsx(vr, {
                          type: "monotone",
                          dataKey: "value",
                          stroke: a,
                          strokeWidth: 2,
                          fill: `url(#grad-${e.replace(/\s/g, "")})`,
                        }),
                        l &&
                          c.jsx(Z, {
                            y: l.value,
                            stroke: l.color,
                            strokeDasharray: "8 4",
                            strokeWidth: 1.5,
                            label: {
                              value: l.label,
                              position: "right",
                              fill: l.color,
                              fontSize: 10,
                            },
                          }),
                      ],
                    }),
            }),
          }),
        ],
      }),
    ],
  });
}
const tt = [
  { value: "1h", label: "1 Hour", hours: 1 },
  { value: "6h", label: "6 Hours", hours: 6 },
  { value: "24h", label: "24 Hours", hours: 24 },
  { value: "7d", label: "7 Days", hours: 168 },
];
function rt(e, r) {
  const t = new Map();
  for (const a of e) {
    const n = Math.floor(a.timestamp / r) * r,
      i = t.get(n) ?? [];
    i.push(a.value), t.set(n, i);
  }
  return Array.from(t.entries())
    .map(([a, n]) => ({
      timestamp: a,
      value: Math.round(n.reduce((i, s) => i + s, 0) / n.length),
    }))
    .sort((a, n) => a.timestamp - n.timestamp);
}
function be(e, r) {
  if (e.length === 0) return 0;
  const t = [...e].sort((n, i) => n - i),
    a = Math.ceil((r / 100) * t.length) - 1;
  return t[Math.max(0, a)];
}
function Xa(e, r) {
  const t = new Map();
  for (const n of e) {
    const i = Math.floor(n.timestamp / r) * r,
      s = t.get(i) ?? [];
    s.push(n.value), t.set(i, s);
  }
  const a = Array.from(t.keys()).sort((n, i) => n - i);
  return {
    p50: a.map((n) => ({ timestamp: n, value: Math.round(be(t.get(n), 50)) })),
    p95: a.map((n) => ({ timestamp: n, value: Math.round(be(t.get(n), 95)) })),
    p99: a.map((n) => ({ timestamp: n, value: Math.round(be(t.get(n), 99)) })),
  };
}
function Ja() {
  const [e, r] = o.useState("24h"),
    t = tt.find((d) => d.value === e)?.hours ?? 24,
    a = t <= 1 ? 6e4 : t <= 6 ? 5 * 6e4 : t <= 24 ? 15 * 6e4 : 60 * 6e4,
    n = ce(ue.metrics.healthTimeSeries, { hours: t }),
    i = ce(ue.metrics.costTimeSeries, { hours: t }),
    s = ce(ue.metrics.activityTimeSeries, { hours: t }),
    l = n === void 0 || i === void 0 || s === void 0,
    u = (n?.length ?? 0) > 0 || (i?.length ?? 0) > 0 || (s?.length ?? 0) > 0,
    p = o.useMemo(() => {
      if (!n?.length) return { p50: [], p95: [], p99: [] };
      const d = n
        .filter((g) => g.responseTimeMs > 0)
        .map((g) => ({ timestamp: g.timestamp, value: g.responseTimeMs }));
      return Xa(d, a);
    }, [n, a]),
    h = o.useMemo(
      () =>
        s?.length
          ? s.map((d) => ({ timestamp: d.timestamp, value: d.total }))
          : [],
      [s],
    ),
    f = o.useMemo(
      () =>
        s?.length
          ? s.map((d) => ({ timestamp: d.timestamp, value: d.errors }))
          : [],
      [s],
    ),
    v = o.useMemo(() => {
      if (!i?.length) return [];
      const d = i.map((g) => ({
        timestamp: g.timestamp,
        value: g.inputTokens + g.outputTokens,
      }));
      return rt(d, a);
    }, [i, a]),
    y = o.useMemo(() => {
      if (!n?.length) return [];
      const d = n.map((g) => ({
        timestamp: g.timestamp,
        value: g.activeSessionCount,
      }));
      return rt(d, a);
    }, [n, a]),
    x = o.useMemo(
      () =>
        n?.length
          ? n
              .filter((d) => d.responseTimeMs > 0)
              .map((d) => ({ timestamp: d.timestamp, value: d.responseTimeMs }))
          : [],
      [n],
    );
  return c.jsxs("div", {
    className: "flex flex-1 flex-col gap-6 p-6",
    children: [
      c.jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          c.jsx("div", {}),
          c.jsx("div", {
            className: "flex items-center gap-1 rounded-lg border bg-card p-1",
            children: tt.map((d) =>
              c.jsx(
                "button",
                {
                  onClick: () => r(d.value),
                  className: W(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    e === d.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  ),
                  children: d.label,
                },
                d.value,
              ),
            ),
          }),
        ],
      }),
      l &&
        c.jsx("div", {
          className:
            "flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5",
          children: c.jsx("span", {
            className: "text-sm text-muted-foreground",
            children: "Loading metrics...",
          }),
        }),
      !l &&
        !u &&
        c.jsx("div", {
          className:
            "flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5",
          children: c.jsx("span", {
            className: "text-xs text-amber-400/80",
            children:
              "No metrics data yet — the collector will populate this as data flows in",
          }),
        }),
      !l &&
        u &&
        c.jsx("div", {
          className:
            "flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5",
          children: c.jsxs("span", {
            className: "text-xs text-emerald-400/80",
            children: [
              "Live metrics from gateway — ",
              n?.length ?? 0,
              " health checks,",
              " ",
              i?.length ?? 0,
              " cost records, ",
              s?.length ?? 0,
              " activity windows",
            ],
          }),
        }),
      c.jsxs("div", {
        className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
        children: [
          c.jsx($, {
            title: "Response Latency",
            subtitle: "Gateway response time percentiles",
            data: p.p50,
            color: "#a855f7",
            unit: "ms",
            multiLine: [
              { label: "P95", data: p.p95, color: "#f59e0b" },
              { label: "P99", data: p.p99, color: "#ef4444" },
            ],
            alarm: { value: 2e3, label: "P99 > 2s", color: "#ef4444" },
            height: 220,
          }),
          c.jsx($, {
            title: "Request Rate",
            subtitle: "Agent activities per 15-min window",
            data: h,
            color: "#8b5cf6",
            unit: " req",
            chartType: "area",
            height: 220,
          }),
          c.jsx($, {
            title: "Error Rate",
            subtitle: "Errors per 15-min window",
            data: f,
            color: "#ef4444",
            fillColor: "#ef4444",
            unit: " err",
            chartType: "area",
            alarm: { value: 5, label: "Spike > 5", color: "#ef4444" },
            height: 220,
          }),
          c.jsx($, {
            title: "Token Throughput",
            subtitle: "Total tokens processed per window",
            data: v,
            color: "#06b6d4",
            unit: " tok",
            chartType: "area",
            alarm: { value: 4e4, label: "Budget Alert", color: "#f59e0b" },
            height: 220,
          }),
          c.jsx($, {
            title: "Active Sessions",
            subtitle: "Concurrent agent sessions",
            data: y,
            color: "#22c55e",
            chartType: "line",
            height: 220,
          }),
          c.jsx($, {
            title: "Heartbeat Interval",
            subtitle: "Gateway poll response time",
            data: x,
            color: "#f97316",
            unit: "ms",
            chartType: "line",
            alarm: { value: 2e3, label: "Slow > 2s", color: "#ef4444" },
            height: 220,
          }),
        ],
      }),
      c.jsxs(at, {
        children: [
          c.jsxs(nt, {
            children: [
              c.jsx(it, { children: "Alarm Status" }),
              c.jsx(st, { children: "Configured metric alarms" }),
            ],
          }),
          c.jsx(ot, {
            children: c.jsx("div", {
              className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
              children: [
                {
                  name: "P99 Latency",
                  metric: "Response time > 2000ms",
                  status: (p.p99.at(-1)?.value ?? 0) > 2e3 ? "ALARM" : "OK",
                },
                {
                  name: "Error Spike",
                  metric: "Errors > 5 per window",
                  status: (f.at(-1)?.value ?? 0) > 5 ? "ALARM" : "OK",
                },
                {
                  name: "Token Budget",
                  metric: "Tokens > 40K per window",
                  status: (v.at(-1)?.value ?? 0) > 4e4 ? "ALARM" : "OK",
                },
                {
                  name: "Heartbeat",
                  metric: "Interval > 2000ms",
                  status: (x.at(-1)?.value ?? 0) > 2e3 ? "ALARM" : "OK",
                },
                {
                  name: "Agent Offline",
                  metric: "No heartbeat > 5min",
                  status: "OK",
                },
                {
                  name: "Session Loop",
                  metric: "Same session > 100 turns",
                  status: "OK",
                },
              ].map((d) =>
                c.jsxs(
                  "div",
                  {
                    className: W(
                      "rounded-lg border p-3",
                      d.status === "ALARM"
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-border bg-card",
                    ),
                    children: [
                      c.jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [
                          c.jsx("span", {
                            className: "text-sm font-medium",
                            children: d.name,
                          }),
                          c.jsx("span", {
                            className: W(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              d.status === "ALARM"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-emerald-500/10 text-emerald-400",
                            ),
                            children: d.status,
                          }),
                        ],
                      }),
                      c.jsx("p", {
                        className: "mt-1 text-xs text-muted-foreground",
                        children: d.metric,
                      }),
                    ],
                  },
                  d.name,
                ),
              ),
            }),
          }),
        ],
      }),
    ],
  });
}
export { Ja as component };
