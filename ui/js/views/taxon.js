import { h } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, formatAge } from "../labels.js";
import { crumbs, nameBlock, reviewBadge, badge, editOnGitHub, speciesCard, sectionTitle, link, taxonomicAssertions } from "../components.js";

export async function taxonView(root, { params }) {
  const t = await api.taxon(params.id);
  const taxa = await api.taxa();
  const taxaById = new Map(taxa.map((x) => [x.id, x]));
  const p = t.phylo || {};
  const age = p.age_mya;

  root.append(
    crumbs(link("tree", tr("生命之树", "Tree of life")), ...t.lineage.slice(0, -1).slice(-3).map((a) => link(`taxon/${a.id}`, loc(a.names)))),
    h("header", { class: `species-head taxon-head ${t.kingdom}` },
      h("div", { class: "head-main" },
        h("p", { class: "eyebrow" }, `${label("rank", t.rank)} · ${label("kingdom", t.kingdom)}`),
        nameBlock(t.names, t.scientific_name),
        h("p", { class: "lead" }, loc(t.summary)),
        h("div", { class: "badges" }, reviewBadge(t.review_status), p.monophyly ? badge(label("monophyly", p.monophyly), `mono ${p.monophyly}`) : null,
          t.pruned ? badge(tr("树中已省略中间类群", "Intermediate clades omitted"), "muted") : null))),

    h("div", { class: "layout-2" },
      h("div", { class: "col-main" },
        p.synapomorphies?.length ? h("section", { class: "panel" },
          sectionTitle(tr("共有衍征（识别线索）", "Shared derived traits (recognition clues)")),
          h("ul", null, p.synapomorphies.map((x) => h("li", null, loc(x))))) : null,
        p.debate ? h("section", { class: "panel debate" },
          sectionTitle(tr("分类学争议与修订", "Debate and revisions")), h("p", null, loc(p.debate))) : null,
        taxonomicAssertions(t.taxonomic_assertions || [], t.sources_resolved),
        t.children.length ? h("section", { class: "panel" },
          sectionTitle(tr("下一级类群", "Child groups")),
          h("ul", { class: "plain" }, t.children.map((c) => h("li", null, h("a", { href: `#/taxon/${c.id}` }, loc(c.names)), " ",
            h("span", { class: "sci sm" }, c.scientific_name), " ", badge(`${c.species_count} ${tr("种", "spp.")}`, "muted"))))) : null,
        t.species.length ? h("section", { class: "panel" },
          sectionTitle(tr("本图鉴中的物种", "Species in this atlas")),
          h("div", { class: "grid small" }, t.species.map((s) => speciesCard(s, taxaById)))) : null),
      h("aside", { class: "col-side" },
        h("section", { class: "panel" },
          sectionTitle(tr("冠群年龄", "Crown age")),
          age ? h("div", null,
            h("div", { class: "age-big" }, `${age.estimate}`, h("small", null, ` ${tr("百万年前", "Mya")}`)),
            h("div", { class: "range" }, h("div", { class: `range-bar ${t.kingdom}`, style: { left: `${100 - (age.max / 1100) * 100}%`, right: `${(age.min / 1100) * 100}%` } })),
            h("p", { class: "muted" }, `${tr("区间", "Range")}: ${formatAge(age)} · ${label("confidence", age.confidence)}`),
            h("p", { class: "muted small" }, tr("分子钟估计随校准点与模型而异；请把它当作区间而非定值。", "Molecular-clock estimates vary with calibrations and models; treat this as a range, not a fixed date.")))
            : h("p", { class: "muted" }, tr("暂无年龄估计。", "No age estimate yet."))),
        h("section", { class: "panel" },
          sectionTitle(tr("位置", "Lineage")),
          h("ol", { class: "lineage" }, t.lineage.map((a, i) => h("li", { class: a.id === t.id ? "leaf" : "", style: { "--i": i } },
            h("a", { href: `#/taxon/${a.id}` }, h("span", { class: "rank" }, label("rank", a.rank)), " ", h("b", null, loc(a.names))))))),
        p.classification_systems?.length ? h("section", { class: "panel" }, sectionTitle(tr("采用此类群的分类系统", "Recognised by")),
          h("p", null, p.classification_systems.map((x) => badge(x)))) : null)),
    h("section", { class: "panel sources" },
      sectionTitle(tr("参考文献", "References")),
      t.sources_resolved.length ? h("ol", null, t.sources_resolved.map((s) => h("li", { id: `src-${s.id}` }, s.citation, " ",
        s.url ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, "↗") : null))) : h("p", { class: "muted" }, tr("尚无引用。", "No citations yet."))),
    h("p", { class: "foot-actions" }, editOnGitHub(`data/taxa/${t.id}.json`)));
}
