import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label } from "../labels.js";
import { render } from "../tree-layout.js";
import { badge } from "../components.js";

export function toNode(t) {
  return {
    id: t.id, kind: "taxon", label: loc(t.names), kingdom: t.kingdom, age: t.age_mya, pruned: t.pruned,
    href: `#/taxon/${t.id}`, species_count: t.species_count, rank: t.rank, sci: t.scientific_name, monophyly: t.monophyly,
    children: [
      ...t.children.map(toNode),
      ...t.species.map((s) => ({ id: s.id, kind: "species", label: loc(s.names), sub: s.scientific_name, kingdom: t.kingdom,
        href: `#/species/${s.id}`, children: [] })),
    ],
  };
}

export async function treeView(root, { query }) {
  const tree = await api.tree();
  const top = toNode(tree);
  const focus = query.get("focus");
  const collapsed = new Set();
  let mode = "tree", showAge = true;
  const dark = () => document.documentElement.dataset.theme === "dark";

  const holder = h("div", { class: "tree-scroll", tabindex: "0", "aria-label": tr("系统发育树，可横向滚动", "Phylogeny, scrollable") });
  const status = h("p", { class: "muted small" });

  function walkAll(n, f) { f(n); n.children.forEach((c) => walkAll(c, f)); }
  function draw() {
    clear(holder);
    if (mode === "outline") { holder.append(outline(top)); return; }
    const { el } = render(top, {
      collapsed, showAge, dark: dark(), focusId: focus,
      onToggle: (id) => { collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); draw(); },
    });
    holder.append(el);
    const f = el.querySelector(".focus");
    if (f) { const r = f.getBoundingClientRect(), hr = holder.getBoundingClientRect(); holder.scrollTop = Math.max(0, r.top - hr.top + holder.scrollTop - 120); }
  }
  function outline(n) {
    const li = h("li", null,
      h("a", { href: n.href }, n.kind === "taxon" ? h("span", { class: "rank" }, label("rank", n.rank)) : null, " ", h("b", null, n.label)),
      " ", h("span", { class: "sci sm" }, n.sci || n.sub || ""),
      n.age ? h("span", { class: "age" }, `≈ ${n.age.estimate} ${tr("百万年前", "Mya")}`) : null,
      n.monophyly && n.monophyly !== "strong" && n.kind === "taxon" ? badge(label("monophyly", n.monophyly), `mono ${n.monophyly}`) : null);
    if (n.children.length) li.append(h("ul", null, n.children.map(outline)));
    return n === top ? h("ul", { class: "outline" }, li) : li;
  }

  const btn = (text, fn, cls = "") => h("button", { class: `btn small ${cls}`, onclick: fn }, text);
  const modeBtns = [
    btn(tr("系统树", "Tree"), () => { mode = "tree"; sync(); }),
    btn(tr("大纲", "Outline"), () => { mode = "outline"; sync(); }),
  ];
  function sync() {
    modeBtns[0].classList.toggle("on", mode === "tree"); modeBtns[1].classList.toggle("on", mode === "outline");
    modeBtns[0].setAttribute("aria-pressed", String(mode === "tree"));
    modeBtns[1].setAttribute("aria-pressed", String(mode === "outline"));
    status.textContent = mode === "tree" ? tr("点击节点圆点，或聚焦后按 Enter/空格，折叠或展开分支；点击名称进入详情。虚线表示省略了中间类群；名称后的灰色数字为冠群年龄（百万年前）。", "Click a node circle, or focus it and press Enter/Space, to fold or unfold a branch. Click a name for details. Dashed branches omit intermediate clades; the grey number after a name is its crown age (Mya).") : "";
    draw();
  }

  root.append(
    h("header", { class: "page-head" },
      h("h1", null, tr("生命之树", "Tree of life")),
      h("p", { class: "lead" }, tr("这里展示的是 BioAtlas 自有主树：以分子系统发育为骨架，而不是按外形相似度排列。蝴蝶是‘蛾’的一支，鲸属于偶蹄动物，木贼嵌在蕨类之中。外部分类权威仅作为独立对照，不会自动改写这棵树。", "This is BioAtlas's own curated tree, organised around molecular phylogeny rather than superficial resemblance. Butterflies nest within moths, whales within even-toed ungulates, and horsetails within ferns. External taxonomic authorities are independent comparisons and never silently rewrite this tree.")),
      h("div", { class: "cta" },
        h("a", { class: "btn", href: "#/" }, tr("返回自然图鉴", "Back to field atlas")),
        h("a", { class: "btn ghost", href: "#/explore" }, tr("查找物种", "Find a species")))),
    h("div", { class: "toolbar" },
      h("div", { class: "seg" }, modeBtns),
      btn(tr("全部展开", "Expand all"), () => { collapsed.clear(); mode = "tree"; sync(); }),
      btn(tr("折叠到科", "Fold to families"), () => { collapsed.clear(); walkAll(top, (n) => { if (n.rank === "family") collapsed.add(n.id); }); mode = "tree"; sync(); }),
      btn(tr("折叠到目/纲", "Fold to orders"), () => { collapsed.clear(); walkAll(top, (n) => { if (["order", "class"].includes(n.rank) && n.children.some((c) => c.kind === "taxon")) { n.children.filter((c) => c.kind === "taxon").forEach((c) => collapsed.add(c.id)); } if (n.rank === "family") collapsed.add(n.id); }); mode = "tree"; sync(); }),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: true, onchange: (e) => { showAge = e.target.checked; draw(); } }), tr("显示年龄", "Show ages"))),
    status, holder);
  sync();
}
