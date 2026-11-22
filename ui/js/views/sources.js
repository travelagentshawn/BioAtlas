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
 const role=h("select",{"aria-label":tr("权威角色","Authority role")});
 const roleLabels={"global-backbone":tr("全球综合骨架","Global backbone"),"nomenclatural-index":tr("命名索引","Nomenclatural index"),"specialist-checklist":tr("专业类群名录","Specialist checklist"),"classification-framework":tr("分类框架","Classification framework"),"conservation-assessment":tr("保护评估","Conservation assessment")};
 role.append(...["","global-backbone","nomenclatural-index","specialist-checklist","classification-framework","conservation-assessment"].map(v=>h("option",{value:v},v?roleLabels[v]:tr("所有权威角色","All authority roles"))));
 function draw(){
  const term=q.value.trim().toLowerCase();
  const rows=sources.filter(s=>(!kind.value||s.kind===kind.value)&&(!role.value||s.authority_role===role.value)&&(!term||[s.title,s.authors,s.citation,s.doi,s.id,...(s.taxonomic_scope||[])].join(" ").toLowerCase().includes(term)));
  clear(list);
  rows.forEach(s=>{
   const href=s.url||(s.doi?`https://doi.org/${s.doi}`:null);
   list.append(h("article",{class:"card"},h("div",{class:"card-body"},
    h("div",{class:"kicker"},s.authority_role?roleLabels[s.authority_role]:`${s.kind} · ${s.year}`),h("h3",null,s.title),
    s.authority_role?h("p",{class:"muted small"},(s.taxonomic_scope||[]).join(" · ")):null,
    s.accessed_at?h("p",{class:"small muted"},tr("访问日期：","Accessed: ")+s.accessed_at):null,
    s.authority_role&&s.identifier_scheme?h("p",{class:"small"},tr("标识符：","Identifier: ")+s.identifier_scheme):null,
    s.current_version?h("p",{class:"small"},tr("当前版本：","Current release: ")+s.current_version):null,
    s.authority_role&&s.update_policy?h("p",{class:"small muted"},s.update_policy):null,
    s.legacy?h("p",{class:"small muted"},tr("历史兼容用途；不用于新分类判断。","Legacy compatibility only; not used for new taxonomic decisions.")):null,
    s.authors?h("p",{class:"muted"},s.authors):null,
    h("p",null,s.citation),
    s.doi?h("p",{class:"sci"},`DOI: ${s.doi}`):null,
    href?h("a",{href,target:"_blank",rel:"noopener noreferrer"},tr("打开原始来源","Open source")):h("span",{class:"muted small"},tr("暂无外部链接","No external URL recorded")))));
  });
  if(!rows.length)list.append(empty(tr("没有匹配的文献来源。","No matching sources.")));
 }
 q.addEventListener("input",draw);kind.addEventListener("change",draw);role.addEventListener("change",draw);
 root.append(h("header",{class:"page-head"},h("h1",null,tr("科学文献与数据来源","Scientific sources")),h("p",{class:"lead"},tr("集中检索支持分类、演化、保护与分布声明的文献和数据库。引用存在不代表相关记录已完成独立审核。","Search references and databases supporting taxonomy, evolution, conservation and distribution claims. A citation does not by itself mean a record has been independently reviewed."))),
 h("section",{class:"panel"},sectionTitle(tr("来源检索","Source search")),q,kind,role),list);
 draw();
}
