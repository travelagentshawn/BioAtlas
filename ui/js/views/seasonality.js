import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { monthName, label } from "../labels.js";
import { speciesCard, sectionTitle, empty } from "../components.js";

export async function seasonalityView(root, { query }) {
  const [species, regionList] = await Promise.all([api.speciesList(), api.regionList()]);
  const regions = await Promise.all(regionList.map((r) => api.region(r.id)));
  let month = Math.min(12, Math.max(1, Number(query.get("month")) || new Date().getMonth() + 1));
  let kingdom = query.get("kingdom") || "";
  const taxa = await api.taxa();
  const taxaById = new Map(taxa.map((t) => [t.id, t]));
  const controls = h("div", { class: "chips" });
  const summary = h("p", { class: "muted" });
  const grid = h("div", { class: "grid" });
  const regionGrid = h("div", { class: "grid small" });

  function draw() {
    clear(controls);
    controls.append(...Array.from({length:12},(_,i)=>h("button",{class:"chip"+(month===i+1?" on":""),onclick:()=>{month=i+1;draw();}},monthName(i+1))));
    controls.append(...[["",tr("全部生命","All life")],["plantae",tr("植物","Plants")],["animalia",tr("动物","Animals")]].map(([v,t])=>h("button",{class:"chip"+(kingdom===v?" on":""),onclick:()=>{kingdom=v;draw();}},t)));
    const list=species.filter(s=>s.best_months.includes(month)&&(!kingdom||s.kingdom===kingdom));
    clear(grid);
    summary.textContent=tr(`${monthName(month)}：${list.length} 种物种处于推荐观察月份。`,`${list.length} species are in their recommended observation window in ${monthName(month)}.`);
    if(!list.length) grid.append(empty(tr("本月暂无匹配记录。","No matching records for this month.")));
    list.forEach(s=>grid.append(speciesCard(s,taxaById)));
    const active=regions.filter(r=>r.month_counts?.[month-1]>0).sort((a,b)=>b.month_counts[month-1]-a.month_counts[month-1]);
    clear(regionGrid);
    active.forEach(r=>regionGrid.append(h("a",{class:"card",href:`#/region/${r.id}`},h("div",{class:"card-body"},h("h3",null,loc(r.names)),h("p",null,loc(r.description)),h("b",null,tr(`${r.month_counts[month-1]} 种`,`${r.month_counts[month-1]} species`))))));
  }
  root.append(h("header",{class:"page-head"},h("h1",null,tr("物候季节日历","Seasonal calendar")),h("p",{class:"lead"},tr("按月份查看物种的推荐观察窗口，并反向寻找当季值得前往的旅行场景。","Browse recommended observation windows by month and discover destinations where seasonal wildlife and plants are recorded."))),
    h("section",{class:"panel"},sectionTitle(tr("选择月份","Choose a month")),controls,summary),
    h("section",null,sectionTitle(tr("当月物种","Species in season")),grid),
    h("section",null,sectionTitle(tr("当季旅行场景","Seasonal travel scenes")),regionGrid));
  draw();
}
