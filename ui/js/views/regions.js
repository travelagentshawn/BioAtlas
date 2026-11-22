import { h } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthName } from "../labels.js";
import { monthBars } from "../viz.js";
import { speciesCard, badge, crumbs, nameBlock, reviewBadge, editOnGitHub, sectionTitle, link } from "../components.js";

export async function regionsView(root) {
  const list = await api.regionList();
  const card = (r) => h("a", { class: "card region-card", href: `#/region/${r.id}` },
    h("div", { class: "card-body" },
      h("div", { class: "kicker" }, r.kind === "destination" ? tr("目的地", "Destination") : tr("典型场景", "Scene")),
      h("h3", null, loc(r.names)),
      h("p", null, loc(r.description)),
      h("div", { class: "badges" }, r.countries.map((c) => badge(label("country", c))), badge(`${r.species_count} ${tr("种", "spp.")}`, "muted"))));
  root.append(
    h("header", { class: "page-head" }, h("h1", null, tr("旅行场景", "Travel scenes")),
      h("p", { class: "lead" }, tr("目的地与典型场景是连接图鉴和旅行工作台的桥：它们告诉你‘在哪里、哪个月、遇到什么’。", "Destinations and scenes bridge the atlas and the travel workbench: they say what you may meet, where and when."))),
    h("h2", { class: "sub" }, tr("目的地", "Destinations")),
    h("div", { class: "grid" }, list.filter((r) => r.kind === "destination").map(card)),
    h("h2", { class: "sub" }, tr("典型场景", "Recurring scenes")),
    h("div", { class: "grid" }, list.filter((r) => r.kind === "scene").map(card)));
}

export async function regionView(root, { params }) {
  const [r, taxa] = await Promise.all([api.region(params.id), api.taxa()]);
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const month = new Date().getMonth() + 1;
  const order = { common: 0, regular: 1, uncommon: 2, rare: 3 };
  const list = [...r.species].sort((a, b) => order[a.likelihood] - order[b.likelihood]);

  root.append(
    crumbs(link("regions", tr("旅行场景", "Travel scenes"))),
    h("header", { class: "page-head" },
      h("p", { class: "eyebrow" }, r.kind === "destination" ? tr("目的地", "Destination") : tr("典型场景", "Scene")),
      nameBlock(r.names), h("p", { class: "lead" }, loc(r.description)),
      h("div", { class: "badges" }, reviewBadge(r.review_status), r.countries.map((c) => badge(label("country", c))), r.habitats.map((x) => badge(label("habitat", x), "muted")),
        r.center ? h("a", { class: "badge", target: "_blank", rel: "noopener noreferrer", href: `https://www.openstreetmap.org/?mlat=${r.center.lat}&mlon=${r.center.lng}#map=11/${r.center.lat}/${r.center.lng}` }, `${r.center.lat.toFixed(2)}, ${r.center.lng.toFixed(2)} ↗`) : null)),
    h("div", { class: "layout-2" },
      h("div", { class: "col-main" },
        h("section", { class: "panel" }, sectionTitle(tr("可能遇到的物种", "Species you may meet")),
          h("div", { class: "grid small" }, list.map((e) => speciesCard(e.species, taxaById,
            h("span", { class: `lk ${e.likelihood}` }, label("likelihood", e.likelihood)))))),
        r.species.some((e) => e.note) ? h("section", { class: "panel" }, sectionTitle(tr("现场提示", "Field notes")),
          h("ul", null, r.species.filter((e) => e.note).map((e) => h("li", null, h("b", null, loc(e.species.names)), "：", loc(e.note))))) : null),
      h("aside", { class: "col-side" },
        h("section", { class: "panel" }, sectionTitle(tr("各月可见物种数", "Species per month")),
          monthBars(r.month_counts, { kingdom: "plantae", highlight: month }),
          h("p", { class: "muted small" }, tr(`本月（${monthName(month)}）可见 ${r.month_counts[month - 1]} 种`, `${r.month_counts[month - 1]} species expected in ${monthName(month)}`))),
        h("a", { class: "btn primary block", href: `#/planner?regions=${r.id}&month=${month}` }, tr("加入行程工作台", "Add to trip workbench")))),
    h("p", { class: "foot-actions" }, editOnGitHub(`data/regions/${r.id}.json`)));
}
