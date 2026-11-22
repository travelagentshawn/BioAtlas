// Display labels for enum values defined in schema/. Unknown values fall back to the raw id,
// so adding a new enum value in the data never breaks the UI.
import { tr } from "./i18n.js";

const M = (zh, en) => ({ zh, en });
const TABLES = {
  habitat: {
    "temple-garden": M("寺庙庭园", "Temple garden"), "urban-park": M("城市公园", "Urban park"),
    street: M("街道", "Street"), farmland: M("农田", "Farmland"), paddy: M("稻田", "Paddy"),
    wetland: M("湿地", "Wetland"), pond: M("池塘", "Pond"), "river-lake": M("河湖", "River / lake"),
    forest: M("森林", "Forest"), mountain: M("山地", "Mountain"), coast: M("海岸", "Coast"), "coral-reef": M("珊瑚礁", "Coral reef"),
    grassland: M("草地", "Grassland"), building: M("建筑", "Buildings"),
  },
  likelihood: { common: M("常见", "Common"), regular: M("较常见", "Regular"), uncommon: M("少见", "Uncommon"), rare: M("罕见", "Rare") },
  evidence: {
    genome: M("基因组", "Genome"), phylogenomics: M("系统发育基因组", "Phylogenomics"),
    "molecular-clock": M("分子钟", "Molecular clock"), fossil: M("化石", "Fossil"),
    morphology: M("形态", "Morphology"), ecology: M("生态", "Ecology"), classification: M("分类学", "Classification"),
  },
  rank: {
    domain: M("域", "Domain"), kingdom: M("界", "Kingdom"), clade: M("演化支", "Clade"), phylum: M("门", "Phylum"),
    class: M("纲", "Class"), subclass: M("亚纲", "Subclass"), order: M("目", "Order"), family: M("科", "Family"), genus: M("属", "Genus"),
  },
  kingdom: { plantae: M("植物", "Plants"), animalia: M("动物", "Animals"), fungi: M("真菌", "Fungi"), root: M("真核生物", "Eukaryotes") },
  review: {
    seed: M("初稿 · 待核对", "Seed · unverified"), reviewed: M("已核对", "Reviewed"), "expert-reviewed": M("专家审阅", "Expert reviewed"),
  },
  monophyly: {
    strong: M("单系性强支持", "Strongly supported monophyly"), moderate: M("单系性中等支持", "Moderately supported"),
    contested: M("存在争议", "Contested"), paraphyletic: M("并系（传统类群）", "Paraphyletic (traditional group)"), unknown: M("未知", "Unknown"),
  },
  confidence: { high: M("可信度高", "High confidence"), moderate: M("可信度中等", "Moderate confidence"), approximate: M("粗略估计", "Approximate") },
  country: {
    CN: M("中国", "China"), JP: M("日本", "Japan"), KR: M("韩国", "South Korea"), GB: M("英国", "United Kingdom"), IE: M("爱尔兰", "Ireland"), US: M("美国", "United States"), CA: M("加拿大", "Canada"), FI: M("芬兰", "Finland"), TH: M("泰国", "Thailand"),
    VN: M("越南", "Vietnam"), IN: M("印度", "India"), NP: M("尼泊尔", "Nepal"), LK: M("斯里兰卡", "Sri Lanka"),
    MY: M("马来西亚", "Malaysia"), SG: M("新加坡", "Singapore"), TW: M("台湾", "Taiwan"), ID: M("印度尼西亚", "Indonesia"), BS: M("巴哈马", "Bahamas"), PR: M("波多黎各", "Puerto Rico"), VI: M("美属维尔京群岛", "U.S. Virgin Islands"),
  },
  iucn: {
    LC: M("无危 LC", "Least Concern"), NT: M("近危 NT", "Near Threatened"), VU: M("易危 VU", "Vulnerable"),
    EN: M("濒危 EN", "Endangered"), CR: M("极危 CR", "Critically Endangered"), EW: M("野外灭绝 EW", "Extinct in the Wild"),
    EX: M("灭绝 EX", "Extinct"), DD: M("数据缺乏 DD", "Data Deficient"), NE: M("未评估 NE", "Not Evaluated"),
  },
};
export function label(table, key) {
  const e = TABLES[table]?.[key];
  return e ? tr(e.zh, e.en) : key;
}
export const monthName = (m) => tr(`${m}月`, ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]);
export function monthRanges(months) {
  // [10,11,12,1] -> "10–12月, 1月" style, handling year wrap by sorting and merging consecutive runs
  const ms = [...new Set(months)].sort((a, b) => a - b);
  if (ms.length === 12) return tr("全年", "All year");
  const runs = [];
  for (const m of ms) {
    const last = runs[runs.length - 1];
    if (last && m === last[1] + 1) last[1] = m; else runs.push([m, m]);
  }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) {
    const first = runs.shift(); runs[runs.length - 1][1] = first[1] + 12;
  }
  return runs.map(([a, b]) => {
    const f = (x) => ((x - 1) % 12) + 1;
    return a === b ? monthName(a) : `${tr(String(a), monthName(a))}–${tr(`${f(b)}月`, monthName(f(b)))}`;
  }).join(tr("、", ", "));
}
export const formatAge = (a) => !a ? "" : `${a.min}–${a.max} ${tr("百万年前", "Mya")}`;
