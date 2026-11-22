import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { sectionTitle, badge } from "../components.js";

export async function qualityView(root) {
 const [speciesLite,taxa,regions,sources]=await Promise.all([api.speciesList(),api.taxa(),api.regionList(),api.sources()]);
 const [details,taxonDetails,regionDetails]=await Promise.all([
  Promise.all(speciesLite.map(s=>api.species(s.id))),
  Promise.all(taxa.map(t=>api.taxon(t.id))),
  Promise.all(regions.map(r=>api.region(r.id)))
 ]);
 const allRecords=[...details,...taxonDetails,...regionDetails];
 const audited=allRecords.filter(r=>!!r.review).length;
 const missingAudit=allRecords.filter(r=>r.review_status!=="seed"&&!r.review).length;
 const regionLinks=regionDetails.flatMap(r=>r.species||[]);
 const evidencedLinks=regionLinks.filter(e=>(e.evidence||[]).length>0).length;
 const unverifiedLinks=regionLinks.length-evidencedLinks;
 const regionsWithUnverifiedEvidence=regionDetails.filter(r=>(r.species||[]).some(e=>!(e.evidence||[]).length)).length;
 const count=(fn)=>details.filter(fn).length;
 const status=["seed","reviewed","expert-reviewed"].map(k=>({key:k,n:details.filter(s=>s.review_status===k).length}));
 const metrics=[
  [tr("物种记录","Species records"),details.length],
  [tr("分类单元","Taxa"),taxa.length],
  [tr("旅行场景","Travel scenes"),regions.length],
  [tr("文献来源","Sources"),sources.length],
  [tr("具有保护评估","With conservation assessment"),count(s=>!!s.conservation)],
  [tr("具有外部数据库 ID","With external identifiers"),count(s=>Object.keys(s.external_ids||{}).length>0)],
  [tr("具有授权图片","With licensed images"),count(s=>(s.media||[]).length>0)],
  [tr("具有授权声音","With licensed sounds"),count(s=>(s.sounds||[]).length>0)],
  [tr("具有颜色标签","With colour tags"),count(s=>(s.identification?.color_tags||[]).length>0)],
  [tr("具有体型数据","With size data"),count(s=>!!s.identification?.size_cm)],
  [tr("具有审核记录","With review audit metadata"),audited],
  [tr("非初稿但缺少审核记录","Non-seed records missing audit"),missingAudit],
  [tr("有来源的地区—物种关联","Region–species links with evidence"),`${evidencedLinks} / ${regionLinks.length}`],
  [tr("缺少关联证据的地区—物种记录","Region–species links missing evidence"),unverifiedLinks],
  [tr("存在未核实关联的场景","Scenes with unverified associations"),regionsWithUnverifiedEvidence]
 ];
 const table=h("div",{class:"quality-grid"});
 metrics.forEach(([label,value])=>table.append(h("div",{class:"panel stat-card"},h("span",{class:"muted"},label),h("b",null,value))));
 const statuses=h("div",{class:"badges"});
 status.forEach(s=>statuses.append(badge(`${s.key}: ${s.n}`,s.key==="seed"?"muted":"ev")));
 const pending=details.filter(s=>s.review_status==="seed").slice(0,12);
 const list=h("ul",{class:"plain"});
 pending.forEach(s=>list.append(h("li",null,h("a",{href:`#/species/${s.id}`},loc(s.names)),h("span",{class:"muted"},` · ${s.scientific_name}`))));
 root.append(h("header",{class:"page-head"},h("h1",null,tr("数据质量与贡献状态","Data quality & contribution status")),h("p",{class:"lead"},tr("公开显示数据覆盖、审核状态与仍待补充的字段，避免把数据缺失误读为科学结论。","A transparent view of coverage, review status and missing fields, so missing data is not mistaken for a scientific conclusion."))),
 h("section",{class:"panel"},sectionTitle(tr("数据覆盖","Coverage")),table),
 h("section",{class:"panel"},sectionTitle(tr("全库审核记录","Repository-wide review audit")),h("p",{class:"muted small"},tr(`当前 ${allRecords.length} 条物种、分类单元与场景记录中，${audited} 条保留审核元数据；${missingAudit} 条非 seed 记录缺少审核元数据。`,`${audited} of ${allRecords.length} species, taxa and region records carry review metadata; ${missingAudit} non-seed records are missing an audit.`))),
 h("section",{class:"panel"},sectionTitle(tr("物种审核状态","Species review status")),statuses,h("p",{class:"muted small"},tr("seed = 初稿，尚未独立核对；reviewed = 贡献者已对照来源核对；expert-reviewed = 专家审阅。","seed = draft, not independently checked; reviewed = contributor checked against sources; expert-reviewed = specialist sign-off."))),
 h("section",{class:"panel"},sectionTitle(tr("待核对物种（最多显示 12 条）","Species awaiting review (up to 12)")),list));
}
