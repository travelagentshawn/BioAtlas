// Shell: header, hash router, theme and language toggles, footer.
import { h, clear } from "./dom.js";
import { api, REPO, API_BASE } from "./api.js";
import { tr, getLang, setLang } from "./i18n.js";
import { loading, failure } from "./components.js";

const routes = [
  ["", () => import("./views/home.js").then((m) => m.home)],
  ["explore", () => import("./views/explore.js").then((m) => m.explore)],
  ["species/:id", () => import("./views/species.js").then((m) => m.speciesView)],
  ["taxon/:id", () => import("./views/taxon.js").then((m) => m.taxonView)],
  ["tree", () => import("./views/tree.js").then((m) => m.treeView)],
  ["regions", () => import("./views/regions.js").then((m) => m.regionsView)],
  ["region/:id", () => import("./views/regions.js").then((m) => m.regionView)],
  ["planner", () => import("./views/planner.js").then((m) => m.plannerView)],
  ["seasonality", () => import("./views/seasonality.js").then((m) => m.seasonalityView)],
  ["identify", () => import("./views/identify.js").then((m) => m.identifyView)],
  ["learn", () => import("./views/learn.js").then((m) => m.learnView)],
  ["map", () => import("./views/map.js").then((m) => m.mapView)],
  ["conservation", () => import("./views/conservation.js").then((m) => m.conservationView)],
  ["sounds", () => import("./views/sounds.js").then((m) => m.soundsView)],
  ["evolution", () => import("./views/evolution.js").then((m) => m.evolutionView)],
  ["sources", () => import("./views/sources.js").then((m) => m.sourcesView)],
  ["quality", () => import("./views/quality.js").then((m) => m.qualityView)],
  ["docs", () => import("./views/docs.js").then((m) => m.docsView)],
  ["docs/:slug", () => import("./views/docs.js").then((m) => m.docsView)],
];

function parse() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  const segs = path.split("/").filter(Boolean).map(decodeURIComponent);
  for (const [pattern, loader] of routes) {
    const p = pattern.split("/").filter(Boolean);
    if (p.length !== segs.length) continue;
    const params = {};
    if (p.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = segs[i]), true) : s === segs[i]))) {
      return { loader, params, query: new URLSearchParams(qs), name: segs[0] || "home" };
    }
  }
  return { loader: () => Promise.resolve((r) => r.append(h("div", { class: "state" }, tr("页面不存在。", "Page not found.")))), params: {}, query: new URLSearchParams(), name: "404" };
}

// The two primary experiences are deliberately peers: the curated usable atlas
// and the phylogeny tree. All other tools remain available as secondary modules.
const navLinks = [
  ["home", tr("自然图鉴", "Field atlas"), "primary-mode"],
  ["tree", tr("进化树", "Evolution tree"), "primary-mode"],
  ["explore", tr("物种探索", "Explore")],
  ["regions", tr("旅行场景", "Scenes")],
  ["planner", tr("行程工作台", "Workbench")],
  ["seasonality", tr("季节日历", "Seasonality")],
  ["identify", tr("野外辨认", "Field ID")],
  ["learn", tr("学习", "Learn")],
  ["map", tr("自然地图", "Nature map")],
  ["conservation", tr("保护与礼仪", "Conservation")],
  ["sounds", tr("自然声音", "Sounds")],
  ["evolution", tr("演化学习", "Evolution")],
  ["sources", tr("科学来源", "Sources")],
  ["quality", tr("数据质量", "Data quality")],
  ["docs", tr("开发说明书", "Developer docs")],
];

function header() {
  const theme = document.documentElement.dataset.theme;
  return h("header", { class: "site-header" },
    h("div", { class: "wrap bar" },
      h("a", { class: "brand", href: "#/" }, h("span", { class: "mark", "aria-hidden": "true" }), h("span", null, "BioAtlas", h("small", null, tr("旅途生物图鉴", "Field atlas")))),
      h("nav", { class: "nav", "aria-label": "Main" }, navLinks.map(([k, l, cls = ""]) => h("a", { href: k === "home" ? "#/" : `#/${k}`, "data-k": k, class: cls }, l))),
      h("div", { class: "tools" },
        h("button", { class: "icon-btn", title: tr("切换语言", "Switch language"), onclick: () => { setLang(({zh:"en",en:"ja",ja:"zh"})[getLang()] || "zh"); boot(); } }, ({zh:"EN",en:"日本語",ja:"中"})[getLang()] || "EN"),
        h("button", { class: "icon-btn", title: tr("切换明暗", "Toggle theme"), "aria-label": "theme", onclick: () => {
          const next = (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next; try { localStorage.setItem("bioatlas.theme", next); } catch { /* ignore */ } route();
        } }, theme === "dark" ? "☀" : "☾"),
        h("a", { class: "icon-btn gh", href: REPO.url, target: "_blank", rel: "noopener noreferrer", title: "GitHub" }, "GitHub"))),
    h("div", { class: "site-notice" },
      h("div", { class: "wrap site-notice-inner" },
        h("span", null, tr("公开初稿 · 数据记录尚待逐条核验", "Public draft · records still require source-by-source review")),
        h("a", { href: "#/quality" }, tr("查看数据质量", "Review data quality"), " →"))));
}

async function footer() {
  let m = null; try { m = await api.manifest(); } catch { /* shown by views */ }
  return h("footer", { class: "site-footer" }, h("div", { class: "wrap" },
    h("div", null, h("b", null, "BioAtlas"), " · ", tr("开源的旅途生物图鉴：代码 MIT，数据 CC BY 4.0。", "Open travel biodiversity atlas — code MIT, data CC BY 4.0.")),
    h("div", { class: "muted" },
      m ? `API v${m.api_version} · data ${m.data_hash} · ${m.counts.species} ${tr("物种", "species")}` : "",
      " · ", h("a", { href: `${API_BASE}/manifest.json`, target: "_blank", rel: "noopener" }, "manifest.json"),
      " · ", h("a", { href: "./llms.txt", target: "_blank", rel: "noopener" }, "llms.txt"),
      " · ", h("a", { href: `${REPO.url}/issues`, target: "_blank", rel: "noopener noreferrer" }, tr("反馈与贡献", "Issues & contributions")))));
}

const main = h("main", { id: "view", tabindex: "-1" });
let token = 0;
async function route() {
  const my = ++token;
  const r = parse();
  document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.k === r.name));
  clear(main).append(loading());
  try {
    const view = await r.loader();
    if (my !== token) return;
    const holder = h("div", { class: "wrap view" });
    await view(holder, r);
    if (my !== token) return;
    clear(main).append(holder);
    window.scrollTo(0, r.query.get("a") ? window.scrollY : 0);
    document.title = (holder.querySelector("h1")?.textContent || "BioAtlas") + " · BioAtlas";
  } catch (e) {
    if (my === token) { console.error(e); clear(main).append(h("div", { class: "wrap view" }, failure(e))); }
  }
}

async function boot() {
  const app = document.getElementById("app");
  clear(app).append(header(), main, h("div", { id: "foot" }));
  footer().then((f) => document.getElementById("foot")?.replaceWith(f));
  route();
}

try { const t = localStorage.getItem("bioatlas.theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* ignore */ }
addEventListener("hashchange", route);
boot();
