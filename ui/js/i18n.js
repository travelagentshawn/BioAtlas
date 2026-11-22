// Language state. Data text is {zh, en}; interface text uses tr("中文", "English").
const KEY = "bioatlas.lang";
let lang = "zh";
try {
  const q = new URLSearchParams(location.hash.split("?")[1] || location.search).get("lang");
  lang = q || localStorage.getItem(KEY) || ((navigator.language || "zh").startsWith("zh") ? "zh" : "en");
} catch { /* storage may be blocked */ }
if (!["zh", "en"].includes(lang)) lang = "zh";

export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
}
export const tr = (zh, en) => (lang === "zh" ? zh : en);
// Pick text from a data i18n object, falling back across languages.
export const loc = (o) => (o ? o[lang] || o.en || o.zh || "" : "");
// The "other" language name, used as a subtitle.
export const loc2 = (o) => (o ? o[lang === "zh" ? "en" : "zh"] || "" : "");
document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
