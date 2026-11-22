// Trip workbench: choose month + regions -> tick-off checklist, trip phylogeny, import/export.
import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthName, monthRanges } from "../labels.js";
import { sigil } from "../viz.js";
import { render } from "../tree-layout.js";
import { badge, sectionTitle, empty } from "../components.js";

const KEY = "bioatlas.trip";
const blank = () => ({ type: "bioatlas-trip", format_version: 1, name: "", month: new Date().getMonth() + 1, regions: [], destinations: [], checked: [] });

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v?.type === "bioatlas-trip") return v; } catch { /* ignore */ }
  return blank();
}
function save(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ } }

const km = (a, b) => {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export async function plannerView(root, { query }) {
  const [regionList, taxa] = await Promise.all([api.regionList(), api.taxa()]);
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const trip = load();
  // deep links: #/planner?regions=a,b&month=11&lat=34.7&lng=135.8&r=20
  if (query.get("regions")) trip.regions = [...new Set([...trip.regions, ...query.get("regions").split(",").filter((x) => regionList.some((r) => r.id === x))])];
  if (query.get("month")) trip.month = +query.get("month") || null;
  if (query.get("lat") && query.get("lng")) addNear(+query.get("lat"), +query.get("lng"), +(query.get("r") || 30));

  function addNear(lat, lng, radius) {
    const ids = regionList.filter((r) => r.center && km({ lat, lng }, r.center) <= radius + 5).map((r) => r.id);
    trip.regions = [...new Set([...trip.regions, ...ids])];
    trip.destinations = [...(trip.destinations || []), { lat, lng, radius_km: radius }];
    return ids.length;
  }

  const results = h("div", { class: "planner-results" });
  const panelLeft = h("div", { class: "planner-config" });
  let seq = 0;

  const commit = () => { save(trip); renderResults(); };

  // ----- left panel -----
  const nameInput = h("input", { type: "text", value: trip.name, placeholder: tr("例如：京都 · 11 月赏秋", "e.g. Kyoto · autumn colour"), oninput: (e) => { trip.name = e.target.value; save(trip); } });
  const monthRow = h("div", { class: "chips tight" });
  function drawMonths() {
    clear(monthRow);
    monthRow.append(h("button", { class: `chip${!trip.month ? " on" : ""}`, onclick: () => { trip.month = null; drawMonths(); commit(); } }, tr("不限", "Any")));
    for (let m = 1; m <= 12; m++) monthRow.append(h("button", { class: `chip${trip.month === m ? " on" : ""}`, onclick: () => { trip.month = m; drawMonths(); commit(); } }, monthName(m)));
  }
  const regionBox = h("div", { class: "region-picks" });
  function drawRegions() {
    clear(regionBox);
    for (const r of regionList) {
      regionBox.append(h("label", { class: `pick${trip.regions.includes(r.id) ? " on" : ""}` },
        h("input", { type: "checkbox", checked: trip.regions.includes(r.id), onchange: (e) => {
          trip.regions = e.target.checked ? [...trip.regions, r.id] : trip.regions.filter((x) => x !== r.id);
          drawRegions(); commit();
        } }),
        h("span", null, h("b", null, loc(r.names)), h("small", null, `${r.kind === "destination" ? tr("目的地", "Destination") : tr("场景", "Scene")} · ${r.countries.map((c) => label("country", c)).join("、")}`))));
    }
  }
  const lat = h("input", { type: "number", step: "any", placeholder: "lat 34.69" }), lng = h("input", { type: "number", step: "any", placeholder: "lng 135.84" });
  const rad = h("input", { type: "number", value: "30", min: "1" });
  const nearMsg = h("p", { class: "muted small" });
  const importInput = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: onImport });

  panelLeft.append(
    h("section", { class: "panel" }, sectionTitle(tr("行程", "Trip")), nameInput),
    h("section", { class: "panel" }, sectionTitle(tr("月份", "Month")), monthRow),
    h("section", { class: "panel" }, sectionTitle(tr("目的地与场景", "Destinations & scenes")), regionBox),
    h("section", { class: "panel" }, sectionTitle(tr("按坐标查找附近", "Find near coordinates"), tr("来自外部行程软件的地点可以直接粘贴坐标。", "Paste coordinates from any external planner.")),
      h("div", { class: "row3" }, lat, lng, h("label", { class: "inl" }, rad, h("span", null, "km"))),
      h("button", { class: "btn small", onclick: () => {
        if (lat.value === "" || lng.value === "") return;
        const n = addNear(+lat.value, +lng.value, +rad.value || 30);
        nearMsg.textContent = n ? tr(`已加入 ${n} 个附近条目。`, `Added ${n} nearby entries.`) : tr("附近暂无条目，欢迎补充数据。", "Nothing nearby yet — contributions welcome.");
        drawRegions(); commit();
      } }, tr("查找并加入", "Find & add")), nearMsg),
    h("section", { class: "panel" }, sectionTitle(tr("导入 / 导出", "Import / export")),
      h("div", { class: "row-btns" },
        h("button", { class: "btn small", onclick: () => download(`bioatlas-trip-${slug(trip.name)}.json`, JSON.stringify({ ...trip, exported_at: new Date().toISOString() }, null, 2), "application/json") }, "JSON"),
        h("button", { class: "btn small", onclick: exportMd }, "Markdown"),
        h("button", { class: "btn small", onclick: () => importInput.click() }, tr("导入", "Import")),
        h("button", { class: "btn small ghost", onclick: () => { Object.assign(trip, blank()); drawMonths(); drawRegions(); nameInput.value = ""; commit(); } }, tr("清空", "Reset"))),
      importInput,
      h("p", { class: "muted small" }, tr("格式见 schema/trip.schema.json，可由任何行程软件生成。", "Format: schema/trip.schema.json — any planner can generate it."))));

  // ----- helpers -----
  const slug = (s) => (s || "trip").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "trip";
  function download(name, text, type) {
    const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a); a.click(); a.remove();
  }
  let current = [];
  function exportMd() {
    const lines = [`# ${trip.name || tr("行程物种清单", "Trip species checklist")}`, "", trip.month ? `${tr("月份", "Month")}: ${monthName(trip.month)}` : "", ""];
    for (const g of current) {
      lines.push(`## ${loc(g.region.names)}`, "");
      for (const e of g.items) lines.push(`- [${trip.checked.includes(e.species.id) ? "x" : " "}] ${loc(e.species.names)} (*${e.species.scientific_name}*) — ${label("likelihood", e.likelihood)}, ${monthRanges(e.months)}`);
      lines.push("");
    }
    download(`bioatlas-trip-${slug(trip.name)}.md`, lines.join("\n"), "text/markdown");
  }
  async function onImport(ev) {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const v = JSON.parse(await f.text());
      if (v.type !== "bioatlas-trip") throw new Error("type");
      Object.assign(trip, blank(), v, { regions: (v.regions || []).filter((x) => regionList.some((r) => r.id === x)) });
      for (const d of v.destinations || []) addNear(d.lat, d.lng, d.radius_km || 30);
      nameInput.value = trip.name || ""; drawMonths(); drawRegions(); commit();
    } catch { nearMsg.textContent = tr("无法识别的文件：需要 type = bioatlas-trip。", "Unrecognised file: expected type = bioatlas-trip."); }
    ev.target.value = "";
  }

  // ----- results -----
  async function renderResults() {
    const mine = ++seq;
    const details = await Promise.all(trip.regions.map((id) => api.region(id).catch(() => null)));
    if (mine !== seq) return;
    const regions = details.filter(Boolean);
    clear(results);
    if (!regions.length) { results.append(empty(tr("在左侧选择至少一个目的地或场景，清单会出现在这里。", "Pick at least one destination or scene on the left to see your checklist."))); current = []; return; }

    const order = { common: 0, regular: 1, uncommon: 2, rare: 3 };
    const inSeason = (e) => !trip.month || e.months.includes(trip.month);
    current = regions.map((r) => ({ region: r, items: [...r.species].sort((a, b) => inSeason(b) - inSeason(a) || order[a.likelihood] - order[b.likelihood]) }));

    const uniq = new Map();
    for (const g of current) for (const e of g.items) if (!uniq.has(e.species.id)) uniq.set(e.species.id, e);
    const all = [...uniq.values()], seasonal = all.filter(inSeason);
    const done = all.filter((e) => trip.checked.includes(e.species.id)).length;

    const stat = (n, zh, en) => h("div", { class: "stat" }, h("b", null, n), h("span", null, tr(zh, en)));
    results.append(h("section", { class: "panel summary" },
      h("div", { class: "stats compact" }, stat(all.length, "物种", "species"), stat(seasonal.length, trip.month ? `${monthName(trip.month)}可见` : "可见", trip.month ? `in ${monthName(trip.month)}` : "visible"),
        stat(all.filter((e) => e.species.kingdom === "plantae").length, "植物", "plants"), stat(all.filter((e) => e.species.kingdom === "animalia").length, "动物", "animals"),
        stat(`${done}/${all.length}`, "已勾选", "ticked")),
      h("div", { class: "progress" }, h("i", { style: { width: `${all.length ? (done / all.length) * 100 : 0}%` } }))));

    for (const g of current) {
      results.append(h("section", { class: "panel" },
        h("div", { class: "group-head" }, h("h3", null, h("a", { href: `#/region/${g.region.id}` }, loc(g.region.names))), h("span", { class: "muted" }, g.region.countries.map((c) => label("country", c)).join("、"))),
        h("ul", { class: "checklist" }, g.items.map((e) => {
          const s = e.species, on = inSeason(e);
          return h("li", { class: on ? "" : "off" },
            h("label", null, h("input", { type: "checkbox", checked: trip.checked.includes(s.id), onchange: (ev) => {
              trip.checked = ev.target.checked ? [...new Set([...trip.checked, s.id])] : trip.checked.filter((x) => x !== s.id); save(trip); renderResults();
            } }),
            sigil(s.lineage, s.kingdom, 34, loc(s.names)),
            h("span", { class: "who" }, h("a", { href: `#/species/${s.id}`, onclick: (ev) => ev.stopPropagation() }, loc(s.names)), h("small", { class: "sci" }, s.scientific_name))),
            h("span", { class: "meta" }, badge(label("likelihood", e.likelihood), `lk ${e.likelihood}`), h("small", { class: "muted" }, on ? monthRanges(e.months) : tr(`非当季 · ${monthRanges(e.months)}`, `off-season · ${monthRanges(e.months)}`))));
        }))));
    }
    results.append(tripTree(all));
  }

  // Induced phylogeny of every species on the trip; unary chains are compressed to branching points.
  function tripTree(all) {
    const root = { key: "", children: new Map(), species: [] };
    for (const e of all) {
      let n = root;
      for (const tid of e.species.lineage) { if (!n.children.has(tid)) n.children.set(tid, { key: tid, children: new Map(), species: [] }); n = n.children.get(tid); }
      n.species.push(e.species);
    }
    const top = [...root.children.values()][0];
    const conv = (n) => {
      let cur = n;
      while (cur.children.size === 1 && !cur.species.length) cur = [...cur.children.values()][0];
      const t = taxaById.get(cur.key);
      const kids = [...cur.children.values()].map(conv);
      const leaves = cur.species.map((s) => ({ id: s.id, kind: "species", label: loc(s.names), sub: s.scientific_name, kingdom: s.kingdom, href: `#/species/${s.id}`, children: [] }));
      return { id: cur.key, kind: "taxon", label: loc(t.names), kingdom: t.kingdom, age: t.age_mya, pruned: true, href: `#/taxon/${t.id}`, children: [...kids, ...leaves] };
    };
    if (!top) return h("span");
    const tree = conv(top);
    const { el } = render(tree, { dark: document.documentElement.dataset.theme === "dark", leafWidth: 220 });
    return h("section", { class: "panel" }, sectionTitle(tr("这次旅行的系统发育树", "Phylogeny of this trip"), tr("只保留你会遇到的物种；分叉处的数字是冠群年龄（百万年前）。", "Only the species you may meet; numbers at forks are crown ages (Mya).")),
      h("div", { class: "tree-scroll short" }, el));
  }

  drawMonths(); drawRegions(); save(trip);
  root.append(
    h("header", { class: "page-head" }, h("h1", null, tr("行程工作台", "Trip workbench")),
      h("p", { class: "lead" }, tr("选择月份与目的地，得到一份可勾选的观察清单和这次旅行的系统发育树。数据保存在你的浏览器本地。", "Choose a month and places to get a tick-off checklist and a phylogeny of the trip. Everything stays in your browser."))),
    h("div", { class: "planner" }, panelLeft, results));
  renderResults();
}
