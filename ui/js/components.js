import { h } from "./dom.js";
import { tr, loc, loc2 } from "./i18n.js";
import { label, formatAge } from "./labels.js";
import { sigil, monthStrip } from "./viz.js";
import { REPO } from "./api.js";

export const link = (href, ...kids) => h("a", { href: `#/${href}` }, ...kids);

export function badge(text, cls = "") { return h("span", { class: `badge ${cls}` }, text); }

export function reviewBadge(status) {
  return h("span", { class: `badge review ${status}`, title: tr(
    "初稿＝已起草但尚未被独立核对；已核对＝贡献者对照所引文献检查过；专家审阅＝领域专家签字。",
    "seed = drafted, not independently verified; reviewed = checked against cited sources; expert-reviewed = signed off by a specialist.") },
  label("review", status));
}

export function iucnBadge(code) {
  return code ? h("span", { class: `badge iucn iucn-${code}`, title: "IUCN Red List" }, label("iucn", code)) : null;
}

export function ageText(age) {
  if (!age) return null;
  return h("span", { class: "age", title: `${label("confidence", age.confidence)} · ${tr("估计值", "estimate")} ${age.estimate}` },
    formatAge(age));
}

export function editOnGitHub(path) {
  if (!REPO.url) return null;
  return h("a", { class: "edit-link", href: `${REPO.url}/edit/${REPO.branch}/${path}`, target: "_blank", rel: "noopener noreferrer" },
    tr("在 GitHub 上修订这条记录", "Suggest an edit on GitHub"));
}

export function sectionTitle(title, sub) {
  return h("div", { class: "section-title" }, h("h2", null, title), sub ? h("p", null, sub) : null);
}

export function loading() { return h("div", { class: "state" }, h("span", { class: "spinner" }), tr("加载中…", "Loading…")); }
export function failure(err) {
  return h("div", { class: "state error" }, h("strong", null, tr("无法载入数据", "Could not load data")),
    h("p", null, String(err?.message || err)),
    h("p", { class: "muted" }, tr("请确认已运行 npm run build，并检查 ui/config.js 中的 apiBase。", "Make sure `npm run build` has run and check apiBase in ui/config.js.")));
}
export function empty(text) { return h("div", { class: "state" }, text); }

// taxaById: Map from api.taxa(); used to show the family/order name on a card.
export function speciesCard(s, taxaById, extra) {
  const fam = taxaById?.get(s.taxon);
  return h("a", { class: `card species-card ${s.kingdom}`, href: `#/species/${s.id}` },
    h("div", { class: "card-plate" }, sigil(s.lineage, s.kingdom, 64, loc(s.names))),
    h("div", { class: "card-body" },
      h("h3", null, loc(s.names)),
      h("div", { class: "sci" }, s.scientific_name),
      fam ? h("div", { class: "fam" }, `${loc(fam.names)} · ${fam.scientific_name}`) : null,
      h("div", { class: "card-foot" }, monthStrip(s.best_months, s.kingdom), iucnBadge(s.iucn && s.iucn !== "LC" ? s.iucn : null), extra || null)));
}

export function crumbs(...parts) {
  return h("nav", { class: "crumbs", "aria-label": "breadcrumb" },
    parts.flatMap((p, i) => [i ? h("span", { class: "sep" }, "/") : null, p]));
}

export function nameBlock(names, sci) {
  return h("div", { class: "namebl" },
    h("h1", null, loc(names)),
    h("div", { class: "alt" }, loc2(names)),
    sci ? h("div", { class: "sci big" }, sci) : null);
}

export function taxonomicAssertions(assertions = [], sources = []) {
  if (!assertions.length) return null;
  const byId = new Map(sources.map((source) => [source.id, source]));
  const status = {
    accepted: tr("该来源接受此名称", "Accepted by source"),
    synonym: tr("该来源列为异名", "Listed as synonym"),
    unresolved: tr("该来源状态未决", "Unresolved by source"),
    unassessed: tr("尚未核验", "Not yet assessed"),
  };
  return h("section", { class: "panel" },
    sectionTitle(tr("分类权威记录", "Taxonomic authority assertions"),
      tr("不同来源的名称与分类意见分别保留，不自动互相覆盖。", "Provider claims are preserved independently and are not silently merged.")),
    h("ul", { class: "plain" }, assertions.map((assertion) => {
      const authority = byId.get(assertion.authority);
      const source = byId.get(assertion.source);
      return h("li", { class: "taxon-assertion" },
        h("strong", null, authority?.title || assertion.authority), " ",
        badge(status[assertion.name_status] || assertion.name_status, assertion.name_status),
        h("div", { class: "sci" }, assertion.scientific_name),
        h("div", { class: "muted small" },
          `${tr("记录 ID", "Record ID")}: ${assertion.record_id} · ${tr("核对日期", "Accessed")}: ${assertion.accessed_at}`),
        assertion.classification_system || assertion.version ? h("div", { class: "small muted" },
          [assertion.classification_system, assertion.version].filter(Boolean).join(" · ")) : null,
        source ? h("a", { class: "small", href: `#src-${source.id}` }, tr("查看支持来源", "View supporting source")) : null,
        assertion.notes ? h("p", { class: "note small" }, loc(assertion.notes)) : null);
    })));
}
