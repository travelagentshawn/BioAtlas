// Left pane of the home page: evolutionary lineage rail + collapsible tree.
// Pure UI over API objects (api.tree(), api.taxa(), api.speciesList()); no data is embedded here.
import { h, clear } from "./dom.js";
import { tr, loc } from "./i18n.js";
import { label } from "./labels.js";
import { lineColor } from "./viz.js";

const age = (a) => (a ? `${a.min}–${a.max} ${tr("百万年前", "Mya", "百万年前")}` : "");

/* ---- lineage rail: selected species / taxon, or the life timeline when nothing is selected ---- */
export function lineagePanel(taxa, species) {
  const byId = new Map(taxa.map((t) => [t.id, t]));
  const el = h("section", { class: "lineage", "aria-live": "polite" });

  const step = (t, last, extra) => h("li", { class: `ln-step${last ? " last" : ""}` },
    h("span", { class: "ln-dot", style: `background:${lineColor(t.id, t.kingdom)}` }),
    h("a", { class: "ln-body", href: `#/taxon/${t.id}` },
      h("span", { class: "ln-rank" }, label("rank", t.rank)),
      h("b", null, loc(t.names)), " ", h("i", { class: "sci sm" }, t.scientific_name),
      t.age_mya ? h("span", { class: "ln-age" }, `≈ ${t.age_mya.estimate} ${tr("百万年前", "Mya", "百万年前")} · ${age(t.age_mya)}`) : null),
    extra || null);

  function show({ sp = null, taxonId = null } = {}) {
    clear(el);
    let chain = null, tail = null, title;
    if (sp) { chain = [...sp.lineage]; title = loc(sp.names); tail = sp; }
    else if (taxonId) {
      chain = []; for (let t = byId.get(taxonId); t; t = byId.get(t.parent)) chain.unshift(t.id);
      title = loc(byId.get(taxonId)?.names);
    }
    if (!chain) {
      const marks = taxa.filter((t) => t.age_mya).sort((a, b) => b.age_mya.estimate - a.age_mya.estimate).slice(0, 8);
      el.append(h("h2", null, tr("生命时间轴", "Timeline of life", "生命の時間軸")),
        h("p", { class: "muted small" }, tr("按分歧年代从古到今排列。点击右侧丛林中的生物或下方的树，查看它自己的谱系。", "Oldest divergences first. Pick a creature in the jungle or a node in the tree to see its own lineage.", "古い分岐から順に表示。右の森の生きものか下の樹を選ぶと、その系統を表示します。")),
        h("ol", { class: "ln-rail" }, marks.map((t, i) => step(t, i === marks.length - 1))));
      return;
    }
    const steps = chain.map((id) => byId.get(id)).filter(Boolean);
    el.append(h("h2", null, tr("演化脉络 · ", "Lineage · ", "系統 · "), title),
      h("ol", { class: "ln-rail" }, steps.map((t, i) => step(t, !tail && i === steps.length - 1)),
        tail ? h("li", { class: "ln-step last sp" }, h("span", { class: "ln-dot", style: `background:${lineColor(tail.id, tail.kingdom)}` }),
          h("a", { class: "ln-body", href: `#/species/${tail.id}` }, h("span", { class: "ln-rank" }, tr("物种", "Species", "種")), h("b", null, loc(tail.names)), " ", h("i", { class: "sci sm" }, tail.scientific_name))) : null));
  }
  show();
  return { el, show };
}

/* ---- collapsible tree ---- */
export function homeTree(tree, speciesById, { onSpecies, onTaxon }) {
  const open = new Set(), rows = new Map(), speciesRows = new Map(), below = new Map();
  const root = h("ul", { class: "ht-root", role: "tree" });

  function build(n, depth) {
    const sp = [...(n.species || [])], kids = n.children || [];
    const ids = new Set(sp.map((s) => s.id));
    const li = h("li", { role: "treeitem", "aria-expanded": "true", class: `ht-node k-${n.kingdom}` });
    const head = h("div", { class: "ht-head" });
    const caret = h("button", { class: "ht-caret", "aria-label": tr("展开/折叠", "Expand/collapse", "開閉") }, "▾");
    const name = h("button", { class: "ht-name", title: n.scientific_name }, h("span", { class: "dot", style: `background:${lineColor(n.id, n.kingdom)}` }),
      h("b", null, loc(n.names)), h("span", { class: "ht-rank" }, label("rank", n.rank)),
      n.age_mya ? h("span", { class: "ht-age" }, `${n.age_mya.estimate} Mya`) : null);
    head.append(caret, name);
    const ul = h("ul", { role: "group" });
    li.append(head, ul);
    kids.forEach((c) => { const r = build(c, depth + 1); r.ids.forEach((i) => ids.add(i)); ul.append(r.li); });
    sp.forEach((s) => {
      const full = speciesById.get(s.id) || s;
      const b = h("button", { class: "ht-sp", "data-id": s.id }, h("span", { class: "dot sq", style: `background:${lineColor(s.id, n.kingdom)}` }), loc(s.names), " ", h("i", { class: "sci sm" }, s.scientific_name));
      b.onclick = () => onSpecies(full.id);
      const sli = h("li", { role: "treeitem", class: "ht-leaf" }, b);
      speciesRows.set(s.id, sli); ul.append(sli);
    });
    const setOpen = (v) => { v ? open.add(n.id) : open.delete(n.id); li.setAttribute("aria-expanded", String(v)); caret.textContent = v ? "▾" : "▸"; ul.hidden = !v; };
    caret.onclick = () => setOpen(!open.has(n.id));
    name.onclick = () => { setOpen(true); onTaxon(n.id, [...ids]); };
    setOpen(depth < 2);
    rows.set(n.id, { li, setOpen, isOpen: () => open.has(n.id), name });
    below.set(n.id, ids);
    return { li, ids };
  }
  root.append(build(tree, 0).li);

  return {
    el: root,
    revealSpecies(id) {
      // expand every ancestor, mark the leaf, scroll it into view inside the scroller
      rows.forEach((r, tid) => { if (below.get(tid).has(id)) r.setOpen(true); });
      speciesRows.forEach((li, sid) => li.firstChild.classList.toggle("sel", sid === id));
      rows.forEach((r) => r.name.classList.remove("sel"));
      const li = speciesRows.get(id), sc = root.closest(".ht-scroll") || root.parentElement;
      if (li && sc) sc.scrollTop = Math.max(0, li.offsetTop - sc.clientHeight / 2);
    },
    markTaxon(id) {
      speciesRows.forEach((li) => li.firstChild.classList.remove("sel"));
      rows.forEach((r, tid) => r.name.classList.toggle("sel", tid === id));
    },
    clearMarks() { speciesRows.forEach((li) => li.firstChild.classList.remove("sel")); rows.forEach((r) => r.name.classList.remove("sel")); },
    // visible: Set of species ids or null for all. Hides empty branches and expands the rest while filtering.
    applyVisible(visible) {
      speciesRows.forEach((li, id) => { li.hidden = !!visible && !visible.has(id); });
      rows.forEach((r, tid) => {
        const any = !visible || [...below.get(tid)].some((i) => visible.has(i));
        r.li.hidden = !any;
        if (visible && any) r.setOpen(true);
      });
    },
  };
}
