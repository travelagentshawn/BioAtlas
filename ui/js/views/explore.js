import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthName } from "../labels.js";
import { speciesCard, empty } from "../components.js";

export async function explore(root, { query }) {
  const [species, taxa, search] = await Promise.all([api.speciesList(), api.taxa(), api.search()]);
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const text = new Map(search.filter((x) => x.kind === "species").map((x) => [x.id, x.text]));
  const state = {
    q: query.get("q") || "", kingdom: query.get("kingdom") || "", month: query.get("month") || "",
    habitat: query.get("habitat") || "", country: query.get("country") || "", clade: query.get("clade") || "",
  };

  const uniq = (f) => [...new Set(species.flatMap(f))].sort();
  const select = (key, options, anyLabel) => h("select", {
    "aria-label": anyLabel, onchange: (e) => { state[key] = e.target.value; update(); },
  }, h("option", { value: "" }, anyLabel),
  options.map(([v, l]) => h("option", { value: v, selected: String(state[key]) === String(v) }, l)));

  const kChips = h("div", { class: "chips", role: "group" }, [["", tr("全部", "All")], ["plantae", tr("植物", "Plants")], ["animalia", tr("动物", "Animals")], ["fungi", tr("真菌", "Fungi")]]
    .map(([v, l]) => h("button", { class: `chip ${v}${state.kingdom === v ? " on" : ""}`, "data-v": v, onclick: () => { state.kingdom = v; update(); } }, l)));

  const input = h("input", { type: "search", class: "search", placeholder: tr("搜索中文名、英文名或学名…", "Search by name or scientific name…"),
    value: state.q, "aria-label": tr("搜索", "Search"), oninput: (e) => { state.q = e.target.value; update(); } });

  const clades = taxa.filter((t) => ["order", "class", "clade", "family"].includes(t.rank) && t.species_count > 1)
    .sort((a, b) => loc(a.names).localeCompare(loc(b.names), tr("zh", "en"))).map((t) => [t.id, `${loc(t.names)}`]);

  const out = h("div", { class: "grid" });
  const count = h("p", { class: "muted count" });

  function update() {
    kChips.querySelectorAll(".chip").forEach((b) => b.classList.toggle("on", b.dataset.v === state.kingdom));
    const q = state.q.trim().toLowerCase();
    const list = species.filter((s) =>
      (!q || text.get(s.id)?.includes(q)) && (!state.kingdom || s.kingdom === state.kingdom) &&
      (!state.month || s.best_months.includes(+state.month)) && (!state.habitat || s.habitats.includes(state.habitat)) &&
      (!state.country || s.countries.includes(state.country)) && (!state.clade || s.lineage.includes(state.clade)));
    clear(out);
    count.textContent = tr(`${list.length} / ${species.length} 个物种`, `${list.length} of ${species.length} species`);
    if (!list.length) out.append(empty(tr("没有符合条件的物种。试试放宽筛选。", "Nothing matches. Try loosening the filters.")));
    list.forEach((s) => out.append(speciesCard(s, taxaById)));
  }

  root.append(
    h("header", { class: "page-head" },
      h("h1", null, tr("探索物种", "Explore species")),
      h("p", { class: "lead" }, tr("按类群、月份、栖息地或国家筛选旅途中可能遇到的物种。", "Filter by clade, month, habitat or country for species you may meet on a trip."))),
    h("div", { class: "filters" }, input, kChips,
      h("div", { class: "selects" },
        select("clade", clades, tr("所有类群", "All clades")),
        select("month", Array.from({ length: 12 }, (_, i) => [i + 1, monthName(i + 1)]), tr("任意月份", "Any month")),
        select("habitat", uniq((s) => s.habitats).map((v) => [v, label("habitat", v)]), tr("任意栖息地", "Any habitat")),
        select("country", uniq((s) => s.countries).map((v) => [v, label("country", v)]), tr("任意国家", "Any country")))),
    count, out);
  update();
}
