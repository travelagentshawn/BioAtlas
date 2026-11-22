import { h, clear } from "../dom.js";
import { api } from "../api.js";
import { tr, loc } from "../i18n.js";
import { sectionTitle, empty } from "../components.js";

export async function learnView(root) {
  const list=await api.speciesList();
  const pool=list.filter(s=>s.id&&s.names);
  const stage=h("div",{class:"panel"});
  let index=0,score=0,answered=false,current=null,options=[];
  function shuffle(a){return [...a].sort(()=>Math.random()-.5);}
  async function next(){
    answered=false;
    current=pool[index%pool.length];
    const distractors=shuffle(pool.filter(s=>s.id!==current.id)).slice(0,3);
    options=shuffle([current,...distractors]);
    const full=await api.species(current.id);
    draw(full);
  }
  function draw(full){
    clear(stage);
    const clue=loc(full.identification?.field_marks)||loc(full.summary);
    stage.append(h("p",{class:"eyebrow"},tr(`第 ${index+1} 题`,`Question ${index+1}`)),
      h("h2",null,tr("根据野外特征，判断这是什么物种？","Which species matches these field marks?")),
      h("p",{class:"lead"},clue),
      h("div",{class:"quiz-options"},options.map(s=>h("button",{class:"btn block",disabled:answered,onclick:()=>{
        answered=true;const correct=s.id===current.id;if(correct)score++;
        drawAnswered(full,s,correct);
      }},loc(s.names)))));
  }
  function drawAnswered(full,chosen,correct){
    clear(stage);
    stage.append(h("p",{class:"eyebrow"},tr(`得分 ${score} / ${index+1}`,`Score ${score} / ${index+1}`)),
      h("h2",null,correct?tr("回答正确！","Correct!"):tr("再认识一个物种","A useful field note")),
      h("p",null,tr(`正确答案：${loc(current.names)}（${current.scientific_name}）`,`Answer: ${loc(current.names)} (${current.scientific_name})`)),
      h("p",null,loc(full.identification?.field_marks)||loc(full.summary)),
      h("button",{class:"btn primary",onclick:()=>{index++;next();}},tr("下一题","Next question")));
  }
  root.append(h("header",{class:"page-head"},h("h1",null,tr("生命观察学习","Field learning")),h("p",{class:"lead"},tr("通过物种形态线索认识旅途中遇到的植物与动物。题目来自当前公开图鉴记录。","Learn to recognise plants and animals from field marks in the public atlas records."))),
    h("section",null,sectionTitle(tr("物种辨认小测","Species recognition quiz")),stage));
  if(!pool.length)stage.append(empty(tr("暂无可用物种。","No species available.")));else await next();
}
