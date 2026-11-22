import { h } from "../dom.js";
import { api, API_BASE } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthRanges } from "../labels.js";
import { sigil, monthWheel } from "../viz.js";
import { crumbs, nameBlock, reviewBadge, iucnBadge, badge, editOnGitHub, speciesCard, sectionTitle, link, taxonomicAssertions } from "../components.js";

export async function speciesView(root, { params }) {
  const s = await api.species(params.id);
  const taxa = await api.taxa();
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const month = new Date().getMonth() + 1;
  const srcIdx = new Map(s.sources_resolved.map((x, i) => [x.id, i + 1]));
  const cite = (id) => srcIdx.has(id) ? h("a", { class: "cite", href: `#/species/${s.id}?src=${id}`, title: id, onclick: (e) => { e.preventDefault(); document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } }, `[${srcIdx.get(id)}]`) : null;
  const family = s.lineage[s.lineage.length - 1];
  const media = (s.media || [])[0];

  root.append(
    crumbs(link("explore", tr("探索", "Explore")), link(`taxon/${family.id}`, loc(family.names))),
    h("header", { class: `species-head ${s.kingdom}` },
      h("div", { class: "plate" },
        media ? h("img", { src: media.url, alt: loc(s.names), loading: "lazy" }) : sigil(s.lineage.map((l) => l.id), s.kingdom, 148, loc(s.names)),
        media ? h("small", { class: "muted" }, `${media.attribution} · ${media.license}`) : h("small", { class: "muted" }, tr("谱系徽记：每一圈是一个祖先类群", "Lineage sigil: each ring is an ancestral group"))),
      h("div", { class: "head-main" },
        nameBlock(s.names, s.scientific_name),
        h("p", { class: "lead" }, loc(s.summary)),
        h("div", { class: "badges" }, reviewBadge(s.review_status), iucnBadge(s.conservation?.iucn),
          s.authority ? badge(s.authority) : null))),

    h("div", { class: "layout-2" },
      h("div", { class: "col-main" },
        h("section", { class: "panel" },
          sectionTitle(tr("如何辨认", "Field marks")),
          h("p", null, loc(s.identification.field_marks)),
          s.identification.similar ? h("p", { class: "note" }, h("strong", null, tr("易混淆：", "Look-alikes: ")), loc(s.identification.similar)) : null),

        h("section", { class: "panel evo" },
          sectionTitle(tr("演化故事", "Evolutionary story"), tr("来自分子数据与化石记录", "From molecular data and the fossil record")),
          h("p", null, loc(s.evolution.story)),
          h("ul", { class: "evidence" }, s.evolution.evidence.map((e) =>
            h("li", null, badge(label("evidence", e.type), "ev"), " ", e.note ? loc(e.note) + " " : "", cite(e.source))))),

        taxonomicAssertions(s.taxonomic_assertions || [], s.sources_resolved),
        
        h("section", { class: "panel" },
          sectionTitle(tr("在旅途中", "On the road")),
          h("p", null, loc(s.travel.notes)),
          s.travel.etiquette ? h("p", { class: "callout" }, h("strong", null, tr("请注意：", "Please mind: ")), loc(s.travel.etiquette)) : null,
          h("div", { class: "kv" },
            kv(tr("栖息地", "Habitats"), s.travel.habitats.map((x) => badge(label("habitat", x)))),
            kv(tr("分布国家", "Countries"), s.travel.countries.map((x) => badge(label("country", x)))))),

        s.regions.length ? h("section", { class: "panel" },
          sectionTitle(tr("出现在这些场景", "Seen in these scenes")),
          h("ul", { class: "plain" }, s.regions.map((r) => h("li", null,
            h("a", { href: `#/region/${r.id}` }, loc(r.names)), " ",
            badge(label("likelihood", r.likelihood)), " ", h("span", { class: "muted" }, monthRanges(r.months)))))) : null,

        s.relatives.length ? h("section", { class: "panel" },
          sectionTitle(tr("最近的亲戚（本图鉴内）", "Closest relatives in this atlas"),
            tr("共同祖先越年轻，亲缘越近。", "The younger the common ancestor, the closer the kinship.")),
          h("div", { class: "grid small" }, s.relatives.slice(0, 4).map((r) => speciesCard(r.species, taxaById,
            h("span", { class: "mrca", title: tr("最近共同祖先", "Most recent common ancestor") },
              `${tr("共祖", "MRCA")}: ${loc(r.mrca.names)}${r.mrca.age_mya ? ` · ${r.mrca.age_mya.estimate} ${tr("百万年前", "Mya")}` : ""}`))))) : null),

      h("aside", { class: "col-side" },
        h("section", { class: "panel" },
          sectionTitle(tr("最佳观察月份", "Best months")),
          h("div", { class: "wheel-wrap" }, monthWheel(s.travel.best_months, { size: 168, kingdom: s.kingdom, current: month }),
            h("div", { class: "wheel-cap" }, monthRanges(s.travel.best_months)))),

        h("section", { class: "panel" },
          sectionTitle(tr("生命之树上的位置", "Place on the tree")),
          h("ol", { class: "lineage" }, s.lineage.map((t, i) => h("li", { style: { "--i": i } },
            h("a", { href: `#/taxon/${t.id}` },
              h("span", { class: "rank" }, label("rank", t.rank)), " ", h("b", null, loc(t.names))),
            h("span", { class: "sci sm" }, t.scientific_name),
            t.age_mya ? h("span", { class: "age" }, `≈ ${t.age_mya.estimate} ${tr("百万年前", "Mya")}`) : null)),
          h("li", { class: "leaf" }, h("b", null, loc(s.names)), h("span", { class: "sci sm" }, s.scientific_name))),
          h("a", { class: "btn small", href: `#/tree?focus=${s.id}` }, tr("在系统树中查看", "Show on the tree"))),

        s.conservation ? h("section", { class: "panel" },
          sectionTitle(tr("保护状况", "Conservation")),
          h("p", null, iucnBadge(s.conservation.iucn), " ", h("span", { class: "muted" }, `${tr("截至", "as of")} ${s.conservation.as_of}`), " ", cite(s.conservation.source))) : null)),

    h("section", { class: "panel sources" },
      sectionTitle(tr("参考文献", "References")),
      h("ol", null, s.sources_resolved.map((src) => h("li", { id: `src-${src.id}` }, src.citation, " ",
        src.url ? h("a", { href: src.url, target: "_blank", rel: "noopener noreferrer" }, src.doi ? "DOI" : tr("链接", "link")) : null)))),
    h("p", { class: "foot-actions" }, editOnGitHub(`data/species/${s.id}.json`),
      " · ", h("a", { href: `${apiUrl(`species/${s.id}.json`)}`, target: "_blank", rel: "noopener" }, tr("原始 JSON", "Raw JSON"))));
}

const apiUrl = (p) => `${API_BASE}/${p}`;
function kv(k, v) { return h("div", { class: "kv-row" }, h("span", { class: "k" }, k), h("span", { class: "v" }, v)); }
