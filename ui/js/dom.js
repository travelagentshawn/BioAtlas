// Tiny hyperscript helpers. Everything is built with DOM APIs / textContent, never innerHTML,
// so content from data files can never inject markup.
const SVG_NS = "http://www.w3.org/2000/svg";

function apply(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.setAttribute("class", v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  apply(el, props); append(el, kids);
  return el;
}
export function svg(tag, props, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, props); append(el, kids);
  return el;
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : null; }
