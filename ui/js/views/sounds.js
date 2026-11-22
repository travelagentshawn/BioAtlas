import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { sectionTitle, empty, reviewBadge } from "../components.js";

export async function soundsView(root) {
 const lite=await api.speciesList();
 const records=await Promise.all(lite.filter(s=>s.kingdom==="animalia").map(s=>api.species(s.id)));
 const items=records.flatMap(s=>(s.sounds||[]).map(a=>({species:s,recording:a})));
 const list=h("div",{class:"grid"});
 const q=h("input",{type:"search",class:"search",placeholder:tr("搜索物种或录音说明","Search species or recording notes"),"aria-label":tr("搜索录音","Search recordings")});
 function draw(){
  const term=q.value.trim().toLowerCase();
  const rows=items.filter(x=>[loc(x.species.names),x.species.scientific_name,loc(x.recording.caption),x.recording.attribution].join(" ").toLowerCase().includes(term));
  clear(list);
  rows.forEach(x=>{
   const audio=h("audio",{controls:true,preload:"none"});
   audio.append(h("source",{src:x.recording.url,type:x.recording.mime_type||"audio/mpeg"}));
   list.append(h("article",{class:"card"},h("div",{class:"card-body"},h("h3",null,h("a",{href:`#/species/${x.species.id}`},loc(x.species.names))),h("p",null,loc(x.recording.caption)),audio,h("p",{class:"muted small"},`${x.recording.attribution} · ${x.recording.license}`),h("a",{href:x.recording.source_url,target:"_blank",rel:"noopener noreferrer"},tr("录音原始来源","Recording source")))));
  });
  if(!rows.length)list.append(empty(tr("目前尚无符合许可要求的录音。欢迎提交可再分发的鸟鸣、蛙鸣及其他自然声音；每条录音必须注明许可、录音者和原始来源。","No redistributable recordings are published yet. Contributions of bird, frog and other nature sounds are welcome; every recording must include license, recordist and source.")));
 }
 q.addEventListener("input",draw);
 root.append(h("header",{class:"page-head"},h("h1",null,tr("自然声音资料库","Nature sound library")),h("p",{class:"lead"},tr("只收录明确允许再分发、具有完整署名和来源的自然声音。","Only recordings with explicit redistribution rights, attribution and source are eligible."))),h("section",{class:"panel"},sectionTitle(tr("录音检索","Recordings")),q),list,
 h("p",{class:"foot-actions"},h("a",{href:"https://github.com/travelagentshawn/BioAtlas/issues/new?template=feature_request.md",target:"_blank",rel:"noopener noreferrer"},tr("提交录音资料","Contribute a recording"))));
 draw();
}
