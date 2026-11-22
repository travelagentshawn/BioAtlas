// In-app Documentation. Reads docs/index.json (nav) and docs/<lang>/<slug>.md from the site root.
import { h, clear } from "../dom.js";
import { fetchDocs, REPO, API_BASE } from "../api.js";
import { tr, getLang } from "../i18n.js";
import { renderMarkdown } from "../md.js";
import { sectionTitle } from "../components.js";

let navCache;
const nav = () => (navCache ||= fetchDocs("index.json"));

export async function docsView(root, { params, query }) {
  const lang = getLang();
  const index = await nav();
  const pages = index[lang] || index.en;
  const slug = params.slug || pages[0].slug;
  const page = pages.find((p) => p.slug === slug) || pages[0];

  const groups = [...new Set(pages.map((p) => p.group))];
  const side = h("nav", { class: "doc-nav", "aria-label": tr("开发说明书", "Documentation") },
    groups.map((g) => h("div", { class: "doc-group" }, h("h4", null, g),
      pages.filter((p) => p.group === g).map((p) => h("a", { href: `#/docs/${p.slug}`, class: p.slug === page.slug ? "on" : "" }, p.title)))));

  const body = h("article", { class: "doc-body" });
  const tocBox = h("aside", { class: "doc-toc" });
  root.append(
    h("header", { class: "page-head" }, h("h1", null, tr("开发说明书", "Developer documentation")),
      h("p", { class: "lead" }, tr("给开发者与 AI 协作者的说明书：数据模型、API 契约、如何各自开发与编译。", "For developers and AI collaborators: the data model, the API contract, and how to develop and build each side independently."))),
    h("div", { class: "docs" }, side, body, tocBox));

  const resolver = (href) => {
    if (href.startsWith("repo:")) return `${REPO.url}/blob/${REPO.branch}/${href.slice(5)}`;
    if (href.startsWith("api:")) return `${API_BASE}/${href.slice(4)}`;
    if (/^https?:/i.test(href)) return href;
    const [file, anchor] = href.split("#");
    if (!file) return `#/docs/${page.slug}${anchor ? `?a=${anchor}` : ""}`;
    if (file.endsWith(".md")) return `#/docs/${file.replace(/^.*\//, "").replace(/\.md$/, "")}${anchor ? `?a=${anchor}` : ""}`;
    return null;
  };

  try {
    const md = await fetchDocs(page.file);
    const { el, toc } = renderMarkdown(md, { linkResolver: resolver });
    body.append(el,
      h("p", { class: "foot-actions" },
        h("a", { href: `${REPO.url}/edit/${REPO.branch}/docs/${page.file}`, target: "_blank", rel: "noopener noreferrer" }, tr("在 GitHub 上编辑此页", "Edit this page on GitHub")),
        " · ", h("a", { href: `${REPO.url}/blob/${REPO.branch}/docs/${page.file}`, target: "_blank", rel: "noopener noreferrer" }, "Markdown")));
    if (toc.length) {
      tocBox.append(sectionTitle(tr("本页目录", "On this page")),
        h("ul", null, toc.map((t) => h("li", { class: `l${t.level}` }, h("a", { href: `#/docs/${page.slug}?a=${t.id}` }, t.text)))));
    }
    const a = query.get("a");
    if (a) requestAnimationFrame(() => document.getElementById(a)?.scrollIntoView({ block: "start" }));
  } catch (e) {
    clear(body).append(h("div", { class: "state error" }, String(e.message)));
  }
}
