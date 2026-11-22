import { h, clear, svg } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label, monthName } from "../labels.js";
import { badge, sectionTitle, empty, reviewBadge } from "../components.js";

export async function mapView(root,{query}) {
  const regionLite=await api.regionList();
  const list=await Promise.all(regionLite.map(r=>api.region(r.id)));
  let month=Number(query.get("month"))||new Date().getMonth()+1;
  let country=query.get("country")||"";
  const filters=h("div",{class:"selects"});
  const monthSelect=h("select",{"aria-label":tr("月份","Month"),onchange:e=>{month=+e.target.value;draw();}});
  for(let m=1;m<=12;m++)monthSelect.append(h("option",{value:m,selected:m===month},monthName(m)));
  const countries=[...new Set(list.flatMap(r=>r.countries))].sort();
  const countrySelect=h("select",{"aria-label":tr("国家","Country"),onchange:e=>{country=e.target.value;draw();}});
  countrySelect.append(h("option",{value:""},tr("所有国家","All countries")));
  countries.forEach(c=>countrySelect.append(h("option",{value:c,selected:c===country},label("country",c))));
  filters.append(monthSelect,countrySelect);
  const plot=svg("svg",{class:"world-plot",viewBox:"0 0 960 440",role:"group","aria-label":tr("可交互的旅行自然场景地图。使用 Tab 聚焦地点，按 Enter 或空格打开地点档案。","Interactive travel-scene map. Tab to a location and press Enter or Space to open its record.")});
  const listBox=h("div",{class:"grid small"});
  const note=h("p",{class:"muted small"});
  function draw(){
    clear(plot);clear(listBox);
    for(let lon=-180;lon<=180;lon+=30){const x=(lon+180)/360*960;plot.append(svg("line",{x1:x,y1:0,x2:x,y2:380,class:"map-grid"}),svg("text",{x,y:400,class:"map-axis","text-anchor":"middle"},String(lon)));}
    for(let lat=-60;lat<=80;lat+=20){const y=(90-lat)/180*380;plot.append(svg("line",{x1:0,y1:y,x2:960,y2:y,class:"map-grid"}),svg("text",{x:6,y:y-4,class:"map-axis"},String(lat)));}
    const active=list.filter(r=>r.center&&(!country||r.countries.includes(country))&&(r.month_counts?.[month-1]||0)>0);
    active.forEach(r=>{
      const x=(r.center.lng+180)/360*960,y=(90-r.center.lat)/180*380;
      const openRegion=()=>{location.hash=`#/region/${r.id}`;};
      const mark=svg("circle",{cx:x,cy:y,r:6,class:"map-dot",tabindex:0,role:"button","aria-label":tr(`打开地点档案：${loc(r.names)}`,`Open scene record: ${loc(r.names)}`)});
      mark.append(svg("title",{},loc(r.names)));
      mark.addEventListener("click",openRegion);
      mark.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){event.preventDefault();openRegion();}
      });
      plot.append(mark);
      const text=svg("text",{x:x+9,y:y-8,class:"map-label"},loc(r.names));
      plot.append(text);
      const card=h("a",{class:"card",href:`#/region/${r.id}`},h("div",{class:"card-body"},h("h3",null,loc(r.names)),h("p",null,loc(r.description)),h("div",{class:"badges"},...r.countries.map(c=>badge(label("country",c))),reviewBadge(r.review_status))));
      listBox.append(card);
    });
    note.textContent=tr(`显示 ${active.length} 个在 ${monthName(month)} 有物种观察记录的地理场景。地图为等距经纬度示意图，不代表物种连续分布范围。`,`${active.length} georeferenced scenes with species records in ${monthName(month)}. This is an equirectangular locator plot, not a species range map.`);
    if(!active.length)listBox.append(empty(tr("没有匹配的地理场景。","No georeferenced scenes match.")));
  }
  root.append(h("header",{class:"page-head"},h("h1",null,tr("旅行自然地图","Nature map")),h("p",{class:"lead"},tr("查看已收录旅行场景的地理位置，并进入地点档案查看当季物种。","Locate documented travel scenes and open each record for seasonal species."))),filters,h("section",{class:"panel"},plot,note),h("section",null,sectionTitle(tr("地图地点","Mapped places")),listBox));
  draw();
}
