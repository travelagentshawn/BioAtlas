import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label } from "../labels.js";
import { sectionTitle, reviewBadge, iucnBadge, empty } from "../components.js";

export async function conservationView(root) {
 const lite=await api.speciesList();
 const records=await Promise.all(lite.map(s=>api.species(s.id)));
 const list=h("div",{class:"grid"});
 const q=h("input",{type:"search",class:"search",placeholder:tr("搜索物种、保护等级或国家","Search species, status or country"),"aria-label":tr("搜索","Search")});
 const status=h("select",{"aria-label":tr("IUCN 保护等级","IUCN category"),onchange:draw});
 const statuses=["","CR","EN","VU","NT","LC","DD","NE","EW","EX"];
 status.append(...statuses.map(s=>h("option",{value:s},s||tr("所有 IUCN 等级","All IUCN categories"))));
 const legal=h("select",{"aria-label":tr("法律保护制度","Legal protection instrument"),onchange:draw});
 const legalOptions=[
  ["",tr("所有法规制度","All legal instruments")],
  ["US Endangered Species Act (ESA)","ESA"],
  ["CITES","CITES"],
  ["SPAW Protocol","SPAW"],
  ["ESA Section 4(d) protective regulation","ESA 4(d)"],
 ];
 legal.append(...legalOptions.map(([v,l])=>h("option",{value:v},l)));
 const note=h("p",{class:"muted small"});
 function draw(){
  const term=q.value.trim().toLowerCase(),code=status.value,instrument=legal.value;
  const rows=records.filter(s=>{
   const protections=s.conservation?.protections||[];
   const searchable=[loc(s.names),s.scientific_name,s.conservation?.iucn,...(s.travel.countries||[]),
    ...protections.flatMap(p=>[p.instrument,p.jurisdiction,p.status,p.scope])].join(" ").toLowerCase();
   return (!code||s.conservation?.iucn===code)
    &&(!instrument||protections.some(p=>p.instrument===instrument))
    &&(!term||searchable.includes(term));
  });
  clear(list);
  rows.forEach(s=>{
   const etiquette=loc(s.travel.etiquette);
   const protections=s.conservation?.protections||[];
   list.append(h("article",{class:"card"},h("div",{class:"card-body"},
    h("div",{class:"badges"},
     s.conservation?.iucn?iucnBadge(s.conservation.iucn):h("span",{class:"badge muted"},tr("无 IUCN 评估记录","No IUCN assessment")),
     reviewBadge(s.review_status),
     ...protections.map(p=>h("span",{class:"badge"},`${p.instrument}: ${p.status}`))),
    h("h3",null,h("a",{href:`#/species/${s.id}`},loc(s.names))),
    h("div",{class:"sci"},s.scientific_name),
    h("p",null,etiquette||tr("尚无经过核验的专门观察礼仪记录。","No species-specific field etiquette has been documented yet.")),
    s.conservation?.iucn?h("p",{class:"muted small"},tr(`IUCN 等级记录日期：${s.conservation.as_of} · 来源：${s.conservation.source}`,`IUCN assessment: ${s.conservation.as_of} · Source: ${s.conservation.source}`)):null,
    protections.map(p=>h("p",{class:"muted small"},`${p.instrument} · ${p.status} · ${p.jurisdiction} · ${p.scope} · ${tr("来源核对", "Source checked")} ${p.accessed_at}`)),
    h("a",{class:"btn small",href:`#/species/${s.id}`},tr("查看档案与来源","View record and sources")))));
  });
  note.textContent=tr(`显示 ${rows.length} / ${records.length} 条物种记录。IUCN 红色名录评估与法律/公约保护是不同体系；缺少 IUCN 等级不代表没有法律保护，缺少保护记录也不代表可自由接触或采集。`,`${rows.length} of ${records.length} records. IUCN assessments and legal/treaty protections are different systems. Missing IUCN data does not mean a species has no legal protection; missing protection records do not mean it may be handled or collected freely.`);
  if(!rows.length)list.append(empty(tr("没有匹配记录。","No matching records.")));
 }
 q.addEventListener("input",draw);
 root.append(h("header",{class:"page-head"},h("h1",null,tr("保护与野外礼仪","Conservation & field ethics")),h("p",{class:"lead"},tr("分开展示 IUCN 红色名录评估、国家法律和国际公约保护，以及低干扰观察规范。法规内容必须以当地主管机构的现行公告为准。","Separate IUCN Red List assessments, national laws and international treaty protections from low-impact observation guidance. Legal requirements must be checked against current local authority notices."))),
 h("section",{class:"panel"},sectionTitle(tr("筛选","Filters")),q,status,legal,note),list);
 draw();
}
