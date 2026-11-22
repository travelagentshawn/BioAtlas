// Data-driven graphics. No images are required: every species gets a "sigil" whose rings encode
// its lineage (one ring per ancestor taxon, outermost = closest to the species), and a
// phenology wheel that shows the best months to see it.
import { svg } from "./dom.js";
import { monthName } from "./labels.js";

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
// Hue ranges keep kingdoms recognisable: plants in greens/teals, animals in ambers/terracottas.
const HUES = { plantae: [95, 175], animalia: [8, 48], fungi: [260, 310], root: [200, 230] };
export function lineColor(id, kingdom, dark = false) {
  const [a, b] = HUES[kingdom] || HUES.root;
  const hue = a + (hash(id) % (b - a));
  const sat = 38 + (hash(id + "s") % 22);
  const light = dark ? 52 + (hash(id + "l") % 14) : 34 + (hash(id + "l") % 22);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function sigil(lineage, kingdom, size = 72, label = "") {
  const rings = lineage.slice(1); // skip the shared root
  const r0 = size / 2, step = (r0 - size * 0.16) / Math.max(rings.length, 1);
  const el = svg("svg", { class: "sigil", width: size, height: size, viewBox: `0 0 ${size} ${size}`, role: "img", "aria-label": label || "lineage sigil" });
  rings.forEach((id, i) => {
    const r = r0 - i * step;
    el.append(svg("circle", { cx: r0, cy: r0, r: r - 0.5, fill: lineColor(id, kingdom) }));
  });
  // thin separators + a pale core so the rings read as growth rings
  rings.forEach((id, i) => {
    el.append(svg("circle", { cx: r0, cy: r0, r: r0 - i * step, fill: "none", stroke: "var(--surface)", "stroke-width": size > 100 ? 1.5 : 1 }));
  });
  el.append(svg("circle", { cx: r0, cy: r0, r: size * 0.1, fill: "var(--surface)" }));
  return el;
}

// 12-segment ring. `months` highlighted; optional `current` month marked with a dot.
export function monthWheel(months, { size = 120, kingdom = "plantae", current = null, labels = true } = {}) {
  const on = new Set(months);
  const c = size / 2, rOut = c - 2, rIn = c * (labels ? 0.5 : 0.42);
  const el = svg("svg", { class: "wheel", width: size, height: size, viewBox: `0 0 ${size} ${size}`, role: "img",
    "aria-label": months.map(monthName).join(" ") });
  const pt = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)];
  for (let m = 1; m <= 12; m++) {
    const a0 = ((m - 1) / 12) * Math.PI * 2 + 0.02, a1 = (m / 12) * Math.PI * 2 - 0.02;
    const [x0, y0] = pt(rOut, a0), [x1, y1] = pt(rOut, a1), [x2, y2] = pt(rIn, a1), [x3, y3] = pt(rIn, a0);
    el.append(svg("path", {
      d: `M${x0},${y0} A${rOut},${rOut} 0 0 1 ${x1},${y1} L${x2},${y2} A${rIn},${rIn} 0 0 0 ${x3},${y3} Z`,
      class: on.has(m) ? `wheel-on ${kingdom}` : "wheel-off",
    }, svg("title", {}, monthName(m))));
    if (labels && size >= 100) {
      const [tx, ty] = pt((rOut + rIn) / 2, ((m - 0.5) / 12) * Math.PI * 2);
      el.append(svg("text", { x: tx, y: ty, class: on.has(m) ? "wheel-t on" : "wheel-t", "text-anchor": "middle", "dominant-baseline": "central" }, String(m)));
    }
  }
  if (current) {
    const [dx, dy] = pt(rIn - 6, ((current - 0.5) / 12) * Math.PI * 2);
    el.append(svg("circle", { cx: dx, cy: dy, r: 2.5, class: "wheel-now" }));
  }
  return el;
}

// Compact 12-cell strip used on cards.
export function monthStrip(months, kingdom = "plantae") {
  const on = new Set(months);
  const el = svg("svg", { class: "strip", width: 96, height: 10, viewBox: "0 0 96 10", "aria-label": months.map(monthName).join(" ") });
  for (let m = 1; m <= 12; m++) el.append(svg("rect", { x: (m - 1) * 8, y: 0, width: 7, height: 10, rx: 1.5, class: on.has(m) ? `wheel-on ${kingdom}` : "wheel-off" }));
  return el;
}

// Bar chart of species-per-month for a region.
export function monthBars(counts, { height = 96, kingdom = "plantae", highlight = null } = {}) {
  const max = Math.max(...counts, 1), w = 300;
  const el = svg("svg", { class: "bars", viewBox: `0 0 ${w} ${height + 20}`, role: "img", "aria-label": counts.join(",") });
  counts.forEach((n, i) => {
    const bw = w / 12 - 6, x = i * (w / 12) + 3, bh = Math.max((n / max) * height, n ? 3 : 1);
    el.append(svg("rect", { x, y: height - bh, width: bw, height: bh, rx: 2.5, class: `bar ${kingdom}${highlight === i + 1 ? " hi" : ""}` }, svg("title", {}, `${monthName(i + 1)}: ${n}`)));
    el.append(svg("text", { x: x + bw / 2, y: height + 14, "text-anchor": "middle", class: "bar-l" }, String(i + 1)));
    if (n) el.append(svg("text", { x: x + bw / 2, y: height - bh - 3, "text-anchor": "middle", class: "bar-n" }, String(n)));
  });
  return el;
}
