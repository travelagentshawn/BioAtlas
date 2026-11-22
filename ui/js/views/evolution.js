import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { label } from "../labels.js";
import { sectionTitle, empty } from "../components.js";

export async function evolutionView(root) {
 const taxa=await api.taxa();
 const eligible=taxa.filter(t=>t.parent&&t.species_count>0);
 const stage=h("section",{class:"panel"});
 let index=0,score=0;
 function question(){
  const target=eligible[index%eligible.length];
  const parent=taxa.find(t=>t.id===target.parent);
  const siblings=eligible.filter(t=>t.parent===target.parent&&t.id!==target.id).slice(0,3);
  const choices=[target,...siblings].sort((a,b)=>a.id.localeCompare(b.id));
  clear(stage);
  stage.append(h("p",{class:"eyebrow"},tr(`第 ${index+1} 题 · 得分 ${score}`,`Question ${index+1} · Score ${score}`)),
   h("h2",null,tr("哪个类群与目标类群共享最近的直接祖先？","Which group shares the most recent direct parent with the target?")),
   h("p",{class:"lead"},h("b",null,loc(target.names)),` · ${target.scientific_name}`),
   h("div",{class:"quiz-options"},choices.map(c=>h("button",{class:"btn block",onclick:()=>{
    const correct=c.id!==target.id;
    if(correct)score++;
    clear(stage);
    stage.append(h("h2",null,correct?tr("正确！","Correct!"):tr("继续探索","Keep exploring")),
     h("p",null,tr(`目标类群：${loc(target.names)}；共同父级：${parent?loc(parent.names):"—"}。`,`Target: ${loc(target.names)}; shared parent: ${parent?loc(parent.names):"—"}.`)),
     h("p",{class:"muted"},tr("这是当前图鉴采样树中的关系，不代表完整生命树。","This is a relationship within the current sampled atlas tree, not the complete tree of life.")),
     h("button",{class:"btn primary",onclick:()=>{index++;question();}},tr("下一题","Next question")));
   }},loc(c.names)))));
 }
 root.append(h("header",{class:"page-head"},h("h1",null,tr("演化与谱系学习","Evolution & phylogeny learning")),h("p",{class:"lead"},tr("通过分类层级和共同祖先理解生命树。题目只使用当前已收录的分类单元。","Explore taxonomic ranks and shared ancestry using the taxa currently in the atlas."))),h("section",null,sectionTitle(tr("共同祖先小测","Common-ancestor quiz")),stage));
 if(eligible.length<2)stage.append(empty(tr("目前分类数据不足以生成题目。","Not enough taxon records for a quiz.")));else question();
}
