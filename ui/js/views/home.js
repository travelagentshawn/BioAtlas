import { h } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { sigil } from "../viz.js";
import { speciesCard, sectionTitle } from "../components.js";
import { monthName } from "../labels.js";
import { moduleDirectory } from "./modules.js";

export async function home(root) {
  const [manifest, species, calendar, taxa] = await Promise.all([
    api.manifest(), api.speciesList(), api.calendar(), api.taxa(),
  ]);
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const month = new Date().getMonth() + 1;
  const byId = new Map(species.map((s) => [s.id, s]));
  const nowList = (calendar[month] || []).map((i) => byId.get(i)).filter(Boolean);
  const stat = (n, zh, en) => h("div", { class: "stat" }, h("b", null, n), h("span", null, tr(zh, en)));
  const seeds = species.filter((s) => s.review_status === "seed").length;

  // floating sigils: a mix of plants, animals and fungi
  const picks = [...species].sort((a, b) => a.id.localeCompare(b.id)).filter((_, i) => i % 2 === 0).slice(0, 9);

  root.append(
    h("section", { class: "hero" },
      h("div", { class: "hero-copy" },
        h("p", { class: "eyebrow" }, tr("植物 · 动物 · 真菌 · 旅途图鉴", "Plants · Animals · Fungi · A travellers' field atlas")),
        h("h1", null, tr("沿途所见，皆有谱系", "Everything you meet on the road has a lineage")),
        h("p", { class: "lead" }, tr(
          "BioAtlas 把分子系统发育的证据与传统分类学放进同一张图，帮你在旅途中认出银杏、白鹭、梅花鹿、蘑菇与苔藓，并知道它们在生命之树上的位置。",
          "BioAtlas puts molecular-phylogenetic evidence and classical taxonomy on one map, so you can recognise ginkgo, egrets, sika deer, mushrooms and mosses on a trip — and know where they sit on the tree of life.")),
        h("div", { class: "cta" },
          h("a", { class: "btn primary", href: "#/explore" }, tr("开始探索", "Start exploring")),
          h("a", { class: "btn", href: "#/tree" }, tr("打开进化树", "Open evolution tree")),
          h("a", { class: "btn", href: "#/planner" }, tr("规划行程清单", "Plan a trip checklist")),
          h("a", { class: "btn ghost", href: "#/docs" }, tr("开发说明书", "Developer docs"))),
        h("div", { class: "stats" },
          stat(manifest.counts.species, "物种", "species"), stat(manifest.counts.taxa, "分类单元", "taxa"),
          stat(manifest.counts.regions, "旅行场景", "scenes"), stat(manifest.counts.sources, "文献来源", "sources"))),
      h("div", { class: "hero-art", "aria-hidden": "true" },
        picks.map((s, i) => h("a", { class: `float f${i}`, href: `#/species/${s.id}`, tabindex: "-1", title: loc(s.names) },
          sigil(s.lineage, s.kingdom, [92, 64, 78, 56, 86, 60, 72, 52, 66][i]))))),

    h("section", { class: "mode-entry-grid", "aria-label": tr("双主视图入口", "Two primary views") },
      modeCard("#/explore", "atlas", tr("01 · 自然图鉴", "01 · Field atlas"),
        tr("从物种、季节与目的地开始", "Start with species, seasons and places"),
        tr("检索物种、查看当季观察线索、规划目的地，并使用野外辨认与保护工具。", "Search species, discover seasonal field notes, plan destinations, and use identification and conservation tools."),
        [tr("物种检索", "Species search"), tr("季节观察", "Seasonal field notes"), tr("旅行场景", "Travel scenes")]),
      modeCard("#/tree", "tree", tr("02 · 进化树", "02 · Evolution tree"),
        tr("沿着共同祖先探索生命", "Explore life through shared ancestry"),
        tr("展开 BioAtlas 自有主树，查看分类层级、分歧年代与物种之间的亲缘关系。", "Expand BioAtlas's own curated tree to explore taxonomic ranks, divergence times and relationships."),
        [tr("系统发育", "Phylogeny"), tr("分歧年代", "Divergence times"), tr("分类大纲", "Taxonomic outline")])),

    h("section", { class: "block" },
      sectionTitle(tr(`${monthName(month)}值得留意`, `Worth looking for in ${monthName(month)}`),
        tr("按物种的最佳观察月份筛选。", "Filtered by each species' best months.")),
      nowList.length
        ? h("div", { class: "grid" }, nowList.slice(0, 6).map((s) => speciesCard(s, taxaById)))
        : h("p", { class: "muted" }, tr("本月暂无条目，欢迎补充。", "No entries for this month yet — contributions welcome."))),

    h("section", { class: "block rigor" },
      h("div", { class: "rigor-card" },
        h("h2", null, tr("严谨，是这里的默认设置", "Rigour is the default here")),
        h("ul", null,
          h("li", null, tr("每条分歧年代都是区间，并标注可信度与来源，不给单一数字。", "Every divergence time is a range with a confidence label and a source — never a single number.")),
          h("li", null, tr("并系类群（如‘蜥蜴’‘蛾’）会被明确标出，而不是悄悄沿用旧说法。", "Paraphyletic groups (like ‘lizards’ or ‘moths’) are flagged openly rather than silently reused.")),
          h("li", null, tr(`目前 ${seeds}/${species.length} 个物种为“初稿”。欢迎对照原文献核对后提交修订。`, `Currently ${seeds}/${species.length} species are marked “seed”. Check them against the cited papers and send a fix.`))),
        h("a", { class: "btn", href: "#/docs/data-model" }, tr("了解数据模型", "Read the data model")))));
  moduleDirectory(root, true);
}

function modeCard(href, kind, eyebrow, title, description, tags) {
  return h("a", { class: `mode-card ${kind}`, href },
    h("div", { class: "mode-card-copy" },
      h("p", { class: "mode-eyebrow" }, eyebrow),
      h("h2", null, title),
      h("p", { class: "mode-description" }, description),
      h("div", { class: "mode-tags" }, tags.map((tag) => h("span", null, tag))),
      h("span", { class: "mode-open" }, tr("进入界面", "Open view"), " ↗")),
    h("div", { class: `mode-visual ${kind}`, "aria-hidden": "true" },
      kind === "atlas"
        ? h("span", { class: "atlas-orbit" }, "✳")
        : h("span", { class: "tree-glyph" }, "⑂")));
}

