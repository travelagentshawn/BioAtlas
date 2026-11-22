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
 const status=h("select",{"aria-label":tr("保护等级","Conservation status"),onchange:draw});
 const statuses=["","CR","EN","VU","NT","LC","DD","NE","EW","EX"];
 status.append(...statuses.map(s=>h("option",{value:s},s||tr("所有等级","All statuses"))));
 const note=h("p",{class:"muted small"});
 function draw(){
  const term=q.value.trim().toLowerCase(),code=status.value;
  const rows=records.filter(s=>(!code||s.conservation?.iucn===code)&&(!term||[loc(s.names),s.scientific_name,s.conservation?.iucn,...(s.travel.countries||[])].join(" ").toLowerCase().includes(term)));
  clear(list);
  rows.forEach(s=>{
   const etiquette=loc(s.travel.etiquette);
   list.append(h("article",{class:"card"},h("div",{class:"card-body"},
    h("div",{class:"badges"},iucnBadge(s.conservation?.iucn),reviewBadge(s.review_status)),
    h("h3",null,h("a",{href:`#/species/${s.id}`},loc(s.names))),
    h("div",{class:"sci"},s.scientific_name),
    h("p",null,etiquette||tr("尚无经过核验的专门观察礼仪记录。","No species-specific field etiquette has been documented yet.")),
    h("p",{class:"muted small"},s.conservation?tr(`等级记录日期：${s.conservation.as_of} · 来源：${s.conservation.source}`,`Status record: ${s.conservation.as_of} · Source: ${s.conservation.source}`):tr("尚无保护等级记录","No conservation assessment recorded")),
    h("a",{class:"btn small",href:`#/species/${s.id}`},tr("查看档案与来源","View record and sources")))));
  });
  note.textContent=tr(`显示 ${rows.length} / ${records.length} 条物种记录。IUCN 等级必须结合评估日期与来源阅读；未收录不等于无危。`,`${rows.length} of ${records.length} records. Read IUCN categories together with assessment date and source; missing data does not mean Least Concern.`);
  if(!rows.length)list.append(empty(tr("没有匹配记录。","No matching records.")));
 }
 q.addEventListener("input",draw);
 root.append(h("header",{class:"page-head"},h("h1",null,tr("保护与野外礼仪","Conservation & field ethics")),h("p",{class:"lead"},tr("集中查看物种保护评估与不打扰野生生命的观察规范。法规内容必须以当地主管机构的现行公告为准。","Review conservation assessments and low-impact observation guidance. Legal requirements must be checked against current local authority notices."))),
 h("section",{class:"panel"},sectionTitle(tr("筛选","Filters")),q,status,note),list);
 draw();
}
