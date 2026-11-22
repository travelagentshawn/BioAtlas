// Home: left = light evolutionary lineage + tree; right = dark explorable jungle.
// Both panes are driven by one selection state; modules not woven into the scene are listed below.
import { h } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { buildJungle } from "../jungle.js";
import { homeTree, lineagePanel } from "../home-tree.js";
import { monthName } from "../labels.js";
import { monthWheel } from "../viz.js";
import { moduleDirectory } from "./modules.js";

// Modules reachable from the scene itself (signpost, dock, cards) — everything else is listed below.
export const INTEGRATED = ["#/explore", "#/tree", "#/regions", "#/planner", "#/docs", "#/seasonality"];

export async function home(root) {
  const [manifest, species, calendar, taxa, tree] = await Promise.all([api.manifest(), api.speciesList(), api.calendar(), api.taxa(), api.tree()]);
  const byId = new Map(species.map((s) => [s.id, s]));
  const month = new Date().getMonth() + 1;
  const inSeason = new Set(calendar[month] || []);
  const nameOf = (id) => loc(byId.get(id)?.names) || id;
  const state = { sel: null, taxon: null, q: "", kingdom: "all", season: false, hints: true };

  const lineage = lineagePanel(taxa, species);
  const jungle = buildJungle({ species, nameOf, onPick: (id) => pick(id), onSign: (href) => { location.hash = href; } });
  const tree$ = homeTree(tree, byId, { onSpecies: (id) => pick(id), onTaxon: (id, ids) => pickTaxon(id, ids) });

  /* --- shared selection --- */
  const card = h("aside", { class: "pick-card", hidden: true, "aria-live": "polite" });
  const tip = h("div", { class: "jg-tip", hidden: true });
  function visibleSet() {
    const q = state.q.trim().toLowerCase();
    const all = state.kingdom === "all" && !q && !state.season && !state.taxon;
    if (all) return null;
    const scope = state.taxon ? new Set(state.taxon.ids) : null;
    return new Set(species.filter((s) => {
      if (scope && !scope.has(s.id)) return false;
      if (state.kingdom !== "all" && s.kingdom !== state.kingdom) return false;
      if (state.season && !inSeason.has(s.id)) return false;
      if (q && !`${s.scientific_name} ${s.names.zh || ""} ${s.names.en || ""} ${s.names.ja || ""}`.toLowerCase().includes(q)) return false;
      return true;
    }).map((s) => s.id));
  }
  function refresh() { const v = visibleSet(); jungle.setVisible(v); tree$.applyVisible(v); count.textContent = v ? tr(`${v.size} 个物种`, `${v.size} species`, `${v.size} 種`) : ""; }
  function pick(id) {
    const s = byId.get(id); if (!s) return;
    state.sel = id; state.taxon = null;
    jungle.setSelected(id); tree$.revealSpecies(id); lineage.show({ sp: s });
    card.hidden = false; card.replaceChildren(
      h("button", { class: "pc-x", "aria-label": tr("关闭", "Close", "閉じる"), onclick: () => clearSel() }, "×"),
      h("div", { class: "pc-main" },
        h("b", null, loc(s.names)), h("i", { class: "sci sm" }, s.scientific_name),
        h("p", null, loc(s.summary)),
        h("div", { class: "pc-btns" },
          h("a", { class: "btn small primary", href: `#/species/${s.id}` }, tr("查看档案", "Open record", "記録を見る")),
          h("a", { class: "btn small", href: `#/tree?focus=${s.id}` }, tr("在进化树中定位", "Locate in tree", "系統樹で表示")),
          h("a", { class: "btn small", href: "#/planner" }, tr("加入行程", "Add to trip", "旅程に追加")))),
      s.best_months?.length ? h("div", { class: "pc-wheel" }, monthWheel(s.best_months, { size: 84, kingdom: s.kingdom, current: month, labels: false }), h("small", null, tr("最佳月份", "Best months", "観察適期"))) : null);
    refresh();
  }
  function pickTaxon(id, ids) {
    state.sel = null; state.taxon = { id, ids };
    jungle.setSelected(null); tree$.markTaxon(id); lineage.show({ taxonId: id });
    card.hidden = true; refresh();
  }
  function clearSel() {
    state.sel = null; state.taxon = null; jungle.setSelected(null); tree$.clearMarks(); lineage.show(); card.hidden = true; refresh();
  }

  jungle.onHover((id, e) => {
    if (!id || id === "__sign" || !e) { tip.hidden = true; return; }
    const b = e.currentTarget.getBoundingClientRect();
    tip.hidden = false; tip.textContent = nameOf(id);
    tip.style.left = `${Math.min(Math.max(e.clientX - b.left, 40), b.width - 40)}px`; tip.style.top = `${e.clientY - b.top - 14}px`;
  });

  /* --- left pane --- */
  const count = h("span", { class: "muted small" });
  const search = h("input", { type: "search", placeholder: tr("搜索物种、学名…", "Search species or Latin name…", "種名・学名で検索…"), "aria-label": tr("搜索", "Search", "検索"), oninput: (e) => { state.q = e.target.value; refresh(); } });
  const kChips = [["all", tr("全部", "All", "すべて")], ["plantae", tr("植物", "Plants", "植物")], ["animalia", tr("动物", "Animals", "動物")], ["fungi", tr("真菌", "Fungi", "菌類")]].map(([k, l]) =>
    h("button", { class: `chip ${k}${k === "all" ? " on" : ""}`, "aria-pressed": String(k === "all"), onclick: (e) => {
      state.kingdom = k; kChips.forEach((c) => { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); }); e.currentTarget.classList.add("on"); e.currentTarget.setAttribute("aria-pressed", "true"); refresh();
    } }, l));

  const left = h("section", { class: "home-left", "aria-label": tr("进化脉络与进化树", "Lineage and evolution tree", "系統と進化樹") },
    h("div", { class: "hl-inner" },
      h("header", { class: "hl-head" },
        h("p", { class: "eyebrow" }, tr("植物 · 动物 · 真菌 · 旅途图鉴", "Plants · Animals · Fungi · A travellers' field atlas", "植物・動物・菌類 — 旅のフィールド図鑑")),
        h("h1", null, tr("沿途所见，皆有谱系", "Everything you meet on the road has a lineage", "旅先で出会う生きものには、すべて系統がある")),
        h("p", { class: "lead" }, tr("左侧读演化脉络，右侧在夜间丛林里点一点：每个生物都连着它在生命之树上的位置。", "Read the lineage on the left; tap a creature in the night jungle on the right — each one is wired to its place on the tree of life.", "左で系統をたどり、右の夜の森で生きものをタップ。すべて生命の樹上の位置につながっています。"))),
      h("div", { class: "hl-tools" }, search, h("div", { class: "chips" }, kChips), count),
      lineage.el,
      h("section", { class: "hl-tree" },
        h("div", { class: "hl-tree-head" }, h("h2", null, tr("进化树", "Evolution tree", "進化樹")),
          h("a", { class: "btn small", href: "#/tree" }, tr("完整树与大纲", "Full tree & outline", "全体図とアウトライン"), " ↗")),
        h("p", { class: "muted small" }, tr("点击类群，在丛林中只高亮其下的物种；点击物种，跳转到其生物。", "Click a clade to highlight just its species in the jungle; click a species to select it.", "分類群をクリックすると、森でその種だけが強調されます。")),
        h("div", { class: "ht-scroll" }, tree$.el)),
      h("p", { class: "hl-rigor small" },
        tr(`年代均为区间并注明来源；目前 ${species.filter((s) => s.review_status === "seed").length}/${species.length} 个物种为“初稿”。`, `Ages are ranges with sources; ${species.filter((s) => s.review_status === "seed").length}/${species.length} species are still “seed”.`, `年代は出典付きの範囲です。現在 ${species.filter((s) => s.review_status === "seed").length}/${species.length} 種が「初稿」です。`),
        " ", h("a", { href: "#/docs/data-model" }, tr("数据模型", "Data model", "データモデル")), " · ", h("a", { href: "#/quality" }, tr("数据质量", "Data quality", "データ品質")))));

  /* --- right pane --- */
  const extras = jungle.extras.map((id) => byId.get(id)).filter(Boolean);
  const seasonBtn = h("button", { class: "jg-btn", "aria-pressed": "false", onclick: (e) => {
    state.season = !state.season; e.currentTarget.setAttribute("aria-pressed", String(state.season)); e.currentTarget.classList.toggle("on", state.season); refresh();
  } }, "◐ ", tr(`${monthName(month)}可见`, `In season: ${monthName(month)}`, `${monthName(month)}の観察種`));
  const hintBtn = h("button", { class: "jg-btn on", "aria-pressed": "true", onclick: (e) => {
    state.hints = !state.hints; jungle.setHints(state.hints); e.currentTarget.setAttribute("aria-pressed", String(state.hints)); e.currentTarget.classList.toggle("on", state.hints);
  } }, "✦ ", tr("提示光点", "Hints", "ヒント"));
  const right = h("section", { class: "home-right", "aria-label": tr("可探索的丛林", "Explorable jungle", "探索できる森") },
    jungle.el, tip, card,
    h("div", { class: "jg-dock" }, seasonBtn, hintBtn,
      h("a", { class: "jg-btn", href: "#/seasonality" }, "◔ ", tr("季节日历", "Seasonality", "季節カレンダー")),
      h("a", { class: "jg-btn", href: "#/regions" }, "⌖ ", tr("旅行场景", "Scenes", "観察スポット")),
      extras.length ? h("span", { class: "jg-extra" }, tr("更多：", "More: ", "ほか："), extras.map((s) => h("button", { class: "jg-chip", onclick: () => pick(s.id) }, loc(s.names)))) : null),
    h("p", { class: "jg-help" }, tr("点击生物 · 点击木牌进入模块", "Tap a creature · tap a sign to open a module", "生きものをタップ ・ 看板でモジュールへ")));

  root.classList.add("home-root");
  root.append(h("div", { class: "home-split" }, left, right));

  const rest = h("div", { class: "wrap view home-rest" });
  moduleDirectory(rest, true, INTEGRATED);
  root.append(rest);
}
