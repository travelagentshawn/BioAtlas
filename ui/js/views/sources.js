import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr } from "../i18n.js";
import { sectionTitle, empty } from "../components.js";

export async function sourcesView(root) {
 const sources=await api.sources();
 const list=h("div",{class:"grid"});
 const q=h("input",{type:"search",class:"search",placeholder:tr("搜索标题、作者、DOI 或引用","Search title, author, DOI or citation"),"aria-label":tr("搜索文献","Search sources")});
 const kind=h("select",{"aria-label":tr("来源类型","Source type")});
 kind.append(...["", "paper","database","book","website"].map(v=>h("option",{value:v},v||tr("所有类型","All types"))));
 function draw(){
  const term=q.value.trim().toLowerCase();
  const rows=sources.filter(s=>(!kind.value||s.kind===kind.value)&&(!term||[s.title,s.authors,s.citation,s.doi,s.id].join(" ").toLowerCase().includes(term)));
  clear(list);
  rows.forEach(s=>{
   const href=s.url||(s.doi?`https://doi.org/${s.doi}`:null);
   list.append(h("article",{class:"card"},h("div",{class:"card-body"},
    h("div",{class:"kicker"},`${s.kind} · ${s.year}`),h("h3",null,s.title),
    s.authors?h("p",{class:"muted"},s.authors):null,
    h("p",null,s.citation),
    s.doi?h("p",{class:"sci"},`DOI: ${s.doi}`):null,
    href?h("a",{href,target:"_blank",rel:"noopener noreferrer"},tr("打开原始来源","Open source")):h("span",{class:"muted small"},tr("暂无外部链接","No external URL recorded")))));
  });
  if(!rows.length)list.append(empty(tr("没有匹配的文献来源。","No matching sources.")));
 }
 q.addEventListener("input",draw);kind.addEventListener("change",draw);
 root.append(h("header",{class:"page-head"},h("h1",null,tr("科学文献与数据来源","Scientific sources")),h("p",{class:"lead"},tr("集中检索支持分类、演化、保护与分布声明的文献和数据库。引用存在不代表相关记录已完成独立审核。","Search references and databases supporting taxonomy, evolution, conservation and distribution claims. A citation does not by itself mean a record has been independently reviewed."))),
 h("section",{class:"panel"},sectionTitle(tr("来源检索","Source search")),q,kind),list);
 draw();
}
