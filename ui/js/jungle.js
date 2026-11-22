// The explorable night-jungle on the home page. Everything is drawn procedurally as SVG (no image files).
// Species hotspots are keyed by species id; ids that are not drawn here are returned in `extras`
// so a species added to the data later still appears in the UI (as a chip) without touching this file.
// To draw a new species: add a draw function below and one entry in ART (position, hit boxes, ping point).
import { svg } from "./dom.js";
import { tr, getLang } from "./i18n.js";

const NS = (tag, a, ...k) => svg(tag, a, ...k);
const P = (d, a = {}) => NS("path", { d, ...a });
const C = (cx, cy, r, a = {}) => NS("circle", { cx, cy, r, ...a });
const E = (cx, cy, rx, ry, a = {}) => NS("ellipse", { cx, cy, rx, ry, ...a });
const R = (x, y, width, height, a = {}) => NS("rect", { x, y, width, height, ...a });
const L = (x1, y1, x2, y2, a = {}) => NS("line", { x1, y1, x2, y2, ...a });
const G = (a, ...k) => NS("g", a, ...k);
const U = (id, a = {}) => NS("use", { href: `#bj-${id}`, ...a });
const tf = (x, y, rot = 0, s = 1) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(2)})`;
const STROKE = (c, w) => ({ fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" });

function rng(seed) {
  let t = seed >>> 0;
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- defs ---------- */
const stops = (arr) => arr.map(([o, c, op]) => NS("stop", { offset: o, "stop-color": c, "stop-opacity": op ?? 1 }));
const lin = (id, x1, y1, x2, y2, arr) => NS("linearGradient", { id: `bj-${id}`, x1, y1, x2, y2 }, ...stops(arr));
const rad = (id, arr) => NS("radialGradient", { id: `bj-${id}`, cx: 0.5, cy: 0.5, r: 0.5 }, ...stops(arr));

function defs() {
  return NS("defs", {},
    lin("sky", 0, 0, 0, 1, [["0", "#06171a"], ["0.4", "#0a2822"], ["1", "#04110d"]]),
    lin("ground", 0, 0, 0, 1, [["0", "#0e2a1f"], ["1", "#050f0b"]]),
    lin("water", 0, 0, 0, 1, [["0", "#1d6b6a"], ["1", "#0d3d46"]]),
    lin("waterFront", 0, 0, 0, 1, [["0", "#0f4f58", 0.95], ["0.6", "#0a3340", 0.97], ["1", "#06222b"]]),
    lin("trunk", 0, 0, 1, 0, [["0", "#2a1d15"], ["0.5", "#4a3526"], ["1", "#241810"]]),
    lin("bamboo", 0, 0, 1, 0, [["0", "#1c5a3c"], ["0.45", "#52a574"], ["1", "#173f2c"]]),
    rad("moonHalo", [["0", "#f4eed2", 0.5], ["0.5", "#f4eed2", 0.12], ["1", "#f4eed2", 0]]),
    rad("gold", [["0", "#f1c84a", 0.34], ["1", "#f1c84a", 0]]),
    rad("red", [["0", "#e0502f", 0.3], ["1", "#e0502f", 0]]),
    rad("pink", [["0", "#f7a9c8", 0.3], ["1", "#f7a9c8", 0]]),
    rad("vig", [["0.55", "#000", 0], ["1", "#000", 0.55]]),
    NS("filter", { id: "bj-glow", x: "-30%", y: "-30%", width: "160%", height: "160%" },
      NS("feGaussianBlur", { stdDeviation: 5, result: "b" }), NS("feMerge", {}, NS("feMergeNode", { in: "b" }), NS("feMergeNode", { in: "SourceGraphic" }))),
    NS("filter", { id: "bj-blur", x: "-20%", y: "-50%", width: "140%", height: "200%" }, NS("feGaussianBlur", { stdDeviation: 16 })),
    NS("symbol", { id: "bj-fan", overflow: "visible" }, P("M0,0 L-13,-17 Q-15,-27 -7,-27 L-3,-23 L0,-28 L3,-23 L7,-27 Q15,-27 13,-17Z")),
    NS("symbol", { id: "bj-palm", overflow: "visible" }, P("M0,9 L-2,3 L-9,5 L-6,-1 L-12,-5 L-5,-6 L-6,-14 L0,-9 L6,-14 L5,-6 L12,-5 L6,-1 L9,5 L2,3Z")),
    NS("symbol", { id: "bj-blossom", overflow: "visible" },
      ...[0, 72, 144, 216, 288].map((a) => C(0, -4.2, 3.6, { transform: `rotate(${a})` })), C(0, 0, 1.6, { fill: "#d8386f" })));
}

/* ---------- species art (local coordinates; origin = foot / base) ---------- */
function panda() {
  const k = "#10130f", w = "#f4f1e8";
  return G({},
    E(0, -4, 38, 8, { fill: "#000", opacity: 0.28 }),
    E(-24, -12, 15, 12, { fill: k }), E(24, -12, 15, 12, { fill: k }),
    E(0, -44, 34, 38, { fill: w }),
    E(-31, -52, 11, 25, { fill: k, transform: "rotate(14 -31 -52)" }), E(31, -52, 11, 25, { fill: k, transform: "rotate(-14 31 -52)" }),
    C(0, -88, 25, { fill: w }), C(-19, -109, 9, { fill: k }), C(19, -109, 9, { fill: k }),
    E(-10, -89, 7.5, 9.5, { fill: k, transform: "rotate(22 -10 -89)" }), E(10, -89, 7.5, 9.5, { fill: k, transform: "rotate(-22 10 -89)" }),
    C(-9.5, -90, 2.3, { fill: w }), C(9.5, -90, 2.3, { fill: w }), E(0, -80, 5.5, 3.6, { fill: k }),
    P("M0,-76 Q-4,-70 -8,-72 M0,-76 Q4,-70 8,-72", STROKE(k, 1.6)));
}
function deer() {
  const body = "#a9764a", belly = "#dcbc92", dark = "#7d5434";
  return G({},
    E(0, -1, 48, 6, { fill: "#000", opacity: 0.28 }),
    ...[[-28, -30, -30, 0], [-16, -28, -15, 0], [18, -28, 17, 0], [30, -30, 32, 0]].map(([a, b, c, d]) => L(a, b, c, d, STROKE(dark, 5))),
    P("M-40,-54 Q-50,-60 -44,-44Z", { fill: "#f4ecd8" }),
    E(0, -50, 42, 19, { fill: body }), E(2, -42, 34, 9, { fill: belly, opacity: 0.8 }),
    P("M26,-60 Q44,-84 54,-92 L62,-86 Q50,-70 40,-48Z", { fill: body }),
    E(63, -88, 12, 7, { fill: body, transform: "rotate(28 63 -88)" }), C(66, -91, 1.6, { fill: "#111" }), E(73, -84, 3, 2.5, { fill: "#222" }),
    E(53, -98, 4, 8, { fill: dark, transform: "rotate(-20 53 -98)" }),
    P("M57,-97 L52,-124 M54.5,-111 L45,-119 M52,-124 L59,-130 M52,-124 L46,-130", STROKE("#e6cfa3", 2.3)),
    ...[[-20, -58], [-8, -62], [6, -60], [18, -56], [-26, -48], [-12, -50], [2, -52], [14, -46], [-2, -44], [24, -50]].map(([x, y]) => C(x, y, 1.9, { fill: "#f6ecd6", opacity: 0.9 })));
}
function macaque() {
  const fur = "#8c7761", f2 = "#6f5d49", face = "#e2b49a";
  return G({},
    P("M-8,-6 C-34,-8 -40,-34 -26,-44", STROKE(f2, 5)),
    E(0, -22, 13, 18, { fill: fur }), E(0, -18, 8, 11, { fill: "#b79f84" }),
    E(-12, -14, 5, 12, { fill: f2, transform: "rotate(18 -12 -14)" }), E(11, -12, 5, 11, { fill: f2, transform: "rotate(-18 11 -12)" }),
    C(2, -46, 10.5, { fill: fur }), E(4, -44, 7, 6.5, { fill: face }), C(-6, -47, 3.2, { fill: fur }), C(-6, -47, 1.7, { fill: face }),
    C(1.5, -47, 1.1, { fill: "#222" }), C(7, -47, 1.1, { fill: "#222" }), E(4, -41.5, 2.3, 1.4, { fill: "#b66b5a" }),
    E(-6, 0, 8, 4, { fill: f2 }), E(8, 0, 8, 4, { fill: f2 }));
}
function egret() {
  const w = "#f5f4ee", leg = "#2d2b26";
  return G({},
    L(-3, -34, -5, 0, STROKE(leg, 2.2)), L(5, -34, 7, 0, STROKE(leg, 2.2)),
    E(-6, -2, 6, 2, { fill: "#d2b24a" }), E(9, -2, 6, 2, { fill: "#d2b24a" }),
    E(0, -44, 22, 11, { fill: w, transform: "rotate(-18 0 -44)" }),
    P("M-18,-52 Q-38,-48 -44,-34 Q-30,-44 -14,-46Z", { fill: w }),
    P("M12,-52 C34,-62 14,-84 26,-96", STROKE(w, 6)), C(27, -98, 6, { fill: w }),
    P("M32,-99 L56,-94 L32,-95Z", { fill: "#e8c34a" }), C(28, -100, 1.4, { fill: "#111" }), P("M24,-103 Q14,-108 8,-104", STROKE(w, 1.4)));
}
function duck(male) {
  const c = male ? "#c9692e" : "#8d8174";
  return G({},
    E(0, 6, 22, 3, { fill: "#fff", opacity: 0.12 }), E(0, 0, 16, 7.5, { fill: c }),
    male ? P("M-6,-5 Q-2,-24 10,-8Z", { fill: "#e98a2e" }) : null, male ? E(-2, -1, 9, 4, { fill: "#4a6fa8", opacity: 0.9 }) : null,
    C(15, -8, 6.5, { fill: male ? "#2f7a5f" : "#9a8f80" }), male ? P("M10,-12 Q4,-20 12,-18Z", { fill: "#f2e6c9" }) : null,
    P("M20,-8 L27,-6.5 L20,-5Z", { fill: male ? "#e24a3b" : "#555" }), C(17, -9, 1.1, { fill: "#111" }));
}
function carp() {
  return G({ class: "swim" },
    P("M-30,0 C-16,-13 12,-13 26,-2 C12,11 -16,11 -30,0Z", { fill: "#e8793a" }), E(-6, -4, 9, 4, { fill: "#fff4e6", opacity: 0.9 }), E(10, -3, 5, 3, { fill: "#c93f2c", opacity: 0.9 }),
    P("M-28,0 L-46,-12 Q-42,0 -46,12Z", { fill: "#d85f2a" }), P("M-6,-9 Q0,-16 8,-9Z", { fill: "#d85f2a" }), C(18, -3, 1.6, { fill: "#111" }));
}
function coralStag() {
  const r = rng(11), out = [];
  const br = (x, y, len, ang, d) => {
    if (d === 0 || len < 4) return;
    const x2 = x + Math.cos(ang) * len, y2 = y - Math.sin(ang) * len; out.push(`M${x.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`);
    br(x2, y2, len * 0.74, ang + 0.42 + r() * 0.18, d - 1); br(x2, y2, len * 0.74, ang - 0.42 - r() * 0.18, d - 1);
  };
  br(0, 0, 14, Math.PI / 2, 5); br(-10, 0, 11, Math.PI / 2 + 0.5, 4); br(12, 0, 11, Math.PI / 2 - 0.5, 4);
  return G({}, P(out.join(" "), STROKE("#e9a58a", 3.2)), P(out.join(" "), { ...STROKE("#fbe0cf", 1), opacity: 0.7 }));
}
function coralElk() {
  return G({},
    P("M-44,0 C-48,-14 -30,-20 -24,-9 C-18,-26 4,-26 8,-10 C16,-24 40,-18 40,0Z", { fill: "#c98a4b" }),
    P("M-30,-10 Q-20,-18 -10,-10 M2,-12 Q14,-20 24,-10", { ...STROKE("#e6b27a", 2), opacity: 0.8 }),
    ...[[-30, -18], [-14, -22], [2, -24], [18, -20], [30, -14]].map(([x, y]) => E(x, y, 3.2, 5, { fill: "#d9a063" })));
}
function amanita() {
  const m = (x, y, s) => G({ transform: tf(x, y, 0, s) },
    P("M-4,0 L-3,-14 L3,-14 L4,0Z", { fill: "#efe6d2" }), E(0, -13, 8, 2.4, { fill: "#efe6d2" }),
    P("M-18,-15 C-18,-36 18,-36 18,-15 C10,-11 -10,-11 -18,-15Z", { fill: "#d8372e" }),
    ...[[-8, -24, 2], [2, -29, 2.3], [10, -22, 1.8], [-1, -20, 1.5], [-13, -18, 1.4]].map(([a, b, r]) => C(a, b, r, { fill: "#fff" })));
  return G({}, E(0, 2, 34, 5, { fill: "#000", opacity: 0.3 }), m(-16, 0, 0.9), m(8, 3, 1.15), m(28, -1, 0.7));
}
function moss() {
  const r = rng(5), shoots = [];
  for (let i = 0; i < 22; i++) { const x = -26 + i * 2.5 + r() * 2, h = 10 + r() * 10; shoots.push(P(`M${x.toFixed(1)},0 L${(x + (r() - 0.5) * 4).toFixed(1)},${-h.toFixed(1)}`, STROKE("#3f9a5e", 1.8))); }
  const spo = [-16, -4, 9, 20].map((x, i) => G({}, L(x, 0, x + 1, -(24 + i * 3), STROKE("#b4783a", 1.2)), E(x + 1, -(26 + i * 3), 2.6, 4, { fill: "#c98a4b" })));
  return G({}, E(0, 1, 32, 8, { fill: "#245f3d" }), ...shoots, ...spo);
}
function equisetum() {
  const stalks = [[-14, 54], [-5, 66], [4, 48], [12, 60], [20, 40]].map(([x, h], i) => {
    const kids = [];
    for (let y = 10; y < h; y += 9) for (const d of [-1, 1]) kids.push(L(x, -y, x + d * 8, -y - 4, STROKE("#78b588", 1)));
    return G({}, L(x, 0, x, -h, STROKE(i === 4 ? "#a77a52" : "#5f9a72", 2.6)), ...kids, i === 4 ? E(x, -h - 4, 2.8, 6, { fill: "#8a6139" }) : null);
  });
  return G({}, ...stalks);
}
function teaBush(s = 1) {
  return G({ transform: `scale(${s})` }, P("M-26,0 C-26,-22 26,-22 26,0Z", { fill: "#1d5a3b" }),
    ...[[-14, -14], [-4, -17], [8, -16], [17, -11], [-20, -8], [2, -9]].map(([x, y]) => C(x, y, 3, { fill: "#7fc28a", opacity: 0.85 })), C(10, -18, 1.8, { fill: "#fff6dc" }));
}
function rice() {
  const r = rng(9), parts = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
    const x = 6 + i * 17 + (row % 2) * 8, y = -row * 11, lean = (r() - 0.5) * 8;
    parts.push(G({ transform: `translate(${x} ${y})` },
      P(`M0,0 Q${lean - 4},-14 ${lean - 12},-24`, STROKE("#c8b552", 1.7)), P(`M0,0 Q${lean + 2},-16 ${lean + 6},-27`, STROKE("#d6c25e", 1.7)), P("M0,0 Q-2,-12 -4,-20", STROKE("#9bb057", 1.5)),
      E(lean - 12, -22, 2.2, 4.5, { fill: "#e6d070" }), E(lean + 6, -25, 2.2, 4.5, { fill: "#f0dc7a" })));
  }
  return G({}, E(52, 2, 66, 8, { fill: "#0a2a1c" }), ...parts);
}
function butterfly() {
  const wing = () => G({ class: "wing" },
    P("M0,0 C-8,-14 -26,-18 -30,-8 C-30,2 -14,6 0,2Z", { fill: "#f3d44a" }), P("M-8,-8 L-24,-10 M-6,-3 L-26,-3", STROKE("#1c1c14", 1.3)),
    P("M0,2 C-10,6 -22,8 -24,16 L-27,29 L-19,21 C-10,22 -2,14 0,6Z", { fill: "#f0c93a" }), C(-15, 14, 2.2, { fill: "#4a86d8" }), P("M-30,-8 C-30,2 -14,6 0,2", STROKE("#1c1c14", 1.6)));
  return G({}, wing(), G({ transform: "scale(-1 1)" }, wing()), E(0, 3, 1.8, 10, { fill: "#2a2418" }));
}
function dragonfly() {
  const wing = (x, y, r) => E(x, y, 15, 3.6, { fill: "#d7f4ee", opacity: 0.55, transform: `rotate(${r} ${x} ${y})`, class: "dw" });
  return G({ class: "hov" }, wing(-4, -8, -14), wing(-4, -8, 14), wing(-8, 8, 12), wing(-8, 8, -12),
    L(-24, 0, 14, 0, STROKE("#79d3c4", 3)), C(17, 0, 4, { fill: "#79d3c4" }), C(19, -1, 1.6, { fill: "#143" }));
}
function bulbul() {
  return G({}, L(-1, -2, -2, 4, STROKE("#333", 1.4)), L(3, -2, 3, 4, STROKE("#333", 1.4)),
    P("M-9,-8 L-22,-4 L-9,-4Z", { fill: "#8a8f7a" }), E(0, -8, 10, 6.5, { fill: "#a3a893" }), E(1, -5, 6, 3, { fill: "#e9e6d6" }),
    C(8, -13, 5.6, { fill: "#16181a" }), E(4.5, -14, 2.4, 3.6, { fill: "#fff" }), P("M12,-13 L17,-12 L12,-11Z", { fill: "#2a2a2a" }), C(9.5, -14, 0.9, { fill: "#fff" }));
}
function sparrow() {
  return G({}, L(-1, -2, -2, 4, STROKE("#333", 1.4)), L(3, -2, 3, 4, STROKE("#333", 1.4)),
    P("M-9,-8 L-21,-5 L-9,-4Z", { fill: "#7d5a3a" }), E(0, -8, 10, 6.5, { fill: "#a97a4e" }), E(1, -5, 6, 3, { fill: "#d9cdb4" }),
    C(8, -13, 5.6, { fill: "#8a4a2a" }), E(8.5, -11.5, 3.6, 3, { fill: "#efe6d2" }), C(9, -11, 1, { fill: "#222" }), P("M12,-13 L16,-12 L12,-11Z", { fill: "#3a3a3a" }), C(9.5, -14.5, 0.9, { fill: "#fff" }));
}
function gecko() {
  return G({}, P("M-14,0 Q-30,8 -40,-4", STROKE("#a89a7e", 3)), E(0, 0, 15, 4.6, { fill: "#bcae8e" }), E(17, -1, 6.5, 4.2, { fill: "#c8ba9a" }),
    ...[[-8, -3, -12, -9], [6, -3, 10, -9], [-8, 3, -12, 9], [6, 3, 10, 9]].map(([a, b, c, d]) => L(a, b, c, d, STROKE("#a89a7e", 2))),
    ...[-3, -1, 2].map((x) => C(x * 3, -1.5, 1.2, { fill: "#8d7e62" })), C(20, -2.4, 1.2, { fill: "#222" }));
}

/* trees */
function ginkgoTree() {
  const r = rng(3), g = G({});
  g.append(C(0, -320, 160, { fill: "url(#bj-gold)" }),
    P("M-17,0 C-14,-70 -10,-150 -7,-230 L7,-230 C10,-150 14,-70 17,0 C26,4 34,8 40,12 L-40,12 C-34,8 -26,4 -17,0Z", { fill: "url(#bj-trunk)" }),
    P("M0,-210 L-60,-290 M0,-215 L58,-296 M0,-222 L-8,-300 M0,-200 L-90,-250 M0,-200 L88,-256", STROKE("#3b2a1e", 5)));
  for (let i = 0; i < 190; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = Math.cos(a) * 118 * d, y = -318 + Math.sin(a) * 104 * d;
    g.append(U("fan", { transform: tf(x, y, (a * 180) / Math.PI + 90 + (r() - 0.5) * 70, 0.75 + r() * 0.6), fill: `hsl(${42 + r() * 16} 90% ${48 + r() * 18}%)`, opacity: 0.95 }));
  }
  for (let i = 0; i < 14; i++) g.append(U("fan", { transform: tf(-70 + r() * 150, 4 + r() * 10, r() * 360, 0.6), fill: `hsl(${44 + r() * 10} 85% 52%)`, opacity: 0.6 }));
  return g;
}
function mapleTree() {
  const r = rng(8), g = G({});
  g.append(C(0, -120, 100, { fill: "url(#bj-red)" }),
    P("M-8,0 C-6,-40 -4,-70 -3,-100 L4,-100 C5,-70 8,-40 9,0Z", { fill: "url(#bj-trunk)" }), P("M0,-80 L-34,-120 M0,-86 L36,-124 M0,-92 L2,-130", STROKE("#3b2a1e", 3.5)));
  for (let i = 0; i < 120; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = Math.cos(a) * 74 * d, y = -122 + Math.sin(a) * 52 * d;
    g.append(U("palm", { transform: tf(x, y, r() * 360, 0.8 + r() * 0.7), fill: `hsl(${2 + r() * 22} ${68 + r() * 16}% ${42 + r() * 16}%)`, opacity: 0.96 }));
  }
  for (let i = 0; i < 12; i++) g.append(U("palm", { transform: tf(-60 + r() * 120, 6 + r() * 8, r() * 360, 0.7), fill: "hsl(8 75% 46%)", opacity: 0.55 }));
  return g;
}
function conifer(x, base, h, w, hue, seed) {
  const r = rng(seed), g = G({}), n = 11, tw = w * 0.07;
  g.append(R(x - tw / 2, base - h * 0.15, tw, h * 0.15 + 8, { fill: "#2a1d15" }));
  for (let i = n - 1; i >= 0; i--) {
    const y = base - h + (i / n) * h * 0.92, hw = w * (0.12 + 0.88 * ((i + 1) / n)) / 2, y2 = y + (h / n) * 1.5;
    g.append(P(`M${x},${y.toFixed(1)} L${(x - hw).toFixed(1)},${y2.toFixed(1)} Q${x},${(y2 - 7).toFixed(1)} ${(x + hw).toFixed(1)},${y2.toFixed(1)}Z`, { fill: `hsl(${hue} 34% ${20 + (i / n) * 7}%)` }));
    if (r() > 0.35) g.append(E(x - hw * 0.82, y2 - 3, hw * 0.28, 3, { fill: "#b9683a", opacity: 0.5 }), E(x + hw * 0.82, y2 - 3, hw * 0.28, 3, { fill: "#b9683a", opacity: 0.5 }));
  }
  return g;
}
function redwoods() { return G({}, conifer(55, 650, 400, 92, 160, 1), conifer(112, 660, 330, 82, 150, 2), conifer(168, 650, 270, 76, 165, 4)); }
function camphorTree() {
  const r = rng(6), g = G({});
  g.append(P("M-26,0 C-20,-60 -14,-160 -10,-290 L10,-290 C16,-160 22,-60 28,0 C40,4 50,8 58,12 L-58,12 C-48,8 -38,4 -26,0Z", { fill: "url(#bj-trunk)" }),
    P("M6,-190 Q50,-200 94,-214", STROKE("#3d2c20", 7)), P("M-4,-230 Q-40,-250 -76,-262 M4,-250 Q40,-280 72,-300", STROKE("#3d2c20", 5)), P("M-60,-262 Q-70,-300 -50,-330", STROKE("#3d2c20", 3)));
  for (let i = 0; i < 30; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = Math.cos(a) * 112 * d, y = -340 + Math.sin(a) * 58 * d, rr = 26 + r() * 24;
    g.append(C(x, y, rr, { fill: `hsl(${138 + r() * 22} ${36 + r() * 10}% ${18 + r() * 9}%)` }));
  }
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = Math.cos(a) * 100 * d - 10, y = -352 + Math.sin(a) * 48 * d;
    g.append(C(x, y, 9 + r() * 10, { fill: `hsl(${130 + r() * 25} 46% ${30 + r() * 10}%)`, opacity: 0.55 }));
  }
  g.append(P("M-76,-262 L-100,-248 M-70,-266 L-96,-270", STROKE("#3d2c20", 3)));
  return g;
}
function bambooGrove() {
  const r = rng(12), g = G({}), xs = [640, 664, 690, 716, 742, 762];
  xs.forEach((x, i) => {
    const top = 300 + r() * 60, lean = (r() - 0.5) * 14, w = 9 + (i % 2) * 2, base = 806;
    g.append(P(`M${x - w / 2},${base} L${x - w / 2 + lean},${top} L${x + w / 2 + lean},${top} L${x + w / 2},${base}Z`, { fill: "url(#bj-bamboo)" }));
    for (let y = base - 50; y > top + 20; y -= 54 + r() * 14) {
      const lx = x + lean * ((base - y) / (base - top));
      g.append(R(lx - w / 2 - 1, y, w + 2, 3, { fill: "#0f3322", opacity: 0.7 }));
      if (y < 600) for (const d of [-1, 1]) g.append(P(`M${lx},${y} Q${lx + d * 14},${y - 8} ${lx + d * 30},${y - 4} Q${lx + d * 14},${y + 2} ${lx},${y}Z`, { fill: `hsl(${130 + r() * 20} 48% ${34 + r() * 10}%)` }));
    }
    for (let k = 0; k < 7; k++) g.append(P(`M${x + lean},${top + k * 9} q${(k % 2 ? 1 : -1) * 22},-10 ${(k % 2 ? 1 : -1) * 40},-2 q${(k % 2 ? -1 : 1) * 20},5 ${(k % 2 ? -1 : 1) * -40},-2Z`, { fill: `hsl(${128 + r() * 24} 52% ${32 + r() * 14}%)`, opacity: 0.9 }));
  });
  return g;
}
function cherryBranch() {
  const r = rng(21), g = G({}), pts = [[820, 66], [740, 92], [690, 128], [640, 172], [596, 206], [560, 226]];
  g.append(C(690, 160, 120, { fill: "url(#bj-pink)" }), P("M820,66 C740,86 690,126 640,172 S592,208 556,228", STROKE("#3a2429", 7)), P("M740,90 L772,128 M690,128 L700,176 M640,172 L618,214 M670,138 L644,112 M610,200 L600,236", STROKE("#3a2429", 3.5)));
  for (let i = 0; i < 70; i++) {
    const t = r() * (pts.length - 1), k = Math.floor(t), f = t - k, x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f + (r() - 0.5) * 70, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f + (r() - 0.5) * 60 + 10;
    g.append(U("blossom", { transform: tf(x, y, r() * 360, 0.9 + r() * 0.6), fill: r() > 0.3 ? "#f9cfe0" : "#f3a3c3", opacity: 0.96 }));
  }
  return g;
}
function lotusLeaves() {
  const leaf = (x, y, s) => G({ transform: tf(x, y, 0, s) }, E(0, 0, 30, 9, { fill: "#2e8a62" }), P("M0,0 L28,-2 M0,0 L-26,3 M0,0 L8,8 M0,0 L-10,-8", { ...STROKE("#1d6a47", 1), opacity: 0.8 }));
  const flower = (x, y, s) => G({ transform: tf(x, y, 0, s) }, L(0, 0, 0, 16, STROKE("#2e8a62", 2.5)),
    ...[-50, -25, 0, 25, 50].map((a) => E(0, -9, 5.2, 11, { fill: "#f4a9c6", transform: `rotate(${a} 0 0)` })), ...[-12, 12].map((a) => E(0, -8, 4, 8, { fill: "#fbd0e1", transform: `rotate(${a} 0 0)` })), C(0, -4, 3, { fill: "#f0c84a" }));
  return G({}, leaf(292, 838, 1), leaf(338, 856, 0.9), leaf(450, 862, 1.1), leaf(552, 840, 0.85), leaf(300, 818, 0.7), flower(336, 846, 1), flower(480, 850, 1.05), flower(268, 832, 0.75));
}

/* ---------- placement table ---------- */
// at: [x, y, scale]; hits: [[x, y, w, h], ...] in scene units; ping: marker position.
const ART = {
  "metasequoia-glyptostroboides": { draw: redwoods, at: [0, 0, 1], hits: [[30, 240, 175, 415]], ping: [110, 430] },
  "acer-palmatum": { draw: mapleTree, at: [125, 790, 1], hits: [[50, 612, 150, 180]], ping: [125, 668] },
  "ginkgo-biloba": { draw: ginkgoTree, at: [300, 790, 1], hits: [[185, 350, 235, 440]], ping: [300, 455] },
  "cinnamomum-camphora": { draw: camphorTree, at: [500, 720, 1], hits: [[382, 290, 250, 170], [482, 460, 36, 260]], ping: [500, 380], pre: true },
  "phyllostachys-edulis": { draw: bambooGrove, at: [0, 0, 1], hits: [[625, 290, 145, 515]], ping: [700, 420] },
  "prunus-x-yedoensis": { draw: cherryBranch, at: [0, 0, 1], hits: [[565, 52, 235, 195]], ping: [690, 150] },
  "nelumbo-nucifera": { draw: lotusLeaves, at: [0, 0, 1], hits: [[258, 805, 330, 65]], ping: [480, 836] },
  "oryza-sativa": { draw: rice, at: [14, 992, 1], hits: [[8, 925, 112, 70]], ping: [60, 962] },
  "camellia-sinensis": { draw: () => G({}, ...[0, 1, 2, 3, 4].map((i) => G({ transform: `translate(${620 + i * 42} ${975 + (i % 2) * 14})` }, teaBush(1.05)))), at: [0, 0, 1], hits: [[592, 942, 205, 56]], ping: [700, 968] },
  "equisetum-arvense": { draw: equisetum, at: [598, 880, 0.95], hits: [[572, 812, 58, 74]], ping: [598, 846] },
  "polytrichum-commune": { draw: moss, at: [146, 984, 1], hits: [[114, 940, 62, 50]], ping: [146, 962] },
  "amanita-muscaria": { draw: amanita, at: [196, 976, 1.05], hits: [[168, 928, 68, 56]], ping: [200, 950] },
  "ailuropoda-melanoleuca": { draw: panda, at: [690, 800, 1], hits: [[646, 682, 90, 122]], ping: [690, 740] },
  "cervus-nippon": { draw: deer, at: [222, 796, 0.9], hits: [[184, 676, 108, 125]], ping: [225, 740] },
  "macaca-mulatta": { draw: macaque, at: [584, 506, 1.1], hits: [[556, 438, 62, 72]], ping: [586, 472] },
  "egretta-garzetta": { draw: egret, at: [510, 836, 0.9], hits: [[476, 736, 82, 104]], ping: [520, 790] },
  "aix-galericulata": { draw: () => G({ class: "bob" }, G({ transform: "translate(-22 4)" }, duck(false)), G({ transform: "translate(18 -2)" }, duck(true))), at: [412, 846, 1], hits: [[372, 824, 78, 32]], ping: [412, 838] },
  "cyprinus-carpio": { draw: carp, at: [400, 904, 1], hits: [[350, 888, 74, 34]], ping: [398, 904] },
  "acropora-cervicornis": { draw: coralStag, at: [292, 944, 1], hits: [[258, 908, 70, 40]], ping: [292, 924] },
  "acropora-palmata": { draw: coralElk, at: [506, 944, 1], hits: [[460, 920, 92, 28]], ping: [508, 930] },
  "papilio-xuthus": { draw: butterfly, at: [588, 258, 1], hits: [[552, 236, 68, 52]], ping: [588, 262] },
  "pantala-flavescens": { draw: dragonfly, at: [380, 762, 1], hits: [[344, 740, 62, 36]], ping: [380, 760] },
  "pycnonotus-sinensis": { draw: bulbul, at: [438, 350, 1.15], hits: [[420, 328, 44, 36]], ping: [440, 340] },
  "passer-montanus": { draw: sparrow, at: [700, 838, 1.2], hits: [[680, 814, 42, 32]], ping: [700, 828] },
  "hemidactylus-frenatus": { draw: gecko, at: [504, 640, 1.25], hits: [[486, 596, 36, 54]], ping: [504, 626], rot: -90 },
};
const TWIG = () => G({}, P("M430,372 Q444,360 470,376", STROKE("#3d2c20", 3)));
const SIGNS = [
  { href: "#/explore", zh: "探索全部", en: "Explore all", ja: "すべて探索" },
  { href: "#/regions", zh: "旅行场景", en: "Scenes", ja: "観察スポット" },
  { href: "#/planner", zh: "行程工作台", en: "Workbench", ja: "プランナー" },
  { href: "#/docs", zh: "Documentation", en: "Documentation", ja: "Documentation" },
];

/* ---------- scene ---------- */
export function buildJungle({ species, nameOf, onPick, onSign }) {
  const root = NS("svg", { class: "jungle", viewBox: "0 0 800 1000", preserveAspectRatio: "xMidYMid slice", role: "group", "aria-label": tr("可探索的夜间丛林：点击生物查看谱系", "Explorable night jungle: click a creature to see its lineage", "探索できる夜の森：生きものをクリックして系統を見る") });
  root.append(defs(), R(0, 0, 800, 1000, { fill: "url(#bj-sky)" }));

  const r = rng(99);
  // moon + far scenery
  root.append(C(392, 118, 120, { fill: "url(#bj-moonHalo)" }), C(392, 118, 40, { fill: "#f4eed2" }), C(380, 108, 7, { fill: "#e2dbbd", opacity: 0.6 }), C(404, 128, 5, { fill: "#e2dbbd", opacity: 0.5 }),
    P("M0,470 C80,420 140,440 220,410 S380,380 460,420 S640,400 800,450 L800,720 L0,720Z", { fill: "#0f2e27" }),
    P("M0,530 C100,490 200,520 300,498 S520,478 620,508 S740,498 800,520 L800,720 L0,720Z", { fill: "#0b261f" }));
  for (let i = 0; i < 3; i++) root.append(E(160 + i * 260, 520 + i * 60, 220, 26, { fill: "#cfe8df", opacity: 0.08, filter: "url(#bj-blur)", class: `drift d${i}` }));
  root.append(P("M0,610 C150,590 300,620 400,604 S650,598 800,618 L800,1000 L0,1000Z", { fill: "url(#bj-ground)" }));

  // pond (surface behind, cut-away water volume in front)
  const waterBack = G({}, E(400, 830, 196, 46, { fill: "url(#bj-water)" }), E(380, 822, 120, 18, { fill: "#f4eed2", opacity: 0.1 }));
  const waterFront = G({}, P("M204,832 C204,900 248,942 330,948 L470,948 C556,942 596,900 596,832 C596,872 500,878 400,878 C300,878 204,872 204,832Z", { fill: "url(#bj-waterFront)" }),
    ...[0, 1, 2].map((i) => P(`M${290 + i * 90},878 L${270 + i * 100},946`, { stroke: "#9fe3d6", "stroke-width": 14, opacity: 0.05 })),
    E(400, 830, 196, 46, { fill: "none", stroke: "#8fd6cd", "stroke-width": 1.2, opacity: 0.4, class: "ripple" }), E(400, 832, 150, 34, { fill: "none", stroke: "#8fd6cd", "stroke-width": 1, opacity: 0.25, class: "ripple r2" }));

  const hs = new Map(), nodes = [];
  const wanted = new Set(species.map((s) => s.id));
  const hot = (id, name, a) => {
    const el = G({ class: "hs", "data-id": id, tabindex: 0, role: "button", "aria-label": name },
      G({ class: "art", transform: tf(a.at[0], a.at[1], a.rot || 0, a.at[2]) }, a.draw()),
      ...a.hits.map(([x, y, w, h]) => R(x, y, w, h, { class: "hit", rx: 14 })),
      C(a.ping[0], a.ping[1], 4.5, { class: "ping" }));
    hs.set(id, { el, ping: a.ping });
    return el;
  };
  const place = (id) => (wanted.has(id) && ART[id] ? hot(id, nameOf(id), ART[id]) : null);

  // layer order, back to front
  const order = [
    "metasequoia-glyptostroboides", "prunus-x-yedoensis", "cinnamomum-camphora", "phyllostachys-edulis", "acer-palmatum", "ginkgo-biloba",
  ];
  order.forEach((id) => { const n = place(id); if (n) root.append(n); });
  root.append(TWIG(), waterBack);
  ["nelumbo-nucifera"].forEach((id) => { const n = place(id); if (n) root.append(n); });
  root.append(waterFront);
  ["cyprinus-carpio", "acropora-cervicornis", "acropora-palmata", "egretta-garzetta", "aix-galericulata", "cervus-nippon", "ailuropoda-melanoleuca",
    "macaca-mulatta", "pycnonotus-sinensis", "hemidactylus-frenatus", "papilio-xuthus", "pantala-flavescens", "camellia-sinensis", "oryza-sativa",
    "polytrichum-commune", "amanita-muscaria", "equisetum-arvense"].forEach((id) => { const n = place(id); if (n) root.append(n); });

  // signpost (module navigation) + sparrow on top
  const post = G({ class: "signpost" }, R(696, 836, 8, 100, { fill: "#4a3626", rx: 2 }));
  const lang = getLang();
  SIGNS.forEach((s, i) => {
    const y = 846 + i * 22, left = i % 2 === 0, x0 = left ? 636 : 696, w = 68;
    const body = left ? `M${x0},${y} L${x0 + w},${y} L${x0 + w},${y + 18} L${x0},${y + 18} L${x0 - 8},${y + 9}Z` : `M${x0},${y} L${x0 + w},${y} L${x0 + w + 8},${y + 9} L${x0 + w},${y + 18} L${x0},${y + 18}Z`;
    post.append(G({ class: "sign", "data-href": s.href, tabindex: 0, role: "link", "aria-label": s[lang] || s.en },
      P(body, { fill: "#8a6842", stroke: "#2c1f14", "stroke-width": 1 }), NS("text", { x: x0 + w / 2 + (left ? 0 : 0), y: y + 12.5, "text-anchor": "middle", class: "sign-t" }, s[lang] || s.en)));
  });
  root.append(post);
  const sp = place("passer-montanus"); if (sp) root.append(sp);

  // fireflies + vignette
  const ff = G({ class: "fireflies", "aria-hidden": "true" });
  for (let i = 0; i < 26; i++) ff.append(C(30 + r() * 740, 240 + r() * 640, 1.4 + r() * 1.6, { class: "ff", style: `animation-delay:${(r() * 6).toFixed(1)}s;animation-duration:${(3 + r() * 4).toFixed(1)}s` }));
  root.append(ff, R(0, 0, 800, 1000, { fill: "url(#bj-vig)", "pointer-events": "none" }));

  // events (delegated)
  const idOf = (t) => t.closest?.(".hs")?.dataset.id || null;
  const hover = { in: () => {}, out: () => {} };
  root.addEventListener("click", (e) => {
    const sign = e.target.closest?.(".sign"); if (sign) { onSign(sign.dataset.href); return; }
    const id = idOf(e.target); if (id) onPick(id);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const sign = e.target.closest?.(".sign"); if (sign) { e.preventDefault(); onSign(sign.dataset.href); return; }
    const id = idOf(e.target); if (id) { e.preventDefault(); onPick(id); }
  });
  root.addEventListener("pointermove", (e) => hover.in(idOf(e.target) || (e.target.closest?.(".sign") ? "__sign" : null), e));
  root.addEventListener("pointerleave", () => hover.in(null));

  return {
    el: root,
    extras: species.filter((s) => !ART[s.id]).map((s) => s.id),
    onHover: (fn) => { hover.in = fn; },
    setSelected(id) { hs.forEach((v, k) => v.el.classList.toggle("sel", k === id)); },
    setVisible(set) { hs.forEach((v, k) => v.el.classList.toggle("dim", !!set && !set.has(k))); },
    setHints(on) { root.classList.toggle("no-hints", !on); },
    pingOf(id) { return hs.get(id)?.el.querySelector(".ping") || null; },
    has: (id) => hs.has(id),
  };
}
