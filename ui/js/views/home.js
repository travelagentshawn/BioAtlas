import { h } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { sigil } from "../viz.js";
import { speciesCard, sectionTitle } from "../components.js";
import { monthName } from "../labels.js";

export async function home(root) {
  const [manifest, species, calendar, taxa, regions] = await Promise.all([
    api.manifest(), api.speciesList(), api.calendar(), api.taxa(), api.regionList(),
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

    h("section", { class: "block" },
      sectionTitle(tr(`${monthName(month)}值得留意`, `Worth looking for in ${monthName(month)}`),
        tr("按物种的最佳观察月份筛选。", "Filtered by each species' best months.")),
      nowList.length
        ? h("div", { class: "grid" }, nowList.slice(0, 6).map((s) => speciesCard(s, taxaById)))
        : h("p", { class: "muted" }, tr("本月暂无条目，欢迎补充。", "No entries for this month yet — contributions welcome."))),

    h("section", { class: "block pillars" },
      sectionTitle(tr("核心入口", "Core entry points")),
      h("div", { class: "pillar-grid" },
        pillar("#/tree", tr("生命之树", "Tree of life"), tr("以分子系统发育为骨架，从真核生物一路展开到你拍到的那只鸟。", "A phylogeny-first view that unfolds from eukaryotes down to the bird you photographed.")),
        pillar("#/regions", tr("旅行场景", "Travel scenes"), tr(`${regions.length} 个目的地与场景，告诉你在哪个月、哪种地方会遇到什么。`, `${regions.length} destinations and scenes telling you what to expect, where and when.`)),
        pillar("#/planner", tr("行程工作台", "Trip workbench"), tr("选月份与目的地，生成可勾选的观察清单与行程物种树，并可导出。", "Pick a month and places to get a tick-off checklist and a trip tree, ready to export.")))),

    h("section", { class: "block pillars" },
      sectionTitle(tr("自然观察工具", "Nature observation tools")),
      h("div", { class: "pillar-grid" },
        pillar("#/seasonality", tr("物候日历", "Seasonality"), tr("按月份寻找适合观察的物种与旅行场景。", "Find species and travel scenes by month.")),
        pillar("#/map", tr("自然地图", "Nature map"), tr("定位已收录的自然观察目的地。", "Locate documented nature observation destinations.")),
        pillar("#/identify", tr("野外辨认", "Field ID"), tr("按名称、栖息地、颜色和体型检索物种。", "Search species by name, habitat, colour and size.")),
        pillar("#/conservation", tr("保护与礼仪", "Conservation"), tr("查看保护评估与低干扰观察提示。", "Review conservation assessments and low-impact field notes.")),
        pillar("#/sounds", tr("自然声音", "Nature sounds"), tr("收听符合授权要求的自然录音。", "Listen to appropriately licensed nature recordings.")),
        pillar("#/learn", tr("物种学习", "Species learning"), tr("通过野外形态线索辨认物种。", "Recognise species from field marks.")),
        pillar("#/evolution", tr("演化学习", "Evolution"), tr("通过共同祖先练习理解生命树。", "Explore the tree of life through common-ancestor exercises.")),
        pillar("#/sources", tr("科学来源", "Sources"), tr("检索支持图鉴内容的文献与数据库。", "Search references and databases behind atlas records.")),
        pillar("#/quality", tr("数据质量", "Data quality"), tr("追踪数据覆盖与审核状态。", "Track data coverage and review status.")))),
    h("section", { class: "block rigor" },
      h("div", { class: "rigor-card" },
        h("h2", null, tr("严谨，是这里的默认设置", "Rigour is the default here")),
        h("ul", null,
          h("li", null, tr("每条分歧年代都是区间，并标注可信度与来源，不给单一数字。", "Every divergence time is a range with a confidence label and a source — never a single number.")),
          h("li", null, tr("并系类群（如‘蜥蜴’‘蛾’）会被明确标出，而不是悄悄沿用旧说法。", "Paraphyletic groups (like ‘lizards’ or ‘moths’) are flagged openly rather than silently reused.")),
          h("li", null, tr(`目前 ${seeds}/${species.length} 个物种为“初稿”。欢迎对照原文献核对后提交修订。`, `Currently ${seeds}/${species.length} species are marked “seed”. Check them against the cited papers and send a fix.`))),
        h("a", { class: "btn", href: "#/docs/data-model" }, tr("了解数据模型", "Read the data model")))));
}

function pillar(href, title, text) {
  return h("a", { class: "pillar", href }, h("h3", null, title), h("p", null, text), h("span", { class: "go" }, "→"));
}
