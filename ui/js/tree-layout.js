// Pure layout + rendering for cladograms. Used by the Tree view and by the Planner's "trip tree".
// Input node shape: { id, kind: "taxon"|"species", label, sub, kingdom, age, pruned, href, children: [] }
import { svg } from "./dom.js";
import { lineColor } from "./viz.js";
import { tr } from "./i18n.js";

export function layout(root, collapsed = new Set()) {
  const ROW = 30, COL = 150, PAD = 110;
  let row = 0, maxDepth = 0;
  const walk = (n, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    n._depth = depth;
    const kids = collapsed.has(n.id) ? [] : n.children || [];
    n._shown = kids;
    if (!kids.length) { n._y = row++ * ROW + ROW; }
    else { kids.forEach((k) => walk(k, depth + 1)); n._y = (kids[0]._y + kids[kids.length - 1]._y) / 2; }
    n._x = depth * COL + PAD;
  };
  walk(root, 0);
  return { rows: row, ROW, COL, maxDepth, width: maxDepth * COL + PAD, height: row * ROW + ROW };
}

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function render(root, { collapsed = new Set(), onToggle, showAge = true, dark = false, focusId = null, leafWidth = 320 } = {}) {
  const L = layout(root, collapsed);
  const W = L.width + leafWidth, H = L.height + 8;
  const el = svg("svg", { class: "cladogram", width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": tr("生命之树示意图。分类名称可打开详情，节点圆点可展开或折叠。需要层级列表阅读时，请切换到大纲视图。", "Phylogeny diagram. Taxon labels open details and node dots expand or collapse branches. Switch to Outline view for a hierarchical list.") });
  const edges = svg("g", { class: "edges" }), nodes = svg("g", { class: "nodes" });
  el.append(edges, nodes);

  const visit = (n, parent) => {
    const col = lineColor(n.id, n.kingdom, dark);
    if (parent) {
      edges.append(svg("path", { d: `M${parent._x},${parent._y} V${n._y} H${n._x}`, class: `edge ${n.kingdom}${n.pruned ? " pruned" : ""}`, stroke: col }));
    }
    const isLeaf = !n._shown.length;
    const hasKids = (n.children || []).length > 0;
    const g = svg("g", {
      class: `node ${n.kind}${focusId === n.id ? " focus" : ""}`,
      transform: `translate(${n._x},${n._y})`,
    });
    if (n.kind === "species") {
      g.append(svg("circle", { r: 4.5, fill: col, class: "dot" }));
      const a = svg("a", { href: n.href }, svg("text", { x: 10, y: 0, class: "leaf-label", "dominant-baseline": "central" }, n.label,
        svg("tspan", { class: "leaf-sci", dx: 8 }, n.sub || "")));
      g.append(a);
    } else {
      const toggle = hasKids && onToggle;
      const c = svg("circle", {
        r: hasKids && isLeaf ? 6.5 : 4,
        fill: hasKids && isLeaf ? col : "var(--surface)",
        stroke: col, "stroke-width": 2, class: "dot",
        style: { cursor: toggle ? "pointer" : "default" },
        tabindex: toggle ? 0 : null,
        role: toggle ? "button" : null,
        "aria-label": toggle ? `${tr("展开或折叠", "Expand or collapse")} ${n.label}` : null,
        "aria-expanded": toggle ? String(!collapsed.has(n.id)) : null,
      });
      if (toggle) {
        c.addEventListener("click", () => onToggle(n.id));
        c.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(n.id); }
        });
        g.append(svg("title", {}, tr("点击或按 Enter/空格展开/折叠", "Click or press Enter/Space to expand/collapse")));
      }
      g.append(c);
      const text = clip(n.label, 14);
      const a = svg("a", { href: n.href }, svg("text", { x: isLeaf ? 12 : -7, y: isLeaf ? 0 : -8, "text-anchor": isLeaf ? "start" : "end", "dominant-baseline": isLeaf ? "central" : "auto", class: "node-label" }, text,
        showAge && n.age ? svg("tspan", { class: "age-label", dx: 5 }, `${n.age.estimate}`) : null));
      a.append(svg("title", {}, n.label));
      g.append(a);
      if (isLeaf && hasKids) g.append(svg("text", { x: 12 + text.length * 11 + 6, y: 0, class: "collapsed-n", "dominant-baseline": "central" }, `+${n.species_count ?? n.children.length}`));
    }
    nodes.append(g);
    n._shown.forEach((k) => visit(k, n));
  };
  visit(root, null);
  return { el, layout: L };
}
