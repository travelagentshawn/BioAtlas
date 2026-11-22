import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthName } from "../labels.js";
import { speciesCard, sectionTitle, empty } from "../components.js";

export async function identifyView(root) {
  const [species,taxa]=await Promise.all([api.speciesList(),api.taxa()]);
  const taxaById=new Map(taxa.map(t=>[t.id,t]));
  const state={q:"",kingdom:"",habitat:"",country:"",month:""};
  const fields=h("div",{class:"selects"});
  const input=h("input",{type:"search",class:"search",placeholder:tr("名称或学名","Common or scientific name"),"aria-label":tr("搜索物种","Search species"),oninput:e=>{state.q=e.target.value;draw();}});
  const results=h("div",{class:"grid"});
  const count=h("p",{class:"muted"});
  const options=(key,values,title)=>h("select",{"aria-label":title,onchange:e=>{state[key]=e.target.value;draw();}},h("option",{value:""},title),values.map(v=>h("option",{value:v},key==="month"?monthName(+v):key==="habitat"||key==="country"?label(key,v):v)));
  fields.append(options("kingdom",["plantae","animalia"],tr("全部类群","All kingdoms")),
    options("habitat",[...new Set(species.flatMap(s=>s.habitats))].sort(),tr("任意栖息地","Any habitat")),
    options("country",[...new Set(species.flatMap(s=>s.countries))].sort(),tr("任意国家","Any country")),
    options("month",Array.from({length:12},(_,i)=>String(i+1)),tr("任意月份","Any month")));
  function draw(){
    const q=state.q.trim().toLowerCase();
    const list=species.filter(s=>(!q||[loc(s.names),s.scientific_name].join(" ").toLowerCase().includes(q))&&(!state.kingdom||s.kingdom===state.kingdom)&&(!state.habitat||s.habitats.includes(state.habitat))&&(!state.country||s.countries.includes(state.country))&&(!state.month||s.best_months.includes(+state.month)));
    count.textContent=tr(`找到 ${list.length} / ${species.length} 种`,`${list.length} of ${species.length} species`);
    clear(results);
    if(!list.length)results.append(empty(tr("没有匹配项，请调整条件。","No matches. Adjust the filters.")));
    list.forEach(s=>results.append(speciesCard(s,taxaById)));
  }
  root.append(h("header",{class:"page-head"},h("h1",null,tr("野外辨认检索","Field identification")),h("p",{class:"lead"},tr("从可观察的物种名录出发，按类群、栖息地、国家和月份缩小范围。进入物种档案可查看形态辨认要点。","Narrow the field guide by kingdom, habitat, country and season; open a species record for diagnostic field marks."))),
    h("section",{class:"panel"},sectionTitle(tr("筛选条件","Filters")),input,fields),count,results);
  draw();
}
