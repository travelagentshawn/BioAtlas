// Small, safe Markdown renderer for the in-app Documentation. Builds DOM nodes (no innerHTML).
// Supports: # headings (with ids), paragraphs, **bold**, *italic*, `code`, [links](url),
// fenced ``` code blocks, - / 1. lists (one level + continuation), > quotes, tables, ---.
import { h, safeUrl } from "./dom.js";

export function slugify(s) {
  return s.toLowerCase().trim().replace(/[`*_]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

function inline(text, linkResolver) {
  const out = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(h("code", null, t.slice(1, -1)));
    else if (m[2]) out.push(h("strong", null, inline(t.slice(2, -2), linkResolver)));
    else if (m[3]) out.push(h("em", null, inline(t.slice(1, -1), linkResolver)));
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t);
      const resolved = linkResolver ? linkResolver(href) : href;
      if (resolved?.startsWith("#")) out.push(h("a", { href: resolved }, inline(label, linkResolver)));
      else if (safeUrl(resolved)) out.push(h("a", { href: resolved, target: "_blank", rel: "noopener noreferrer" }, inline(label, linkResolver)));
      else out.push(label);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(src, { linkResolver } = {}) {
  const root = h("div", { class: "md" });
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const toc = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      root.append(h("pre", { "data-lang": fence[1] || null }, h("code", null, buf.join("\n"))));
      continue;
    }
    const hd = /^(#{1,4})\s+(.*)$/.exec(line);
    if (hd) {
      const level = hd[1].length, text = hd[2].trim(), id = slugify(text);
      if (level >= 2 && level <= 3) toc.push({ level, text: text.replace(/[`*]/g, ""), id });
      root.append(h(`h${level}`, { id }, inline(text, linkResolver)));
      i++; continue;
    }
    if (/^---+$/.test(line.trim())) { root.append(h("hr")); i++; continue; }
    if (line.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      root.append(h("blockquote", null, h("p", null, inline(buf.join(" "), linkResolver))));
      continue;
    }
    if (line.includes("|") && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] || "") && lines[i + 1].includes("-")) {
      const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const head = cells(line); i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
      root.append(h("div", { class: "table-wrap" }, h("table", null,
        h("thead", null, h("tr", null, head.map((c) => h("th", null, inline(c, linkResolver))))),
        h("tbody", null, rows.map((r) => h("tr", null, r.map((c) => h("td", null, inline(c, linkResolver)))))))));
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const list = h(ordered ? "ol" : "ul");
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) {
          const item = h("li", null, inline(m[3], linkResolver));
          const nested = m[1].length >= 2 && list.lastElementChild;
          if (nested) {
            let sub = list.lastElementChild.querySelector(":scope > ul, :scope > ol");
            if (!sub) { sub = h(/\d/.test(m[2]) ? "ol" : "ul"); list.lastElementChild.append(sub); }
            sub.append(item);
          } else list.append(item);
          i++;
        } else if (/^\s{2,}\S/.test(lines[i]) && list.lastElementChild) {
          list.lastElementChild.append(" ", ...inline(lines[i].trim(), linkResolver)); i++;
        } else break;
      }
      root.append(list);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|---+$|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    root.append(h("p", null, inline(buf.join(" "), linkResolver)));
  }
  return { el: root, toc };
}
